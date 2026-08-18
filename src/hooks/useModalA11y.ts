import { useEffect, useRef } from "react";

interface ModalA11yOptions {
  /** Called when the user presses Escape. */
  onClose: () => void;
  /** Lock body scroll while the modal is open (default true). */
  lockScroll?: boolean;
}

/**
 * Accessibility scaffolding for hand-rolled modals: Escape to close, a focus
 * trap that keeps Tab within the dialog, focus moved into the dialog on open
 * and restored to the trigger on close, and optional body-scroll lock.
 *
 * Spread the returned `dialogProps` onto the modal's container element (the one
 * with role="dialog") and attach `ref` to it.
 */
export function useModalA11y({ onClose, lockScroll = true }: ModalA11yOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const node = ref.current;
    // Move focus into the dialog (first focusable, else the container).
    const focusables = node?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    (focusables && focusables.length ? focusables[0] : node)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;

      const items = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    let prevOverflow = "";
    if (lockScroll) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (lockScroll) document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [onClose, lockScroll]);

  return {
    ref,
    dialogProps: {
      role: "dialog" as const,
      "aria-modal": true,
      tabIndex: -1,
    },
  };
}
