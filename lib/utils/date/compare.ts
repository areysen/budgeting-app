import { parseISO, isWithinInterval } from "date-fns";

export function isDateInRange(
  dateStr: string,
  startStr: string,
  endStr: string
) {
  return isWithinInterval(parseISO(dateStr), {
    start: parseISO(startStr),
    end: parseISO(endStr),
  });
}
