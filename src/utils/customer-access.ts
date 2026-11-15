export function getCustomerOrders<T extends { userId: string }>(
  orders: T[],
  customerId: string | null | undefined
): T[] {
  return customerId ? orders.filter((order) => order.userId === customerId) : [];
}

export function canPlaceOrderForCustomer(
  isAuthenticated: boolean,
  customerId: string | null | undefined,
  orderCustomerId?: string
): boolean {
  return Boolean(isAuthenticated && customerId && (!orderCustomerId || customerId === orderCustomerId));
}

export function requestedWishlistAddition(
  productId: string | null,
  availableProductIds: string[],
  savedProductIds: string[]
): string | null {
  if (!productId || !availableProductIds.includes(productId) || savedProductIds.includes(productId)) {
    return null;
  }
  return productId;
}
