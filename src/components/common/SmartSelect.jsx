import { useId, useMemo, useRef, useState } from "react";
import FloatingPanel from "./FloatingPanel";

/** Value-controlled accessible select. Options can be grouped or flat. */
export default function SmartSelect({ value, onChange, options, label = "Chọn", disabled = false, className = "" }) {
  const triggerRef = useRef(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const groups = useMemo(() => options.flatMap((item) => item.options ? [{ heading: item.label, choices: item.options }] : [{ choices: [item] }]), [options]);
  const flat = groups.flatMap((group) => group.choices).filter((item) => !item.disabled);
  const selected = flat.find((item) => String(item.value) === String(value));
  const close = () => setOpen(false);
  function choose(item) { onChange(item.value); close(); triggerRef.current?.focus(); }
  function handleKey(event) {
    if (disabled || !flat.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { setOpen(true); setActive(Math.max(0, flat.findIndex((item) => String(item.value) === String(value)))); }
      else setActive((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + flat.length) % flat.length);
    } else if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault(); choose(flat[active] || flat[0]);
    } else if (event.key === "Escape" && open) { event.preventDefault(); close(); }
  }
  return <>
    <button ref={triggerRef} type="button" role="combobox" aria-label={label} aria-controls={open ? listId : undefined} aria-expanded={open} aria-haspopup="listbox" disabled={disabled}
      onKeyDown={handleKey} onClick={() => { setActive(Math.max(0, flat.findIndex((item) => String(item.value) === String(value)))); setOpen((was) => !was); }}
      className={`flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:border-blue-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-slate-900 ${className}`}>
      <span className="min-w-0 truncate">{selected?.label ?? "Chọn..."}</span>
      <span aria-hidden="true" className={`shrink-0 text-xs text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
    </button>
    <FloatingPanel anchorRef={triggerRef} open={open} onClose={close}>
      <div id={listId} role="listbox" aria-label={label} className="grid gap-0.5">
        {groups.map((group, groupIndex) => <div key={groupIndex}>
          {group.heading && <p className="px-3 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{group.heading}</p>}
          {group.choices.map((item) => <button key={item.value} type="button" role="option" aria-selected={String(item.value) === String(value)}
            onMouseEnter={() => setActive(flat.findIndex((opt) => opt.value === item.value))}
            onClick={() => choose(item)}
            className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${String(item.value) === String(value) ? "bg-blue-50 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300" : active === flat.findIndex((opt) => opt.value === item.value) ? "bg-slate-100 dark:bg-slate-700" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
            <span className="w-4 shrink-0 text-blue-600">{String(item.value) === String(value) ? "✓" : ""}</span><span className="min-w-0 truncate">{item.label}</span>
          </button>)}
        </div>)}
      </div>
    </FloatingPanel>
  </>;
}
