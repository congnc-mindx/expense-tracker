import { test } from "node:test";
import assert from "node:assert/strict";
import { validDate, totals } from "../src/utils/finance.js";
import { validateSocialEntry, aggregatePeople } from "../src/utils/social.js";
import { createYearPlan, buildYearSummary } from "../src/utils/yearSummary.js";

const money = (name, amount, direction, occasion) => ({ personName: name, group: "Cấp 2", amount, date: "2026-10-30", direction, occasion });
test("chỉ nhận ngày có thật", () => {
  assert.equal(validDate("2024-02-29"),true);
  assert.equal(validDate("2026-02-29"),false);
});
test("không lưu ghi nhận không hợp lệ", () => {
  assert.throws(()=>validateSocialEntry(money("A",0,"given","wedding")));
  assert.throws(()=>validateSocialEntry(money("A",200,"unknown","wedding")));
  assert.throws(()=>validateSocialEntry(money("A",200,"given","unknown")));
});
test("cộng các lần gửi / nhận theo một người, không phân biệt dấu", () => {
  const entries=[validateSocialEntry(money("Thành Văn",300000,"given","wedding")),validateSocialEntry(money("Thanh Van",200000,"received","newborn"))];
  const people=aggregatePeople(entries);
  assert.equal(people.length,1);
  assert.equal(people[0].given,300000);
  assert.equal(people[0].received,200000);
  assert.equal(people[0].cells.given_wedding,300000);
});
test("khoản chi dự kiến tự tính vào tháng đến hạn", () => {
  const tx=[{type:"income",amount:8000000,date:"2026-10-15",status:"actual"},{type:"expense",amount:500000,date:"2026-10-16",status:"actual"},{type:"expense",amount:1000000,date:"2026-10-17",status:"planned"}];
  assert.deepEqual(totals(tx),{income:8000000,expense:1500000});
  const summary=buildYearSummary(tx,2026,createYearPlan(),new Date(2026,9,30));
  assert.equal(summary.income,8000000);assert.equal(summary.expense,1500000);
});

test("không gộp nhầm hai người cùng tên ở hai nhóm", () => {
  const a=validateSocialEntry(money("Hùng",300000,"given","wedding"));
  const b=validateSocialEntry({...money("Hùng",200000,"received","newborn"),group:"Cấp 3"});
  assert.equal(aggregatePeople([a,b]).length,2);
});
