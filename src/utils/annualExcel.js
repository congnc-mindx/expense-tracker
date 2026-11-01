import { isActual } from "./finance.js";
import { mindxSalaryTransactions, legacyMindxReceiptsExcluded } from "../integrations/mindx/projection.js";
import { automaticRecurringExpenses } from "./automaticLedger.js";
import { socialToTransaction } from "./socialAccounting.js";
import { resolveMonthlyBudget } from "./budgetInheritance.js";
import { defaultCategoryConfig, resolveCategoryConfig, categoryById } from "./categoryConfig.js";

const xml = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const encoder = new TextEncoder();
const money = (value) => Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0;
const moneyCell = (value) => ({ value: money(value), style: "money" });
const formula = (text, calculated) => ({ formula: text, value: calculated, style: "money" });
const info = (value) => value == null ? "" : String(value);
const monthKey = (year, month) => `${year}-${String(month).padStart(2, "0")}`;

function dataRows(snapshot, key) { return snapshot?.collections?.[key] || []; }
export function buildAnnualSheets(snapshot, year, salaryRows = [], salaryUid = "") {
  if (!Number.isInteger(year) || year < 2023 || year > 2091) throw new Error("Năm sao lưu phải nằm trong khoảng 2023–2091.");
  const transactions = dataRows(snapshot, "transactions");
  const social = dataRows(snapshot, "socialEntries");
  const budgets = dataRows(snapshot, "budgets");
  const plans = dataRows(snapshot, "plans");
  const preferences = dataRows(snapshot, "preferences");
  const yearPlans = dataRows(snapshot, "yearPlans");
  const config = resolveCategoryConfig(preferences.find((row) => row.id === "categories")) || defaultCategoryConfig();
  const recurringRules = preferences.find((row) => row.id === "recurringExpenses")?.items || [];
  const automaticExpenses = automaticRecurringExpenses(recurringRules, transactions);
  const mindxRows = mindxSalaryTransactions(salaryRows, salaryUid, transactions,
    config.income.find((cat) => cat.id === "mindx")?.id || "salary");
  const combined = [...legacyMindxReceiptsExcluded(transactions, salaryRows, salaryUid),
    ...social.map(socialToTransaction), ...automaticExpenses, ...mindxRows]
    .filter((row) => row.date?.startsWith(`${year}-`))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const amounts = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, income: 0, expense: 0 }));
  for (const tx of combined) {
    if (!isActual(tx)) continue;
    const index = Number(tx.date.slice(5, 7)) - 1;
    if (index >= 0 && index < 12 && ["income", "expense"].includes(tx.type)) amounts[index][tx.type] += money(tx.amount);
  }
  const totals = amounts.reduce((acc, month) => ({ income: acc.income + month.income, expense: acc.expense + month.expense }), { income: 0, expense: 0 });
  const summary = [
    ["zWhisFlow · BÁO CÁO NĂM " + year],
    ["Thu nhập mindX theo tháng công việc; khoản chi dự kiến tự tính từ tháng đến hạn."],
    ["Tháng", "Thực thu (VND)", "Thực chi (VND)", "Chênh lệch (VND)"],
    ...amounts.map((a, index) => ["Tháng " + a.month, moneyCell(a.income), moneyCell(a.expense), formula(`B${index + 4}-C${index + 4}`, a.income - a.expense)]),
    ["CẢ NĂM", formula("SUM(B4:B15)", totals.income), formula("SUM(C4:C15)", totals.expense), formula("B16-C16", totals.income - totals.expense)],
  ];
  const movements = [
    ["ID", "Ngày", "Chiều", "Danh mục", "Số tiền (VND)", "Tính thực tế", "Nguồn", "Ghi chú", "Kỳ mindX"],
    ...combined.map((tx) => [info(tx.id), tx.date, tx.type === "income" ? "Thu" : "Chi", categoryById(config, tx.category).name,
      moneyCell(tx.amount), isActual(tx) ? "Đã phát sinh" : "Dự kiến / tương lai", info(tx.source), info(tx.note), info(tx.mindxPeriod)]),
  ];
  const socialRows = [["ID", "Ngày", "Người", "Nhóm", "Dịp", "Chiều", "Số tiền (VND)", "Ghi chú"],
    ...social.filter((row) => row.date?.startsWith(`${year}-`)).map((row) => [row.id, row.date, row.personName, row.group, row.occasion,
      row.direction === "received" ? "Họ gửi" : "Mình gửi", moneyCell(row.amount), info(row.note)])];
  const budgetRows = [["Tháng", "Lấy hạn mức từ", "Ngân sách (VND)", "Danh mục", "Hạn mức (VND)"]];
  for (let month = 1; month <= 12; month++) {
    const key = monthKey(year, month);
    const resolved = resolveMonthlyBudget(budgets, key);
    const budget = resolved?.budget || { total: 0, categories: {} };
    const entries = Object.entries(budget.categories || {});
    if (!entries.length) budgetRows.push([key, resolved?.sourceMonth || "", moneyCell(budget.total), "", moneyCell(0)]);
    else for (const [categoryId, value] of entries) budgetRows.push([key, resolved?.sourceMonth || "", moneyCell(budget.total), categoryById(config, categoryId).name, moneyCell(value)]);
  }
  const planRows = [["ID", "Kế hoạch", "Nhóm", "Dự kiến hoàn thành", "Mục tiêu (VND)", "Đã chuẩn bị chung (VND)", "Trạng thái", "Ghi chú"]];
  const taskRows = [["Kế hoạch", "Việc cần làm", "Dự chi (VND)", "Đã chuẩn bị (VND)", "Hoàn thành"]];
  for (const plan of plans) {
    if (plan.targetDate && !String(plan.targetDate).startsWith(`${year}-`)) continue;
    planRows.push([plan.id, plan.title, plan.category, info(plan.targetDate), moneyCell(plan.targetAmount), moneyCell(plan.preparedAmount), plan.status, info(plan.note)]);
    for (const task of plan.tasks || []) taskRows.push([plan.title, task.title, moneyCell(task.estimatedAmount), moneyCell(task.preparedAmount), task.done ? "Có" : "Không"]);
  }
  const yearPlan = yearPlans.find((row) => String(row.id) === String(year));
  const yearGoalRows = [["Tháng", "Mục tiêu thu (VND)", "Mục tiêu tiết kiệm (VND)", "Đã tiết kiệm (VND)"],
    ...Array.from({ length: 12 }, (_, i) => [monthKey(year, i + 1), moneyCell(yearPlan?.months?.[i]?.target || 0), moneyCell(yearPlan?.months?.[i]?.savingsTarget || 0), moneyCell(yearPlan?.months?.[i]?.savings || 0)])];
  const salary = [["Kỳ mindX", "Dự kiến (VND)", "Công việc xác nhận (VND)", "Đang chờ (VND)", "Sửa lúc"],
    ...salaryRows.filter((row) => row.period?.startsWith(`${year}-`)).map((row) => [row.period, moneyCell(row.expectedIncome), moneyCell(row.confirmedWork), moneyCell(row.waitingWork), row.updatedAt ? new Date(row.updatedAt).toISOString() : ""])];
  const recurring = [["ID", "Loại", "Tên", "Danh mục", "Số tiền (VND)", "Ngày trong tháng", "Đang hoạt động"],
    ...(preferences.find((row) => row.id === "recurringExpenses")?.items || []).map((row) => [row.id, row.type === "income" ? "Thu" : "Chi", row.title,
      categoryById(config, row.category).name, moneyCell(row.amount), row.dayOfMonth ?? row.day ?? "", row.active === false ? "Không" : "Có"])];
  const categoryRows = [["Chiều", "ID", "Tên danh mục", "Nhóm", "Đã ẩn"],
    ...[...config.expense, ...config.income].map((row) => [row.type === "income" ? "Thu" : "Chi", row.id, row.name, row.groupId, row.hidden ? "Có" : "Không"])];
  const readme = [["zWhisFlow · SAO LƯU NĂM " + year], ["Thời gian xuất", new Date().toISOString()],
    ["Lưu ý", "Các sheet chỉ lấy dữ liệu thuộc năm chọn; kế hoạch chưa có ngày được đưa vào sheet Kế hoạch."],
    ["Thu chi", "Sổ mừng được ghi riêng ở sheet Sổ mừng, nhưng đã tính vào Tổng hợp và Giao dịch (không có bản ghi Firestore trùng)."],
    ["Ngân sách", "Ghi trạng thái kế thừa hiệu lực từng tháng."],
    ["Bản sao lưu đầy đủ", "Nên lưu thêm tệp JSON xuất từ Cài đặt để giữ dữ liệu gốc và phục hồi Firestore khi cần."],
    ["Lương mindX", "Thu nhập theo tháng công việc phát sinh, tự cập nhật từ Salary Tracker."],
    ["Chi định kỳ", "Tự tính từ tháng bắt đầu đến hiện tại, không tạo thêm giao dịch Firestore."],
    ["Không gồm", "Thông tin xác thực, mật khẩu và token đăng nhập."]];
  return [
    { name: "Hướng dẫn", rows: readme, moneyColumns: [] },
    { name: "Tổng hợp 12 tháng", rows: summary, moneyColumns: [2, 3, 4], headerRow: 3 },
    { name: "Giao dịch", rows: movements, moneyColumns: [5] },
    { name: "Sổ mừng", rows: socialRows, moneyColumns: [7] },
    { name: "Ngân sách", rows: budgetRows, moneyColumns: [3, 5] },
    { name: "Kế hoạch", rows: planRows, moneyColumns: [5, 6] },
    { name: "Đầu việc", rows: taskRows, moneyColumns: [3, 4] },
    { name: "Mục tiêu năm", rows: yearGoalRows, moneyColumns: [2, 3, 4] },
    { name: "Lương mindX", rows: salary, moneyColumns: [2, 3, 4] },
    { name: "Định kỳ", rows: recurring, moneyColumns: [5] },
    { name: "Danh mục", rows: categoryRows, moneyColumns: [] },
  ];
}

// A standards-compliant, browser-only OOXML ZIP writer with STORE entries.
// Avoids a new third-party dependency or GitHub Actions package-lock changes.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function u16(n) { return [n & 255, (n >>> 8) & 255]; }
function u32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }
function zip(files) {
  const local = [], central = []; let offset = 0;
  for (const [filename, data] of files) {
    const name = encoder.encode(filename), body = encoder.encode(data), crc = crc32(body);
    const header = Uint8Array.from([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(body.length), ...u32(body.length), ...u16(name.length), ...u16(0)]);
    local.push(header, name, body);
    const dir = Uint8Array.from([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(body.length), ...u32(body.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]);
    central.push(dir, name); offset += header.length + name.length + body.length;
  }
  const directorySize = central.reduce((sum, part) => sum + part.length, 0);
  const end = Uint8Array.from([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(directorySize), ...u32(offset), ...u16(0)]);
  const all = [...local, ...central, end], total = all.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total); let at = 0;
  for (const part of all) { output.set(part, at); at += part.length; }
  return output;
}
const address = (column) => {
  let result = "", n = column;
  while (n > 0) { n--; result = String.fromCharCode(65 + n % 26) + result; n = Math.floor(n / 26); }
  return result;
};
function cellXml(value, column, row, isHeader) {
  const ref = `${address(column)}${row}`;
  if (value && typeof value === "object" && "formula" in value) return `<c r="${ref}" s="2"><f>${xml(value.formula)}</f><v>${Number(value.value) || 0}</v></c>`;
  const cell = value && typeof value === "object" && "value" in value ? value : { value };
  const item = cell.value;
  const style = isHeader ? 1 : cell.style === "money" ? 2 : 0;
  if (typeof item === "number" && Number.isFinite(item)) return `<c r="${ref}" s="${style}"><v>${item}</v></c>`;
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xml(item)}</t></is></c>`;
}
function sheetXml(sheet) {
  const headerRow = sheet.headerRow || 1;
  const rows = sheet.rows.map((values, i) => `<row r="${i + 1}"${i + 1 === headerRow ? ' ht="27" customHeight="1"' : ""}>${values.map((item, j) => cellXml(item, j + 1, i + 1, i + 1 === headerRow)).join("")}</row>`).join("");
  const count = Math.max(1, ...sheet.rows.map((row) => row.length));
  const widths = Array.from({length: count}, (_, i) => `<col min="${i+1}" max="${i+1}" width="${i === 0 ? 24 : (sheet.moneyColumns.includes(i+1) ? 21 : 24)}" customWidth="1"/>`).join("");
  const range = `A${headerRow}:${address(count)}${Math.max(headerRow, sheet.rows.length)}`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow+1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths}</cols><sheetData>${rows}</sheetData>${sheet.rows.length > headerRow ? `<autoFilter ref="${range}"/>` : ""}</worksheet>`;
}
function makeXlsx(sheets) {
  const files = [];
  files.push(["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`]);
  files.push(["_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`]);
  files.push(["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("")}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`]);
  files.push(["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`]);
  files.push(["xl/styles.xml", `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0 &quot;đ&quot;"/></numFmts><fonts count="2"><font><sz val="11"/><color rgb="FF213B2D"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1B8557"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf xfId="0" numFmtId="0" fontId="1" fillId="2" borderId="0" applyFill="1" applyFont="1"/><xf xfId="0" numFmtId="164" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`]);
  sheets.forEach((sheet, i) => files.push([`xl/worksheets/sheet${i+1}.xml`, sheetXml(sheet)]));
  return zip(files);
}
export function buildAnnualWorkbook(snapshot, year, salaryRows = [], salaryUid = "") {
  return makeXlsx(buildAnnualSheets(snapshot, year, salaryRows, salaryUid));
}
export function downloadAnnualWorkbook(snapshot, year, salaryRows = [], salaryUid = "") {
  const bytes = buildAnnualWorkbook(snapshot, year, salaryRows, salaryUid);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `zWhisFlow-${year}.xlsx`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
