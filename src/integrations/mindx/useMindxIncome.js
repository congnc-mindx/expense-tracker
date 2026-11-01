import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, browserLocalPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { mindxAuth, mindxConfigured, mindxDb } from "./client";
import { validSalaryPeriod } from "./periods";

export function useMindxIncome() {
  const [account, setAccount] = useState(undefined);
  const [state, setState] = useState({ rows: [], loading: false, error: "" });
  useEffect(() => {
    if (!mindxAuth) { setAccount(null); return; }
    return onAuthStateChanged(mindxAuth, setAccount, () => setAccount(null));
  }, []);
  useEffect(() => {
    if (!account?.uid || !mindxDb) { setState({ rows: [], loading: false, error: "" }); return; }
    setState({ rows: [], loading: true, error: "" });
    return onSnapshot(collection(mindxDb, "users", account.uid, "incomeExports"),
      (snapshot) => setState({
        rows: snapshot.docs.map((d) => ({ ...d.data(), period: d.id })).filter(validSalaryPeriod).sort((a, b) => b.period.localeCompare(a.period)),
        loading: false, error: "",
      }),
      (reason) => setState({ rows: [], loading: false, error: reason?.code === "permission-denied" ? "Salary Tracker chưa cho phép tài khoản này đọc bảng tổng hợp lương." : "Không đọc được dữ liệu lương mindX." }),
    );
  }, [account?.uid]);
  const connect = useCallback(async (email, password) => {
    if (!mindxAuth) throw new Error("Chưa cấu hình Firebase Salary Tracker.");
    await setPersistence(mindxAuth, browserLocalPersistence);
    await signInWithEmailAndPassword(mindxAuth, email.trim(), password);
  }, []);
  const disconnect = useCallback(() => mindxAuth ? signOut(mindxAuth) : Promise.resolve(), []);
  return { ...state, account: account || null, checkingAuth: account === undefined,
    configured: mindxConfigured, connect, disconnect };
}
