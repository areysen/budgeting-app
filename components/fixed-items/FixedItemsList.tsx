"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { FixedItem } from "@/types";

// Utility to format ordinal suffixes for due days
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
  const baseMonth = start.getMonth(); // e.g. March = 2
  const months = [baseMonth, baseMonth + 3, baseMonth + 6, baseMonth + 9];

  return dueDays
    .map((day, index) => {
      const monthIndex = months[index] % 12;
      const date = new Date(2000, monthIndex, parseInt(day));
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }); // e.g. "Mar 15"
    })
    .join(", ");
}

export function FixedItemsList({
  onEdit,
  editable = false,
}: {
  onEdit?: (item: FixedItem) => void;
  editable?: boolean;
}) {
  const [items, setItems] = useState<FixedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      const { data, error } = await supabase
        .from("fixed_items")
        .select(
          "id, name, amount, frequency, due_days, weekly_day, start_date, notes, transaction_match_keywords, categories:categories(id, name), vaults(id, name)"
        )
        .order("due_days");

      if (!error && data) {
        setItems(
          data.map((item) => {
            const { vaults, categories, ...rest } = item;
            return {
              ...rest,
              vault_id:
                vaults && typeof vaults === "object" && "id" in vaults
                  ? vaults.id
                  : null,
              vaults:
                vaults && typeof vaults === "object" && "id" in vaults
                  ? "id" in vaults && "name" in vaults
                    ? { id: vaults.id as string, name: vaults.name as string }
                    : null
                  : null,
              categories:
                categories &&
                typeof categories === "object" &&
                "id" in categories
                  ? "id" in categories && "name" in categories
                    ? {
                        id: String(categories.id),
                        name: String(categories.name),
                      }
                    : null
                  : null,
            } as FixedItem;
          })
        );
      }
      setLoading(false);
    }

    fetchItems();
  }, []);

  if (loading)
    return <p className="text-muted-foreground">Loading fixed items...</p>;

  if (items.length === 0)
    return <p className="text-muted-foreground">No fixed items found.</p>;

  // Group items by category name
  const groupedItems: { [category: string]: FixedItem[] } = {};
  items.forEach((item) => {
    const category = item.categories?.name ?? "Uncategorized";
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });

  // Sort categories so "Income" is always last
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    if (a === "Income") return 1;
    if (b === "Income") return -1;
    return a.localeCompare(b);
  });

  return (
    <div>
      {sortedCategories.map((category) => {
        const group = groupedItems[category];
        return (
          <div key={category}>
            <h3 className="text-lg font-semibold text-foreground mt-4">
              {category}
            </h3>
            <div className="space-y-2">
              {group.map((item) => (
                <div
                  key={item.id}
                  className="border border-border ring-border bg-card p-4 rounded-lg"
                >
                  <div className="text-base font-semibold text-foreground">
                    {item.name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {item.categories?.name ?? "Uncategorized"} •{" "}
                    <span className="font-medium">
                      ${item.amount.toFixed(2)}
                    </span>
                    {item.frequency === "Monthly" && item.due_days?.length === 1
                      ? ` • Monthly ${formatDueDay(item.due_days[0])}`
                      : item.frequency === "Semi-Monthly" &&
                        item.due_days?.length === 2
                      ? ` • Every ${
                          item.due_days[0] === "EOM"
                            ? "month-end"
                            : formatOrdinal(item.due_days[0])
                        } and ${
                          item.due_days[1] === "EOM"
                            ? "month-end"
                            : formatOrdinal(item.due_days[1])
                        }`
                      : item.frequency === "Quarterly" &&
                        item.due_days?.length === 4
                      ? ` • Quarterly on ${formatQuarterlyDates(
                          item.due_days,
                          item.start_date
                        )}`
                      : item.frequency === "Yearly" &&
                        item.due_days?.length === 1
                      ? ` • Yearly ${formatDueDay(item.due_days[0])}`
                      : item.frequency === "Per Paycheck"
                      ? ` • Every Paycheck`
                      : ""}
                    {item.frequency === "Weekly" && item.weekly_day
                      ? ` • Every ${item.weekly_day}`
                      : item.frequency === "Biweekly" && item.weekly_day
                      ? ` • Every other ${item.weekly_day}`
                      : ""}
                    {item.vaults?.name ? ` • Vault: ${item.vaults.name}` : ""}
                  </div>
                  {item.notes && (
                    <div className="text-sm mt-1 italic text-muted-foreground">
                      {item.notes}
                    </div>
                  )}
                  {editable && (
                    <div className="flex gap-2 mt-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="text-sm text-primary hover:text-primary/80 underline transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to delete this fixed item?"
                            )
                          ) {
                            await supabase
                              .from("fixed_items")
                              .delete()
                              .eq("id", item.id);
                            setItems((prev) =>
                              prev.filter((i) => i.id !== item.id)
                            );
                          }
                        }}
                        className="text-sm text-destructive hover:text-destructive/80 underline transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
