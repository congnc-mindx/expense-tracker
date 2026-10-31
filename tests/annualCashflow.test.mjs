import test from "node:test";
import assert from "node:assert/strict";
import { annualCashflow } from "../src/utils/annualCashflow.js";
import { socialToTransaction } from "../src/utils/socialAccounting.js";

const today = "2026-10-31";
test("Biểu đồ 12 tháng phân tách tiền thu, chi từ giao dịch thường và Sổ mừng", () => {
  const social = socialToTransaction({id:"w1",personName:"Lê Trung",direction:"given",occasion:"wedding",amount:2000000,date:"2026-10-24"});
  const source = [
    {type:"income", amount:10000000, date:"2026-01-16",status:"actual"},
    {type:"expense", amount:1000000, date:"2026-01-20",status:"actual"},
    social,
    {type:"income", amount:500000, date:"2026-10-30",status:"actual"},
    {type:"expense", amount:1500000, date:"2026-10-29",status:"planned"},
    {type:"expense", amount:750000, date:"2026-11-01",status:"actual"},
    {type:"income", amount:3000000, date:"2025-10-11",status:"actual"},
  ];
  const result = annualCashflow(source, 2026, today);
  assert.equal(result.months.length,12);
  assert.deepEqual([result.months[0].income,result.months[0].expense],[10000000,1000000]);
  assert.deepEqual([result.months[9].income,result.months[9].expense],[500000,2000000]);
  assert.deepEqual([result.months[10].income,result.months[10].expense],[0,0]);
  assert.equal(result.income, 10500000);
  assert.equal(result.expense, 3000000);
  assert.equal(result.balance, 7500000);
  assert.equal(result.scale, 10000000);
});
test("Không có dữ liệu thì 12 cột có giá trị 0 và thang đo an toàn", () => {
  const result = annualCashflow([], 2091, today);
  assert.equal(result.months.length,12);
  assert.equal(result.income,0);
  assert.equal(result.expense,0);
  assert.equal(result.scale,1);
  assert.equal(result.months[11].key,"2091-12");
});
