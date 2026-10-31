import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./client";

export function useCloudCollection(uid, name) {
  const [state, setState] = useState({ rows: [], loading: true, error: "" });
  useEffect(() => {
    if (!uid || !db) return;
    return onSnapshot(collection(db, "users", uid, name),
      (snapshot) => setState({ rows: snapshot.docs.map((d) => ({ ...d.data(), id: d.id })), loading: false, error: "" }),
      (e) => setState({ rows: [], loading: false, error: e.code === "permission-denied" ? "Firestore đang từ chối truy cập. Kiểm tra và publish Security Rules." : "Không đồng bộ được dữ liệu Firebase. Kiểm tra kết nối Internet." }),
    );
  }, [uid, name]);
  async function save(id, data) { return setDoc(doc(db, "users", uid, name, id), data); }
  async function remove(id) { return deleteDoc(doc(db, "users", uid, name, id)); }
  return { ...state, save, remove };
}
