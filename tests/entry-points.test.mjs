import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("index.html trỏ đúng entry mới và luôn qua AuthGate", () => {
  const html = source("../index.html");
  assert.match(html, /src="\/src\/main\.jsx"/);
  assert.match(source("../src/main.jsx"), /<AuthGate\s*\/>/);
  assert.match(source("../src/auth/AuthGate.jsx"), /if \(!state\.user\) return <LoginPage/);
});

test("login có hai chế độ ghi nhớ do Firebase quản lý", () => {
  const login = source("../src/auth/LoginPage.jsx");
  assert.match(login, /browserLocalPersistence/);
  assert.match(login, /browserSessionPersistence/);
  assert.match(login, /setPersistence\(auth, remember/);
  assert.match(login, /Ghi nhớ đăng nhập/);
});

test("Sổ mừng có menu và đường dẫn từ Tổng quan", () => {
  assert.match(source("../src/App.jsx"), /page === "social" \? <SocialLedgerPage/);
  assert.match(source("../src/components/finance/FinanceLayout.jsx"), /\["social", "Sổ mừng & thăm hỏi"/);
  assert.match(source("../src/pages/OverviewPage.jsx"), /onNavigate\("social"\)/);
});

test("legacy index.jsx không còn bypass Firebase Authentication", () => {
  const legacy = source("../src/index.jsx");
  assert.match(legacy, /import\s+["']\.\/main\.jsx["']/);
  assert.doesNotMatch(legacy, /<App\b|uid:\s*["']local["']|Dữ liệu trên thiết bị này/);
});
