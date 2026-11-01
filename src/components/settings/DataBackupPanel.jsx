import { useState } from "react";
import { panel, button, muted, primary } from "../finance/ui";
import { localDate } from "../../utils/finance";
import { exportBackup, downloadJson } from "../../firebase/backup";
import { validateBackup, prepareRestore, applyRestore } from "../../firebase/restoreBackup";
import { downloadAnnualWorkbook } from "../../utils/annualExcel";
import { useConfirm } from "../common/ConfirmProvider";

const exportYears = (now = new Date().getFullYear()) => Array.from({ length: 5 }, (_, index) => now - index).filter((year) => year >= 2023);

export default function DataBackupPanel({ user, mindx }) {
  const confirm = useConfirm();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [preview, setPreview] = useState(null);
  const [restoreFile, setRestoreFile] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const years = exportYears();

  async function backup(asExcel) {
    setBusy(true); setError(""); setMessage("");
    try {
      const data = await exportBackup(user.uid);
      if (asExcel) {
        downloadAnnualWorkbook(data, year, mindx?.rows || [], mindx?.account?.uid || "");
        setMessage(`Đã xuất báo cáo Excel ${year}.`);
      } else {
        downloadJson(data, `zwhisflow-${localDate()}.json`);
        setMessage("Đã sao lưu dữ liệu JSON.");
      }
    } catch (reason) { setError(reason?.message || "Không thể xuất dữ liệu."); }
    finally { setBusy(false); }
  }
  async function selectRestoreFile(event) {
    const file = event.target.files?.[0];
    setPreview(null); setRestoreFile(""); setMessage(""); setError(""); setOverwrite(false);
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setError("Tệp vượt 20MB. Hãy dùng bản sao lưu nhỏ hơn."); event.target.value = ""; return; }
    setBusy(true);
    try {
      const data = JSON.parse(await file.text());
      const valid = validateBackup(data);
      const result = await prepareRestore(user.uid, valid);
      setPreview(result);
      setRestoreFile(file.name);
    } catch (reason) { setError(reason?.message || "Không thể đọc file JSON."); }
    finally { setBusy(false); event.target.value = ""; }
  }
  async function restore() {
    if (!preview || busy) return;
    const count = overwrite ? preview.validated.count : preview.additions;
    if (count === 0) { setMessage("Không có bản ghi mới cần khôi phục."); return; }
    const accepted = await confirm({
      title: overwrite ? "Ghi đè bản ghi trùng?" : "Khôi phục bản ghi còn thiếu?",
      message: `${count} bản ghi sẽ được ghi lên Firebase. Hệ thống tải một bản JSON hiện tại trước khi thực hiện; không xóa dữ liệu khác.`,
      confirmLabel: "Khôi phục", destructive: overwrite,
    });
    if (!accepted) return;
    setBusy(true); setError(""); setMessage("");
    try {
      // The pre-restore snapshot must be downloaded successfully before ANY writes.
      const prior = await exportBackup(user.uid);
      downloadJson(prior, `zwhisflow-before-restore-${localDate()}.json`);
      // Refresh the comparison after confirmation to avoid stale previews.
      const refreshed = await prepareRestore(user.uid, preview.validated);
      const result = await applyRestore(user.uid, refreshed, overwrite);
      setMessage(`Đã khôi phục ${result.written} bản ghi. ${result.skipped} bản ghi trùng được giữ nguyên.`);
      setPreview(null); setOverwrite(false); setRestoreFile("");
    } catch (reason) { setError(reason?.message || "Khôi phục chưa thành công. Kiểm tra lại dữ liệu."); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-4">
    <section className={panel}>
      <h2 className="text-lg font-bold">Sao lưu & xuất dữ liệu</h2>
      <p className={`mt-2 ${muted}`}>Xuất Excel 5 năm gần nhất hoặc sao lưu JSON của zWhisFlow để khôi phục. Dữ liệu Firebase mindX nằm ở project riêng.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-semibold">Năm xuất Excel
          <select aria-label="Năm xuất Excel" value={year} onChange={(event) => setYear(Number(event.target.value))}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
            {years.map((value) => <option key={value} value={value}>Năm {value}</option>)}
          </select>
        </label>
        <button type="button" className={primary} disabled={busy} onClick={() => backup(true)}>{busy ? "Đang xử lý…" : `↓ Xuất Excel ${year}`}</button>
        <button type="button" className={button} disabled={busy} onClick={() => backup(false)}>↓ Sao lưu JSON</button>
      </div>
      <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
        <h3 className="text-sm font-bold">Khôi phục dữ liệu từ JSON</h3>
        <p className={`mt-1 ${muted}`}>Mặc định chỉ thêm bản ghi còn thiếu. Không xóa dữ liệu đang có.</p>
        <label className="mt-3 block max-w-xl text-sm font-medium">Chọn bản sao lưu zWhisFlow
          <input type="file" accept=".json,application/json" disabled={busy} onChange={selectRestoreFile}
            className="mt-2 block w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:file:bg-slate-800 dark:file:text-emerald-300" />
        </label>
        {preview && <div className="mt-4 max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/20">
          <p className="break-all font-bold">{restoreFile}</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">{preview.validated.count} bản ghi trong tệp · {preview.additions} cần bổ sung · {preview.conflicts} đã tồn tại</p>
          {preview.conflicts > 0 && <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 accent-emerald-600" checked={overwrite} onChange={(event) => setOverwrite(event.target.checked)} />
            <span>Ghi đè các bản ghi trùng ID bằng nội dung file (nâng cao)</span>
          </label>}
          <button type="button" className={`${overwrite ? "mt-4 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700" : `${primary} mt-4`}`}
            disabled={busy || (overwrite ? preview.validated.count : preview.additions) === 0} onClick={restore}>
            {busy ? "Đang khôi phục…" : `Khôi phục ${overwrite ? preview.validated.count : preview.additions} bản ghi`}
          </button>
        </div>}
      </div>
    </section>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{message}</p>}
  </div>;
}
