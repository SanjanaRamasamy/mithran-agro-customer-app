const APP_ORIGIN = "https://customer-app.invalid";

export function safeReturnPath(value: string | null | undefined, fallback = "/"): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return fallback;
  }

  try {
    const destination = new URL(value, APP_ORIGIN);
    if (
      destination.origin !== APP_ORIGIN ||
      destination.pathname === "/login" ||
      destination.pathname.startsWith("/login/") ||
      destination.pathname === "/api" ||
      destination.pathname.startsWith("/api/")
    ) {
      return fallback;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
