import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { button, primary } from "../finance/ui";

const Context = createContext(null);

function ConfirmSurface({ request, finish }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    el.showModal();
    return () => { if (el.open) el.close(); };
  }, []);
  const isDark = document.querySelector("[data-zwhis-theme]")?.getAttribute("data-zwhis-theme") === "dark";
  return createPortal(
    <dialog ref={dialogRef} aria-labelledby="zwhis-confirm-title"
      onCancel={(event) => { event.preventDefault(); finish(false); }}
      onClick={(event) => { if (event.target === dialogRef.current) finish(false); }}
      className={`${isDark ? "dark" : ""} fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100`} >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-xl text-xl ${request.destructive ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"}`}>
            {request.destructive ? "!" : "?"}
          </span>
          <div className="min-w-0"><h2 id="zwhis-confirm-title" className="text-lg font-extrabold">{request.title}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{request.message}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className={button} onClick={() => finish(false)}>Hủy</button>
          <button type="button" autoFocus className={request.destructive ? "inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-rose-500" : primary} onClick={() => finish(true)}>{request.confirmLabel || "Xác nhận"}</button>
        </div>
      </div>
    </dialog>, document.body,
  );
}

/** Promise-based confirm; supports nested editing modals via a top-level portal. */
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const pending = useRef(null);
  const confirm = useCallback((options) => {
    if (pending.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      pending.current = resolve;
      setRequest({ title: "Xác nhận thao tác", message: "Bạn có chắc không?", ...options });
    });
  }, []);
  const finish = useCallback((approved) => {
    const done = pending.current;
    pending.current = null;
    setRequest(null);
    done?.(approved);
  }, []);
  useEffect(() => () => { pending.current?.(false); pending.current = null; }, []);
  return <Context.Provider value={confirm}>{children}{request && <ConfirmSurface request={request} finish={finish} />}</Context.Provider>;
}

export function useConfirm() {
  const confirm = useContext(Context);
  if (!confirm) throw new Error("useConfirm must be used under ConfirmProvider");
  return confirm;
}
