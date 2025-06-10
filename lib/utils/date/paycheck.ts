import {
  addDays,
  subDays,
  parseISO,
  isWithinInterval,
  isSameDay,
  set,
} from "date-fns";
import type { PaycheckDate } from "../generatePaycheckDates";

interface FrequencySource {
  due_days?: string[];
  weekly_day?: string;
  frequency?: string;
  start_date?: string;
  name?: string;
}

// Return the end of a paycheck period
export function getPaycheckRange(current: PaycheckDate, next?: PaycheckDate) {
  const start = parseISO(current.adjustedDate);
  const rawEnd = next
    ? subDays(parseISO(next.adjustedDate), 1)
    : addDays(start, 13);

  const end = set(rawEnd, {
    hours: 23,
    minutes: 59,
    seconds: 59,
    milliseconds: 999,
  });

  return { start, end };
}

function getMonthlyHitDates(
  source: FrequencySource,
  periodStart: Date,
  periodEnd: Date
): Date[] {
  const dates: Date[] = [];
  for (const dayStr of source.due_days ?? []) {
    let d: Date | null = null;
    if (dayStr === "EOM") {
      d = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 0);
    } else if (dayStr.includes("/")) {
      const [monthStr, dayPart] = dayStr.split("/");
      const month = parseInt(monthStr) - 1;
      const day = parseInt(dayPart);
      d = new Date(periodStart.getFullYear(), month, day);
    } else {
      const day = parseInt(dayStr);
      const candidate = new Date(
        periodStart.getFullYear(),
        periodStart.getMonth(),
        day
      );
      if (candidate < periodStart) {
        d = new Date(
          periodStart.getFullYear(),
          periodStart.getMonth() + 1,
          day
        );
      } else {
        d = candidate;
      }
    }
    if (
      d &&
      isWithinInterval(d, {
        start: periodStart,
        end: new Date(
          periodEnd.getFullYear(),
          periodEnd.getMonth(),
          periodEnd.getDate(),
          23,
          59,
          59,
          999
        ),
      })
    ) {
      dates.push(d);
    }
  }
  return dates;
}

function getWeeklyHitDates(
  source: FrequencySource,
  periodStart: Date,
  periodEnd: Date
): Date[] {
  const dates: Date[] = [];
  const weekdayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const targetDay = weekdayMap[source.weekly_day as keyof typeof weekdayMap];
  const isBiweekly = source.frequency?.toLowerCase() === "biweekly";
  const refStart = source.start_date
    ? new Date(source.start_date)
    : periodStart;
  refStart.setHours(12, 0, 0, 0);
  const refDay = refStart.getDay();
  const offset =
    refDay <= targetDay ? targetDay - refDay : 7 - (refDay - targetDay);
  const firstHit = addDays(refStart, offset);

  const candidate = new Date(periodStart);
  candidate.setHours(12, 0, 0, 0);
  while (candidate <= periodEnd) {
    if (candidate.getDay() === targetDay) {
      const match = !isBiweekly
        ? true
        : isSameDay(candidate, firstHit) ||
          ((candidate.getTime() - firstHit.getTime()) / (1000 * 60 * 60 * 24)) %
            14 ===
            0;
      if (match && candidate >= periodStart && candidate <= periodEnd) {
        dates.push(new Date(candidate));
      }
    }
    candidate.setDate(candidate.getDate() + 1);
  }
  return dates;
}

function getQuarterlyHitDates(
  source: FrequencySource,
  periodStart: Date,
  periodEnd: Date
): Date[] {
  const dates: Date[] = [];
  if (!source.start_date || !source.due_days?.length) return dates;

  const baseDate = new Date(source.start_date);
  baseDate.setHours(12, 0, 0, 0);
  const baseMonth = baseDate.getMonth();
  const baseYear = baseDate.getFullYear();

  for (let q = 0; q < 4; q++) {
    const dayStr =
      source.due_days[q] ?? source.due_days[source.due_days.length - 1];
    if (!dayStr) continue;

    const monthIndex = baseMonth + q * 3;
    const year = baseYear + Math.floor(monthIndex / 12);
    const month = monthIndex % 12;

    let target: Date;
    if (dayStr === "EOM") {
      target = new Date(year, month + 1, 0, 12);
    } else if (dayStr.includes("/")) {
      const [mStr, dStr] = dayStr.split("/");
      const overrideMonth = parseInt(mStr) - 1;
      const day = parseInt(dStr);
      target = new Date(year, overrideMonth, day, 12);
    } else {
      const day = parseInt(dayStr);
      if (isNaN(day)) continue;
      target = new Date(year, month, day, 12);
    }

    if (isWithinInterval(target, { start: periodStart, end: periodEnd })) {
      dates.push(new Date(target));
    }
  }

  return dates;
}

export function getIncomeHitDate(
  source: FrequencySource,
  periodStart: Date,
  periodEnd: Date
): Date[] {
  const frequency = source.frequency?.trim().toLowerCase() ?? "";
  const dates: Date[] = [];

  if (
    source.due_days?.length &&
    (frequency === "monthly" ||
      frequency === "semi-monthly" ||
      frequency === "yearly")
  ) {
    dates.push(...getMonthlyHitDates(source, periodStart, periodEnd));
  }

  if (
    source.weekly_day &&
    (frequency === "weekly" || frequency === "biweekly")
  ) {
    dates.push(...getWeeklyHitDates(source, periodStart, periodEnd));
  }

  if (
    frequency === "quarterly" &&
    source.due_days?.length &&
    source.start_date
  ) {
    dates.push(...getQuarterlyHitDates(source, periodStart, periodEnd));
  }

  const sorted = dates.sort((a, b) => a.getTime() - b.getTime());

  // De-duplicate dates by day
  const uniqueDates = sorted.filter(
    (d, index, arr) => index === 0 || !isSameDay(d, arr[index - 1])
  );

  const hitsInRange = uniqueDates.filter((d) =>
    isWithinInterval(d, {
      start: periodStart,
      end: new Date(
        periodEnd.getFullYear(),
        periodEnd.getMonth(),
        periodEnd.getDate(),
        23,
        59,
        59,
        999
      ),
    })
  );

  // Fallback: if frequency is 'monthly' and due_days is missing or empty, assume 1st of the month
  if (
    hitsInRange.length === 0 &&
    frequency === "monthly" &&
    (!source.due_days || source.due_days.length === 0)
  ) {
    const assumed = new Date(
      periodStart.getFullYear(),
      periodStart.getMonth(),
      1
    );
    if (isWithinInterval(assumed, { start: periodStart, end: periodEnd })) {
      hitsInRange.push(assumed);
    }
  }

  return hitsInRange;
}
