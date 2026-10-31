import useModalDialog from "../common/useModalDialog";
import { primary } from "../finance/ui";

export default function CelebrationDialog({ plan, onClose }) {
  const dialog = useModalDialog(onClose);
  return <dialog ref={dialog.ref} onCancel={dialog.onCancel} aria-labelledby="plan-congratulations-title"
    className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-[26px] border border-emerald-200 bg-white p-7 text-center text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-emerald-900 dark:bg-slate-900 dark:text-slate-100 sm:p-9">
    <div aria-hidden="true" className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-emerald-100 text-4xl text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">✦</div>
    <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Mục tiêu hoàn thành</p>
    <h2 id="plan-congratulations-title" className="mt-3 text-2xl font-extrabold tracking-tight">Chúc mừng bạn!</h2>
    <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">Bạn đã hoàn thành kế hoạch <strong className="break-words text-emerald-700 dark:text-emerald-300">{plan.title}</strong>. Một mục tiêu mới đã được chinh phục!</p>
    <p className="mt-2 text-xs text-slate-500">Kế hoạch đã được lưu vào danh sách hoàn thành.</p>
    <button type="button" className={`${primary} mt-6 w-full`} onClick={onClose}>Tuyệt vời!</button>
  </dialog>;
}
