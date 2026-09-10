"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  opts?: { onClose?: () => void; returnFocus?: RefObject<HTMLElement | null> },
) {
  const onCloseRef = useRef(opts?.onClose);
  const returnFocusRef = useRef(opts?.returnFocus);

  onCloseRef.current = opts?.onClose;
  returnFocusRef.current = opts?.returnFocus;

  useEffect(() => {
    if (!isOpen) return;
    const container = ref.current;
    if (!container) return;

    const focusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );

    const first = () => focusable()[0];
    const last = () => {
      const els = focusable();
      return els[els.length - 1];
    };

    first()?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = first();
      const l = last();
      if (!f || !l) return;
      if (e.shiftKey && document.activeElement === f) {
        e.preventDefault();
        l.focus();
      } else if (!e.shiftKey && document.activeElement === l) {
        e.preventDefault();
        f.focus();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current?.();
        returnFocusRef.current?.current?.focus();
      }
    };

    container.addEventListener("keydown", handleTab);
    document.addEventListener("keydown", handleEscape);

    return () => {
      container.removeEventListener("keydown", handleTab);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, ref]);
}
