import type { RefObject } from "preact";
import { useEffect } from "preact/hooks";

/**
 * Closes the dialog on a click on the dimmed area around it; Esc works natively.
 * Both the press and the release must land on the dimmed area: selecting text
 * and letting go of the mouse outside the window must not close it.
 */
export function useBackdropClose(dialog: RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    let pressedOnBackdrop = false;
    const onDown = (e: MouseEvent) => {
      pressedOnBackdrop = e.target === el;
    };
    const onClick = (e: MouseEvent) => {
      if (pressedOnBackdrop && e.target === el) el.close();
      pressedOnBackdrop = false;
    };
    el.addEventListener("mousedown", onDown);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("click", onClick);
    };
  }, [dialog]);
}
