import { useState } from "react";
import CategoryManager from "../components/settings/CategoryManager";
import { panel, button, muted, primary } from "../components/finance/ui";
import { localDate } from "../utils/finance";
import { exportBackup, downloadJson } from "../firebase/backup";

export default function SettingsPage({ user, dark, onThemeChange, categoryConfig, categoryVersion, onSaveCategories }) {
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
    <div className="grid gap-6 xl:grid-cols-2">
      <section className={panel}><h2 className="font-bold">Tài khoản & giao diện</h2><p className={`mt-3 break-all ${muted}`}>{user.email}</p><p className={`mt-1 text-xs ${muted}`}>UID: {user.uid}</p>
        <button type="button" className={`mt-5 ${button}`} onClick={onThemeChange}>Chuyển sang giao diện {dark ? "sáng" : "tối"}</button>
      </section>
      <section className={panel}><h2 className="font-bold">Firebase & sao lưu</h2><p className={`mt-3 ${muted}`}>Toàn bộ giao dịch, sổ mừng, danh mục và ngân sách được đồng bộ trên Firestore theo tài khoản. Bạn có thể xuất bản sao lưu JSON bất cứ lúc nào.</p>
        <button type="button" disabled={busy} className={`mt-4 ${primary}`} onClick={backup}>↓ Xuất toàn bộ dữ liệu Firebase (JSON)</button>
      </section>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{message}</p>}
    <CategoryManager key={categoryVersion} initial={categoryConfig} onSave={onSaveCategories}/>
  </div>;
}
