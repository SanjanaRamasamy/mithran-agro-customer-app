import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/contexts/Providers";
import { SITE } from "@/config/site";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${SITE.name} — Farm, Garden & Home Marketplace`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "agro", "organic", "fruits", "vegetables", "marketplace", "farm fresh",
    "organic grocery", "fertilizers", "seeds", "plants", "garden tools", "farm equipment",
    "sarees", "fashion", "Bengaluru",
  ],
  authors: [{ name: SITE.fullName }],
  openGraph: {
    title: `${SITE.name} — Farm, Garden & Home Marketplace`,
    description: SITE.description,
    siteName: SITE.name,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b4332",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${jakarta.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
