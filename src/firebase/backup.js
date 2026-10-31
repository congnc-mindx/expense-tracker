import { collection, getDocs } from "firebase/firestore";
import { db } from "./client";

const COLLECTIONS = ["transactions", "budgets", "yearPlans", "socialEntries", "preferences"];

/** Export a user-owned offline snapshot. No legacy localStorage migration. */
export async function exportBackup(uid) {
  const collections = {};
  for (const name of COLLECTIONS) {
    const snapshot = await getDocs(collection(db, "users", uid, name));
    collections[name] = snapshot.docs.map((document) => ({ ...document.data(), id: document.id }));
  }
  return { app: "zWhisFlow", version: 2, exportedAt: new Date().toISOString(), collections };
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const element = document.createElement("a");
  element.href = url;
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  element.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
