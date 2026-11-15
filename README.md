# Mithran Agro Customer App

The customer storefront is a Next.js App Router application. The catalog is loaded from the configured PrestaShop Webservice; the app does not fall back to bundled mock products if the live catalog is unavailable.

## Local setup

The repository includes `bun.lock`. With Bun installed, run `bun install`, copy `.env.example` to `.env.local`, fill in the server-only PrestaShop values, then run `bun run dev`.

```env
PRESTASHOP_BASE_URL=https://your-store.example
PRESTASHOP_API_KEY=replace-with-your-prestashop-api-key
```

Never use a `NEXT_PUBLIC_` prefix for the PrestaShop API key. The key is used only by server-side API routes for product/category retrieval, product-image proxying, and checkout inventory/price validation.

## Authentication and customer data

There is no customer authentication backend in this project. The current email, Google, and registration flows are explicitly simulated frontend demo sign-in; credentials are not sent or stored, and no password or authentication token is persisted. The demo profile is stored in browser local storage and is not a secure session.

Protected-route checks and order ownership filtering are client-side UX protections only. They are not authorization boundaries. A production deployment must provide server-managed authentication and enforce customer identity, order ownership, address access, wishlist access, and authorization on every private API request.

## Checkout and orders

Checkout revalidates every basket item against the current PrestaShop catalog, including active/visible/available status, minimum quantity, stock, and price. The app does not create an order in PrestaShop or process a real payment. Any confirmation and order history created by the frontend is simulated and stored locally.

A production order workflow still needs a server-side authenticated checkout endpoint that repeats inventory and price validation, reserves or decrements stock transactionally, creates an order in PrestaShop, integrates a payment provider, prevents duplicate submission with an idempotency key, and returns a server-owned order identifier. Order reads, changes, returns, and cancellations must enforce server-side ownership.

## Checks

`bun run typecheck`, `bun run lint`, `bun run test`, and `bun run build` are the intended project checks. The focused Node tests cover the safe return-destination rules used by authentication routing.
