"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatDisplayDate } from "@/lib/utils/date/format";
import type { Database } from "@/types/supabase";

export default function VaultActivityList({
  vaultId,
}: {
  vaultId: string;
}) {
  const [activity, setActivity] = useState<
    Database["public"]["Tables"]["vault_activity"]["Row"][]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("vault_activity")
        .select("*")
        .eq("vault_id", vaultId)
        .order("activity_date", { ascending: false });
      setActivity(data ?? []);
      setLoading(false);
    }
    load();
  }, [vaultId]);

  const balance = activity.reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (activity.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity</p>;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Balance: ${balance.toFixed(2)}
      </div>
      <ul className="space-y-2">
        {activity.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <div>
              <span
                className={
                  item.amount >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {item.amount >= 0 ? "+" : "-"}${Math.abs(item.amount).toFixed(2)}
              </span>
              {" "}
              <span className="text-xs text-muted-foreground">
                {item.source}
              </span>
              {item.notes && (
                <span className="block text-xs text-muted-foreground">
                  {item.notes}
                </span>
              )}
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {item.activity_date && formatDisplayDate(item.activity_date)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
