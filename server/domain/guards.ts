export function isValidPvcUSphere(sphere: number, stock: number, minStock: number) {
  return Number.isInteger(sphere) && sphere >= 1 && sphere <= 7 && Number.isInteger(stock) && stock >= 0 && Number.isInteger(minStock) && minStock >= 0;
}

export function requiresPaymentApproval(actionType: string) {
  return actionType === "create_payment_request" || actionType === "create_invoice" || actionType === "send_payment" || actionType === "execute_charge";
}

export function isInternalRole(role: "owner" | "collaborator" | "client") {
  return role === "owner" || role === "collaborator";
}

export function canResolvePaymentRequest(role: "owner" | "collaborator" | "client", status: string) {
  return role === "owner" && status === "pending_approval";
}

export function canAccessClientProject(role: "owner" | "collaborator" | "client", projectClientId: number, viewerClientId: number | null) {
  return role !== "client" || (viewerClientId !== null && projectClientId === viewerClientId);
}
