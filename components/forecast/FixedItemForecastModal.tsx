"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { FixedItem } from "@/types";
import { generatePaycheckDates } from "@/lib/utils/generatePaycheckDates";

interface Props {
  fixedItem: FixedItem;
  fixedItemId?: string; // optional for backward compatibility
  forecastStart: string;
  onSaved?: () => void;
  trigger: React.ReactNode;
}

interface AdjustmentPayload {
  user_id: string;
  fixed_item_id: string;
  forecast_start: string;
  override_amount: number | null;
  defer_to_start: string | null;
  notes?: string | null;
}

function getNextForecastStart(current: string): string | null {
  const start = new Date(current);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 3);
  const dates = generatePaycheckDates(start, end);
  const idx = dates.findIndex((d) => d.adjustedDate === current);
  return idx !== -1 && dates[idx + 1] ? dates[idx + 1].adjustedDate : null;
}

export default function FixedItemForecastModal({
  fixedItem,
  fixedItemId,
  forecastStart,
  onSaved,
  trigger,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [overrideAmount, setOverrideAmount] = useState<string>("");
  const [deferToNext, setDeferToNext] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    // Use provided fixedItemId if present, else fallback to logic
    let cleanedId: string;
    if (fixedItemId) {
      cleanedId = fixedItemId;
    } else {
      cleanedId =
        typeof fixedItem.id === "string" && fixedItem.id.endsWith("-deferred")
          ? fixedItem.id.replace("-deferred", "")
          : fixedItem.id;
    }
    supabase
      .from("forecast_adjustments")
      .select("override_amount, defer_to_start")
      .eq("forecast_start", forecastStart)
      .eq("fixed_item_id", cleanedId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error && error.code !== "PGRST116") {
          console.error("Unexpected error:", error);
          return;
        }

        if (data) {
          setOverrideAmount(
            data.override_amount != null ? String(data.override_amount) : ""
          );
          setDeferToNext(Boolean(data.defer_to_start));
          setNotes("");
        } else {
          setOverrideAmount("");
          setDeferToNext(false);
          setNotes("");
        }
      });
  }, [open, forecastStart, fixedItemId, fixedItem.id]);

  const nextForecastStart = useMemo(
    () => getNextForecastStart(forecastStart),
    [forecastStart]
  );

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return;

    // Use provided fixedItemId if present, else fallback to logic
    let cleanedId: string;
    if (fixedItemId) {
      cleanedId = fixedItemId;
    } else {
      cleanedId =
        typeof fixedItem.id === "string" && fixedItem.id.endsWith("-deferred")
          ? fixedItem.id.replace("-deferred", "")
          : fixedItem.id;
    }

    // Always use originalForecastStart if present (for deferred edits)
    const upsertForecastStart =
      fixedItem.originalForecastStart ?? forecastStart;

    const payload: AdjustmentPayload = {
      user_id: user.id,
      fixed_item_id: cleanedId,
      forecast_start: upsertForecastStart,
      override_amount: overrideAmount ? Number(overrideAmount) : null,
      defer_to_start: deferToNext ? nextForecastStart : null,
    };

    await supabase
      .from("forecast_adjustments")
      .upsert(payload, { onConflict: "user_id,fixed_item_id,forecast_start" });

    // Use Next.js router.refresh and toast
    const toast = (await import("react-hot-toast")).toast;
    toast.success("✅ Forecast adjustment saved. Refreshing...");
    router.refresh();
    if (onSaved) onSaved(); // Ensure this triggers refresh after saving
    setOpen(false);
  };

  // Determine if the item is deferred for modal title/description
  const isDeferred =
    typeof fixedItem.id === "string" && fixedItem.id.endsWith("-deferred");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-sm p-6"
        header={
          <DialogHeader>
            <DialogTitle>
              Edit Fixed Item{isDeferred ? " (Deferred)" : ""}
            </DialogTitle>
            <DialogDescription>
              Adjust amounts, deferment, or notes for this item
              {isDeferred ? " (editing deferred override)" : ""}.
            </DialogDescription>
          </DialogHeader>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground font-semibold">
              Name
            </label>
            <Input
              readOnly
              value={fixedItem.name}
              className="bg-muted text-muted-foreground border-border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground font-semibold">
              Original Amount
            </label>
            <Input
              readOnly
              value={fixedItem.amount}
              className="bg-muted text-muted-foreground border-border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground font-semibold">
              Override Amount
            </label>
            <Input
              type="number"
              value={overrideAmount}
              onChange={(e) => setOverrideAmount(e.target.value)}
              className="bg-card text-foreground border-border"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="defer_to_next"
              checked={deferToNext}
              onChange={(e) => setDeferToNext(e.target.checked)}
            />
            <label
              htmlFor="defer_to_next"
              className="text-sm text-foreground font-semibold"
            >
              Defer to Next Paycheck
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground font-semibold">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-card text-foreground border-border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            type="button"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
