import { format, parseISO } from "date-fns";

export const formatDisplayDate = (dateStr: string) =>
  format(parseISO(dateStr), "MMM d, yyyy");

export const formatDateRange = (start: string, end: string) =>
  `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`;
