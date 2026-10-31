import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Shared floating surface for selectors and month navigation.
 * Uses a portal so parent tables/cards cannot clip the menu, even in dialogs.
 */
export default function FloatingPanel({ anchorRef, open, onClose, children, maxHeight = 288, minWidth = 244, className = "" }) {
  const panelRef = useRef(null);
  const [place, setPlace] = useState(null);
  const [container, setContainer] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    setContainer(anchorRef.current.closest("dialog") || document.body);
    function update() {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const roomBelow = window.innerHeight - rect.bottom - 12;
      const roomAbove = rect.top - 12;
      const upwards = roomBelow < Math.min(maxHeight, 220) && roomAbove > roomBelow;
      const room = Math.max(100, upwards ? roomAbove : roomBelow);
      setPlace({
        position: "fixed",
        zIndex: 200,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, minWidth) - 8)),
        top: upwards ? undefined : rect.bottom + 6,
        bottom: upwards ? window.innerHeight - rect.top + 6 : undefined,
        width: Math.min(Math.max(rect.width, minWidth), window.innerWidth - 16),
        maxHeight: Math.min(maxHeight, room),
      });
    }
    update();
    function outside(event) {
      if (!anchorRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) onClose();
    }
    function escape(event) {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); anchorRef.current?.focus(); }
    }
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape, true);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", escape, true);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, maxHeight, minWidth, onClose]);

  if (!open || !container || !place) return null;
  const isDark = Boolean(anchorRef.current?.closest(".dark"));
  return createPortal(
    <div data-floating-panel="true" ref={panelRef} style={place} className={`${isDark ? "dark" : ""} min-w-0 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 text-sm text-slate-800 shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${className}`}>
      {children}
    </div>, container,
  );
}
