import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { defaultCategoryConfig } from "../src/utils/categoryConfig.js";
import { validateRecurringExpense, recurringForMonth, recurringTransactionId, recurringDate } from "../src/utils/recurringExpenses.js";
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const config=defaultCategoryConfig();
const base = {id:"rent",title:"Tiền nhà",category:"food",amount:3_500_000,day:31,startMonth:"2026-01",endMonth:"",active:true};

test("Khoản chi định kỳ được kiểm tra trước khi lưu lên Firebase",()=>{
  const rule=validateRecurringExpense(base,config);
  assert.equal(rule.amount,3_500_000);
  assert.equal(rule.day,31);
  assert.throws(()=>validateRecurringExpense({...base,amount:-1},config));
  assert.throws(()=>validateRecurringExpense({...base,category:"missing"},config));
  assert.throws(()=>validateRecurringExpense({...base,endMonth:"2025-12"},config));
});
test("Lặp 31 tháng 2 tự giới hạn vào cuối tháng, năm nhuận chính xác",()=>{
  assert.equal(recurringDate("2026-02",31),"2026-02-28");
  assert.equal(recurringDate("2028-02",31),"2028-02-29");
  assert.equal(recurringDate("2026-04",31),"2026-04-30");
});
test("Mỗi tháng chỉ có một dự kiến; đã thanh toán không hiện lại",()=>{
  const first=recurringForMonth([base],"2026-04",[]);
  assert.equal(first.length,1);
  assert.equal(first[0].date,"2026-04-30");
  assert.equal(first[0].status,"planned");
  assert.equal(first[0].amount,base.amount);
  const id=recurringTransactionId("rent","2026-04");
  assert.equal(first[0].id,id);
  assert.deepEqual(recurringForMonth([base],"2026-04",[{id,amount:3_500_000}]),[]);
  assert.equal(recurringForMonth([base],"2026-05",[]).length,1);
});
test("Dừng hoặc kết thúc lặp không làm xuất hiện khoản mới",()=>{
  assert.deepEqual(recurringForMonth([{...base,active:false}],"2026-06",[]),[]);
  assert.deepEqual(recurringForMonth([{...base,endMonth:"2026-05"}],"2026-06",[]),[]);
  assert.deepEqual(recurringForMonth([base],"2025-12",[]),[]);
});
test("Ghi đã chi được bảo vệ bằng Firestore transaction và không tạo khoản chi ảo thành thực chi",()=>{
  const hook=read("src/hooks/useTransactions.js");
  assert.match(hook,/runTransaction\(db/);
  assert.match(hook,/existing\.exists\(\)/);
  assert.match(hook,/recurringMonth/);
  assert.match(read("src/App.jsx"),/recurringForMonth\(recurringRules,\s*month,\s*transactions\)/);
});
test("UX mới: chi đầu tiên, lịch không spinner, dự kiến, và xem thêm dùng chung",()=>{
  assert.match(read("src/App.jsx"),/useState\("expense"\)/);
  assert.doesNotMatch(read("src/components/common/MonthPicker.jsx"),/type="number"/);
  assert.doesNotMatch(read("src/components/common/YearPicker.jsx"),/type="number"/);
  assert.match(read("src/components/finance/TransactionList.jsx"),/Dự kiến/);
  for(const f of ["src/pages/TransactionsPage.jsx","src/pages/PlansPage.jsx","src/pages/SocialLedgerPage.jsx","src/components/settings/CategoryManager.jsx","src/components/social/SocialHistoryDialog.jsx","src/pages/SummaryPage.jsx"]){
    assert.match(read(f),/LoadMoreButton/);
  }
});
