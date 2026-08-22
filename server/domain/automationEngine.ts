import { and, eq, sql } from "drizzle-orm";
import { automationRuns, automations, paymentRequests, replenishmentProposals, tasks } from "../../drizzle/schema";
import { getDb } from "../db";
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

export async function runEventAutomations(trigger: string, payload: EventPayload) {
  const db = await getDb();
  if (!db) return;
  const rules = await db.select().from(automations).where(and(eq(automations.trigger, trigger), eq(automations.enabled, true)));

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
      } else if (action.type === "notify_owner" || action.type === "notify_client") {
        detail = `Notificación registrada para ${action.type === "notify_owner" ? "Duck/Elika" : "el cliente"}.`;
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
