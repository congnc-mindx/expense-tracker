import { useMemo, useState } from "react";
import { useTransactions } from "./hooks/useTransactions";
import { useCloudCollection } from "./firebase/useCloudCollection";
import FinanceLayout from "./components/finance/FinanceLayout";
import TransactionModal from "./components/finance/TransactionModal";
import OverviewPage from "./pages/OverviewPage";
import TransactionsPage from "./pages/TransactionsPage";
import BudgetPage from "./pages/BudgetPage";
import SummaryPage from "./pages/SummaryPage";
import SettingsPage from "./pages/SettingsPage";
import SocialLedgerPage from "./pages/SocialLedgerPage";
import { localDate, monthRows } from "./utils/finance";
import { resolveCategoryConfig, validateCategoryConfig } from "./utils/categoryConfig";
import { CategoryProvider } from "./context/CategoryContext";
import { socialToTransaction } from "./utils/socialAccounting";
import { clampYear } from "./utils/dateLimits";

const EMPTY_BUDGET = { total: 0, categories: {} };
function validBudget(budget) {
  return budget && Number.isSafeInteger(budget.total) && budget.total >= 0 && budget.categories &&
    typeof budget.categories === "object" && !Array.isArray(budget.categories) &&
    Object.values(budget.categories).every((value) => Number.isSafeInteger(value) && value >= 0);
}
export default function App({ user, onSignOut, signingOut, logoutError }) {
  const [page, setPage] = useState("overview");
  const [month, setMonth] = useState(() => localDate().slice(0, 7));
  const [modal, setModal] = useState(null);
  const [themeError, setThemeError] = useState("");
  const [summaryMode, setSummaryMode] = useState("month");
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [socialAddSignal, setSocialAddSignal] = useState(0);
  const preferences = useCloudCollection(user.uid, "preferences");
  const dark = preferences.rows.find((item) => item.id === "ui")?.dark ?? window.matchMedia("(prefers-color-scheme: dark)").matches;
  const categoryConfig = useMemo(() => resolveCategoryConfig(preferences.rows.find((r) => r.id === "categories")), [preferences.rows]);
  const { transactions, saveTransaction, deleteTransaction, availableYears, error, loading } = useTransactions(user.uid, categoryConfig);
  const socialStore = useCloudCollection(user.uid, "socialEntries");
  const combinedTransactions = useMemo(() => [...transactions, ...socialStore.rows.map(socialToTransaction)], [transactions, socialStore.rows]);
  async function saveCategories(data) {
    if (preferences.loading || preferences.error) throw new Error(preferences.error || "Cài đặt chưa tải xong.");
    await preferences.save("categories", { ...validateCategoryConfig(data), updatedAt: Date.now() });
  }
  const budgetStore = useCloudCollection(user.uid, "budgets");
  const budget = budgetStore.rows.find((b) => b.id === month) || EMPTY_BUDGET;
  const budgetError = budgetStore.error || (!validBudget(budget) ? "Dữ liệu ngân sách tháng không hợp lệ." : "");
  const rows = monthRows(combinedTransactions, month);
  const readError = error || budgetError || socialStore.error || preferences.error;
  const busy = loading || budgetStore.loading || socialStore.loading || preferences.loading;
  async function toggleTheme() {
    setThemeError("");
    try { await preferences.save("ui", { dark: !dark, updatedAt: Date.now() }); }
    catch { setThemeError("Chưa đồng bộ được giao diện lên Firebase."); }
  }
  async function saveBudget(next) {
    if (budgetStore.loading || budgetError) throw new Error(budgetError || "Ngân sách chưa tải xong.");
    if (!validBudget(next)) throw new Error("Ngân sách có giá trị không hợp lệ.");
    await budgetStore.save(month, { ...next, updatedAt: Date.now() });
  }
  return <CategoryProvider config={categoryConfig}><FinanceLayout page={page} onNavigate={setPage} month={month} onMonthChange={setMonth} dark={dark} onThemeChange={toggleTheme}
    summaryMode={summaryMode} summaryYear={summaryYear} onSummaryYearChange={(y)=>setSummaryYear(clampYear(y))} availableYears={availableYears}
    onAdd={() => page === "social" ? setSocialAddSignal((n) => n + 1) : setModal({ type: page === "income" ? "income" : "expense" })} onSignOut={onSignOut} signingOut={signingOut} logoutError={logoutError} user={user}>
    {themeError && <p role="alert" className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">{themeError}</p>}
    {readError && <p role="alert" className="mb-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{readError}</p>}
    {page === "settings" ? <SettingsPage user={user} dark={dark} onThemeChange={toggleTheme} categoryConfig={categoryConfig} categoryVersion={preferences.rows.find((r) => r.id === "categories")?.updatedAt || 0} onSaveCategories={saveCategories} /> :
     page === "social" ? <SocialLedgerPage store={socialStore} addSignal={socialAddSignal} /> :
     busy ? <div className="rounded-2xl bg-white p-8 text-center text-slate-500 dark:bg-slate-900">Đang tải dữ liệu từ Firebase…</div> :
     readError ? null : <>
       {page === "overview" && <OverviewPage rows={rows} allTransactions={combinedTransactions} month={month} onMonthChange={setMonth} budget={budget} onNavigate={setPage} />}
       {["expense", "income"].includes(page) && <TransactionsPage key={`${page}:${month}`} type={page} rows={rows} onEdit={(transaction) => setModal({ type: transaction.type, transaction })} onDelete={deleteTransaction} onSocialNavigate={() => setPage("social")} />}
       {page === "budget" && <BudgetPage key={month} budget={budget} rows={rows} onSave={saveBudget} />}
       {page === "summary" && <SummaryPage transactions={combinedTransactions} userId={user.uid} month={month} mode={summaryMode} onModeChange={setSummaryMode} year={summaryYear} />}
     </>}
    {modal && !busy && !readError && <TransactionModal defaultType={modal.type} transaction={modal.transaction} onSave={saveTransaction} onClose={() => setModal(null)} />}
  </FinanceLayout></CategoryProvider>;
}
