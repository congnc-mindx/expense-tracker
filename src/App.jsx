import { useMemo, useState } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase/client";
import { useTransactions } from "./hooks/useTransactions";
import { useCloudCollection } from "./firebase/useCloudCollection";
import FinanceLayout from "./components/finance/FinanceLayout";
import TransactionModal from "./components/finance/TransactionModal";
import OverviewPage from "./pages/OverviewPage";
import TransactionsWorkspace from "./components/finance/TransactionsWorkspace";
import BudgetPage from "./pages/BudgetPage";
import SummaryPage from "./pages/SummaryPage";
import SettingsPage from "./pages/SettingsPage";
import SocialLedgerPage from "./pages/SocialLedgerPage";
import PlansPage from "./pages/PlansPage";
import { localDate, monthRows } from "./utils/finance";
import {
  resolveCategoryConfig,
  validateCategoryConfig,
} from "./utils/categoryConfig";
import { CategoryProvider } from "./context/CategoryContext";
import { socialToTransaction } from "./utils/socialAccounting";
import { clampYear } from "./utils/dateLimits";
import { categoryIdsInBudgets } from "./utils/budgetEdits";
import {
  recurringForMonth,
  recurringTransactionId,
  validateRecurringRule,
  recurringType,
} from "./utils/recurringExpenses";
import { localDate as todayDate } from "./utils/finance";

const EMPTY_BUDGET = { total: 0, categories: {} };
function validBudget(budget) {
  return (
    budget &&
    Number.isSafeInteger(budget.total) &&
    budget.total >= 0 &&
    budget.categories &&
    typeof budget.categories === "object" &&
    !Array.isArray(budget.categories) &&
    Object.values(budget.categories).every(
      (value) => Number.isSafeInteger(value) && value >= 0,
    )
  );
}
export default function App({ user, onSignOut, signingOut, logoutError }) {
  const [page, setPage] = useState("overview");
  const [transactionType, setTransactionType] = useState("expense");
  // Compatibility: dashboard shortcuts still navigate using old page IDs.
  function navigate(nextPage) {
    if (nextPage === "income" || nextPage === "expense") {
      setTransactionType(nextPage);
      setPage("transactions");
      return;
    }
    setPage(nextPage);
  }
  const [month, setMonth] = useState(() => localDate().slice(0, 7));
  const [modal, setModal] = useState(null);
  const [themeError, setThemeError] = useState("");
  const [summaryMode, setSummaryMode] = useState("month");
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [socialAddSignal, setSocialAddSignal] = useState(0);
  const [planAddSignal, setPlanAddSignal] = useState(0);
  const [recurringBusy, setRecurringBusy] = useState(false);
  const [recurringError, setRecurringError] = useState("");
  const preferences = useCloudCollection(user.uid, "preferences");
  const dark =
    preferences.rows.find((item) => item.id === "ui")?.dark ??
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const categoryConfig = useMemo(
    () =>
      resolveCategoryConfig(
        preferences.rows.find((r) => r.id === "categories"),
      ),
    [preferences.rows],
  );
  const {
    transactions,
    saveTransaction,
    deleteTransaction,
    saveRecurringPayment,
    availableYears,
    error,
    loading,
  } = useTransactions(user.uid, categoryConfig);
  const recurringRules = useMemo(() => {
    const items = preferences.rows.find(
      (row) => row.id === "recurringExpenses",
    )?.items;
    return Array.isArray(items) ? items : [];
  }, [preferences.rows]);
  const recurringPreview = useMemo(
    () => recurringForMonth(recurringRules, month, transactions),
    [recurringRules, month, transactions],
  );
  const socialStore = useCloudCollection(user.uid, "socialEntries");
  const plansStore = useCloudCollection(user.uid, "plans");
  const combinedTransactions = useMemo(
    () => [...transactions, ...socialStore.rows.map(socialToTransaction)],
    [transactions, socialStore.rows],
  );
  async function saveCategories(data) {
    if (
      preferences.loading ||
      preferences.error ||
      loading ||
      budgetStore.loading ||
      budgetStore.error
    )
      throw new Error(preferences.error || "Dữ liệu chưa tải xong.");
    const clean = validateCategoryConfig(data);
    const nextIds = new Set(
      [...clean.expense, ...clean.income].map((item) => item.id),
    );
    const usedIds = new Set([
      ...transactions.map((tx) => tx.category),
      ...categoryIdsInBudgets(budgetStore.rows),
      ...recurringRules.map((rule) => rule.category),
    ]);
    const missingUsed = [...usedIds].filter((id) => id && !nextIds.has(id));
    if (missingUsed.length)
      throw new Error(
        "Không thể xóa danh mục đang có giao dịch hoặc hạn mức ngân sách. Hãy dùng Ẩn để bảo vệ lịch sử.",
      );
    await preferences.save("categories", { ...clean, updatedAt: Date.now() });
  }
  const budgetStore = useCloudCollection(user.uid, "budgets");
  const budget = budgetStore.rows.find((b) => b.id === month) || EMPTY_BUDGET;
  const budgetError =
    budgetStore.error ||
    (!validBudget(budget) ? "Dữ liệu ngân sách tháng không hợp lệ." : "");
  const rows = monthRows(combinedTransactions, month);
  const usedCategoryIds = useMemo(
    () => [
      ...new Set([
        ...transactions.map((tx) => tx.category).filter(Boolean),
        ...categoryIdsInBudgets(budgetStore.rows),
        ...recurringRules.map((rule) => rule.category),
      ]),
    ],
    [transactions, budgetStore.rows, recurringRules],
  );
  const readError =
    error || budgetError || socialStore.error || preferences.error;
  const busy =
    loading ||
    budgetStore.loading ||
    socialStore.loading ||
    preferences.loading;
  async function toggleTheme() {
    setThemeError("");
    try {
      await preferences.save("ui", { dark: !dark, updatedAt: Date.now() });
    } catch {
      setThemeError("Chưa đồng bộ được giao diện lên Firebase.");
    }
  }
  // Firestore transaction prevents two open tabs overwriting one another's schedules.
  async function persistRecurring(transform) {
    if (preferences.loading || preferences.error || recurringBusy)
      throw new Error(preferences.error || "Chưa thể lưu khoản định kỳ.");
    setRecurringBusy(true);
    setRecurringError("");
    try {
      const ref = doc(
        db,
        "users",
        user.uid,
        "preferences",
        "recurringExpenses",
      );
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current =
          snapshot.exists() && Array.isArray(snapshot.data()?.items)
            ? snapshot.data().items
            : [];
        const next = transform(current);
        transaction.set(ref, { items: next, updatedAt: Date.now() });
      });
    } catch (reason) {
      setRecurringError(reason.message || "Không thể lưu khoản định kỳ.");
      throw reason;
    } finally {
      setRecurringBusy(false);
    }
  }
  async function saveRecurringRule(fields, id) {
    const clean = validateRecurringRule(fields, categoryConfig);
    const timestamp = Date.now();
    const createdId = id || crypto.randomUUID();
    await persistRecurring((current) => {
      if (id && !current.some((item) => item.id === id))
        throw new Error("Khoản lặp không còn tồn tại.");
      return id
        ? current.map((rule) =>
            rule.id === id ? { ...rule, ...clean, updatedAt: timestamp } : rule,
          )
        : [
            ...current,
            {
              ...clean,
              id: createdId,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ];
    });
  }
  async function deleteRecurringRule(rule) {
    if (
      !window.confirm(
        `Xóa lịch “${rule.title}”? Giao dịch đã ghi nhận vẫn được giữ.`,
      )
    )
      return;
    await persistRecurring((current) =>
      current.filter((item) => item.id !== rule.id),
    );
  }
  async function toggleRecurringRule(rule) {
    await persistRecurring((current) =>
      current.map((item) =>
        item.id === rule.id
          ? { ...item, active: !item.active, updatedAt: Date.now() }
          : item,
      ),
    );
  }
  async function markRecurringPaid(tx) {
    const rule = recurringRules.find((item) => item.id === tx.recurringId);
    if (
      !rule ||
      !rule.active ||
      tx.date > todayDate() ||
      recurringType(rule) !== tx.type
    ) {
      throw new Error(
        "Khoản thu/chi chưa đến hạn, đã dừng hoặc không còn hợp lệ.",
      );
    }
    await saveRecurringPayment(
      tx,
      recurringTransactionId(rule.id, tx.recurringMonth),
    );
  }
  async function saveBudget(next) {
    if (budgetStore.loading || budgetError)
      throw new Error(budgetError || "Ngân sách chưa tải xong.");
    if (!validBudget(next))
      throw new Error("Ngân sách có giá trị không hợp lệ.");
    await budgetStore.save(month, { ...next, updatedAt: Date.now() });
  }
  return (
    <CategoryProvider config={categoryConfig}>
      <FinanceLayout
        page={page}
        onNavigate={navigate}
        month={month}
        onMonthChange={setMonth}
        dark={dark}
        onThemeChange={toggleTheme}
        summaryMode={summaryMode}
        summaryYear={summaryYear}
        onSummaryYearChange={(y) => setSummaryYear(clampYear(y))}
        availableYears={availableYears}
        addLabel={
          page === "plans"
            ? "+ Tạo kế hoạch"
            : page === "transactions" && transactionType === "recurring"
              ? "+ Thêm định kỳ"
              : undefined
        }
        onAdd={() =>
          page === "plans"
            ? setPlanAddSignal((n) => n + 1)
            : page === "social"
              ? setSocialAddSignal((n) => n + 1)
              : setModal({
                  type:
                    page === "transactions" && transactionType !== "recurring"
                      ? transactionType
                      : "expense",
                  recurring:
                    page === "transactions" && transactionType === "recurring",
                })
        }
        onSignOut={onSignOut}
        signingOut={signingOut}
        logoutError={logoutError}
        user={user}
      >
        {themeError && (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
          >
            {themeError}
          </p>
        )}
        {readError && (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200"
          >
            {readError}
          </p>
        )}
        {busy ? (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500 dark:bg-slate-900">
            Đang tải dữ liệu từ Firebase…
          </div>
        ) : readError ? null : (
          <>
            {page === "settings" && (
              <SettingsPage
                user={user}
                dark={dark}
                onThemeChange={toggleTheme}
                categoryConfig={categoryConfig}
                onSaveCategories={saveCategories}
                usedCategoryIds={usedCategoryIds}
              />
            )}
            {page === "social" && (
              <SocialLedgerPage
                store={socialStore}
                addSignal={socialAddSignal}
              />
            )}
            {page === "plans" &&
              (plansStore.loading ? (
                <div className="rounded-2xl bg-white p-8 text-center text-slate-500 dark:bg-slate-900">
                  Đang tải kế hoạch từ Firebase…
                </div>
              ) : (
                <PlansPage store={plansStore} addSignal={planAddSignal} />
              ))}
            {page === "overview" && (
              <OverviewPage
                rows={rows}
                allTransactions={combinedTransactions}
                month={month}
                onMonthChange={setMonth}
                budget={budget}
                onNavigate={navigate}
              />
            )}
            {page === "transactions" && (
              <TransactionsWorkspace
                type={transactionType}
                onTypeChange={setTransactionType}
                month={month}
                rows={[...rows, ...recurringPreview]}
                recurringRules={recurringRules}
                recurringActions={{
                  save: saveRecurringRule,
                  remove: deleteRecurringRule,
                  toggle: toggleRecurringRule,
                  busy: recurringBusy,
                  error: recurringError,
                }}
                onCreateRecurring={(type) =>
                  setModal({ type, recurring: true })
                }
                onRecurringPayment={markRecurringPaid}
                onEdit={(transaction) =>
                  setModal({ type: transaction.type, transaction })
                }
                onDelete={deleteTransaction}
                onSocialNavigate={() => navigate("social")}
              />
            )}
            {page === "budget" && (
              <BudgetPage
                key={month}
                budget={budget}
                rows={rows}
                onSave={saveBudget}
              />
            )}
            {page === "summary" && (
              <SummaryPage
                transactions={combinedTransactions}
                userId={user.uid}
                month={month}
                mode={summaryMode}
                onModeChange={setSummaryMode}
                year={summaryYear}
              />
            )}
          </>
        )}
        {modal && !busy && !readError && (
          <TransactionModal
            defaultType={modal.type}
            transaction={modal.transaction}
            recurringDefault={Boolean(modal.recurring)}
            onSave={saveTransaction}
            onSaveRecurring={async (rule) => {
              await saveRecurringRule(rule);
              setPage("transactions");
              setTransactionType("recurring");
            }}
            onClose={() => setModal(null)}
          />
        )}
      </FinanceLayout>
    </CategoryProvider>
  );
}
