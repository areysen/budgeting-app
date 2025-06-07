// /lib/utils/generatePaycheckDates.ts
import Holidays from "date-holidays";
import { format } from "date-fns";

export type PaycheckDate = {
  label: string;
  officialDate: string;
  adjustedDate: string;
};

export function generatePaycheckDates(start: Date, end: Date): PaycheckDate[] {
  const dates: PaycheckDate[] = [];

  const hd = new Holidays("US");
  const holidayMap = new Map<string, boolean>();

  for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
    const holidays = hd.getHolidays(year);
    holidays.forEach((h) => {
      if (h.date) {
        holidayMap.set(new Date(h.date).toDateString(), true);
      }
    });
  }

  const isHoliday = (d: Date) => holidayMap.has(d.toDateString());

  const adjustDate = (d: Date): Date => {
    const adjusted = new Date(d);
    const day = adjusted.getDay();

    // If Monday, Saturday, or Sunday → back to Friday first
    if (day === 1) {
      adjusted.setDate(adjusted.getDate() - 3); // Monday → Friday
    } else if (day === 0) {
      adjusted.setDate(adjusted.getDate() - 2); // Sunday → Friday
    } else if (day === 6) {
      adjusted.setDate(adjusted.getDate() - 1); // Saturday → Friday
    }

    // Now apply holiday adjustment if needed
    while (isHoliday(adjusted)) {
      adjusted.setDate(adjusted.getDate() - 1);
      // Re-check if now weekend
      const day = adjusted.getDay();
      if (day === 0)
        adjusted.setDate(adjusted.getDate() - 2); // Sunday → Friday
      else if (day === 6) adjusted.setDate(adjusted.getDate() - 1); // Saturday → Friday
    }

    return adjusted;
  };

  const current = new Date(start);
  current.setDate(1); // ensure clean month iteration

  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth();

    const officialFifteenth = new Date(year, month, 15);
    const adjustedFifteenth = adjustDate(officialFifteenth);
    const officialEOM = new Date(year, month + 1, 0); // day 0 of next month = last day of current
    const adjustedEOM = adjustDate(officialEOM);

    dates.push({
      label: `Month 15`,
      officialDate: format(officialFifteenth, "yyyy-MM-dd"),
      adjustedDate: format(adjustedFifteenth, "yyyy-MM-dd"),
    });
    dates.push({
      label: `Month EOM`,
      officialDate: format(officialEOM, "yyyy-MM-dd"),
      adjustedDate: format(adjustedEOM, "yyyy-MM-dd"),
    });

    current.setMonth(current.getMonth() + 1);
  }

  return dates;
}
