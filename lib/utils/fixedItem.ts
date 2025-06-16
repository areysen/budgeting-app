import { FixedItem } from "@/types";

export function normalizeFixedItem(
  item: Partial<FixedItem> & { category_id?: string | null }
): FixedItem {
  return {
    ...item,
    due_days: item.due_days ? item.due_days.map(String) : undefined,
    weekly_day: item.weekly_day ?? undefined,
    category_id: item.category_id === null ? undefined : item.category_id,
  } as FixedItem;
}
