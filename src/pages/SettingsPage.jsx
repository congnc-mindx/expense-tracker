import { useState } from "react";
import { localDate } from "../utils/finance";
import CategoryManager from "../components/settings/CategoryManager";
import MindxIncomePanel from "../components/settings/MindxIncomePanel";
import DataBackupPanel from "../components/settings/DataBackupPanel";

const sections = [
  { id: "categories", label: "Danh mục", description: "Thêm, sửa và quản lý phân loại thu chi" },
  { id: "backup", label: "Sao lưu & dữ liệu", description: "Xuất Excel, sao lưu và khôi phục JSON" },
  { id: "integrations", label: "Kết nối mindX", description: "Tài khoản và nguồn lương đồng bộ" },
];

export default function SettingsPage({ user, categoryConfig, onSaveCategories, usedCategoryIds = [], mindx, transactions = [] }) {
  const [section, setSection] = useState("categories");
  const active = sections.find((item) => item.id === section);
  return (
    <div className="grid min-w-0 gap-5">
      <nav aria-label="Các mục cài đặt" className="grid min-w-0 gap-2 rounded-2xl border border-[#dce9df] bg-white p-2 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
        {sections.filter((item) => item.id !== "integrations" || mindx).map((item) => (
          <button key={item.id} type="button" aria-current={section === item.id ? "page" : undefined}
            className={`min-w-0 rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${section === item.id ? "bg-emerald-600 text-white shadow-sm" : "text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800"}`}
            onClick={() => setSection(item.id)}>
            <span className="block text-sm font-bold">{item.label}</span>
            <span className={`mt-0.5 block text-xs ${section === item.id ? "text-emerald-50" : "text-slate-500 dark:text-slate-400"}`}>{item.description}</span>
          </button>
        ))}
      </nav>
      <div role="region" aria-label={active?.label} className="min-w-0">
        {section === "categories" && <CategoryManager key={user.uid} initial={categoryConfig} onSave={onSaveCategories} usedCategoryIds={usedCategoryIds} />}
        {section === "backup" && <DataBackupPanel user={user} mindx={mindx} />}
        {section === "integrations" && mindx && <MindxIncomePanel connectionOnly mindx={mindx} uid={user.uid} period={localDate().slice(0, 7)} transactions={transactions} />}
      </div>
    </div>
  );
}
