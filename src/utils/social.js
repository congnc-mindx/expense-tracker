import { normalize, validDate } from "./finance.js";

export const OCCASIONS = [
  { id: "wedding", label: "Mừng cưới", icon: "💍" },
  { id: "funeral", label: "Phúng viếng", icon: "🕯" },
  { id: "newborn", label: "Thăm con", icon: "🧸" },
  { id: "hospital", label: "Thăm bệnh", icon: "❤" },
  { id: "other", label: "Khác", icon: "✉" },
];
export const DIRECTIONS = [{ id: "given", label: "Mình gửi" }, { id: "received", label: "Họ gửi" }];
export function socialName(id) { return OCCASIONS.find((item) => item.id === id)?.label || "Khác"; }
export function validateSocialEntry(data) {
  const personName = String(data.personName || "").trim().replace(/\s+/g, " ");
  const group = String(data.group || "").trim().replace(/\s+/g, " ") || "Chưa phân nhóm";
  const amount = Number(data.amount);
  if (!personName || personName.length > 100 || group.length > 80) throw new Error("Nhập tên người và nhóm hợp lệ.");
  if (!DIRECTIONS.some((item) => item.id === data.direction) || !OCCASIONS.some((item) => item.id === data.occasion))
    throw new Error("Loại khoản hoặc chiều gửi/nhận không hợp lệ.");
  if (!Number.isSafeInteger(amount) || amount <= 0 || !validDate(data.date)) throw new Error("Số tiền phải là số nguyên dương (đồng), ngày phải hợp lệ.");
  return { personName, group, amount, date: data.date, direction: data.direction, occasion: data.occasion,
    note: String(data.note || "").trim().slice(0, 500) };
}
export function aggregatePeople(entries) {
  const map = new Map();
  for (const entry of [...entries].sort((a,b)=> a.date.localeCompare(b.date))) {
    const key = `${normalize(entry.personName.trim())}::${normalize(entry.group || "Chưa phân nhóm")}`;
    if (!key) continue;
    if (!map.has(key)) map.set(key, { key, name: entry.personName, group: entry.group || "Chưa phân nhóm", entries: [], given: 0, received: 0, cells: {} });
    const person = map.get(key);
    person.name = entry.personName; person.group = entry.group || person.group;
    person.entries.push(entry);
    person[entry.direction] += entry.amount;
    const cell = `${entry.direction}_${entry.occasion}`;
    person.cells[cell] = (person.cells[cell] || 0) + entry.amount;
  }
  return [...map.values()].sort((a,b) => normalize(a.group).localeCompare(normalize(b.group), "vi") || normalize(a.name).localeCompare(normalize(b.name), "vi"));
}
