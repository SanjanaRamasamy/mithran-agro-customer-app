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
import { sanitizeProductDescription } from "../src/lib/product-description.ts";
import { MOCK_NOTIFICATIONS } from "../src/data/offers.ts";
import { notificationTimeLabel } from "../src/utils/format.ts";
import {
  getInitialNotifications,
  loadPersistedNotifications,
} from "../src/utils/notification-state.ts";

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

test("keeps plain-text product descriptions as text", () => {
  assert.equal(
    sanitizeProductDescription("Fresh mangoes & guavas"),
    "Fresh mangoes &amp; guavas",
  );
});

test("preserves legitimate paragraph formatting", () => {
  assert.equal(
    sanitizeProductDescription("<p>Fresh produce</p><p>Carefully harvested.</p>"),
    "<p>Fresh produce</p><p>Carefully harvested.</p>",
  );
});

test("preserves headings and bold text", () => {
  assert.equal(
    sanitizeProductDescription("<h2>Nutrition</h2><p><b>Rich</b> in vitamins.</p>"),
    "<h2>Nutrition</h2><p><b>Rich</b> in vitamins.</p>",
  );
});

test("preserves ordered and unordered lists", () => {
  assert.equal(
    sanitizeProductDescription("<ul><li>One</li></ul><ol><li>Two</li></ol>"),
    "<ul><li>One</li></ul><ol><li>Two</li></ol>",
  );
});

test("preserves mixed text and formatted markup", () => {
  assert.equal(
    sanitizeProductDescription("A sweet fruit. <p>Grown locally.</p> Best enjoyed fresh."),
    "A sweet fruit. <p>Grown locally.</p> Best enjoyed fresh.",
  );
});

test("removes AI citation references and unwraps citation-wrapped product copy", () => {
  assert.equal(
    sanitizeProductDescription(
      '<div class="model-response-message-content"><p>Dragon fruit is nutritious <span class="citation-27">[27]</span> and refreshing.</p><sup class="citation-26">26</sup></div>',
    ),
    "<p>Dragon fruit is nutritious  and refreshing.</p>",
  );
});

test("removes source-label metadata without removing surrounding product copy", () => {
  assert.equal(
    sanitizeProductDescription(
      '<p>High in fiber.</p><div class="source-inline-chip-container"><span class="source-label-container">Healthline</span></div><p>Enjoy chilled.</p>',
    ),
    "<p>High in fiber.</p><p>Enjoy chilled.</p>",
  );
});

test("removes unsafe markup, event attributes, and unsafe links", () => {
  const sanitized = sanitizeProductDescription(
    '<p onclick="alert(1)">Safe <strong>content</strong></p><script>alert(1)</script><iframe src="https://attacker.example"></iframe><a href="javascript:alert(1)">unsafe link</a><img src=x onerror=alert(1)>',
  );
  assert.equal(sanitized, "<p>Safe <strong>content</strong></p>unsafe link");
  assert.doesNotMatch(sanitized, /script|iframe|javascript:|onclick|onerror|attacker/);
});

test("returns empty output for missing or empty descriptions", () => {
  assert.equal(sanitizeProductDescription(undefined), "");
  assert.equal(sanitizeProductDescription(null), "");
  assert.equal(sanitizeProductDescription("   "), "");
});

test("notification initial time markup uses the same fixed timestamp and fallback on server and client", () => {
  const [firstNotification] = MOCK_NOTIFICATIONS;
  assert.equal(firstNotification.id, "ntf-1");
  assert.deepEqual(
    MOCK_NOTIFICATIONS.map((notification) => notification.timestamp),
    [
      "2026-11-17T04:45:00.000Z",
      "2026-11-17T00:45:00.000Z",
      "2026-11-16T20:45:00.000Z",
      "2026-11-16T07:45:00.000Z",
      "2026-11-15T23:45:00.000Z",
      "2026-11-15T07:45:00.000Z",
    ],
  );
  assert.equal(notificationTimeLabel(firstNotification.timestamp, null), "—");
  assert.equal(notificationTimeLabel(firstNotification.timestamp, null), "—");
});

test("notification relative time is calculated only after a mounted clock is available", () => {
  const timestamp = "2026-11-17T04:45:00.000Z";
  const mountedNow = Date.parse("2026-11-17T05:45:00.000Z");
  assert.equal(notificationTimeLabel(timestamp, null), "—");
  assert.equal(notificationTimeLabel(timestamp, mountedNow), "1h ago");
});

test("notification timestamps that are missing or invalid render safely", () => {
  assert.equal(notificationTimeLabel(undefined, Date.now()), "—");
  assert.equal(notificationTimeLabel("", Date.now()), "—");
  assert.equal(notificationTimeLabel("not-a-date", Date.now()), "—");
});

test("notification initial state is the deterministic shared server and client snapshot", () => {
  const serverSnapshot = getInitialNotifications(MOCK_NOTIFICATIONS);
  const clientSnapshot = getInitialNotifications(MOCK_NOTIFICATIONS);
  assert.deepEqual(serverSnapshot, MOCK_NOTIFICATIONS);
  assert.deepEqual(clientSnapshot, serverSnapshot);
  assert.deepEqual(
    clientSnapshot.map(({ id, timestamp, read }) => ({ id, timestamp, read })),
    MOCK_NOTIFICATIONS.map(({ id, timestamp, read }) => ({ id, timestamp, read })),
  );
});

test("localStorage cannot affect initial notifications and persisted state loads on demand", () => {
  const persisted = [
    { ...MOCK_NOTIFICATIONS[0], id: "stored-notification", read: true },
  ];
  const initial = getInitialNotifications(MOCK_NOTIFICATIONS);
  let storageReads = 0;
  assert.deepEqual(initial, MOCK_NOTIFICATIONS);
  assert.equal(storageReads, 0);

  const loaded = loadPersistedNotifications(() => {
    storageReads += 1;
    return persisted;
  }, initial);
  assert.equal(storageReads, 1);
  assert.deepEqual(loaded, persisted);
});

test("malformed persisted notification data falls back to the initial snapshot", () => {
  const initial = getInitialNotifications(MOCK_NOTIFICATIONS);
  assert.deepEqual(loadPersistedNotifications(() => ({ timestamp: "not-an-array" }), initial), initial);
});
