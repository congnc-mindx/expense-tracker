import React, { useState } from "react";
import "./App.css";
import { useTransactions } from "./hooks/useTransactions";
import Dashboard from "./pages/Dashboard";
import AddTransaction from "./pages/AddTransaction";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { transactions, addTransaction, deleteTransaction, availableYears } =
    useTransactions();

  return (
    <div className="app-layout">
      {/* Sidebar cho Desktop & Header cho Mobile */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">🌿</div>
          <div>
            <h1>SageFinance</h1>
            <p>Quản lý chi tiêu thông minh</p>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span>📊</span> Tổng quan & Thống kê
          </button>
          <button
            className={`nav-item ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            <span>➕</span> Nhập chi tiêu hàng ngày
          </button>
        </nav>
      </aside>

      {/* Nội dung chính */}
      <main className="main-content">
        {activeTab === "dashboard" ? (
          <Dashboard
            transactions={transactions}
            onDelete={deleteTransaction}
            availableYears={availableYears}
            onQuickAdd={() => setActiveTab("add")}
          />
        ) : (
          <AddTransaction
            onAdd={addTransaction}
            onSuccess={() => setActiveTab("dashboard")}
          />
        )}
      </main>

      {/* Thanh điều hướng dưới đáy cho Điện thoại (Mobile Bottom Nav) */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <span>📊</span>
          <small>Tổng quan</small>
        </button>
        <button
          className={`mobile-nav-btn fab-btn ${activeTab === "add" ? "active" : ""}`}
          onClick={() => setActiveTab("add")}
        >
          <span>➕</span>
          <small>Nhập thu/chi</small>
        </button>
      </nav>
    </div>
  );
}
