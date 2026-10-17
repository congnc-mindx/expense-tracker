import { getCategoryById } from "../data/defaultSettings";

/**
 * Lọc và tính toán toàn bộ dữ liệu thống kê theo Năm và Tháng trong O(N)
 * @param {Array} transactions - Danh sách toàn bộ giao dịch
 * @param {number} selectedYear - Năm đang chọn (VD: 2026)
 * @param {number|string} selectedMonth - Tháng đang chọn (1-12) hoặc 'ALL' để xem cả năm
 */
export const calculateFinancialSummary = (
  transactions = [],
  selectedYear,
  selectedMonth = "ALL",
) => {
  let totalIncome = 0;
  let totalExpense = 0;
  let yearlyIncome = 0;
  let yearlyExpense = 0;

  // Khởi tạo mảng 12 tháng cho biểu đồ năm
  const monthlyBreakdown = Array.from({ length: 12 }, (_, idx) => ({
    month: idx + 1,
    label: `T${idx + 1}`,
    income: 0,
    expense: 0,
  }));

  const categoryMap = {};
  const filteredTransactions = [];

  for (const tx of transactions) {
    if (!tx || !tx.date) continue;
    const txDate = new Date(tx.date);
    const txYear = txDate.getFullYear();
    const txMonth = txDate.getMonth() + 1; // 1 -> 12
    const amount = Number(tx.amount) || 0;

    // 1. Thống kê theo Năm đang chọn (phục vụ biểu đồ 12 tháng & tổng năm)
    if (txYear === Number(selectedYear)) {
      if (tx.type === "income") {
        yearlyIncome += amount;
        monthlyBreakdown[txMonth - 1].income += amount;
      } else {
        yearlyExpense += amount;
        monthlyBreakdown[txMonth - 1].expense += amount;
      }

      // 2. Kiểm tra điều kiện lọc theo Tháng (hoặc 'ALL' = cả năm)
      const isMonthMatch =
        selectedMonth === "ALL" || txMonth === Number(selectedMonth);

      if (isMonthMatch) {
        filteredTransactions.push(tx);

        if (tx.type === "income") {
          totalIncome += amount;
        } else {
          totalExpense += amount;
          const catId = tx.category || "other_expense";
          if (!categoryMap[catId]) {
            const catInfo = getCategoryById(catId);
            categoryMap[catId] = {
              ...catInfo,
              total: 0,
              count: 0,
            };
          }
          categoryMap[catId].total += amount;
          categoryMap[catId].count += 1;
        }
      }
    }
  }

  // Sắp xếp giao dịch mới nhất lên đầu
  filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Tính phần trăm tỷ trọng từng danh mục chi tiêu
  const categoryBreakdown = Object.values(categoryMap)
    .map((item) => ({
      ...item,
      percentage:
        totalExpense > 0 ? Math.round((item.total / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    yearlyIncome,
    yearlyExpense,
    yearlyBalance: yearlyIncome - yearlyExpense,
    monthlyBreakdown,
    categoryBreakdown,
    filteredTransactions,
  };
};
