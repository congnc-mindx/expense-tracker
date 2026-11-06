import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase/client";
import { useCloudCollection } from "../firebase/useCloudCollection";
import { validateDebt, withDebtPayment, withoutDebtPayment } from "../utils/debts";

/** Owner-scoped realtime list; transactional edits prevent lost payment history across tabs. */
export default function useDebts(uid) {
  const store = useCloudCollection(uid, "debts");
  const refFor = (id) => doc(db, "users", uid, "debts", id);

  async function saveDebt(data, id = null) {
    if (store.loading || store.error) throw new Error(store.error || "Chưa tải xong Sổ nợ.");
    const debtId = id || crypto.randomUUID();
    await runTransaction(db, async (tx) => {
      const ref = refFor(debtId);
      const snapshot = await tx.get(ref);
      if (Boolean(id) !== snapshot.exists()) throw new Error(id ? "Khoản nợ đã bị xóa." : "Mã khoản nợ đã tồn tại.");
      const current = snapshot.exists() ? snapshot.data() : null;
      if (current && data.direction !== current.direction && current.payments?.length)
        throw new Error("Không thể đổi chiều nợ sau khi đã ghi nhận thanh toán.");
      const next = validateDebt({ ...data, payments: current?.payments || [] });
      tx.set(ref, { ...next, createdAt: current?.createdAt || Date.now(), updatedAt: Date.now() });
    });
    return debtId;
  }

  async function addPayment(id, payment) {
    if (store.loading || store.error) throw new Error(store.error || "Chưa tải xong Sổ nợ.");
    const paymentId = crypto.randomUUID();
    await runTransaction(db, async (tx) => {
      const ref = refFor(id);
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error("Khoản nợ đã bị xóa.");
      const next = withDebtPayment(snapshot.data(), { ...payment, id: paymentId, createdAt: Date.now() });
      tx.set(ref, { ...next, createdAt: snapshot.data().createdAt || Date.now(), updatedAt: Date.now() });
    });
    return paymentId;
  }

  async function removePayment(id, paymentId) {
    if (store.loading || store.error) throw new Error(store.error || "Chưa tải xong Sổ nợ.");
    await runTransaction(db, async (tx) => {
      const ref = refFor(id);
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error("Khoản nợ đã bị xóa.");
      const next = withoutDebtPayment(snapshot.data(), paymentId);
      tx.set(ref, { ...next, createdAt: snapshot.data().createdAt || Date.now(), updatedAt: Date.now() });
    });
  }

  async function removeDebt(id) {
    if (store.loading || store.error) throw new Error(store.error || "Chưa tải xong Sổ nợ.");
    await runTransaction(db, async (tx) => {
      const ref = refFor(id);
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error("Khoản nợ đã được xóa.");
      tx.delete(ref);
    });
  }

  return { ...store, saveDebt, addPayment, removePayment, removeDebt };
}
