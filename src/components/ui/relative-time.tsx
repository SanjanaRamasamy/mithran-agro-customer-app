"use client";

import { useEffect, useState } from "react";
import { formatDateTime, timeAgo } from "@/utils/format";

export function RelativeTime({
  timestamp,
  className,
}: {
  timestamp: string;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <time dateTime={timestamp} className={className}>
      {now === null ? formatDateTime(timestamp) : timeAgo(timestamp, now)}
    </time>
  );
}
