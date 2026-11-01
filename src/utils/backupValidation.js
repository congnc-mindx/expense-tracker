export const RESTORE_COLLECTIONS = Object.freeze(["transactions", "budgets", "yearPlans", "socialEntries", "plans", "preferences"]);
const MAX_DOCS = 20000;
const validId = (id) => typeof id === "string" && id.length > 0 && id.length <= 512 && id !== "." && id !== ".." && !id.includes("/");
const isPlainObject = (obj) => obj !== null && typeof obj === "object" && !Array.isArray(obj);
function validateValue(value, depth = 0) {
  if (depth > 25) throw new Error("Tệp có dữ liệu lồng quá sâu.");
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    if (value.length > 50000) throw new Error("Tệp có danh sách quá lớn.");
    value.forEach((v) => validateValue(v, depth + 1)); return;
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length > 1000 || keys.some((key) => key.startsWith("__") || key.includes(".")))
      throw new Error("Tệp có trường dữ liệu không hợp lệ.");
    keys.forEach((key) => validateValue(value[key], depth + 1)); return;
  }
  throw new Error("Tệp chứa kiểu dữ liệu không được hỗ trợ.");
}
export function validateBackup(raw) {
  if (!isPlainObject(raw) || raw.app !== "zWhisFlow" || raw.version !== 2 || !isPlainObject(raw.collections))
    throw new Error("Đây không phải bản sao lưu JSON zWhisFlow phiên bản 2.");
  const collections = {}; let count = 0;
  for (const name of RESTORE_COLLECTIONS) {
    const rows = raw.collections[name];
    if (!Array.isArray(rows)) throw new Error(`Thiếu dữ liệu ${name} trong file sao lưu.`);
    const ids = new Set();
    collections[name] = rows.map((row) => {
      if (!isPlainObject(row) || !validId(row.id) || ids.has(row.id)) throw new Error(`ID bản ghi không hợp lệ hoặc bị trùng trong ${name}.`);
      ids.add(row.id);
      const { id, ...data } = row;
      validateValue(data);
      return { id, data };
    });
    count += rows.length;
    if (count > MAX_DOCS) throw new Error(`Bản sao lưu vượt ${MAX_DOCS} bản ghi; cần chia nhỏ để khôi phục an toàn.`);
  }
  return { collections, count, exportedAt: raw.exportedAt || "" };
}

