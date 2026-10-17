import React, { useState } from "react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../data/defaultSettings";
import { formatMoney, parseMoneyInput } from "../utils/money";

export default function AddTransaction({ onAdd, onSuccess }) {
  const today = new Date().toISOString().split("T")[0];

  const [type, setType] = useState("expense");
  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const categories =
    type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(
      newType === "expense"
        ? EXPENSE_CATEGORIES[0].id
        : INCOME_CATEGORIES[0].id,
    );
  };

  const handleAmountChange = (e) => {
    const numericVal = parseMoneyInput(e.target.value);
    setAmountStr(numericVal > 0 ? numericVal.toString() : "");
    if (error) setError("");
  };

  const quickAmounts = [35000, 50000, 100000, 200000, 500000];

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericAmount = parseMoneyInput(amountStr);

    if (numericAmount <= 0) {
      setError("Vui lòng nhập số tiền lớn hơn 0đ");
      return;
    }

    onAdd({
      type,
      amount: numericAmount,
      category,
      date,
      note: note || categories.find((c) => c.id === category)?.name,
    });

    setAmountStr("");
    setNote("");
    if (onSuccess) onSuccess();
  };

  return (
    <div className="card form-card animate-fade-in">
      <div className="card-header">
        <h2>Nhập giao dịch hàng ngày</h2>
        <p className="subtitle">
          Ghi chép nhanh các khoản thu chi & danh mục khác
        </p>
      </div>

      {/* Chuyển đổi Chi tiêu / Thu nhập */}
      <div className="type-switcher">
        <button
          type="button"
          className={`switch-btn ${type === "expense" ? "active-expense" : ""}`}
          onClick={() => handleTypeChange("expense")}
        >
          💸 Khoản Chi Tiêu
        </button>
        <button
          type="button"
          className={`switch-btn ${type === "income" ? "active-income" : ""}`}
          onClick={() => handleTypeChange("income")}
        >
          🌱 Khoản Thu Nhập
        </button>
      </div>

      <form onSubmit={handleSubmit} className="tx-form">
        {/* Nhập số tiền */}
        <div className="form-group">
          <label>Số tiền ({amountStr ? formatMoney(amountStr) : "0 ₫"})</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Nhập số tiền (VD: 50000)..."
            value={amountStr ? Number(amountStr).toLocaleString("vi-VN") : ""}
            onChange={handleAmountChange}
            className="amount-input"
            autoFocus
          />
          {error && <span className="error-text">{error}</span>}

          {/* Gợi ý nhập nhanh */}
          <div className="quick-chips">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                className="chip-btn"
                onClick={() => setAmountStr(String(amt))}
              >
                +{formatMoney(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* Chọn danh mục */}
        <div className="form-group">
          <label>Chọn danh mục</label>
          <div className="category-grid">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-item ${category === cat.id ? "selected" : ""}`}
                onClick={() => setCategory(cat.id)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ngày & Ghi chú */}
        <div className="form-row">
          <div className="form-group">
            <label>Ngày giao dịch</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Ghi chú chi tiết</label>
            <input
              type="text"
              placeholder="VD: Ăn sáng, đổ xăng, mua đồ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Lưu Giao Dịch
        </button>
      </form>
    </div>
  );
}
