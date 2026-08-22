export function isValidPvcUSphere(sphere: number, stock: number, minStock: number) {
  return Number.isInteger(sphere) && sphere >= 1 && sphere <= 7 && Number.isInteger(stock) && stock >= 0 && Number.isInteger(minStock) && minStock >= 0;
}

export function requiresPaymentApproval(actionType: string) {
  return actionType === "create_payment_request" || actionType === "create_invoice" || actionType === "send_payment" || actionType === "execute_charge";
}
