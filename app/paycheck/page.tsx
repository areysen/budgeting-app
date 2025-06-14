"use client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { generatePaycheckDates } from "@/lib/utils/generatePaycheckDates";
import BudgetPlanningForm from "./components/BudgetPlanningForm";
import ApprovedBudgetView from "./components/ApprovedBudgetView";
import ActivePaycheckView from "./components/ActivePaycheckView";
import { getPaycheckRange } from "@/lib/utils/date/paycheck";

type PaycheckDate = {
  label: string;
  officialDate: string;
  adjustedDate: string;
};

interface PaycheckRecord {
  id: string;
  paycheck_date: string;
  approved: boolean | null;
}

export default function PaycheckPage() {
  const [paycheckDates, setPaycheckDates] = useState<PaycheckDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<PaycheckDate | null>(null);
  const [paycheck, setPaycheck] = useState<PaycheckRecord | null>(null);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  useEffect(() => {
    const all = generatePaycheckDates(
      new Date("2025-01-01"),
      new Date("2026-01-01")
    );
    setPaycheckDates(all);

    const today = new Date();
    const active = all.find((pd, i) => {
      const current = new Date(pd.adjustedDate);
      const next = all[i + 1] ? new Date(all[i + 1].adjustedDate) : null;
      return current <= today && (!next || today < next);
    });

    setSelectedDate(active ?? all[0]);
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const all = generatePaycheckDates(
      new Date("2025-01-01"),
      new Date("2026-01-01")
    );
    const idx = all.findIndex(
      (p) => p.officialDate === selectedDate.officialDate
    );
    const next = idx !== -1 ? all[idx + 1] : undefined;
    const { start, end } = getPaycheckRange(selectedDate, next);
    setStart(start);
    setEnd(end);
  }, [selectedDate]);

  const isActive =
    paycheck?.approved &&
    start &&
    end &&
    new Date() >= start &&
    new Date() <= end;

  useEffect(() => {
    async function ensurePaycheck(date: PaycheckDate) {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from("paychecks")
        .select("id, paycheck_date, approved")
        .eq("user_id", userId)
        .eq("paycheck_date", date.adjustedDate);

      if (data && data.length > 0) {
        setPaycheck(data[0] as PaycheckRecord);
        return;
      }

      const { data: inserted } = await supabase
        .from("paychecks")
        .insert({
          paycheck_date: date.adjustedDate,
          total_amount: 0,
          user_id: userId,
          approved: false,
        })
        .select("id, paycheck_date, approved")
        .single();

      if (inserted) setPaycheck(inserted as PaycheckRecord);
    }

    if (selectedDate) {
      ensurePaycheck(selectedDate);
    }
  }, [selectedDate]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const found = paycheckDates.find((p) => p.adjustedDate === value) ?? null;
    setSelectedDate(found);
    setPaycheck(null);
  };

  return (
    <AuthGuard>
      <div className="space-y-6">
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Select Paycheck
          </h2>
          <select
            className="w-full border border-border rounded-md p-2 bg-background text-foreground"
            value={selectedDate?.adjustedDate ?? ""}
            onChange={handleSelectChange}
          >
            <option value="" disabled>
              Choose a paycheck date
            </option>
            {paycheckDates.map((pd) => (
              <option key={pd.adjustedDate} value={pd.adjustedDate}>
                {pd.label} -{" "}
                {new Date(pd.adjustedDate + "T00:00:00").toLocaleDateString()}
              </option>
            ))}
          </select>
        </section>

        {paycheck && !paycheck.approved && (
          <BudgetPlanningForm
            paycheckId={paycheck.id}
            onApproved={() =>
              setPaycheck((p) => (p ? { ...p, approved: true } : p))
            }
          />
        )}
        {paycheck && paycheck.approved && isActive && (
          <ActivePaycheckView paycheckId={paycheck.id} />
        )}
        {paycheck && paycheck.approved && !isActive && (
          <ApprovedBudgetView paycheckId={paycheck.id} />
        )}
      </div>
    </AuthGuard>
  );
}
