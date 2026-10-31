import { useEffect, useState } from "react";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "../firebase/client";
import { createYearPlan, isYearPlan } from "../utils/yearSummary";

export default function useYearPlan(userId, year) {
  const [state, setState] = useState({ plan: createYearPlan(), loading: true, error: "" });
  useEffect(() => {
    const ref = doc(db, "users", userId, "yearPlans", String(year));
    return onSnapshot(ref, (snapshot) => {
      const plan = snapshot.exists() ? snapshot.data()?.months : createYearPlan();
      setState({ plan: isYearPlan(plan) ? plan : createYearPlan(), loading: false,
        error: isYearPlan(plan) ? "" : "Kế hoạch trên Firebase không hợp lệ; không thể chỉnh sửa." });
    }, () => setState((previous) => ({ ...previous, loading: false, error: "Không đọc được kế hoạch năm từ Firebase." })));
  }, [userId, year]);
  async function saveMonth(month, values) {
    if (state.loading || state.error) throw new Error(state.error || "Kế hoạch chưa tải xong.");
    if (month < 1 || month > 12) throw new Error("Tháng không hợp lệ.");
    const ref = doc(db, "users", userId, "yearPlans", String(year));
    await runTransaction(db, async (transaction) => {
      const old = await transaction.get(ref);
      const months = old.exists() ? old.data()?.months : createYearPlan();
      if (!isYearPlan(months)) throw new Error("Kế hoạch trên Firebase có lỗi, đã giữ nguyên dữ liệu.");
      const next = months.map((item, index) => index === month-1 ? values : item);
      if (!isYearPlan(next)) throw new Error("Giá trị kế hoạch không hợp lệ.");
      transaction.set(ref, { months: next, updatedAt: Date.now() });
    });
    return true;
  }
  return { plan: state.plan, error: state.error, loading: state.loading, saveMonth };
}
