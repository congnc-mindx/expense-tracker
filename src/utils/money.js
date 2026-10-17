const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

export const formatMoney = (amount) => {
  const num = Number(amount);
  if (Number.isNaN(num)) return currencyFormatter.format(0);
  return currencyFormatter.format(num);
};

export const formatCompactMoney = (amount) => {
  const num = Number(amount);
  if (Number.isNaN(num) || num === 0) return "0đ";
  return `${compactFormatter.format(num)}đ`;
};

export const parseMoneyInput = (rawString) => {
  if (typeof rawString === "number") return rawString;
  if (!rawString) return 0;
  const cleaned = String(rawString).replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
};
