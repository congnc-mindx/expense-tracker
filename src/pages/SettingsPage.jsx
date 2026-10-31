import { useState } from "react";
import CategoryManager from "../components/settings/CategoryManager";
import { panel, button, muted, primary } from "../components/finance/ui";
import { localDate } from "../utils/finance";
import { exportBackup, downloadJson } from "../firebase/backup";

export default function SettingsPage({ user, dark, onThemeChange, categoryConfig, onSaveCategories, usedCategoryIds = [] }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function backup() {
    setBusy(true);setError("");setMessage("");
    try { const data=await exportBackup(user.uid);downloadJson(data,`zwhisflow-${localDate()}.json`);setMessage("Đã tạo bản sao lưu từ dữ liệu Firebase của tài khoản này."); }
    catch (e) { setError(e.message || "Không thể tải bản sao lưu Firebase."); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-6">
    <CategoryManager initial={categoryConfig} onSave={onSaveCategories} usedCategoryIds={usedCategoryIds}/>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className={panel}><h2 className="font-bold">Tài khoản & giao diện</h2><p className={`mt-3 break-all ${muted}`}>{user.email}</p><p className={`mt-1 text-xs ${muted}`}>UID: {user.uid}</p><p className={`mt-4 ${muted}`}>Bạn có thể chuyển nhanh giữa giao diện sáng và tối. Brand chính của bản hiện tại là xanh lá để đồng bộ toàn bộ ứng dụng.</p>
        <button type="button" className={`mt-5 ${button}`} onClick={onThemeChange}>Chuyển sang giao diện {dark ? "sáng" : "tối"}</button>
      </section>
      <section className={panel}><h2 className="font-bold">Firebase & sao lưu</h2><p className={`mt-3 ${muted}`}>Toàn bộ giao dịch, sổ mừng, danh mục và ngân sách được đồng bộ trên Firestore theo tài khoản. Bạn có thể xuất bản sao lưu JSON bất cứ lúc nào để lưu trữ hoặc kiểm tra dữ liệu.</p>
        <button type="button" disabled={busy} className={`mt-4 ${primary}`} onClick={backup}>↓ Xuất toàn bộ dữ liệu Firebase (JSON)</button></section>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{message}</p>}
  </div>;
}
