import { describe, expect, it } from "vitest";
import { canAccessClientProject, canResolvePaymentRequest, isInternalRole, isValidPvcUSphere, requiresPaymentApproval } from "./guards";

describe("reglas de gobernanza de Duck Ω-MAX", () => {
  it("acepta únicamente las esferas PVC-U 1 a 7 con stock no negativo", () => {
    expect(isValidPvcUSphere(1, 0, 0)).toBe(true);
    expect(isValidPvcUSphere(7, 12, 3)).toBe(true);
    expect(isValidPvcUSphere(8, 12, 3)).toBe(false);
    expect(isValidPvcUSphere(2, -1, 3)).toBe(false);
  });

  it("mantiene toda acción financiera automatizada detrás de aprobación explícita", () => {
    expect(requiresPaymentApproval("create_payment_request")).toBe(true);
    expect(requiresPaymentApproval("create_invoice")).toBe(true);
    expect(requiresPaymentApproval("send_payment")).toBe(true);
    expect(requiresPaymentApproval("execute_charge")).toBe(true);
    expect(requiresPaymentApproval("create_task")).toBe(false);
  });

  it("separa permisos de equipo, clientes y decisiones de pago", () => {
    expect(isInternalRole("owner")).toBe(true);
    expect(isInternalRole("collaborator")).toBe(true);
    expect(isInternalRole("client")).toBe(false);
    expect(canResolvePaymentRequest("owner", "pending_approval")).toBe(true);
    expect(canResolvePaymentRequest("collaborator", "pending_approval")).toBe(false);
    expect(canResolvePaymentRequest("owner", "approved")).toBe(false);
  });

  it("limita el proyecto de portal al cliente asignado", () => {
    expect(canAccessClientProject("owner", 4, null)).toBe(true);
    expect(canAccessClientProject("collaborator", 4, null)).toBe(true);
    expect(canAccessClientProject("client", 4, 4)).toBe(true);
    expect(canAccessClientProject("client", 4, 7)).toBe(false);
    expect(canAccessClientProject("client", 4, null)).toBe(false);
  });
});
