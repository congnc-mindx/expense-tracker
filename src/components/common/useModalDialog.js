import { useEffect, useRef } from "react";

/** Native dialog focus trap + reliable click-outside-close, shared by all forms. */
export default function useModalDialog(onClose, busy = false) {
  const ref = useRef(null);
  const callback = useRef(onClose);
  const busyRef = useRef(busy);
  callback.current = onClose;
  busyRef.current = busy;
  useEffect(() => {
    const dialog = ref.current;
    const focused = document.activeElement;
    const overflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    function pointerDown(event) {
      if (busyRef.current || event.target.closest?.("[data-floating-panel]")) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) callback.current();
    }
    dialog.addEventListener("pointerdown", pointerDown);
    return () => { dialog.removeEventListener("pointerdown", pointerDown); if (dialog.open) dialog.close(); document.body.style.overflow = overflow; focused?.focus?.(); };
  }, []);
  return { ref, onCancel: (event) => { event.preventDefault(); if (!busyRef.current) callback.current(); } };
}
