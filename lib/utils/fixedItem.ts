import { FixedItem } from "@/types";
import type { Database } from "@/types/supabase";

type SupabaseFixedItem = Database["public"]["Tables"]["fixed_items"]["Row"] & {
  categories?: { id: string; name: string } | null;
};

export function normalizeFixedItem(item: SupabaseFixedItem): FixedItem {
  return {
    ...item,
    due_days: item.due_days ? item.due_days.map(String) : undefined,
    weekly_day: item.weekly_day ?? undefined,
    category_id: item.category_id === null ? undefined : item.category_id,
  } as FixedItem;
}
