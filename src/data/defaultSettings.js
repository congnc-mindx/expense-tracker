export const EXPENSE_CATEGORIES = [
  { id: "food", name: "Ăn uống", icon: "🍜", color: "#4CAF50" },
  { id: "transport", name: "Di chuyển", icon: "🛵", color: "#26A69A" },
  { id: "shopping", name: "Mua sắm", icon: "🛍️", color: "#66BB6A" },
  { id: "bills", name: "Hóa đơn & Nhà ở", icon: "⚡", color: "#FFA726" },
  { id: "entertainment", name: "Giải trí", icon: "🎬", color: "#AB47BC" },
  { id: "health", name: "Sức khỏe", icon: "💊", color: "#EF5350" },
  { id: "education", name: "Học tập", icon: "📚", color: "#42A5F5" },
  { id: "other_expense", name: "Chi tiêu khác", icon: "📦", color: "#78909C" },
];

export const INCOME_CATEGORIES = [
  { id: "salary", name: "Lương", icon: "💰", color: "#2E7D32" },
  { id: "bonus", name: "Thưởng & Phụ cấp", icon: "🎁", color: "#43A047" },
  { id: "investment", name: "Đầu tư", icon: "📈", color: "#00897B" },
  { id: "other_income", name: "Thu nhập khác", icon: "✨", color: "#81C784" },
];

export const DEFAULT_SETTINGS = {
  currency: "VND",
  locale: "vi-VN",
  monthlyBudget: 15000000,
};

export const getCategoryById = (categoryId) => {
  return (
    [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(
      (c) => c.id === categoryId,
    ) || {
      id: "other_expense",
      name: "Mục khác",
      icon: "📌",
      color: "#90A4AE",
    }
  );
};
