import { useId, useMemo, useRef, useState } from "react";
import FloatingPanel from "./FloatingPanel";

/** Shared dropdown. In accordionGroups mode, group headings expand their own options in place. */
export default function SmartSelect({
  value,
  onChange,
  options,
  label = "Chọn",
  disabled = false,
  className = "",
  showIndicator = false,
  accordionGroups = false,
}) {
  const triggerRef = useRef(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const groups = useMemo(() => options.flatMap((item) => item.options
    ? [{ heading: item.label, choices: item.options }]
    : [{ choices: [item] }]), [options]);
  const flat = groups.flatMap((group) => group.choices).filter((item) => !item.disabled);
  const selected = flat.find((item) => String(item.value) === String(value));
  const accordion = accordionGroups && groups.some((group) => group.heading);
  const visible = accordion
    ? (expandedGroup === null ? [] : groups[expandedGroup]?.choices.filter((item) => !item.disabled) || [])
    : flat;

  const close = () => setOpen(false);
  function choose(item) {
    onChange(item.value);
    close();
    triggerRef.current?.focus();
  }
  function openWithKeyboard() {
    if (accordion) {
      const groupIndex = Math.max(0, groups.findIndex((group) => group.choices.some((item) => String(item.value) === String(value))));
      const choices = groups[groupIndex]?.choices.filter((item) => !item.disabled) || [];
      setExpandedGroup(groupIndex);
      setActive(Math.max(0, choices.findIndex((item) => String(item.value) === String(value))));
    } else {
      setActive(Math.max(0, flat.findIndex((item) => String(item.value) === String(value))));
    }
    setOpen(true);
  }
  function handleKey(event) {
    if (disabled || !flat.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open || (accordion && expandedGroup === null)) openWithKeyboard();
      else if (visible.length) setActive((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + visible.length) % visible.length);
    } else if ((event.key === "Enter" || event.key === " ") && open && visible.length) {
      event.preventDefault();
      choose(visible[active] || visible[0]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  }
  function toggleGroup(index) {
    setExpandedGroup((previous) => previous === index ? null : index);
    setActive(0);
  }

  return <>
    <button ref={triggerRef} type="button" role="combobox" aria-label={label}
      aria-controls={open ? listId : undefined} aria-expanded={open}
      aria-haspopup={accordion ? "dialog" : "listbox"} disabled={disabled}
      onKeyDown={handleKey} onClick={() => {
        if (open) close();
        else {
          setExpandedGroup(null);
          setActive(Math.max(0, flat.findIndex((item) => String(item.value) === String(value))));
          setOpen(true);
        }
      }}
      className={`flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-emerald-500 dark:hover:bg-slate-900 dark:focus-visible:outline-emerald-500 ${className}`}>
      <span className="min-w-0 truncate">{selected?.label ?? "Chọn..."}</span>
      {showIndicator && <span aria-hidden="true" className={`shrink-0 text-xs text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>}
    </button>
    <FloatingPanel anchorRef={triggerRef} open={open} onClose={close}>
      <div id={listId} role={accordion ? "dialog" : "listbox"} aria-label={label} className="grid gap-0.5">
        {groups.map((group, groupIndex) => <div key={groupIndex}>
          {group.heading && (accordion
            ? <button type="button" aria-expanded={expandedGroup === groupIndex}
                aria-controls={expandedGroup === groupIndex ? `${listId}-group-${groupIndex}` : undefined}
                onClick={() => toggleGroup(groupIndex)}
                className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-wide transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:hover:bg-slate-700 ${expandedGroup === groupIndex ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100" : "text-slate-400 dark:text-slate-400"}`}>
                <span>{group.heading}</span>
                <span aria-hidden="true" className="text-base font-normal">{expandedGroup === groupIndex ? "−" : "+"}</span>
              </button>
            : <p className="px-3 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{group.heading}</p>)}
          {(!accordion || expandedGroup === groupIndex) && <div
            id={accordion ? `${listId}-group-${groupIndex}` : undefined}
            role={accordion ? "listbox" : undefined} aria-label={group.heading || label}
            className={accordion ? "pb-1" : undefined}>
            {group.choices.map((item) => <button key={item.value} type="button" role="option"
              disabled={item.disabled} aria-selected={String(item.value) === String(value)}
              onMouseEnter={() => setActive(visible.findIndex((opt) => opt.value === item.value))}
              onClick={() => choose(item)}
              className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:opacity-40 ${String(item.value) === String(value) ? "bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" : active === visible.findIndex((opt) => opt.value === item.value) ? "bg-slate-100 dark:bg-slate-700" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
              <span className="w-4 shrink-0 text-emerald-600 dark:text-emerald-400">{String(item.value) === String(value) ? "✓" : ""}</span>
              <span className="min-w-0 truncate">{item.label}</span>
            </button>)}
          </div>}
        </div>)}
      </div>
    </FloatingPanel>
  </>;
}
