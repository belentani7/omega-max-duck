import { describe, expect, it, vi } from "vitest";

const { authenticateRequest } = vi.hoisted(() => ({ authenticateRequest: vi.fn() }));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest } }));
vi.mock("./db", () => ({ getDb: vi.fn() }));

import { runOverdueTasks } from "./scheduled";

describe("recordatorios programados", () => {
  it("rechaza solicitudes que no proceden de un trabajo cron autenticado", async () => {
    authenticateRequest.mockResolvedValue({ isCron: false });
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    await runOverdueTasks({ headers: {} } as never, { status, json } as never);
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: "cron-only" });
  });
});
