import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./client.js";

import { RESTORE_COLLECTIONS } from "../utils/backupValidation.js";
export { validateBackup } from "../utils/backupValidation.js";

/** Preview current Firestore and count documents that would be created/overwritten.
 * No writes occur until the user confirms the preview in Settings.
 */
export async function prepareRestore(uid, validated) {
  if (!uid || !db) throw new Error("Chưa có quyền truy cập Firebase.");
  const missing = {}; const existing = {}; let additions = 0; let conflicts = 0;
  for (const name of RESTORE_COLLECTIONS) {
    const snapshot = await getDocs(collection(db, "users", uid, name));
    existing[name] = new Set(snapshot.docs.map((d) => d.id));
    missing[name] = validated.collections[name].filter((r) => !existing[name].has(r.id));
    additions += missing[name].length;
    conflicts += validated.collections[name].length - missing[name].length;
  }
  return { validated, existing, missing, additions, conflicts };
}

/** Default: add only absent documents. Optional overwrite requires explicit confirmation.
 * Never deletes documents absent from the backup. Batched commits may be partial if
 * the network fails; retrying in the safe mode will add only missing documents.
 */
export async function applyRestore(uid, prepared, overwrite = false) {
  if (!uid || !db) throw new Error("Chưa có quyền truy cập Firebase.");
  let written = 0; let batch = writeBatch(db); let buffered = 0;
  const flush = async () => {
    if (!buffered) return;
    await batch.commit(); written += buffered;
    batch = writeBatch(db); buffered = 0;
  };
  try {
    for (const name of RESTORE_COLLECTIONS) {
      const rows = overwrite ? prepared.validated.collections[name] : prepared.missing[name];
      for (const row of rows) {
        batch.set(doc(db, "users", uid, name, row.id), row.data);
        if (++buffered >= 200) await flush();
      }
    }
    await flush();
    return { written, skipped: overwrite ? 0 : prepared.conflicts };
  } catch (error) {
    throw new Error(`Khôi phục gián đoạn sau ${written} bản ghi. Kiểm tra dữ liệu rồi thử lại. ${error.message || ""}`);
  }
}
