import { TRPCError } from "@trpc/server";
import { and, desc, eq, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  auditLogs,
  automations,
  automationRuns,
  clients,
  contacts,
  invoices,
  opportunities,
  paymentRequests,
  plugins,
  processingChains,
  products,
  projectFiles,
  projects,
  projectVersions,
  qcItems,
  replenishmentProposals,
  quotes,
  tasks,
  tracks,
  users,
  versionComments,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { isValidPvcUSphere, requiresPaymentApproval } from "../domain/guards";
import { runEventAutomations } from "../domain/automationEngine";

const internalProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role === "client") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Este módulo es solo para el equipo de Duck." });
  }
  return next({ ctx });
});

const ownerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "La decisión requiere aprobación explícita de Duck o Elika." });
  }
  return next({ ctx });
});

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La base de datos no está disponible." });
  return db;
}

async function logAudit(input: {
  actorId?: number;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  detail?: string;
  source?: string;
}) {
  const db = await dbOrThrow();
  await db.insert(auditLogs).values({
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId,
    detail: input.detail,
    source: input.source ?? "web",
  });
}

async function clientIdForUser(userId: number) {
  const db = await dbOrThrow();
  const record = await db.select({ id: clients.id }).from(clients).where(eq(clients.portalUserId, userId)).limit(1);
  return record[0]?.id ?? null;
}

async function assertProjectAccess(user: { id: number; role: "owner" | "collaborator" | "client" }, projectId: number) {
  if (user.role !== "client") return;
  const clientId = await clientIdForUser(user.id);
  const db = await dbOrThrow();
  const project = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), eq(projects.clientId, clientId ?? -1))).limit(1);
  if (!project[0]) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes acceso a este proyecto." });
}

const clientInput = z.object({
  name: z.string().min(2).max(180),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  company: z.string().max(180).optional(),
  artistName: z.string().max(180).optional(),
  language: z.string().max(12).default("pt-BR"),
  timezone: z.string().max(80).default("America/Recife"),
  tags: z.array(z.string().min(1).max(60)).max(20).default([]),
  notes: z.string().max(5000).optional(),
});

const projectInput = z.object({
  clientId: z.number().int().positive(),
  name: z.string().min(2).max(220),
  service: z.string().min(2).max(120).default("music_production"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  currency: z.string().length(3).default("EUR"),
  deadlineAt: z.date().optional(),
  description: z.string().max(8000).optional(),
});

export const studioRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    if (ctx.user.role === "client") {
      const clientId = await clientIdForUser(ctx.user.id);
      const clientProjects = clientId
        ? await db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.updatedAt))
        : [];
      return { mode: "client" as const, projects: clientProjects, paymentRequests: [] };
    }
    const [clientCount] = await db.select({ count: sql<number>`count(*)` }).from(clients);
    const [projectCount] = await db.select({ count: sql<number>`count(*)` }).from(projects);
    const [taskCount] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "todo"));
    const pendingPayments = await db.select().from(paymentRequests).where(eq(paymentRequests.status, "pending_approval")).orderBy(desc(paymentRequests.createdAt)).limit(8);
    const lowStock = await db.select().from(products).where(lte(products.stock, products.minStock)).orderBy(products.stock).limit(8);
    const recentProjects = await db.select().from(projects).orderBy(desc(projects.updatedAt)).limit(8);
    return {
      mode: "internal" as const,
      counts: { clients: Number(clientCount?.count ?? 0), projects: Number(projectCount?.count ?? 0), openTasks: Number(taskCount?.count ?? 0) },
      pendingPayments,
      lowStock,
      recentProjects,
    };
  }),

  crm: router({
    listClients: internalProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(clients).orderBy(desc(clients.updatedAt));
    }),
    createClient: internalProcedure.input(clientInput).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(clients).values(input);
      const id = Number(inserted[0].insertId);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "client.created", resource: "client", resourceId: String(id), detail: input.name });
      return { id };
    }),
    createContact: internalProcedure.input(z.object({ clientId: z.number().int().positive(), name: z.string().min(2).max(180), role: z.string().max(120).optional(), email: z.string().email().optional(), phone: z.string().max(50).optional(), notes: z.string().max(3000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(contacts).values(input);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "contact.created", resource: "contact", resourceId: String(inserted[0].insertId) });
      return { id: Number(inserted[0].insertId) };
    }),
    listOpportunities: internalProcedure.query(async () => {
      const db = await dbOrThrow();
      return db.select().from(opportunities).orderBy(desc(opportunities.updatedAt));
    }),
    createOpportunity: internalProcedure.input(z.object({ clientId: z.number().int().positive().optional(), name: z.string().min(2).max(180), stage: z.string().max(40).default("lead"), service: z.string().max(120).optional(), estimatedValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(), currency: z.string().length(3).default("EUR"), expectedCloseAt: z.date().optional(), notes: z.string().max(5000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(opportunities).values(input);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "opportunity.created", resource: "opportunity", resourceId: String(inserted[0].insertId), detail: input.name });
      return { id: Number(inserted[0].insertId) };
    }),
    listQuotes: internalProcedure.query(async () => (await dbOrThrow()).select().from(quotes).orderBy(desc(quotes.updatedAt))),
    createQuote: internalProcedure.input(z.object({ clientId: z.number().int().positive(), opportunityId: z.number().int().positive().optional(), number: z.string().min(3).max(48), amount: z.string().regex(/^\d+(\.\d{1,2})?$/), currency: z.string().length(3).default("EUR"), expiresAt: z.date().optional(), notes: z.string().max(5000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(quotes).values(input);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "quote.created", resource: "quote", resourceId: String(inserted[0].insertId), detail: input.number });
      return { id: Number(inserted[0].insertId) };
    }),
  }),

  operations: router({
    listProjects: protectedProcedure.query(async ({ ctx }) => {
      const db = await dbOrThrow();
      if (ctx.user.role !== "client") return db.select().from(projects).orderBy(desc(projects.updatedAt));
      const clientId = await clientIdForUser(ctx.user.id);
      return clientId ? db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.updatedAt)) : [];
    }),
    createProject: internalProcedure.input(projectInput).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(projects).values({ ...input, createdById: ctx.user.id });
      const id = Number(inserted[0].insertId);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "project.created", resource: "project", resourceId: String(id), detail: input.name });
      return { id };
    }),
    updateProjectStatus: internalProcedure.input(z.object({ projectId: z.number().int().positive(), status: z.enum(["lead", "quoted", "accepted", "waiting_files", "in_production", "mix_review", "client_review", "changes_requested", "approved", "delivered", "archived"]) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.update(projects).set({ status: input.status }).where(eq(projects.id, input.projectId));
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "project.status_changed", resource: "project", resourceId: String(input.projectId), detail: input.status });
      await runEventAutomations("project_status_change", { projectId: input.projectId });
      return { success: true };
    }),
    listTasks: protectedProcedure.query(async ({ ctx }) => {
      const db = await dbOrThrow();
      if (ctx.user.role !== "client") return db.select().from(tasks).orderBy(desc(tasks.updatedAt));
      const clientId = await clientIdForUser(ctx.user.id);
      if (!clientId) return [];
      return db.select({ task: tasks }).from(tasks).innerJoin(projects, eq(tasks.projectId, projects.id)).where(eq(projects.clientId, clientId)).orderBy(desc(tasks.updatedAt));
    }),
    createTask: internalProcedure.input(z.object({ projectId: z.number().int().positive().optional(), title: z.string().min(2).max(255), priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"), dueAt: z.date().optional() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(tasks).values(input);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "task.created", resource: "task", resourceId: String(inserted[0].insertId), detail: input.title });
      return { id: Number(inserted[0].insertId) };
    }),
  }),

  portal: router({
    projectDetail: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.user, input.projectId);
      const db = await dbOrThrow();
      const [project] = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Proyecto no encontrado." });
      const [projectTracks, versions, qualityChecks] = await Promise.all([
        db.select().from(tracks).where(eq(tracks.projectId, input.projectId)),
        db.select().from(projectVersions).where(eq(projectVersions.projectId, input.projectId)).orderBy(desc(projectVersions.createdAt)),
        db.select().from(qcItems).where(eq(qcItems.projectId, input.projectId)),
      ]);
      const files = ctx.user.role === "client"
        ? await db.select().from(projectFiles).where(and(eq(projectFiles.projectId, input.projectId), eq(projectFiles.authorizedForClient, true)))
        : await db.select().from(projectFiles).where(eq(projectFiles.projectId, input.projectId));
      return { project, tracks: projectTracks, versions, qualityChecks, files };
    }),
    createVersion: internalProcedure.input(z.object({ projectId: z.number().int().positive(), name: z.string().min(2).max(220), notes: z.string().max(5000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(projectVersions).values({ ...input, createdById: ctx.user.id });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "version.created", resource: "version", resourceId: String(inserted[0].insertId), detail: input.name });
      return { id: Number(inserted[0].insertId) };
    }),
    commentVersion: protectedProcedure.input(z.object({ versionId: z.number().int().positive(), body: z.string().min(1).max(5000), timestampSeconds: z.string().regex(/^\d+(\.\d{1,3})?$/).optional() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const [version] = await db.select().from(projectVersions).where(eq(projectVersions.id, input.versionId)).limit(1);
      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Versión no encontrada." });
      await assertProjectAccess(ctx.user, version.projectId);
      const inserted = await db.insert(versionComments).values({ ...input, authorId: ctx.user.id });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "version.commented", resource: "version", resourceId: String(input.versionId) });
      return { id: Number(inserted[0].insertId) };
    }),
    listVersionComments: protectedProcedure.input(z.object({ versionId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const [version] = await db.select().from(projectVersions).where(eq(projectVersions.id, input.versionId)).limit(1);
      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Versión no encontrada." });
      await assertProjectAccess(ctx.user, version.projectId);
      return db.select().from(versionComments).where(eq(versionComments.versionId, input.versionId)).orderBy(desc(versionComments.createdAt));
    }),
    uploadFile: protectedProcedure.input(z.object({
      projectId: z.number().int().positive(),
      name: z.string().min(1).max(255),
      mime: z.string().min(3).max(120),
      category: z.enum(["source", "reference", "revision", "master", "deliverable"]).default("source"),
      dataUrl: z.string().min(20).max(35_000_000),
      authorizedForClient: z.boolean().default(false),
    })).mutation(async ({ ctx, input }) => {
      await assertProjectAccess(ctx.user, input.projectId);
      const match = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "El archivo debe codificarse como data URL base64." });
      const [, detectedMime, encoded] = match;
      if (detectedMime !== input.mime) throw new TRPCError({ code: "BAD_REQUEST", message: "El tipo MIME declarado no coincide con el archivo." });
      const bytes = Buffer.from(encoded, "base64");
      if (bytes.length > 25 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "El límite de carga inicial es 25 MB por archivo." });
      const safeName = input.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
      const { key, url } = await storagePut(`duck/projects/${input.projectId}/${safeName}`, bytes, input.mime);
      const db = await dbOrThrow();
      const inserted = await db.insert(projectFiles).values({
        projectId: input.projectId,
        uploadedById: ctx.user.id,
        name: input.name,
        storageKey: key,
        url,
        category: input.category,
        mime: input.mime,
        sizeBytes: bytes.length,
        status: "uploaded",
        authorizedForClient: ctx.user.role === "client" ? false : input.authorizedForClient,
      });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "file.uploaded", resource: "project_file", resourceId: String(inserted[0].insertId), detail: `${input.name} · ${input.projectId}` });
      await runEventAutomations("file_uploaded", { projectId: input.projectId });
      return { id: Number(inserted[0].insertId), url };
    }),
  }),

  production: router({
    listChains: internalProcedure.query(async () => (await dbOrThrow()).select().from(processingChains).orderBy(desc(processingChains.updatedAt))),
    createChain: internalProcedure.input(z.object({ name: z.string().min(2).max(180), category: z.string().max(64).default("vocal"), genre: z.string().max(80).optional(), description: z.string().max(4000).optional(), steps: z.array(z.object({ plugin: z.string().min(1).max(180), order: z.number().int().min(0), settings: z.string().max(2000).optional(), notes: z.string().max(2000).optional() })).max(40).default([]) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(processingChains).values(input);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "processing_chain.created", resource: "processing_chain", resourceId: String(inserted[0].insertId), detail: input.name });
      return { id: Number(inserted[0].insertId) };
    }),
    listPlugins: internalProcedure.query(async () => (await dbOrThrow()).select().from(plugins).orderBy(desc(plugins.updatedAt))),
    createPlugin: internalProcedure.input(z.object({ name: z.string().min(2).max(180), developer: z.string().min(2).max(180), version: z.string().min(1).max(80), format: z.string().max(32).default("VST3"), category: z.string().max(64).default("vocal"), tags: z.array(z.string().min(1).max(50)).max(20).default([]), officialUrl: z.string().url().optional(), notes: z.string().max(4000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(plugins).values(input);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "plugin.created", resource: "plugin", resourceId: String(inserted[0].insertId), detail: input.name });
      return { id: Number(inserted[0].insertId) };
    }),
  }),

  finance: router({
    listInvoices: internalProcedure.query(async () => (await dbOrThrow()).select().from(invoices).orderBy(desc(invoices.updatedAt))),
    createInvoice: internalProcedure.input(z.object({ clientId: z.number().int().positive(), projectId: z.number().int().positive().optional(), number: z.string().min(3).max(48), amount: z.string().regex(/^\d+(\.\d{1,2})?$/), currency: z.string().length(3).default("EUR"), dueAt: z.date().optional(), notes: z.string().max(5000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(invoices).values({ ...input, status: "draft" });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "invoice.created", resource: "invoice", resourceId: String(inserted[0].insertId), detail: input.number });
      return { id: Number(inserted[0].insertId), status: "draft" as const };
    }),
    listPaymentRequests: internalProcedure.query(async () => (await dbOrThrow()).select().from(paymentRequests).orderBy(desc(paymentRequests.createdAt))),
    createPaymentRequest: internalProcedure.input(z.object({ invoiceId: z.number().int().positive().optional(), title: z.string().min(2).max(220), amount: z.string().regex(/^\d+(\.\d{1,2})?$/), currency: z.string().length(3).default("EUR"), rationale: z.string().min(4).max(5000) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(paymentRequests).values({ ...input, requestedById: ctx.user.id, status: "pending_approval" });
      const id = Number(inserted[0].insertId);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "payment_request.created", resource: "payment_request", resourceId: String(id), detail: "Pendiente de aprobación explícita." });
      return { id, status: "pending_approval" as const };
    }),
    decidePaymentRequest: ownerProcedure.input(z.object({ paymentRequestId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]), reason: z.string().min(4).max(5000) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, input.paymentRequestId)).limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Solicitud no encontrada." });
      if (request.status !== "pending_approval") throw new TRPCError({ code: "CONFLICT", message: "La solicitud ya fue resuelta." });
      await db.update(paymentRequests).set({ status: input.decision, approvedById: ctx.user.id, approvedAt: new Date(), decisionReason: input.reason }).where(eq(paymentRequests.id, input.paymentRequestId));
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: `payment_request.${input.decision}`, resource: "payment_request", resourceId: String(input.paymentRequestId), detail: input.reason });
      return { success: true, status: input.decision };
    }),
  }),

  automation: router({
    list: internalProcedure.query(async () => (await dbOrThrow()).select().from(automations).orderBy(desc(automations.updatedAt))),
    create: internalProcedure.input(z.object({ name: z.string().min(2).max(180), trigger: z.enum(["project_status_change", "file_uploaded", "version_approved", "task_overdue", "invoice_ready", "stock_low"]), condition: z.record(z.string(), z.unknown()).nullable().optional(), action: z.object({ type: z.enum(["notify_owner", "notify_client", "create_task", "set_status", "create_payment_request", "create_replenishment_proposal"]), payload: z.record(z.string(), z.unknown()).optional() }) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const requiresApproval = requiresPaymentApproval(input.action.type);
      const inserted = await db.insert(automations).values({ ...input, action: { ...input.action, requiresApproval }, createdById: ctx.user.id });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "automation.created", resource: "automation", resourceId: String(inserted[0].insertId), detail: requiresApproval ? "Las acciones de cobro requerirán aprobación." : input.trigger });
      return { id: Number(inserted[0].insertId), requiresApproval };
    }),
    setEnabled: internalProcedure.input(z.object({ automationId: z.number().int().positive(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await db.update(automations).set({ enabled: input.enabled }).where(eq(automations.id, input.automationId));
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: input.enabled ? "automation.resumed" : "automation.paused", resource: "automation", resourceId: String(input.automationId) });
      return { success: true };
    }),
    listRuns: internalProcedure.query(async () => (await dbOrThrow()).select().from(automationRuns).orderBy(desc(automationRuns.createdAt)).limit(100)),
  }),

  inventory: router({
    listProducts: internalProcedure.query(async () => (await dbOrThrow()).select().from(products).orderBy(desc(products.updatedAt))),
    createProduct: internalProcedure.input(z.object({ sku: z.string().min(2).max(80), name: z.string().min(2).max(180), description: z.string().max(4000).optional(), category: z.string().max(80).default("studio"), unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"), stock: z.number().int().min(0), minStock: z.number().int().min(0), pvcSphere: z.number().int().min(1).max(7) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const pvcValidated = isValidPvcUSphere(input.pvcSphere, input.stock, input.minStock);
      const inserted = await db.insert(products).values({ ...input, pvcValidated });
      const id = Number(inserted[0].insertId);
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "inventory.product_created", resource: "product", resourceId: String(id), detail: `PVC-U esfera ${input.pvcSphere}: ${pvcValidated ? "válida" : "rechazada"}` });
      if (input.stock <= input.minStock) await runEventAutomations("stock_low", { productId: id, productName: input.name });
      return { id, pvcValidated };
    }),
    proposeReplenishment: internalProcedure.input(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive(), reason: z.string().min(4).max(2000) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const inserted = await db.insert(replenishmentProposals).values({ productId: input.productId, proposedQuantity: input.quantity, reason: input.reason, status: "proposed" });
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "inventory.replenishment_proposed", resource: "replenishment_proposal", resourceId: String(inserted[0].insertId), detail: input.reason });
      return { id: Number(inserted[0].insertId), status: "proposed" as const };
    }),
  }),

  audit: router({
    list: ownerProcedure.query(async () => (await dbOrThrow()).select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(150)),
    listUsers: ownerProcedure.query(async () => (await dbOrThrow()).select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn))),
    setUserRole: ownerProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["owner", "collaborator", "client"]) })).mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      if (input.userId === ctx.user.id && input.role !== "owner") throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes retirar tu propio rol de propietario desde esta sesión." });
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      await logAudit({ actorId: ctx.user.id, actorRole: ctx.user.role, action: "user.role_changed", resource: "user", resourceId: String(input.userId), detail: input.role });
      return { success: true };
    }),
  }),
});
