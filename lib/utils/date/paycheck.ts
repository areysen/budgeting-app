import { addDays, subDays, parseISO, isWithinInterval, format } from "date-fns";
import type { PaycheckDate } from "../generatePaycheckDates";

// Return the end of a paycheck period
export function getPaycheckRange(current: PaycheckDate, next?: PaycheckDate) {
  const start = parseISO(current.adjustedDate);
  const end = next
    ? subDays(parseISO(next.adjustedDate), 1)
    : addDays(start, 13); // fallback = 2-week window
  return { start, end };
}

export function getIncomeHitDate(
  source: any,
  periodStart: Date,
  periodEnd: Date
): Date | null {
  const dates: Date[] = [];

  if (source.due_days?.length) {
    for (const dayStr of source.due_days) {
      let d: Date | null = null;
      if (dayStr === "EOM") {
        d = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 0);
        if (d && isWithinInterval(d, { start: periodStart, end: periodEnd })) {
          dates.push(d);
        }
      } else if (dayStr.includes("/")) {
        const [monthStr, dayStrPart] = dayStr.split("/");
        const month = parseInt(monthStr) - 1; // JS months are 0-indexed
        const day = parseInt(dayStrPart);
        const candidate = new Date(periodStart.getFullYear(), month, day);
        if (
          isWithinInterval(candidate, { start: periodStart, end: periodEnd })
        ) {
          dates.push(candidate);
        }
      } else {
        const day = parseInt(dayStr);
        d = new Date(periodStart.getFullYear(), periodStart.getMonth(), day);
        if (d && isWithinInterval(d, { start: periodStart, end: periodEnd })) {
          dates.push(d);
        }
      }
    }
  }

  if (source.weekly_day) {
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
    const startRef = source.start_date
      ? new Date(source.start_date)
      : periodStart;

    let temp = new Date(startRef);
    // Move to the first matching weekday on or after startRef
    while (temp.getDay() !== targetDay) {
      temp.setDate(temp.getDate() + 1);
    }

    while (temp <= periodEnd) {
      if (temp >= periodStart && temp.getDay() === targetDay) {
        dates.push(new Date(temp));
      }
      temp.setDate(temp.getDate() + (isBiweekly ? 14 : 7));
    }
  }

  // Handle quarterly logic (e.g., Pestie)
  if (
    source.frequency?.toLowerCase() === "quarterly" &&
    source.due_days?.length &&
    source.start_date
  ) {
    const startDate = new Date(source.start_date);
    console.log("🔍 Quarterly Start Date:", startDate.toISOString());
    console.log("🔍 Period Start:", periodStart.toISOString());
    console.log("🔍 Period End:", periodEnd.toISOString());

    for (let i = 0; i < source.due_days.length; i++) {
      const baseMonth = startDate.getMonth();
      const baseYear = startDate.getFullYear();

      const dueMonth = baseMonth + i * 3;
      const dueYear = baseYear + Math.floor(dueMonth / 12);
      const monthIndex = dueMonth % 12;

      const dueDay = parseInt(source.due_days[i]);
      const dueDate = new Date(dueYear, monthIndex, dueDay);
      dueDate.setHours(0, 0, 0, 0);

      console.log(
        `➡️  Q${
          i + 1
        } | Target Day: ${dueDay} | Due Date: ${dueDate.toISOString()}`
      );

      if (isWithinInterval(dueDate, { start: periodStart, end: periodEnd })) {
        console.log("✅ Match in range:", dueDate.toISOString());
        dates.push(dueDate);
      }
    }
  }

  const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
  const match = sorted.find((d) =>
    isWithinInterval(d, { start: periodStart, end: periodEnd })
  );
  return match ?? null;
}
