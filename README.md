# Mithran Agro Customer App

The customer storefront is a Next.js App Router application. The catalog is loaded from the configured PrestaShop Webservice; the app does not fall back to bundled mock products if the live catalog is unavailable.

## Local setup

The repository includes `bun.lock`. With Bun installed, run `bun install`, copy `.env.example` to `.env.local`, fill in the server-only PrestaShop values, then run `bun run dev`.

```env
PRESTASHOP_BASE_URL=https://your-store.example
PRESTASHOP_API_KEY=replace-with-your-prestashop-api-key
PRESTASHOP_APP_MODULE_SECRET=replace-with-the-same-random-secret-configured-in-the-module
```

Never use a `NEXT_PUBLIC_` prefix for either secret. `PRESTASHOP_API_KEY` is used only by server-side catalog, image, and stock/price routes. `PRESTASHOP_APP_MODULE_SECRET` is a separate shared secret for the customer-app module; generate a random value of at least 32 characters and configure the same value in the module back office and the server environment. Do not commit real values.

## Authentication and customer data

Customer registration, login, password reset, profile, addresses, cart, wishlist, notifications, support, and order APIs use the `prestashop-module/mithranagroapp` PrestaShop module as the customer source of truth. The module uses PrestaShop customer records and password hashing, stores only hashes of opaque app-session tokens, and applies login/registration/support rate limits. The Next.js server sets the raw session token only in an HTTP-only, SameSite=Lax cookie (Secure in production); passwords and session tokens are not stored in browser local storage or returned to client JavaScript. Logout revokes the module session.

### PrestaShop module setup

The source is designed for PrestaShop 9.x and declares PrestaShop 9.0.0 as its minimum. It has not yet been PHP-linted or installed on the Hostinger store; successful installation and runtime compatibility must be confirmed on a staging copy before production use.

1. Back up the staging store files and database. Do not test installation or upgrades against production.
2. Package only `prestashop-module/mithranagroapp` as a ZIP whose archive root contains `mithranagroapp/`. The repository provides `prestashop-module/mithranagroapp-staging.zip`; verify that it contains only module source and no environment files or credentials before upload.
3. In PrestaShop Back Office, open **Modules > Module Manager > Upload a module**, upload the ZIP, install **Mithran Agro Customer App**, then open its configuration page. For an existing installation, use the normal Back Office module upgrade path so the versioned upgrade scripts run in order; do not uninstall/reinstall to upgrade. Version 1.2.0 adds a customer password fingerprint to sessions and a retry-claim token to checkout idempotency records. Version 1.2.1 repairs either or both missing columns, revokes sessions whose fingerprint is empty, preserves all idempotency records and references, verifies the expected column definitions, and registers the password-renew hook.
4. Generate a random secret of at least 32 characters. Enter it in the module configuration, then set the same value as `PRESTASHOP_APP_MODULE_SECRET` in the Next.js server environment. The module stores only its SHA-256 hash. Do not put either secret in client-visible environment variables, source control, or support logs.
5. Keep COD disabled until the store owner has checked the COD collection/fulfilment process, default carrier, INR currency, tax and shipping rules, and the custom unpaid order state in staging. The module setting is an explicit enablement gate; it does not install or verify a separate COD payment provider. The app creates an unpaid PrestaShop order with the label “Cash on Delivery”; it never marks that order as paid.
6. Configure HTTPS and PrestaShop's outgoing email transport. Password reset uses PrestaShop's native password-query email and native reset page. Reset requests return the same generic response for unknown addresses and mail-delivery failures; delivery failures are recorded only as a generic module log entry. The module does not send reset email when PrestaShop development mode is enabled.
7. Configure the default carrier and INR currency. Delivery addresses currently require active India country/state records and six-digit PIN codes. Set the same PrestaShop base URL in the Next.js server environment; rebuild/redeploy the app only after staging validation.
8. Verify registration, login/session refresh/logout, profile/address ownership, cart and wishlist persistence, quote totals, COD order ownership/status, order history, reset email, and cross-customer denial using staging test accounts. The module API is HTTPS POST-only and requires `X-Mithran-Integration-Key`; a request without the shared key should be denied. Do not place the key in browser requests.

The module upgrade and uninstall paths preserve customer-owned integration data. Uninstall revokes existing app sessions and removes the module's shared-secret configuration, but deliberately does not drop the module tables or existing orders. Back up the store before any module operation.

The module's API is intended to be called only by the Next.js server with the shared secret. It returns generic errors and does not log passwords or customer data. Client route guards are UX only; private data authorization is enforced again in the module against the authenticated PrestaShop customer and order/address ownership.

## Checkout and orders

Before requesting a quote or placing an order, the checkout UI preflights each basket against the existing PrestaShop catalog route (active/visible/available status, minimum quantity, linked stock, selected default combination, and current base price). Both the catalog and module validate stock for the configured default combination; the app does not aggregate stock across different combinations and the module rejects non-default combinations until the UI/catalog supports them explicitly. The module recalculates the current product, tax, shipping, and total through a native PrestaShop cart. On confirmation, it repeats the stock and address checks, compares the recalculated total with the customer-reviewed quote, and uses PrestaShop's order lifecycle (`PaymentModule::validateOrder`) with an unpaid, non-logable COD order state. Orders are associated with the authenticated customer and delivery address and guarded by a customer-scoped idempotency key, a unique database constraint, and compare-and-set claim tokens. A retry with the same request returns the cart's existing order; a changed request is rejected. A stale pre-order claim can be reclaimed after ten minutes with a fencing token. Once native order creation starts, a retry never creates another order automatically: it returns an existing cart-linked order if found, otherwise it fails closed for manual reconciliation. No idempotency record is deleted.

The module re-reads current PrestaShop product, combination, minimum-quantity, and stock data and ignores client-supplied prices, totals, stock, and seller values. The native cart recalculates current price/tax/shipping for both the quote and order; a changed total is rejected until the customer reviews a new quote. These checks do **not** make stock reservation atomic across separate concurrent carts. PrestaShop's native cart/order lifecycle remains responsible for stock reduction, and this module does not claim that a stock read or `updateQty()` prevents overselling under simultaneous checkouts. On staging only, test with a product whose available quantity is one and two separate customer sessions submitting different idempotency keys at the same time. Verify the resulting orders and stock in Back Office; if both orders succeed, keep COD disabled and resolve the store's inventory-reservation policy before enabling checkout.

For an `order_pending` idempotency record with no cart-linked order, do not retry using a new idempotency key or delete the record. After confirming the original request is no longer running, an operator must check Back Office orders and the associated cart, then arrange an audited recovery of the module-owned idempotency row only if no order was created. If that absence cannot be established, leave the record pending and contact the integration maintainer; creating a new key could duplicate an order whose completion was not observed.

## Checks

`bun run typecheck`, `bun run lint`, `bun run test`, and `bun run build` are the project checks. Live registration, login, order-creation, and Back Office verification require an authorized staging store, installed module, configured secrets, and test customer. Do not use the production store for write tests without approval.
