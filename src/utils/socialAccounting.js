import { socialName } from "./social.js";

/** One Firestore document stays in socialEntries; finance uses a read-only projection.
 * Never write a second transaction or reporting would count the same money twice.
 */
export function socialToTransaction(entry) {
  return {
    id: `social:${entry.id}`,
    socialId: entry.id,
    origin: "social",
    type: entry.direction === "received" ? "income" : "expense",
    category: entry.direction === "received" ? "social_ledger_income" : "social_ledger_expense",
    amount: entry.amount,
    date: entry.date,
    status: "actual",
    note: `${socialName(entry.occasion)} · ${entry.personName}`,
    source: "Sổ mừng & thăm hỏi",
    createdAt: entry.createdAt || 0,
  };
}
