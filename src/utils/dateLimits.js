export const MIN_YEAR = 2023;
export const MAX_YEAR = 2091;
export const MIN_DATE = `${MIN_YEAR}-01-01`;
export const MAX_DATE = `${MAX_YEAR}-12-31`;
export function clampYear(year) { return Math.min(MAX_YEAR, Math.max(MIN_YEAR, year)); }
export function boundedDate(date) { return typeof date === "string" && date >= MIN_DATE && date <= MAX_DATE; }
