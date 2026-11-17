import type { AppNotification } from "@/types";

export function getInitialNotifications(
  initial: AppNotification[],
): AppNotification[] {
  return [...initial];
}

export function loadPersistedNotifications(
  readPersisted: () => unknown,
  initial: AppNotification[],
): AppNotification[] {
  const persisted = readPersisted();
  return Array.isArray(persisted) ? persisted as AppNotification[] : initial;
}
