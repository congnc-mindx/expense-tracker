import React, { useState, useMemo } from "react";
import { calculateFinancialSummary } from "../utils/calculations";
import { formatMoney, formatCompactMoney } from "../utils/money";
import { getCategoryById } from "../data/defaultSettings";

export default function Dashboard({
  transactions,
  onDelete,
  availableYears,
  onQuickAdd,
}) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 'ALL' hoặc 1..12

  const summary = useMemo(
    () => calculateFinancialSummary(transactions, selectedYear, selectedMonth),
    [transactions, selectedYear, selectedMonth],
  );

  // Tìm giá trị cao nhất trong 12 tháng để căn chỉnh chiều cao cột biểu đồ
  const maxMonthlyValue = useMemo(() => {
    const maxVal = Math.max(
      ...summary.monthlyBreakdown.map((m) => Math.max(m.income, m.expense)),
      1,
    );
    return maxVal;
  }, [summary.monthlyBreakdown]);

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Thanh công cụ lọc theo Năm & Tháng */}
      <div className="filter-bar card">
        <div className="filter-Title">
          <h3>📅 Kỳ báo cáo</h3>
          <span className="badge-sage">
            {selectedMonth === "ALL"
              ? `Tổng quan cả năm ${selectedYear}`
              : `Tháng ${selectedMonth} / ${selectedYear}`}
          </span>
        </div>

        <div className="filter-controls">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="filter-select"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value),
              )
            }
            className="filter-select"
          >
            <option value="ALL">📊 Xem cả năm (12 tháng)</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3 Thẻ KPI Tổng quan */}
      <div className="kpi-grid">
        <div className="kpi-card balance-card">
          <span className="kpi-label">
            Số dư khả dụng (
            {selectedMonth === "ALL" ? "Năm" : `T${selectedMonth}`})
          </span>
          <h2 className="kpi-value">{formatMoney(summary.balance)}</h2>
          <span className="kpi-sub">
            Tổng cả năm {selectedYear}: {formatMoney(summary.yearlyBalance)}
          </span>
        </div>

        <div className="kpi-card income-card">
          <span className="kpi-label">🌱 Tổng Thu Nhập</span>
          <h2 className="kpi-value text-green">
            {formatMoney(summary.totalIncome)}
          </h2>
          <span className="kpi-sub">
            Thu nhập năm {selectedYear}: {formatMoney(summary.yearlyIncome)}
          </span>
        </div>

        <div className="kpi-card expense-card">
          <span className="kpi-label">💸 Tổng Chi Tiêu</span>
          <h2 className="kpi-value text-coral">
            {formatMoney(summary.totalExpense)}
          </h2>
          <span className="kpi-sub">
            Chi tiêu năm {selectedYear}: {formatMoney(summary.yearlyExpense)}
          </span>
        </div>
      </div>

      {/* Khu vực Biểu đồ Năm & Phân bổ Danh mục */}
      <div className="charts-grid">
        {/* Biểu đồ cột 12 tháng trong năm */}
        <div className="card chart-card">
          <div className="card-header-inline">
            <h3>Biểu đồ Thu - Chi năm {selectedYear}</h3>
            <span className="hint-text">Bấm vào cột tháng để lọc nhanh</span>
          </div>

          <div className="bar-chart-wrapper">
            {summary.monthlyBreakdown.map((item) => {
              const incHeight = Math.round(
                (item.income / maxMonthlyValue) * 100,
              );
              const expHeight = Math.round(
                (item.expense / maxMonthlyValue) * 100,
              );
              const isSelected = Number(selectedMonth) === item.month;

              return (
                <div
                  key={item.month}
                  className={`bar-column ${isSelected ? "active-month" : ""}`}
                  onClick={() =>
                    setSelectedMonth(isSelected ? "ALL" : item.month)
                  }
                  title={`Tháng ${item.month}: Thu ${formatMoney(item.income)} | Chi ${formatMoney(item.expense)}`}
                >
                  <div className="bars-Area">
                    <div
                      className="bar bar-income"
                      style={{
                        height: `${Math.max(incHeight, item.income > 0 ? 6 : 0)}%`,
                      }}
                    />
                    <div
                      className="bar bar-expense"
                      style={{
                        height: `${Math.max(expHeight, item.expense > 0 ? 6 : 0)}%`,
                      }}
                    />
                  </div>
                  <span className="bar-label">{item.label}</span>
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <span>
              <i className="dot dot-income" /> Thu nhập
            </span>
            <span>
              <i className="dot dot-expense" /> Chi tiêu
            </span>
          </div>
        </div>

        {/* Phân tích chi tiêu theo danh mục */}
        <div className="card category-card">
          <h3>Cơ cấu các mục chi tiêu</h3>
          {summary.categoryBreakdown.length === 0 ? (
            <div className="empty-box">
              Chưa có khoản chi tiêu nào trong kỳ này.
            </div>
          ) : (
            <div className="category-progress-list">
              {summary.categoryBreakdown.map((cat) => (
                <div key={cat.id} className="cat-stat-item">
                  <div className="cat-stat-header">
                    <span>
                      {cat.icon} <strong>{cat.name}</strong> ({cat.count} lần)
                    </span>
                    <span>
                      <strong>{formatMoney(cat.total)}</strong> (
                      {cat.percentage}%)
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danh sách giao dịch chi tiết */}
      <div className="card transactions-card">
        <div className="card-header-inline">
          <h3>Lịch sử giao dịch ({summary.filteredTransactions.length})</h3>
          <button className="btn-outline-sage" onClick={onQuickAdd}>
            + Thêm chi tiêu mới
          </button>
        </div>

        {summary.filteredTransactions.length === 0 ? (
          <div className="empty-box">
            Không có giao dịch nào. Hãy bấm <strong>+ Thêm chi tiêu mới</strong>{" "}
            để bắt đầu!
          </div>
        ) : (
          <div className="tx-list">
            {summary.filteredTransactions.map((tx) => {
              const catInfo = getCategoryById(tx.category);
              return (
                <div key={tx.id} className="tx-item">
                  <div className="tx-left">
                    <div
                      className="tx-icon"
                      style={{ backgroundColor: `${catInfo.color}20` }}
                    >
                      {catInfo.icon}
                    </div>
                    <div className="tx-info">
                      <h4>{tx.note || catInfo.name}</h4>
                      <span>
                        {catInfo.name} •{" "}
                        {new Date(tx.date).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <div className="tx-right">
                    <span
                      className={`tx-amount ${tx.type === "income" ? "text-green" : "text-coral"}`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatMoney(tx.amount)}
                    </span>
                    <button
                      className="delete-btn"
                      onClick={() => onDelete(tx.id)}
                      title="Xoá giao dịch"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
