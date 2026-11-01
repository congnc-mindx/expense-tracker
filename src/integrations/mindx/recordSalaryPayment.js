import { doc, runTransaction } from "firebase/firestore";
import { db } from "../../firebase/client";
import { validDate, localDate } from "../../utils/finance";
import { mindxPaymentId, validSalaryPeriod } from "./periods";

export async function recordSalaryPayment({ uid, salaryUid, period, row, amount, date, categoryId = "mindx", existing = [] }) {
  if (!validSalaryPeriod(row) || row.period !== period) throw new Error("Dữ liệu kỳ lương không hợp lệ.");
  if (!Number.isSafeInteger(amount) || amount <= 0 || !validDate(date) || date > localDate())
    throw new Error("Số tiền hoặc ngày thực nhận không hợp lệ.");
  if (!uid || !salaryUid || !db) throw new Error("Tài khoản chưa sẵn sàng.");
  const id = mindxPaymentId(salaryUid, period);
  if (existing.some((item) => item.id === id)) throw new Error("Kỳ lương này đã được ghi nhận. Hãy sửa khoản thu hiện có nếu cần điều chỉnh.");
  await runTransaction(db, async (transaction) => {
    const reference = doc(db, "users", uid, "transactions", id);
    const prior = await transaction.get(reference);
    if (prior.exists()) throw new Error("Kỳ lương đã được ghi nhận ở một phiên khác.");
    transaction.set(reference, {
      type: "income", amount, date, category: categoryId, status: "actual",
      note: `Lương mindX kỳ ${period.slice(5)}/${period.slice(0, 4)}`,
      source: "mindX Salary Tracker", mindxPeriod: period, mindxSourceUid: salaryUid,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
  });
  return id;
}
