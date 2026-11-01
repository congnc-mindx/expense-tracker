import { useRef, useState } from "react";
import { MIN_YEAR, MAX_YEAR } from "../../utils/dateLimits";
import FloatingPanel from "./FloatingPanel";
import YearGrid, { yearPage } from "./YearGrid";
import { button } from "../finance/ui";

/** Summary year selector with the same year grid as the month selector. */
export default function YearPicker({ value, onChange, className = "" }) {
  const ref = useRef(null);
  const [open,setOpen]=useState(false);
  const [pageStart,setPageStart]=useState(yearPage(Number(value)));
  return <div className={`flex min-w-0 items-center gap-1.5 ${className}`}>
    <button type="button" aria-label="Năm trước" className={`${button} !px-3`} disabled={value<=MIN_YEAR} onClick={()=>onChange(Number(value)-1)}>‹</button>
    <button type="button" ref={ref} aria-label="Chọn năm tổng kết" aria-expanded={open} aria-haspopup="dialog"
      className={`${button} min-w-0 flex-1 !justify-center tabular-nums`} onClick={()=>{setPageStart(yearPage(Number(value)));setOpen(o=>!o);}}>Năm {value} ⌄</button>
    <button type="button" aria-label="Năm sau" className={`${button} !px-3`} disabled={value>=MAX_YEAR} onClick={()=>onChange(Number(value)+1)}>›</button>
    <FloatingPanel anchorRef={ref} open={open} onClose={()=>setOpen(false)} minWidth={300} maxHeight={330} className="!rounded-2xl !p-3">
      <div role="dialog" aria-label="Chọn năm"><YearGrid selected={value} pageStart={pageStart} onPageChange={setPageStart} onSelect={(y)=>{onChange(y);setOpen(false);ref.current?.focus();}}/></div>
    </FloatingPanel>
  </div>;
}
