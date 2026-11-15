import assert from "node:assert/strict";
import { test } from "node:test";
import { safeReturnPath } from "../src/utils/safe-redirect.ts";
import {
  canPlaceOrderForCustomer,
  getCustomerOrders,
  requestedWishlistAddition,
} from "../src/utils/customer-access.ts";

test("accepts a safe same-origin customer route with its query", () => {
  assert.equal(
    safeReturnPath("/account/orders?filter=delivered"),
    "/account/orders?filter=delivered",
  );
});

test("rejects external, protocol-relative, backslash, and control-character destinations", () => {
  for (const destination of [
    "https://attacker.example",
    "//attacker.example/path",
    "/\\attacker.example",
    "/account\u0000/orders",
  ]) {
    assert.equal(safeReturnPath(destination), "/");
  }
});

test("rejects login and API destinations to prevent redirect loops or private endpoint navigation", () => {
  assert.equal(safeReturnPath("/login?redirect=/account"), "/");
  assert.equal(safeReturnPath("/api/prestashop/products"), "/");
});

test("uses a supplied fallback for invalid destinations", () => {
  assert.equal(safeReturnPath("javascript:alert(1)", "/cart"), "/cart");
});

test("checkout submission requires an authenticated matching customer", () => {
  assert.equal(canPlaceOrderForCustomer(false, "customer-a"), false);
  assert.equal(canPlaceOrderForCustomer(true, null), false);
  assert.equal(canPlaceOrderForCustomer(true, "customer-a", "customer-b"), false);
  assert.equal(canPlaceOrderForCustomer(true, "customer-a", "customer-a"), true);
});

test("order history is limited to the authenticated customer and empty for guests", () => {
  const orders = [
    { id: "order-a", userId: "customer-a" },
    { id: "order-b", userId: "customer-b" },
  ];
  assert.deepEqual(getCustomerOrders(orders, null), []);
  assert.deepEqual(getCustomerOrders(orders, "customer-a"), [orders[0]]);
});

test("wishlist intent adds only an available item that is not already saved", () => {
  assert.equal(requestedWishlistAddition("product-a", ["product-a"], []), "product-a");
  assert.equal(requestedWishlistAddition("unknown", ["product-a"], []), null);
  assert.equal(requestedWishlistAddition("product-a", ["product-a"], ["product-a"]), null);
});
