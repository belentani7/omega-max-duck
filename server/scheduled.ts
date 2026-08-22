import type { Request, Response } from "express";
import { and, eq, lte } from "drizzle-orm";
import { automations, tasks } from "../drizzle/schema";
import { getDb } from "./db";
import { runEventAutomations } from "./domain/automationEngine";
import { sdk } from "./_core/sdk";

export async function runOverdueTasks(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req as unknown as Request);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "database-unavailable" });
    const [automation] = await db.select().from(automations).where(eq(automations.scheduleCronTaskUid, user.taskUid)).limit(1);
    if (!automation || !automation.enabled || automation.trigger !== "task_overdue") return res.json({ ok: true, skipped: "orphan-or-disabled" });
    const overdueTasks = await db.select().from(tasks).where(and(eq(tasks.status, "todo"), lte(tasks.dueAt, new Date())));
    for (const task of overdueTasks) await runEventAutomations("task_overdue", { projectId: task.projectId ?? undefined }, automation.id);
    return res.json({ ok: true, processed: overdueTasks.length, taskUid: user.taskUid });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "scheduled-task-failed",
      context: { path: "/api/scheduled/task-overdue" },
      timestamp: new Date().toISOString(),
    });
  }
}
