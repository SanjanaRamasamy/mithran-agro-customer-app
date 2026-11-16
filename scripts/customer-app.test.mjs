import assert from "node:assert/strict";
import { test } from "node:test";
import { safeReturnPath } from "../src/utils/safe-redirect.ts";
import {
  canPlaceOrderForCustomer,
  getCustomerOrders,
  requestedWishlistAddition,
} from "../src/utils/customer-access.ts";
import {
  applyPrestaShopStockAvailables,
  getPrestaShopStockAvailableIds,
  isPrestaShopQuantityAvailable,
  mapPrestaShopProduct,
  parsePrestaShopStockAvailables,
} from "../src/lib/prestashop-catalog.ts";

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

const productFixture = (id, stockLinks, extra = {}) => ({
  id: String(id),
  id_shop_default: "1",
  name: "Fixture product",
  price: "25.00",
  quantity: "999",
  active: "1",
  available_for_order: "1",
  minimal_quantity: "1",
  visibility: "both",
  associations: stockLinks === null
    ? {}
    : { stock_availables: { stock_available: stockLinks } },
  ...extra,
});

const stockFixture = ({
  id,
  productId,
  shopId = 1,
  shopGroupId = 0,
  quantity = 100,
}) => ({
  id,
  id_product: productId,
  id_shop: shopId,
  id_shop_group: shopGroupId,
  quantity,
});

function enrichFixture(product, stockRecords) {
  const parsedStock = parsePrestaShopStockAvailables({
    stock_availables: { stock_available: stockRecords },
  });
  return applyPrestaShopStockAvailables([product], parsedStock)[0];
}

test("maps Orange from its linked stock record fixture and validates checkout quantity", () => {
  const orange = productFixture(27, { id: "71", id_product_attribute: "0" }, {
    name: "Oranges",
    price: "220.000000",
    minimal_quantity: "1",
  });
  const orangeStockResponse = {
    stock_available: {
      id: 71,
      id_product: 27,
      id_shop: 1,
      quantity: 150,
      out_of_stock: 2,
    },
  };
  const stockIds = getPrestaShopStockAvailableIds([orange]);
  const stock = parsePrestaShopStockAvailables(orangeStockResponse);
  const [enrichedOrange] = applyPrestaShopStockAvailables([orange], stock);
  const mappedOrange = mapPrestaShopProduct(enrichedOrange, []);

  assert.deepEqual(stockIds, ["71"]);
  assert.equal(mappedOrange?.prestaShop?.quantity, 150);
  assert.equal(mappedOrange?.variants[0]?.stockCount, 150);
  assert.equal(mappedOrange?.variants[0]?.inStock, true);
  assert.equal(isPrestaShopQuantityAvailable(150, 1, mappedOrange?.prestaShop?.quantity), true);
  assert.equal(isPrestaShopQuantityAvailable(151, 1, mappedOrange?.prestaShop?.quantity), false);
  assert.equal(isPrestaShopQuantityAvailable(1, 2, 150), false);
  assert.equal(isPrestaShopQuantityAvailable(2, 2, 150), true);
});

test("rejects products with no linked stock IDs instead of retaining stale quantity", () => {
  const product = productFixture(41, null);
  assert.throws(() => getPrestaShopStockAvailableIds([product]));
  assert.throws(() => enrichFixture(product, []));
});

test("rejects malformed entries among otherwise valid stock links", () => {
  const product = productFixture(50, [
    { id: "909", id_product_attribute: "0" },
    null,
  ]);
  assert.throws(() => getPrestaShopStockAvailableIds([product]));
});

test("rejects incomplete linked stock data instead of retaining stale quantity", () => {
  const product = productFixture(42, [
    { id: "901", id_product_attribute: "0" },
    { id: "902", id_product_attribute: "0" },
  ]);
  assert.throws(() => enrichFixture(product, [
    stockFixture({ id: 901, productId: 42, quantity: 150 }),
  ]));
});

test("rejects an invalid stock shop-group association", () => {
  const product = productFixture(51, { id: "910", id_product_attribute: "0" });
  assert.throws(() => enrichFixture(product, [
    stockFixture({
      id: 910,
      productId: 51,
      shopGroupId: "invalid",
      quantity: 150,
    }),
  ]));
});

test("rejects stock records associated with another product", () => {
  const product = productFixture(43, { id: "903", id_product_attribute: "0" });
  assert.throws(() => enrichFixture(product, [
    stockFixture({ id: 903, productId: 44, quantity: 150 }),
  ]));
});

test("rejects stock records associated with another shop", () => {
  const product = productFixture(45, { id: "904", id_product_attribute: "0" });
  assert.throws(() => enrichFixture(product, [
    stockFixture({ id: 904, productId: 45, shopId: 2, quantity: 150 }),
  ]));
});

test("rejects group-scoped stock when no matching shop-group context is configured", () => {
  const product = productFixture(49, { id: "908", id_product_attribute: "0" });
  assert.throws(() => enrichFixture(product, [
    stockFixture({
      id: 908,
      productId: 49,
      shopId: 0,
      shopGroupId: 1,
      quantity: 150,
    }),
  ]));
});

test("aggregates distinct attribute stock records only within the product shop context", () => {
  const product = productFixture(20, [
    { id: "59", id_product_attribute: "0" },
    { id: "60", id_product_attribute: "40" },
    { id: "61", id_product_attribute: "41" },
  ]);
  const enriched = enrichFixture(product, [
    stockFixture({ id: 59, productId: 20, quantity: 100 }),
    stockFixture({ id: 60, productId: 20, quantity: 100 }),
    stockFixture({ id: 61, productId: 20, quantity: 100 }),
  ]);
  assert.equal(enriched.quantity, 300);
});

test("deduplicates repeated links and identical stock records before aggregation", () => {
  const product = productFixture(46, [
    { id: "905", id_product_attribute: "0" },
    { id: "905", id_product_attribute: "0" },
  ]);
  const record = stockFixture({ id: 905, productId: 46, quantity: 15 });
  const enriched = enrichFixture(product, [record, record]);
  assert.equal(enriched.quantity, 15);
});

test("rejects duplicate stock IDs with conflicting data", () => {
  const product = productFixture(47, { id: "906", id_product_attribute: "0" });
  assert.throws(() => enrichFixture(product, [
    stockFixture({ id: 906, productId: 47, quantity: 15 }),
    stockFixture({ id: 906, productId: 47, quantity: 16 }),
  ]));
});

test("rejects invalid or missing stock data for checkout", () => {
  assert.equal(isPrestaShopQuantityAvailable(1, 1, undefined), false);
  assert.equal(isPrestaShopQuantityAvailable(1, undefined, 150), false);
  assert.equal(isPrestaShopQuantityAvailable(1, 1, Number.NaN), false);
  assert.equal(isPrestaShopQuantityAvailable(0, 0, 150), false);
  const product = productFixture(48, { id: "907", id_product_attribute: "0" });
  assert.throws(() => enrichFixture(product, [
    stockFixture({ id: 907, productId: 48, quantity: "not-a-number" }),
  ]));
});
