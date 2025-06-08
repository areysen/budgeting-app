import { FixedItem } from "@/types";

export function normalizeFixedItem(item: any): FixedItem {
  return {
    ...item,
    due_days: item.due_days ? item.due_days.map(String) : undefined,
    weekly_day: item.weekly_day ?? undefined,
    category_id: item.category_id ?? undefined,
  };
}
