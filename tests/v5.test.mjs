import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSocialThousands, toSocialThousands, formatThousands } from "../src/utils/socialMoney.js";
import { socialToTransaction } from "../src/utils/socialAccounting.js";
import { validateSocialEntry } from "../src/utils/social.js";
import { createYearPlan, buildYearSummary } from "../src/utils/yearSummary.js";
import { totals, validDate } from "../src/utils/finance.js";
import { defaultCategoryConfig, categoryById, validateCategoryConfig, resolveCategoryConfig } from "../src/utils/categoryConfig.js";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
test("Nhập 2000 nghìn đồng thành 2 triệu VND; xem lại sửa không sai", () => {
  assert.equal(parseSocialThousands("2000"), 2000000);
  assert.equal(parseSocialThousands("2.000"), 2000000);
  assert.equal(parseSocialThousands("1,5"), 1500);
  assert.equal(toSocialThousands(2000000), "2.000");
  assert.equal(formatThousands(2000000), "2.000");
  assert.equal(parseSocialThousands(toSocialThousands(1200500)), 1200500);
  assert.equal(Number.isNaN(parseSocialThousands("foo")), true);
});
test("Sổ mừng ghi một lần, tạo thu chi ảo; chỉ tính ngày hiện tại hoặc quá khứ", () => {
  const given = validateSocialEntry({personName:"Lê Trung", group:"Cấp 3", direction:"given", occasion:"wedding",amount:2000000,date:"2026-10-30"});
  const received = validateSocialEntry({...given,direction:"received",amount:500000});
  const projected = [{...socialToTransaction({...given,id:"g1"})},{...socialToTransaction({...received,id:"r1"})}];
  assert.deepEqual(totals(projected), {income:500000, expense:2000000});
  const report = buildYearSummary(projected,2026,createYearPlan(),new Date(2026,9,31));
  assert.equal(report.rows[9].expense,2000000);
  assert.equal(report.rows[9].income,500000);
  assert.equal(report.balance,-1500000);
  assert.equal(socialToTransaction({...given,id:"g1"}).origin,"social");
  const future = {...projected[0],date:"2027-01-01"};
  assert.deepEqual(totals([future]),{income:0,expense:0});
});
test("Ràng buộc năm 2023..2091", () => {
  assert.equal(validDate("2022-12-31"),false);
  assert.equal(validDate("2023-01-01"),true);
  assert.equal(validDate("2091-12-31"),true);
  assert.equal(validDate("2092-01-01"),false);
});
test("Danh mục giữ ID ổn định, đổi tên/ẩn không làm mất lịch sử", () => {
  const c = defaultCategoryConfig();
  c.expense.find((x)=>x.id==="food").name="Bữa ăn";
  c.expense.find((x)=>x.id==="food").hidden=true;
  const saved=validateCategoryConfig(c);
  assert.equal(categoryById(saved,"food").name,"Bữa ăn");
  assert.equal(categoryById(saved,"food").hidden,true);
  assert.equal(resolveCategoryConfig(saved).expense.find((x)=>x.id==="food").name,"Bữa ăn");
  assert.throws(()=>validateCategoryConfig({...c,income:c.income.filter(x=>x.id!=="social_ledger_income")}));
});
test("zWhisFlow đầy đủ thương hiệu và bỏ liên kết trên trang Tổng quan", () => {
  for (const file of ["src/auth/LoginPage.jsx","src/components/finance/FinanceLayout.jsx","src/firebase/backup.js","index.html"]) assert.match(read(file),/zWhisFlow/);
  assert.doesNotMatch(read("src/pages/OverviewPage.jsx"),/Mở sổ mừng &/);
  assert.match(read("src/pages/SettingsPage.jsx"),/CategoryManager/);
  assert.match(read("src/components/social/SocialPeopleTable.jsx"),/border-r-4/);
  assert.match(read("src/components/social/SocialEntryModal.jsx"),/DatePicker/);
});
