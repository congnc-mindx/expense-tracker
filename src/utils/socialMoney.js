import { formatVndAsThousands, parseThousandsToVnd } from "./moneyInput.js";

/** Social ledger form uses thousands of VND, Firestore stores VND. */
export function parseSocialThousands(value) {
  return parseThousandsToVnd(value);
}
export function toSocialThousands(amount) {
  return Number.isSafeInteger(amount) && amount > 0 ? formatVndAsThousands(amount) : "";
}
export function formatThousands(amount) {
  return toSocialThousands(amount) || "0";
}
