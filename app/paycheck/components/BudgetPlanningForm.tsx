"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { generatePaycheckDates } from "@/lib/utils/generatePaycheckDates";
import { getPaycheckRange } from "@/lib/utils/date/paycheck";
import { formatDateRange, formatDisplayDate } from "@/lib/utils/date/format";
import { normalizeFixedItem } from "@/lib/utils/fixedItem";
import { FixedItem } from "@/types";
import OneOffSection from "@/components/forecast/OneOffSection";
import FixedItemForecastModal from "@/components/forecast/FixedItemForecastModal";
import { Skeleton } from "@/components/ui/skeleton";

interface BudgetPlanningFormProps {
  paycheckId: string;
}

type PaycheckRecord = {
  id: string;
  paycheck_date: string;
};

type PaycheckDate = {
  label: string;
  officialDate: string;
  adjustedDate: string;
};

export default function BudgetPlanningForm({ paycheckId }: BudgetPlanningFormProps) {
  const [record, setRecord] = useState<PaycheckRecord | null>(null);
  const [paycheckDates, setPaycheckDates] = useState<PaycheckDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<PaycheckDate | null>(null);

  const [incomeSources, setIncomeSources] = useState<any[]>([]);
  const [fixedItems, setFixedItems] = useState<FixedItem[]>([]);
  const [vaultItems, setVaultItems] = useState<FixedItem[]>([]);
  const [oneOffItems, setOneOffItems] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);

  const [isLoadingIncome, setIsLoadingIncome] = useState(true);
  const [isLoadingFixedItems, setIsLoadingFixedItems] = useState(true);

  useEffect(() => {
    supabase
      .from("paychecks")
      .select("id, paycheck_date")
      .eq("id", paycheckId)
      .single()
      .then(({ data }) => {
        if (data) setRecord(data as PaycheckRecord);
      });
  }, [paycheckId]);

  useEffect(() => {
    const all = generatePaycheckDates(new Date("2025-01-01"), new Date("2026-01-01"));
    setPaycheckDates(all);
  }, []);

  useEffect(() => {
    if (!record || paycheckDates.length === 0) return;
    const found = paycheckDates.find((p) => p.adjustedDate === record.paycheck_date);
    setSelectedDate(found ?? null);
  }, [record, paycheckDates]);

  const currentIndex = useMemo(() => {
    if (!selectedDate) return -1;
    return paycheckDates.findIndex((p) => p.officialDate === selectedDate.officialDate);
  }, [selectedDate, paycheckDates]);

  const nextPaycheck = useMemo(() => {
    if (currentIndex === -1) return undefined;
    return paycheckDates[currentIndex + 1];
  }, [currentIndex, paycheckDates]);

  const { start, end } = useMemo(() => {
    if (!selectedDate) return { start: null, end: null } as { start: Date | null; end: Date | null };
    return getPaycheckRange(selectedDate, nextPaycheck);
  }, [selectedDate, nextPaycheck]);

  // Income
  useEffect(() => {
    if (!start || !end) return;
    setIsLoadingIncome(true);
    supabase
      .from("income_sources")
      .select("*")
      .then(({ data }) => {
        setIncomeSources(data ?? []);
        setIsLoadingIncome(false);
      });
  }, [start, end]);

  // Fixed items
  useEffect(() => {
    if (!start || !end) return;
    setIsLoadingFixedItems(true);
    supabase
      .from("fixed_items")
      .select("*, categories(name)")
      .then(({ data }) => {
        if (!data) return;
        const items = data.map(normalizeFixedItem);
        const vaults = items.filter((i) => i.categories?.name?.trim().toLowerCase() === "vault");
        const fixed = items.filter((i) => i.categories?.name?.trim().toLowerCase() !== "vault");
        setVaultItems(vaults);
        setFixedItems(fixed);
        setIsLoadingFixedItems(false);
      });
  }, [start, end]);

  // Placeholder one-off & adjustments
  useEffect(() => {
    if (!start) return;
    const key = start.toISOString().slice(0, 10);
    supabase
      .from("forecast_oneoffs")
      .select("*")
      .eq("forecast_start", key)
      .then(({ data }) => setOneOffItems(data ?? []));
    supabase
      .from("forecast_adjustments")
      .select("*")
      .eq("forecast_start", key)
      .then(({ data }) => setAdjustments(data ?? []));
  }, [start]);

  if (!record || !selectedDate) return <p className="text-muted-foreground">Loading...</p>;

  const incomeTotal = useMemo(() => incomeSources.reduce((sum, s) => sum + (s.amount ?? 0), 0), [incomeSources]);

  return (
    <AuthGuard>
      <div className="space-y-6">
        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">Income Summary</h2>
          {isLoadingIncome ? (
            <Skeleton className="h-4 w-1/2" />
          ) : (
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                <strong>Paycheck Date:</strong> {formatDisplayDate(selectedDate.adjustedDate)}
              </div>
              {start && end && (
                <div>
                  <strong>Pay Period:</strong> {formatDateRange(start.toISOString(), end.toISOString())}
                </div>
              )}
              <div>
                <strong>Total Income:</strong> ${incomeTotal.toLocaleString()}
              </div>
            </div>
          )}
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-foreground">Fixed Expenses</h2>
          </div>
          {isLoadingFixedItems ? (
            <Skeleton className="h-4 w-1/2" />
          ) : (
            <div className="space-y-2">
              {fixedItems.map((item) => (
                <FixedItemForecastModal
                  key={item.id}
                  fixedItem={item}
                  fixedItemId={item.id}
                  forecastStart={start?.toISOString().slice(0, 10) ?? ""}
                  onSaved={() => {}}
                  trigger={
                    <div className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background">
                      <div className="text-sm font-medium text-foreground">{item.name}</div>
                      <div className="text-right text-sm text-muted-foreground">${item.amount.toFixed(2)}</div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-foreground">Vault Contributions</h2>
          </div>
          {isLoadingFixedItems ? (
            <Skeleton className="h-4 w-1/2" />
          ) : (
            <div className="space-y-2">
              {vaultItems.map((item) => (
                <FixedItemForecastModal
                  key={item.id}
                  fixedItem={item}
                  fixedItemId={item.id}
                  forecastStart={start?.toISOString().slice(0, 10) ?? ""}
                  onSaved={() => {}}
                  trigger={
                    <div className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background">
                      <div className="text-sm font-medium text-foreground">{item.name}</div>
                      <div className="text-right text-sm text-muted-foreground">${item.amount.toFixed(2)}</div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {start && (
          <OneOffSection forecastStart={start.toISOString().slice(0, 10)} onSaved={() => {}} />
        )}
      </div>
    </AuthGuard>
  );
}
