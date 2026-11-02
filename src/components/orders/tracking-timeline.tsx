"use client";

import { Check, Package } from "lucide-react";
import type { TrackingEvent } from "@/types";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";

/** Vertical order timeline with completed/pending states. */
export function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
  const activeIdx = events.reduce((last, e, i) => (e.completed ? i : last), -1);

  return (
    <ol className="relative space-y-0" aria-label="Order tracking timeline">
      {events.map((event, i) => {
        const done = event.completed;
        const isCurrent = done && i === activeIdx;
        return (
          <li key={event.id} className="relative flex gap-4 pb-7 last:pb-0">
            {/* connector */}
            {i < events.length - 1 && (
              <span
                className={cn(
                  "absolute left-[13px] top-8 h-[calc(100%-2rem)] w-0.5 rounded-full",
                  events[i + 1].completed ? "bg-forest-500" : "bg-forest-100"
                )}
                aria-hidden
              />
            )}
            {/* node */}
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white transition-colors",
                done ? "bg-forest-600 text-white" : "bg-soft text-graymute",
                isCurrent && "animate-pulse bg-lime-natural text-forest-950"
              )}
              aria-hidden
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : <Package className="size-3.5" />}
            </span>
            {/* text */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className={cn("text-sm font-bold", done ? "text-charcoal" : "text-graymute")}>
                  {event.title}
                  {isCurrent && (
                    <span className="ml-2 rounded-full bg-lime-soft px-2 py-0.5 text-[10px] font-bold text-lime-deep">
                      Current
                    </span>
                  )}
                </p>
                {event.timestamp && (
                  <time className="text-[11px] text-graymute">{formatDateTime(event.timestamp)}</time>
                )}
              </div>
              {event.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-graymute">{event.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
