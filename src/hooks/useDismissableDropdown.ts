"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const DROPDOWN_OPEN_EVENT = "mithran:dropdown-open";

/**
 * Coordinates open/close state for header dropdowns & panels:
 * - Closes on outside pointerdown/mousedown
 * - Closes on Escape key
 * - Closes on window scroll
 * - Closes when another dropdown opens
 */
export function useDismissableDropdown(closeOnScroll = true) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(DROPDOWN_OPEN_EVENT, { detail: id }));
      }
      return next;
    });
  }, [id]);

  const openMenu = useCallback(() => {
    setOpen(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(DROPDOWN_OPEN_EVENT, { detail: id }));
    }
  }, [id]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const onOtherOpen = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (custom.detail !== id) {
        setOpen(false);
      }
    };

    const onScroll = () => {
      if (closeOnScroll) setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(DROPDOWN_OPEN_EVENT, onOtherOpen);
    if (closeOnScroll) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(DROPDOWN_OPEN_EVENT, onOtherOpen);
      if (closeOnScroll) {
        window.removeEventListener("scroll", onScroll);
      }
    };
  }, [open, id, closeOnScroll]);

  return { open, setOpen, toggle, openMenu, close, containerRef };
}
