import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { formatDateTime, notificationTimeLabel } from "../src/utils/format.ts";
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
import {
  getInitialNotifications,
  loadPersistedNotifications,
} from "../src/utils/notification-state.ts";
import { parseCustomerOrder } from "../src/lib/customer-order.ts";
import {
  CustomerApiError,
  customerApiErrorDetails,
  hasSameOrigin,
  readCustomerSession,
} from "../src/lib/customer-api-security.ts";
import {
  mergeCustomerCart,
  mergeCustomerWishlist,
  parseCustomerCart,
  parseCustomerWishlist,
} from "../src/utils/customer-sync.ts";

const customerModuleSource = readFile(
  new URL("../prestashop-module/mithranagroapp/classes/HeadlessCustomerApi.php", import.meta.url),
  "utf8",
);
const customerModuleEntry = readFile(
  new URL("../prestashop-module/mithranagroapp/mithranagroapp.php", import.meta.url),
  "utf8",
);
const customerModuleRecoveryUpgrade = readFile(
  new URL("../prestashop-module/mithranagroapp/upgrade/upgrade-1.2.1.php", import.meta.url),
  "utf8",
);

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

test("customer cart persistence merges matching lines and preserves distinct variants", () => {
  const remote = [{
    id: "27:prestashop-27",
    productId: "27",
    variantId: "prestashop-27",
    quantity: 2,
    addedAt: "2026-11-16T10:00:00.000Z",
  }];
  const guest = [
    { ...remote[0], quantity: 1 },
    {
      id: "27:prestashop-27-40",
      productId: "27",
      variantId: "prestashop-27-40",
      quantity: 3,
      addedAt: "2026-11-16T11:00:00.000Z",
    },
  ];
  assert.deepEqual(parseCustomerCart(guest), guest);
  assert.deepEqual(
    mergeCustomerCart(remote, guest).map(({ variantId, quantity }) => ({ variantId, quantity })),
    [
      { variantId: "prestashop-27", quantity: 3 },
      { variantId: "prestashop-27-40", quantity: 3 },
    ],
  );
  assert.equal(parseCustomerCart([{ ...remote[0], quantity: 0 }]), null);
});

test("customer wishlist persistence merges each product once", () => {
  const remote = [{ productId: "27", addedAt: "2026-11-16T10:00:00.000Z" }];
  const guest = [
    { productId: "27", addedAt: "2026-11-16T11:00:00.000Z" },
    { productId: "28", addedAt: "2026-11-16T12:00:00.000Z" },
  ];
  assert.deepEqual(parseCustomerWishlist(guest), guest);
  assert.deepEqual(
    mergeCustomerWishlist(remote, guest).map((entry) => entry.productId),
    ["27", "28"],
  );
});

test("authenticated cart and wishlist data stay hidden until the current account loads", async () => {
  const [cart, wishlist] = await Promise.all([
    readFile(new URL("../src/contexts/CartContext.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/contexts/WishlistContext.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(cart, /storageOwner === \(user\?\.id \?\? null\)/);
  assert.match(cart, /const visibleItems = hasCurrentStorage \? items : \[\]/);
  assert.match(wishlist, /storageOwner === \(user\?\.id \?\? null\)/);
  assert.match(wishlist, /const visibleEntries = hasCurrentStorage \? entries : \[\]/);
});

test("PrestaShop customer storage is authenticated and namespaced per customer", async () => {
  const [api, module] = await Promise.all([customerModuleSource, customerModuleEntry]);
  assert.match(api, /case 'cart:get'/);
  assert.match(api, /case 'cart:save'/);
  assert.match(api, /case 'wishlist:get'/);
  assert.match(api, /case 'wishlist:save'/);
  assert.match(api, /private function authenticatedCustomer\(\)/);
  assert.match(api, /id_customer` = ' \. \(int\) \$customer->id/);
  assert.match(module, /PRIMARY KEY \(`id_customer`, `data_type`\)/);
  assert.match(module, /mithranagro_customer_data/);
  assert.doesNotMatch(module, /DROP TABLE/);
});

test("PrestaShop order submission is customer-scoped and idempotent", async () => {
  const [api, module] = await Promise.all([customerModuleSource, customerModuleEntry]);
  assert.match(module, /PRIMARY KEY \(`id_customer`, `idempotency_key`\)/);
  assert.match(module, /`claim_token` CHAR\(32\)/);
  assert.match(module, /`request_hash` CHAR\(64\)/);
  assert.match(api, /duplicate_submission/);
  assert.match(api, /checkoutRequestHash/);
  assert.match(api, /hash_equals\(\(string\) \$row\['request_hash'\], \$requestHash\)/);
  assert.match(api, /Order::getIdByCartId/);
  assert.match(api, /->validateOrder\(/);
  assert.match(api, /\(int\) \$order->id_customer !== \(int\) \$customer->id/);
  assert.match(api, /getQuantityAvailableByProduct\(\$productId, \$attributeId, \$shopId\)/);
  assert.match(api, /getOrderTotal\(true, Cart::BOTH\)/);
  assert.match(api, /orderHistoryPayload/);
  assert.match(module, /\$state->paid = false;/);
  assert.match(module, /\$state->logable = false;/);
});

test("checkout idempotency fences concurrent retries and rejects request fingerprint changes", async () => {
  const [api, module] = await Promise.all([customerModuleSource, customerModuleEntry]);
  assert.match(module, /PRIMARY KEY \(`id_customer`, `idempotency_key`\)/);
  assert.match(api, /AND `claim_token` =/);
  assert.match(api, /SET `state` = \\'processing\\', `claim_token` =/);
  assert.match(api, /`request_hash` =/);
  assert.match(api, /\$row\['request_hash'\] === '' \|\|[\s\S]*?hash_equals/);
  assert.match(api, /'claim_token' => \$currentClaimToken/);
});

test("interrupted order creation returns an existing cart order or stays pending for reconciliation", async () => {
  const api = await customerModuleSource;
  const start = api.indexOf("private function createOrder(");
  const end = api.indexOf("private function validatedCartItems(", start);
  const createOrder = api.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(createOrder, /beginIdempotencyOrderCreation/);
  assert.match(createOrder, /if \(!\$orderCreationStarted\)/);
  assert.match(createOrder, /throw new MithranAgroApiException\('duplicate_submission', 409\);/);
  assert.match(createOrder, /Order::getIdByCartId/);
  assert.match(createOrder, /if \(!\$orderCreationStarted\) \{\s*if \(!\$cart->delete\(\)\)/);
  assert.match(api, /`state` = \\'order_pending\\'/);
  assert.match(api, /time\(\) - 600/);
  assert.match(api, /AND `date_upd` < \\'[\s\S]*?AND `claim_token` =/);
});

test("quote and order creation rebuild server-priced native carts and reject changed totals", async () => {
  const api = await customerModuleSource;
  const quoteStart = api.indexOf("private function quoteCheckout(");
  const orderStart = api.indexOf("private function createOrder(", quoteStart);
  const cartStart = api.indexOf("private function validatedCartItems(", orderStart);
  assert.match(api.slice(quoteStart, orderStart), /buildCart\(\$body\['items'\] \?\? null, \$customer, \$address\)/);
  assert.match(api.slice(orderStart, cartStart), /buildCart\(\$body\['items'\] \?\? null, \$customer, \$address\)/);
  assert.match(api.slice(orderStart, cartStart), /getOrderTotal\(true, Cart::BOTH\)/);
  assert.match(api.slice(orderStart, cartStart), /price_changed/);
  assert.match(api, /StockAvailable::getQuantityAvailableByProduct\(\$productId, \$attributeId, \$shopId\)/);
  assert.match(api, /if \(\$quantity < \$minimum \|\| \$quantity > \$stock\)/);
  assert.match(api, /if \(\$attributeId === null \|\| \$attributeId !== \$defaultAttributeId\)/);
  assert.doesNotMatch(api.slice(quoteStart, cartStart), /item\[['"](?:price|total|stock|sellerId)['"]\]/);
});

test("address and order lookups enforce ownership through PrestaShop customer IDs", async () => {
  const api = await customerModuleSource;
  assert.match(api, /private function updateProfile\(array \$body\)[\s\S]*?\$this->authenticatedCustomer\(\)/);
  assert.match(api, /private function updateAddress\(array \$body\)[\s\S]*?\(int\) \$address->id_customer !== \(int\) \$customer->id/);
  assert.match(api, /private function deleteAddress\(array \$body\)[\s\S]*?\(int\) \$address->id_customer !== \(int\) \$customer->id/);
  assert.match(api, /private function getOrder\(array \$body\)[\s\S]*?\(int\) \$order->id_customer !== \(int\) \$customer->id/);
  assert.match(api, /private function listOrders\(\)[\s\S]*?\(int\) \$order->id_customer !== \(int\) \$customer->id/);
  assert.match(api, /private function deliveryAddress\(\$addressId, \$customer\)[\s\S]*?\(int\) \$address->id_customer !== \(int\) \$customer->id/);
  assert.match(api, /private function getCustomerData\(\$dataType\)[\s\S]*?\$this->authenticatedCustomer\(\)/);
});

test("sessions expire, honor revocation, and are invalidated when the PrestaShop password changes", async () => {
  const [api, module, upgrade] = await Promise.all([
    customerModuleSource,
    customerModuleEntry,
    readFile(
      new URL("../prestashop-module/mithranagroapp/upgrade/upgrade-1.2.0.php", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(api, /`revoked` = 0 AND `expires_at` > NOW\(\)/);
  assert.match(api, /customerPasswordFingerprint/);
  assert.match(api, /hash_equals\(\$fingerprint, \$this->customerPasswordFingerprint\(\$customer\)\)/);
  assert.match(api, /private function logout\(\)[\s\S]*?if \(!Db::getInstance\(\)->update/);
  assert.match(module, /password_fingerprint` CHAR\(64\)/);
  assert.match(upgrade, /ADD `password_fingerprint` CHAR\(64\)/);
  assert.match(upgrade, /SET `revoked` = 1/);
  assert.match(upgrade, /ADD `claim_token` CHAR\(32\)/);
  assert.match(upgrade, /SET `state` = \\'order_pending\\'/);
});

test("v1.2.1 repair independently adds either missing column and accepts existing compatible columns", async () => {
  const [module, migration] = await Promise.all([
    customerModuleEntry,
    customerModuleRecoveryUpgrade,
  ]);
  assert.match(module, /\$this->version = '1\.(2\.1|3\.0)';/);
  assert.match(migration, /function upgrade_module_1_2_1\(\$module\)/);
  assert.match(migration, /'password_fingerprint', 64, 'id_customer'/);
  assert.match(migration, /'claim_token', 32, 'request_hash'/);
  assert.match(module, /`password_fingerprint` CHAR\(64\) CHARACTER SET ascii NOT NULL DEFAULT ''/);
  assert.match(module, /`claim_token` CHAR\(32\) CHARACTER SET ascii NOT NULL DEFAULT ''/);
  assert.equal((migration.match(/\$ensureColumn\(/g) ?? []).length, 2);
  assert.match(migration, /if \(\$existing\['status'\] === 'found'\)/);
  assert.match(migration, /if \(\$existing\['status'\] === 'error'\)/);
  assert.match(migration, /'status' => 'missing'/);
  assert.match(migration, /`COLUMN_NAME` = [\s\S]*?,\s*false\s*\)/);
});

test("v1.2.1 repair rejects incompatible columns and checks database operation failures", async () => {
  const migration = await customerModuleRecoveryUpgrade;
  assert.match(migration, /incompatible definition for/);
  assert.match(migration, /could not inspect/);
  assert.match(migration, /if \(!\$altered\)/);
  assert.match(migration, /could not verify added column/);
  assert.match(migration, /if \(!\$db->execute\(/);
  assert.match(migration, /a required column has an incompatible final definition/);
  assert.match(migration, /could not register actionPasswordRenew/);
  assert.match(migration, /`CHARACTER_MAXIMUM_LENGTH` AS `character_maximum_length`/);
  assert.match(migration, /`CHARACTER_SET_NAME` AS `character_set_name`/);
  assert.match(migration, /`IS_NULLABLE` AS `is_nullable`/);
  assert.match(migration, /`COLUMN_DEFAULT` AS `column_default`/);
  assert.match(migration, /could not query the final schema/);
  assert.match(migration, /a required column is missing after migration/);
});

test("v1.2.1 repair revokes empty-fingerprint sessions and preserves idempotency data", async () => {
  const migration = await customerModuleRecoveryUpgrade;
  assert.match(migration, /SET `revoked` = 1\s+WHERE `password_fingerprint` = \\'\\'/);
  assert.match(migration, /registerHook\('actionPasswordRenew'\)/);
  assert.doesNotMatch(migration, /UPDATE\s+['"`]?[^;]*mithranagro_idempotency/is);
  assert.doesNotMatch(migration, /DELETE\s+FROM/is);
  assert.doesNotMatch(migration, /SET\s+`(?:state|id_cart|id_order|id_customer|request_hash|claim_token)`/i);
  assert.doesNotMatch(migration, /REPLACE\(UUID\(\)/i);
});

test("v1.2.1 PHP migration mock scenarios", (t) => {
  const php = spawnSync("php", ["-v"], { encoding: "utf8" });
  if (php.error?.code === "ENOENT") {
    t.skip("PHP is unavailable; run scripts/test-prestashop-migration.php where PHP is installed");
    return;
  }
  assert.equal(php.status, 0, php.stderr || php.stdout);

  const result = spawnSync(
    "php",
    ["scripts/test-prestashop-migration.php"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /All mocked migration scenarios passed/);
});

test("rate limits use an untrusted-header-independent client address and fail closed on database errors", async () => {
  const api = await customerModuleSource;
  const start = api.indexOf("private function enforceRateLimit(");
  const end = api.indexOf("private function checkoutRequestHash(", start);
  const rateLimiter = api.slice(start, end);
  assert.match(api, /enforceRateLimit\('login', \$email, 8\)/);
  assert.match(api, /enforceRateLimit\('register', \$email, 4\)/);
  assert.match(api, /enforceRateLimit\('password-reset', \$email, 5\)/);
  assert.match(rateLimiter, /ON DUPLICATE KEY UPDATE `attempts` = `attempts` \+ 1/);
  assert.match(rateLimiter, /\$_SERVER\['REMOTE_ADDR'\]/);
  assert.doesNotMatch(rateLimiter, /HTTP_X_FORWARDED_FOR|HTTP_X_REAL_IP|Tools::getRemoteAddr/);
  assert.match(rateLimiter, /if \(!Db::getInstance\(\)->execute\(\$query\)\)/);
  assert.match(rateLimiter, /if \(\$attemptValue === false \|\| Db::getInstance\(\)->getNumberError\(\) > 0\)/);
  assert.match(rateLimiter, /if \(\$attempts > \$limit\)/);
  assert.match(rateLimiter, /mt_rand\(1, 100\) === 1/);
});

test("password reset is non-enumerating and never emails from PrestaShop development mode", async () => {
  const [api, route] = await Promise.all([
    customerModuleSource,
    readFile(
      new URL("../src/app/api/customer/auth/password-reset/route.ts", import.meta.url),
      "utf8",
    ),
  ]);
  const start = api.indexOf("private function requestPasswordReset(");
  const end = api.indexOf("private function getCustomerData(", start);
  const reset = api.slice(start, end);
  assert.match(reset, /return \['success' => true\];/);
  assert.match(reset, /defined\('_PS_MODE_DEV_'\) && _PS_MODE_DEV_/);
  assert.match(reset, /catch \(Throwable \$error\) \{\s*PrestaShopLogger::addLog\('Mithran Agro password reset mail delivery failed\.'/);
  assert.match(reset, /if \(!\$sent\) \{\s*PrestaShopLogger::addLog\('Mithran Agro password reset mail delivery failed\.'/);
  assert.match(route, /If an active account uses that email/);
  assert.doesNotMatch(route, /customerApiErrorResponse\(.*sent|email.*found/i);
});

test("staging guidance makes concurrent stock race testing and idempotency recovery explicit", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  assert.match(readme, /do \*\*not\*\* make stock reservation atomic across separate concurrent carts/);
  assert.match(readme, /available quantity is one and two separate customer sessions/);
  assert.match(readme, /`order_pending` idempotency record/);
  assert.match(readme, /do not retry using a new idempotency key/);
});

test("PrestaShop module uses hashed shared-secret validation and native reset email", async () => {
  const [api, controller] = await Promise.all([
    customerModuleSource,
    readFile(
      new URL("../prestashop-module/mithranagroapp/controllers/front/api.php", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(api, /hash_equals\(\$configuredHash, hash\('sha256', \$provided\)\)/);
  assert.match(api, /stampResetPasswordToken/);
  assert.match(api, /getValidResetPasswordToken/);
  assert.match(api, /Mail::Send/);
  assert.match(api, /password_query/);
  assert.match(controller, /Tools::usingSecureMode/);
  assert.match(api, /HTTP_X_MITHRAN_INTEGRATION_KEY/);
});

test("wishlist intent adds only an available item that is not already saved", () => {
  assert.equal(requestedWishlistAddition("product-a", ["product-a"], []), "product-a");
  assert.equal(requestedWishlistAddition("unknown", ["product-a"], []), null);
  assert.equal(requestedWishlistAddition("product-a", ["product-a"], ["product-a"]), null);
});

const productFixture = (id, stockLinks, extra = {}) => ({
  id: String(id),
  id_shop_default: "1",
  cache_default_attribute: "0",
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
  attributeId = 0,
  shopId = 1,
  shopGroupId = 0,
  quantity = 100,
}) => ({
  id,
  id_product: productId,
  id_product_attribute: attributeId,
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
      id_product_attribute: 0,
      id_shop: 1,
      id_shop_group: 0,
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

test("uses only the configured default combination stock", () => {
  const product = productFixture(20, [
    { id: "59", id_product_attribute: "0" },
    { id: "60", id_product_attribute: "40" },
    { id: "61", id_product_attribute: "41" },
  ], { cache_default_attribute: "40" });
  const enriched = enrichFixture(product, [
    stockFixture({ id: 59, productId: 20, attributeId: 0, quantity: 100 }),
    stockFixture({ id: 60, productId: 20, attributeId: 40, quantity: 7 }),
    stockFixture({ id: 61, productId: 20, attributeId: 41, quantity: 100 }),
  ]);
  assert.equal(enriched.quantity, 7);
  assert.equal(enriched.cache_default_attribute, "40");
});

test("deduplicates repeated links and identical stock records before aggregation", () => {
  const product = productFixture(46, [
    { id: "905", id_product_attribute: "0" },
    { id: "905", id_product_attribute: "0" },
  ]);
  const record = stockFixture({ id: 905, productId: 46, attributeId: 0, quantity: 15 });
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

test("formats notification timestamps in a deterministic India timezone", () => {
  assert.equal(formatDateTime("2026-11-16T07:00:00.000Z"), "16 Nov, 12:30 pm");
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

test("notification actions use authenticated customer-owned PrestaShop data", () => {
  const notificationRoute = readFileSync(
    new URL("../src/app/api/customer/notifications/route.ts", import.meta.url),
    "utf8",
  );
  const moduleApi = readFileSync(
    new URL("../prestashop-module/mithranagroapp/classes/HeadlessCustomerApi.php", import.meta.url),
    "utf8",
  );
  assert.match(notificationRoute, /callAuthenticatedPrestaShopApp\(request, "notifications:get"\)/);
  assert.match(notificationRoute, /callAuthenticatedPrestaShopApp\(request, "notifications:update", body\)/);
  assert.match(moduleApi, /case 'notifications:get':\s+return \$this->getCustomerData\('notifications'\)/);
  assert.match(moduleApi, /case 'notifications:update':\s+return \$this->updateNotification\(\$body\)/);
  assert.match(moduleApi, /private function updateNotification\(array \$body\)[\s\S]*?\$this->authenticatedCustomer\(\)/);
});

test("support tickets are validated and persisted under the authenticated customer", () => {
  const supportRoute = readFileSync(
    new URL("../src/app/api/customer/support/route.ts", import.meta.url),
    "utf8",
  );
  const supportPage = readFileSync(
    new URL("../src/app/(shop)/account/support/page.tsx", import.meta.url),
    "utf8",
  );
  const moduleApi = readFileSync(
    new URL("../prestashop-module/mithranagroapp/classes/HeadlessCustomerApi.php", import.meta.url),
    "utf8",
  );
  assert.match(supportRoute, /callAuthenticatedPrestaShopApp\(request, "support:list"\)/);
  assert.match(supportRoute, /hasSameOrigin\(request\)/);
  assert.match(supportRoute, /callAuthenticatedPrestaShopApp\(request, "support:create", body\)/);
  assert.match(moduleApi, /private function createSupportTicket\(array \$body\)[\s\S]*?\$this->authenticatedCustomer\(\)/);
  assert.match(moduleApi, /saveCustomerData\(\(int\) \$customer->id, 'support'/);
  assert.match(moduleApi, /enforceRateLimit\('support'/);
  assert.match(supportPage, /Number\.isFinite\(Date\.parse\(record\.createdAt\)\)/);
  assert.match(supportPage, /No staff reply has been recorded yet/);
});

test("parses a customer-owned PrestaShop COD order with its real reference and unpaid status", () => {
  const order = parseCustomerOrder({
    id: "501",
    reference: "ABCD1234",
    userId: "27",
    status: "placed",
    placedAt: "2026-06-10 12:00:00",
    scheduledSlot: "Delivery via Store Carrier",
    paymentMethod: "Cash on Delivery",
    paymentId: "Not applicable for Cash on Delivery",
    paymentStatus: "pending",
    address: {
      id: "64",
      label: "Home",
      name: "Test Customer",
      phone: "+91 9876543210",
      line1: "12 Test Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      type: "home",
      isDefault: true,
    },
    items: [{
      id: "901",
      productId: "27",
      variantId: "prestashop-27",
      name: "Oranges",
      image: "",
      sellerName: "Mithran Agro",
      packLabel: "kg",
      quantity: 2,
      price: 220,
      mrp: 220,
      lineTotal: 440,
    }],
    totals: {
      subtotal: 440,
      mrpTotal: 440,
      savings: 0,
      deliveryFee: 0,
      handlingFee: 0,
      greenFee: 0,
      discount: 0,
      tax: 0,
      total: 440,
    },
    invoiceNo: "Not issued",
    tracking: [{
      id: "501-status",
      status: "placed",
      title: "Awaiting Cash on Delivery",
      description: "Awaiting Cash on Delivery",
      timestamp: "2026-06-10 12:00:00",
      completed: true,
    }],
    canCancel: false,
    canReturn: false,
  });

  assert.equal(order?.reference, "ABCD1234");
  assert.equal(order?.userId, "27");
  assert.equal(order?.paymentStatus, "pending");
  assert.equal(order?.items[0]?.variantId, "prestashop-27");
  assert.equal(parseCustomerOrder({ id: "501", userId: "another-customer" }), null);
});

test("customer session reader accepts only opaque hexadecimal cookie tokens", () => {
  const token = "a".repeat(64);
  assert.equal(
    readCustomerSession(new Request("https://app.example/account", {
      headers: { cookie: `other=value; mithran_customer_session=${token}` },
    })),
    token,
  );
  assert.equal(
    readCustomerSession(new Request("https://app.example/account", {
      headers: { cookie: "mithran_customer_session=short" },
    })),
    null,
  );
  assert.equal(
    readCustomerSession(new Request("https://app.example/account", {
      headers: { cookie: `mithran_customer_session=${token}; injected=value` },
    })),
    token,
  );
});

test("customer write routes accept only requests with the same origin", () => {
  assert.equal(
    hasSameOrigin(new Request("https://app.example/api/customer/profile", {
      method: "PATCH",
      headers: { origin: "https://app.example" },
    })),
    true,
  );
  assert.equal(
    hasSameOrigin(new Request("https://app.example/api/customer/profile", {
      method: "PATCH",
      headers: { origin: "https://attacker.example" },
    })),
    false,
  );
  assert.equal(
    hasSameOrigin(new Request("https://app.example/api/customer/profile", { method: "PATCH" })),
    false,
  );
});

test("customer API errors never expose internal exception details", () => {
  const mapped = customerApiErrorDetails(new CustomerApiError("invalid_credentials"));
  assert.equal(mapped.status, 401);
  assert.equal(mapped.message, "Email or password is incorrect.");

  const unexpected = customerApiErrorDetails(new Error("sensitive database detail"));
  assert.equal(unexpected.status, 503);
  assert.doesNotMatch(JSON.stringify(unexpected), /sensitive database detail/);
});

test("farm directory parsing enforces verified notes, https URLs, and single-farm product ownership", async () => {
  const { isFarmSlug, parseFarm, parseFarms, productFarmIndex } = await import("../src/lib/farms.ts");

  assert.equal(isFarmSlug("green-acres-farm"), true);
  assert.equal(isFarmSlug("../bad-slug"), false);

  const unverifiedWithoutNote = parseFarm({
    id: "1",
    slug: "green-acres",
    name: "Green Acres Farm",
    logoUrl: "http://insecure.example/logo.png",
    coverUrl: "https://shop.shriprocraft.space/img/farm.jpg",
    isVerified: true,
    verificationNote: "",
    productIds: ["20", "21", "bad"],
  });
  assert.ok(unverifiedWithoutNote);
  assert.equal(unverifiedWithoutNote.isVerified, false);
  assert.equal(unverifiedWithoutNote.logoUrl, "");
  assert.equal(unverifiedWithoutNote.coverUrl, "https://shop.shriprocraft.space/img/farm.jpg");
  assert.deepEqual(unverifiedWithoutNote.productIds, ["20", "21"]);

  const farms = parseFarms([
    {
      id: "1",
      slug: "green-acres",
      name: "Green Acres Farm",
      isVerified: true,
      verificationNote: "NPOP #1234 checked 2026-11-01",
      productIds: ["20", "21"],
    },
    {
      id: "2",
      slug: "sunrise-valley",
      name: "Sunrise Valley",
      isVerified: false,
      verificationNote: "",
      productIds: ["21", "22"],
    },
  ]);
  assert.equal(farms.length, 2);
  assert.equal(farms[0].isVerified, true);
  assert.deepEqual(farms[1].productIds, ["22"]);

  const index = productFarmIndex(farms);
  assert.equal(index.get("20"), "green-acres");
  assert.equal(index.get("22"), "sunrise-valley");
});

test("PrestaShop module v1.3.0 includes farm directory and support:reply actions", () => {
  const apiPhp = readFileSync(new URL("../prestashop-module/mithranagroapp/classes/HeadlessCustomerApi.php", import.meta.url), "utf8");
  const mainPhp = readFileSync(new URL("../prestashop-module/mithranagroapp/mithranagroapp.php", import.meta.url), "utf8");
  const upgrade130 = readFileSync(new URL("../prestashop-module/mithranagroapp/upgrade/upgrade-1.3.0.php", import.meta.url), "utf8");
  assert.match(mainPhp, /\$this->version\s*=\s*'1\.3\.0'/);
  assert.match(mainPhp, /mithranagro_farm/);
  assert.match(mainPhp, /mithranagro_farm_product/);
  assert.match(upgrade130, /upgrade_module_1_3_0/);
  assert.match(apiPhp, /case 'farms:list':/);
  assert.match(apiPhp, /case 'farms:get':/);
  assert.match(apiPhp, /case 'support:reply':/);
  assert.match(apiPhp, /\^\[6-9\]\\d\{9\}\$/);
  assert.match(apiPhp, /\^\[1-9\]\\d\{5\}\$/);
});

test("Indian mobile number validation accepts only 10 digits starting with 6-9", async () => {
  const { validateIndianMobile } = await import("../src/lib/validation.ts");

  assert.equal(validateIndianMobile("9876543210").ok, true);
  assert.equal(validateIndianMobile("6123456789").ok, true);

  for (const bad of [
    "5123456789",
    "987654321",
    "98765432101",
    "987654321012",
    "98abcdefgh",
    "98765 43210",
    "+919876543210",
    "",
    "   ",
  ]) {
    assert.equal(validateIndianMobile(bad).ok, false, `Expected phone "${bad}" to be rejected`);
  }
});

test("Indian PIN code validation accepts 6 digits not starting with 0", async () => {
  const { validateIndianPincode } = await import("../src/lib/validation.ts");

  assert.equal(validateIndianPincode("641035").ok, true);

  for (const bad of ["012345", "64103", "6410357", "64A035", "641 035", "", "   "]) {
    assert.equal(validateIndianPincode(bad).ok, false, `Expected PIN "${bad}" to be rejected`);
  }
});

test("address, name, email, and password validation enforce length, format, and independent phone numbers", async () => {
  const {
    validateAddressFields,
    validateEmail,
    validatePassword,
    validatePersonName,
  } = await import("../src/lib/validation.ts");

  assert.equal(validatePersonName("Ananya-Rao O'Connor", { requireFullName: true }).ok, true);
  assert.equal(validatePersonName("Suresh123", { requireFullName: false }).ok, false);
  assert.equal(validatePersonName("   ", { requireFullName: true }).ok, false);

  assert.equal(validateEmail("  buyer@example.com ").ok, true);
  assert.equal(validateEmail("bad email@example.com").ok, false);

  assert.equal(validatePassword("ValidPass123").ok, true);
  assert.equal(validatePassword("short").ok, false);
  assert.equal(validatePassword("a".repeat(73)).ok, false);

  // Optional line2 empty is accepted, and delivery phone can differ from profile phone
  const validAddr = validateAddressFields({
    label: "Home",
    name: "Ramesh Gowda",
    phone: "9876543210",
    line1: "42, 3rd Cross, HSR Layout",
    line2: "",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560102",
  });
  assert.equal(validAddr.ok, true);

  // Reject >10-digit phone, 0-prefixed PIN, whitespace-only fields, and max-length violations
  const invalidAddr = validateAddressFields({
    label: "H",
    name: "   ",
    phone: "987654321012",
    line1: "123",
    line2: "x".repeat(151),
    city: "B",
    state: "InvalidState",
    pincode: "012345",
  });
  assert.equal(invalidAddr.ok, false);
  for (const key of ["label", "name", "phone", "line1", "line2", "city", "state", "pincode"]) {
    assert.ok(invalidAddr.errors[key], `Expected error for ${key}`);
  }
});

test("customer API routes enforce centralized validation helpers before calling PrestaShop", () => {
  const addrPost = readFileSync(new URL("../src/app/api/customer/addresses/route.ts", import.meta.url), "utf8");
  const addrPatch = readFileSync(new URL("../src/app/api/customer/addresses/[id]/route.ts", import.meta.url), "utf8");
  const profilePatch = readFileSync(new URL("../src/app/api/customer/profile/route.ts", import.meta.url), "utf8");
  const regPost = readFileSync(new URL("../src/app/api/customer/auth/register/route.ts", import.meta.url), "utf8");
  const loginPost = readFileSync(new URL("../src/app/api/customer/auth/login/route.ts", import.meta.url), "utf8");
  const resetPost = readFileSync(new URL("../src/app/api/customer/auth/password-reset/route.ts", import.meta.url), "utf8");

  assert.match(addrPost, /validateAddressFields/);
  assert.match(addrPatch, /validateAddressFields/);
  assert.match(profilePatch, /validateIndianMobile/);
  assert.match(profilePatch, /validatePersonName/);
  assert.match(regPost, /validatePersonName/);
  assert.match(regPost, /validateEmail/);
  assert.match(regPost, /validatePassword/);
  assert.match(loginPost, /validateEmail/);
  assert.match(resetPost, /validateEmail/);
});

test("customer experience improvements: order status, images, notifications, footer, and light-mode branding", () => {
  const apiPhp = readFileSync(
    new URL("../prestashop-module/mithranagroapp/classes/HeadlessCustomerApi.php", import.meta.url),
    "utf8",
  );
  // 1. Order status must not confuse "Awaiting Cash on Delivery" with "delivered"
  assert.match(apiPhp, /preg_match\('\/\\bdelivered\\b\/', \$name\)/);
  assert.doesNotMatch(apiPhp, /strpos\(\$name, 'deliver'\) !== false/);
  // 2. Order payload resolves real product cover images
  assert.match(apiPhp, /Image::getCover\(/);
  // 3. Login & order notifications use Mithran Agro branding without duplicates
  assert.match(apiPhp, /'login-' \. date\('Y-m-d'\)/);
  assert.match(apiPhp, /Your Mithran Agro order #/);
  assert.match(apiPhp, /syncOrderStatusNotification/);

  // 4. Footer has non-clickable Our Promise and Shri Procraft backlink
  const footer = readFileSync(new URL("../src/components/layout/footer.tsx", import.meta.url), "utf8");
  assert.match(footer, /https:\/\/shriprocraft\.com/);
  assert.match(footer, /Powered by Shri Procraft/);
  assert.match(footer, /isPromiseGroup/);

  // 5. Women's Apparels is a direct nav link without dropdown and uses local banner image
  const megaMenu = readFileSync(new URL("../src/components/layout/mega-menu.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(megaMenu, /ChevronDown/);
  const imagesTs = readFileSync(new URL("../src/data/images.ts", import.meta.url), "utf8");
  assert.match(imagesTs, /\/images\/women-apparels-banner\.jpg/);

  // 6. Light-mode only: Header has no ThemeToggle
  const header = readFileSync(new URL("../src/components/layout/header.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(header, /ThemeToggle/);
});
