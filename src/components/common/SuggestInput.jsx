import { useRef, useState } from "react";
import FloatingPanel from "./FloatingPanel";
import { normalize } from "../../utils/finance";
import { input } from "../finance/ui";

/** Editable text input with small reusable suggestions; no native datalist. */
export default function SuggestInput({
  value,
  onChange,
  options = [],
  onChoose,
  placeholder,
  maxLength = 100,
  label,
}) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const suggestions = options
    .filter(
      (option) =>
        normalize(option).includes(normalize(value)) &&
        normalize(option) !== normalize(value),
    )
    .slice(0, 7);
  return (
    <>
      <input
        ref={ref}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        maxLength={maxLength}
        placeholder={placeholder}
        className={input}
        aria-label={label}
        autoComplete="off"
      />
      <FloatingPanel
        anchorRef={ref}
        open={open && suggestions.length > 0}
        onClose={() => setOpen(false)}
        maxHeight={256}
      >
        <div className="p-1" role="listbox" aria-label={`Gợi ý ${label}`}>
          {suggestions.map((option) => (
            <button
              type="button"
              key={option}
              role="option"
              aria-selected={false}
              className="block min-h-10 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-50 dark:hover:bg-slate-700"
              onClick={() => {
                (onChoose || onChange)(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </FloatingPanel>
    </>
  );
}
