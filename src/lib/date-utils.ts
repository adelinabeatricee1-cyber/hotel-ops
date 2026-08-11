const MONTH_LABELS = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

export interface MonthRange {
  year: number;
  month: number; // 0-indexed
  label: string;
  param: string; // "YYYY-MM"
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD", inclusive last day of month
  days: string[]; // every day in the month as "YYYY-MM-DD"
  prevParam: string;
  nextParam: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function resolveMonth(monthParam: string | undefined): MonthRange {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => toDateString(year, month, i + 1));

  const prevDate = new Date(Date.UTC(year, month - 1, 1));
  const nextDate = new Date(Date.UTC(year, month + 1, 1));

  return {
    year,
    month,
    label: `${MONTH_LABELS[month]} ${year}`,
    param: `${year}-${pad(month + 1)}`,
    startDate: days[0],
    endDate: days[days.length - 1],
    days,
    prevParam: `${prevDate.getUTCFullYear()}-${pad(prevDate.getUTCMonth() + 1)}`,
    nextParam: `${nextDate.getUTCFullYear()}-${pad(nextDate.getUTCMonth() + 1)}`,
  };
}

export function dayOfMonthLabel(dateStr: string) {
  return Number(dateStr.slice(-2));
}

export function isWeekend(dateStr: string) {
  const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}
