import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const values = vi.fn(async () => [{ insertId: 21 }]);
const insert = vi.fn(() => ({ values }));
const where = vi.fn(async () => []);
const from = vi.fn(() => ({ where, orderBy: vi.fn(async () => []) }));
const select = vi.fn(() => ({ from }));
const update = vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(async () => undefined) })) }));

vi.mock("../db", () => ({ getDb: async () => ({ insert, select, update }) }));
vi.mock("../_core/notification", () => ({ notifyOwner: async () => true }));

import { studioRouter } from "./studio";

const context = {
  user: { id: 1, openId: "duck-owner", name: "Duck", email: null, loginMethod: "manus", role: "owner", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { headers: { cookie: "" } },
  res: {},
} as unknown as TrpcContext;

describe("flujos críticos de Duck Ω-MAX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea un cliente de CRM y conserva la auditoría", async () => {
    const caller = studioRouter.createCaller(context);
    await expect(caller.crm.createClient({ name: "Cliente real", email: "client@example.com", tags: [] })).resolves.toEqual({ id: 21 });
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it("crea un producto con PVC-U válido y no genera una compra automática", async () => {
    const caller = studioRouter.createCaller(context);
    await expect(caller.inventory.createProduct({ sku: "DUCK-001", name: "Cable", stock: 2, minStock: 1, pvcSphere: 3, unitPrice: "0" })).resolves.toEqual({ id: 21, pvcValidated: true });
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it("crea una solicitud financiera siempre en el flujo de aprobación", async () => {
    const caller = studioRouter.createCaller(context);
    await expect(caller.finance.createPaymentRequest({ title: "Mezcla final", amount: "250.00", currency: "EUR", rationale: "Pago acordado de revisión final." })).resolves.toMatchObject({ id: 21, status: "pending_approval" });
    expect(insert).toHaveBeenCalledTimes(2);
  });
});
