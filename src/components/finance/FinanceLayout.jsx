import { useState } from "react";
import { button, primary } from "./ui";
import MonthPicker from "../common/MonthPicker";
import YearPicker from "../common/YearPicker";

const pages = [
  ["overview", "Tổng quan", "Tình hình thu chi của bạn", "◫"],
  ["expense", "Chi tiêu", "Theo dõi từng khoản chi và mục đích sử dụng", "↗"],
  ["income", "Thu nhập", "Phân biệt tiền đã nhận và thu nhập dự kiến", "↙"],
  ["budget", "Ngân sách", "Chủ động giới hạn chi tiêu mỗi tháng", "◎"],
  ["summary", "Tổng kết", "Đối chiếu thu chi và mục tiêu của bạn", "▥"],
  ["social", "Sổ mừng & thăm hỏi", "Theo dõi các khoản mừng, phúng viếng và thăm hỏi qua nhiều năm", "♡"],
  ["settings", "Cài đặt", "Tài khoản, giao diện và dữ liệu", "⚙"],
];

export default function FinanceLayout({ page, onNavigate, month, onMonthChange, summaryMode = "month", summaryYear, onSummaryYearChange, availableYears = [], dark, onThemeChange, onAdd, onSignOut, signingOut, logoutError, user, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const current = pages.find(([id]) => id === page) || pages[0];
  const hasPeriod = !["social", "settings"].includes(page);
  const showYear = page === "summary" && summaryMode === "year";
  const hasAdd = ["overview", "expense", "income", "summary", "social"].includes(page);
  const navigation = <nav aria-label="Điều hướng chính" className="grid gap-1">
    {pages.map(([id, label, , icon]) => <button key={id} type="button" aria-current={page === id ? "page" : undefined}
      onClick={() => { onNavigate(id); setMenuOpen(false); }}
      className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${page === id ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
      <span aria-hidden="true" className="w-5 shrink-0 text-center text-xl">{icon}</span><span className="truncate">{label}</span>
    </button>)}
  </nav>;
  return <div className={`${dark ? "dark" : ""} min-h-dvh overflow-x-clip bg-slate-50 font-sans text-slate-900 scheme-light dark:bg-slate-950 dark:text-slate-100 dark:scheme-dark`}>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2 pt-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-xl text-white">◈</span><div><p className="text-xl font-extrabold">zWhisFlow</p><p className="text-xs text-slate-500 dark:text-slate-400">Tài chính cá nhân</p></div></div>
      {navigation}
      <div className="mt-auto border-t border-slate-200 pt-5 dark:border-slate-800"><p className="text-xs text-slate-500 dark:text-slate-400">Đồng bộ Firebase</p><p className="mt-1 truncate text-sm" title={user?.email}>{user?.email}</p><button type="button" className={`${button} mt-4 w-full`} onClick={onSignOut} disabled={signingOut}>{signingOut ? "Đang đăng xuất…" : "Đăng xuất"}</button></div>
    </aside>
    <div className="min-w-0 lg:pl-64">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden"><span className="font-extrabold">◈ zWhisFlow</span><button type="button" className={button} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((v) => !v)}>{menuOpen ? "✕ Đóng" : "☰ Menu"}</button></div>
      {menuOpen && <div id="mobile-menu" className="border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">{navigation}<button type="button" className={`${button} mt-3 w-full`} onClick={onSignOut} disabled={signingOut}>Đăng xuất</button></div>}
      <main className="mx-auto w-full min-w-0 max-w-[1600px] p-4 sm:p-6 xl:p-8">
        <header className="mb-6 flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0"><h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{current[1]}</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{current[2]}</p></div>
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 xl:w-auto xl:flex-nowrap">
            {hasPeriod && <div className="min-w-0 flex-[1_1_230px] sm:flex-none">
              {showYear ? <YearPicker value={summaryYear} onChange={onSummaryYearChange} className="w-full sm:w-[270px]"/> : <MonthPicker value={month} onChange={onMonthChange} className="w-full sm:w-[270px]"/>}
            </div>}
            {hasAdd && <button type="button" className={`${primary} flex-1 whitespace-nowrap sm:flex-none`} onClick={onAdd}>{page === "social" ? "+ Ghi nhận khoản" : "+ Thêm giao dịch"}</button>}
            <button type="button" className={`${button} !px-3`} onClick={onThemeChange} aria-label={dark ? "Bật giao diện sáng" : "Bật giao diện tối"} title={dark ? "Giao diện sáng" : "Giao diện tối"}>{dark ? "☀" : "☾"}</button>
          </div>
        </header>
        {logoutError && <p role="alert" className="mb-4 text-sm text-rose-600 dark:text-rose-400">{logoutError}</p>}
        <div className="min-w-0 max-w-full">{children}</div>
      </main>
    </div>
  </div>;
}
