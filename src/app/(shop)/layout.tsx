import { AppShell } from "@/components/layout/app-shell";

/** Every customer-facing route shares the announcement bar, header, footer and overlays. */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
