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

export function todayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const WEEKDAY_LABELS = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];

export interface WeekRange {
  label: string;
  param: string; // "YYYY-MM-DD" (Monday of the week)
  days: string[]; // 7 days, Monday through Sunday
  dayLabels: string[];
  prevParam: string;
  nextParam: string;
}

function startOfWeek(date: Date): Date {
  const day = date.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(monday.getUTCDate() + diff);
  return monday;
}

export function resolveWeek(weekParam: string | undefined): WeekRange {
  let base: Date;
  if (weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    base = new Date(`${weekParam}T00:00:00Z`);
  } else {
    base = new Date();
  }

  const monday = startOfWeek(base);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  });

  const prev = new Date(monday);
  prev.setUTCDate(prev.getUTCDate() - 7);
  const next = new Date(monday);
  next.setUTCDate(next.getUTCDate() + 7);

  const lastDay = new Date(`${days[6]}T00:00:00Z`);
  const label = `${dayOfMonthLabel(days[0])} ${MONTH_LABELS[new Date(`${days[0]}T00:00:00Z`).getUTCMonth()].slice(0, 3)} – ${dayOfMonthLabel(days[6])} ${MONTH_LABELS[lastDay.getUTCMonth()].slice(0, 3)}`;

  return {
    label,
    param: days[0],
    days,
    dayLabels: WEEKDAY_LABELS,
    prevParam: `${prev.getUTCFullYear()}-${pad(prev.getUTCMonth() + 1)}-${pad(prev.getUTCDate())}`,
    nextParam: `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`,
  };
}
