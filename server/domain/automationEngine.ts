import { and, eq, sql } from "drizzle-orm";
import { automationRuns, automations, clients, communications, paymentRequests, projects, replenishmentProposals, tasks } from "../../drizzle/schema";
import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";
import { requiresPaymentApproval } from "./guards";

type EventPayload = {
  projectId?: number;
  productId?: number;
  productName?: string;
};

type ActionSpec = {
  type: string;
  payload?: Record<string, unknown>;
  requiresApproval?: boolean;
};

export async function runEventAutomations(trigger: string, payload: EventPayload, onlyAutomationId?: number) {
  const db = await getDb();
  if (!db) return;
  const criteria = [eq(automations.trigger, trigger), eq(automations.enabled, true)];
  if (onlyAutomationId) criteria.push(eq(automations.id, onlyAutomationId));
  const rules = await db.select().from(automations).where(and(...criteria));

  for (const rule of rules) {
    const action = rule.action as ActionSpec;
    let status: "success" | "failed" | "skipped" | "awaiting_approval" = "success";
    let detail = "";
    try {
      if (action.type === "create_task" && payload.projectId) {
        await db.insert(tasks).values({ projectId: payload.projectId, title: String(action.payload?.title || `Automatización: ${rule.name}`), priority: "medium" });
        detail = "Tarea operativa creada.";
      } else if (action.type === "create_replenishment_proposal" && payload.productId) {
        const quantity = Math.max(1, Number(action.payload?.quantity || 1));
        await db.insert(replenishmentProposals).values({ productId: payload.productId, proposedQuantity: quantity, reason: `Propuesta creada por la regla «${rule.name}».`, status: "proposed", createdByAutomationId: rule.id });
        detail = "Propuesta de reposición creada; no se emitió ninguna orden de compra.";
      } else if (requiresPaymentApproval(action.type)) {
        const amount = Number(action.payload?.amount || 0);
        if (amount > 0) {
          await db.insert(paymentRequests).values({
            sourceAutomationId: rule.id,
            title: String(action.payload?.title || `Propuesta de cobro: ${rule.name}`),
            amount: String(amount.toFixed(2)),
            currency: String(action.payload?.currency || "EUR"),
            rationale: `Generada por automatización «${rule.name}». No se ejecutó ningún cobro.`,
            status: "pending_approval",
          });
          detail = "Solicitud financiera creada y bloqueada hasta aprobación explícita.";
        } else {
          detail = "Acción financiera detectada sin importe: ninguna solicitud ni cobro fue ejecutado.";
        }
        status = "awaiting_approval";
      } else if (action.type === "notify_owner") {
        const title = String(action.payload?.title || `Ω-MAX · ${rule.name}`);
        const body = String(action.payload?.body || `La regla «${rule.name}» se activó por ${trigger}.`);
        const delivered = await notifyOwner({ title, content: body });
        await db.insert(communications).values({ projectId: payload.projectId, audience: "owner", channel: "in_app", title, body });
        detail = delivered ? "Aviso enviado a Duck/Elika y registrado en la bitácora interna." : "Aviso interno registrado; el canal de propietario no estuvo disponible.";
      } else if (action.type === "notify_client") {
        if (!payload.projectId) {
          status = "skipped";
          detail = "No hay proyecto asociado para identificar al cliente destinatario.";
        } else {
          const [project] = await db.select({ clientId: projects.clientId }).from(projects).where(eq(projects.id, payload.projectId)).limit(1);
          const [client] = project ? await db.select({ portalUserId: clients.portalUserId }).from(clients).where(eq(clients.id, project.clientId)).limit(1) : [];
          const title = String(action.payload?.title || `Actualización de proyecto`);
          const body = String(action.payload?.body || `Hay una actualización disponible en tu proyecto dentro de Duck Ω-MAX.`);
          await db.insert(communications).values({ projectId: payload.projectId, recipientUserId: client?.portalUserId ?? null, audience: "client", channel: "in_app", title, body });
          detail = "Mensaje interno registrado para el portal del cliente.";
        }
      } else {
        status = "skipped";
        detail = "La regla no tiene datos suficientes para ejecutar una acción segura.";
      }
    } catch (error) {
      status = "failed";
      detail = error instanceof Error ? error.message.slice(0, 1000) : "Error no identificado durante la automatización.";
    }

    await db.insert(automationRuns).values({ automationId: rule.id, status, detail, payload });
    await db.update(automations).set({ runs: sql`${automations.runs} + 1`, lastRunAt: new Date() }).where(eq(automations.id, rule.id));
  }
}
