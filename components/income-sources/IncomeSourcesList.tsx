"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { IncomeSource } from "@/types";

function formatOrdinal(day: string) {
  const n = parseInt(day, 10);
  if (isNaN(n)) return day;
  const suffix =
    ["th", "st", "nd", "rd"][n % 100 >= 11 && n % 100 <= 13 ? 0 : n % 10] ||
    "th";
  return `${n}${suffix}`;
}

function formatDueDay(day: string) {
  if (day === "EOM") return "at month-end";
  return `on the ${formatOrdinal(day)}`;
}

function formatQuarterlyDates(
  dueDays: string[],
  startDate: string | null
): string {
  if (!startDate || dueDays.length !== 4)
    return dueDays.map(formatDueDay).join(", ");

  const start = new Date(startDate);
  const baseMonth = start.getMonth();
  const months = [baseMonth, baseMonth + 3, baseMonth + 6, baseMonth + 9];

  return dueDays
    .map((day, index) => {
      const monthIndex = months[index] % 12;
      const date = new Date(2000, monthIndex, parseInt(day));
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    })
    .join(", ");
}

export function IncomeSourcesList({
  onEdit,
  editable = false,
}: {
  onEdit?: (item: IncomeSource) => void;
  editable?: boolean;
}) {
  const [items, setItems] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      const { data, error } = await supabase
        .from("income_sources")
        .select("*")
        .order("due_days");

      if (!error && data) {
        setItems(
          data.map((item) => ({
            ...item,
            due_days: item.due_days ?? undefined,
          }))
        );
      }
      setLoading(false);
    }

    fetchItems();
  }, []);

  if (loading)
    return <p className="text-muted-foreground">Loading income sources...</p>;

  if (items.length === 0)
    return <p className="text-muted-foreground">No income sources found.</p>;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="border border-border ring-border bg-card p-4 rounded-lg"
        >
          <div className="text-base font-semibold text-foreground">
            {item.name}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            <span className="font-medium">${item.amount.toFixed(2)}</span>
            {item.frequency === "Monthly" && item.due_days?.length === 1
              ? ` • Monthly ${formatDueDay(item.due_days[0])}`
              : item.frequency === "Semi-Monthly" && item.due_days?.length === 2
              ? ` • Every ${
                  item.due_days[0] === "EOM"
                    ? "month-end"
                    : formatOrdinal(item.due_days[0])
                } and ${
                  item.due_days[1] === "EOM"
                    ? "month-end"
                    : formatOrdinal(item.due_days[1])
                }`
              : item.frequency === "Quarterly" && item.due_days?.length === 4
              ? ` • Quarterly on ${formatQuarterlyDates(
                  item.due_days,
                  item.start_date
                )}`
              : item.frequency === "Yearly" && item.due_days?.length === 1
              ? ` • Yearly ${formatDueDay(item.due_days[0])}`
              : item.frequency === "Per Paycheck"
              ? ` • Every Paycheck`
              : ""}
            {item.frequency === "Weekly" && item.weekly_day
              ? ` • Every ${item.weekly_day}`
              : item.frequency === "Biweekly" && item.weekly_day
              ? ` • Every other ${item.weekly_day}`
              : ""}
          </div>
          {item.notes && (
            <div className="text-sm mt-1 italic text-muted-foreground">
              {item.notes}
            </div>
          )}
          {editable && onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="text-sm text-primary hover:text-primary/80 underline mt-1 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
