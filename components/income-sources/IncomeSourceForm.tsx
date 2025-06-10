"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { IncomeSource, IncomeSourceFormProps } from "@/types";

export function IncomeSourceForm({
  source,
  onClose,
  onSave,
}: IncomeSourceFormProps) {
  const [formData, setFormData] = useState<
    Omit<IncomeSource, "id"> & { transaction_match_keywords?: string[] }
  >({
    name: source?.name ?? "",
    amount: source?.amount ?? 0,
    frequency: source?.frequency ?? "Monthly",
    due_days: source?.due_days ?? [],
    start_date: source?.start_date ?? null,
    notes: source?.notes ?? "",
    weekly_day: source?.weekly_day ?? "",
    transaction_match_keywords: source?.transaction_match_keywords ?? [],
  });

  const [keywordInput, setKeywordInput] = useState(
    source?.transaction_match_keywords?.join(", ") ?? ""
  );

  const [showStartDate, setShowStartDate] = useState<boolean>(
    !!formData.start_date
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (name === "due_days") {
      const selectedOptions = Array.from(
        (e.target as HTMLSelectElement).selectedOptions
      ).map((opt) => opt.value);
      setFormData((prev) => ({ ...prev, due_days: selectedOptions }));
      return;
    }
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      ...formData,
      user_id: user?.id,
    };
    if (source?.id) {
      await supabase.from("income_sources").update(payload).eq("id", source.id);
    } else {
      await supabase.from("income_sources").insert(payload);
    }

    onSave();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/10 border border-border ring-border  rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground font-semibold">
            Name
          </label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="bg-card text-foreground border-border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground font-semibold">
            Amount
          </label>
          <Input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            className="bg-card text-foreground border-border"
          />
        </div>
      </div>

      <div className="bg-muted/10 border border-border ring-border  rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground font-semibold">
            Frequency
          </label>
          <Select
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            className="w-full bg-card text-foreground border-border"
          >
            <option>Monthly</option>
            <option>Biweekly</option>
            <option>Weekly</option>
            <option>Yearly</option>
            <option>Quarterly</option>
            <option value="Semi-Monthly">Semi-Monthly</option>
            <option>Per Paycheck</option>
          </Select>
          {formData.frequency === "Per Paycheck" && (
            <p className="text-sm text-muted-foreground mt-1">
              This income will be included in every paycheck plan.
            </p>
          )}
        </div>

        {["Weekly", "Biweekly"].includes(formData.frequency) && (
          <div>
            <label className="block text-sm font-medium text-foreground font-semibold">
              Weekly Day
            </label>
            <Select
              name="weekly_day"
              value={formData.weekly_day ?? ""}
              onChange={handleChange}
              className="w-full bg-card text-foreground border-border"
            >
              <option value="">Select Day</option>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                (day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                )
              )}
            </Select>
          </div>
        )}

        {["Monthly"].includes(formData.frequency) && (
          <div>
            <label className="block text-sm font-medium text-foreground font-semibold">
              Due Day
            </label>
            <Select
              name="due_days"
              value={formData.due_days?.[0] ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  due_days: [(e.target as HTMLSelectElement).value],
                }))
              }
              className="w-full bg-card text-foreground border-border"
            >
              <option value="">Select Day</option>
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const suffix =
                  day === 1 || day === 21 || day === 31
                    ? "st"
                    : day === 2 || day === 22
                    ? "nd"
                    : day === 3 || day === 23
                    ? "rd"
                    : "th";
                return (
                  <option key={day} value={String(day)}>
                    {day}
                    {suffix}
                  </option>
                );
              })}
              <option value="EOM">End of Month</option>
            </Select>
          </div>
        )}
        {formData.frequency === "Semi-Monthly" && (
          <div>
            <label className="block text-sm font-medium text-foreground font-semibold mb-2">
              Semi-Monthly Due Days
            </label>
            <div className="grid grid-cols-2 gap-4">
              {["1st Half", "2nd Half"].map((label, index) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {label}
                  </label>
                  <Select
                    name={`due_days_${index}`}
                    value={formData.due_days?.[index] ?? ""}
                    onChange={(e) => {
                      const newDueDays = [...(formData.due_days ?? [])];
                      newDueDays[index] = (e.target as HTMLSelectElement).value;
                      setFormData((prev) => ({
                        ...prev,
                        due_days: newDueDays,
                      }));
                    }}
                    className="w-full bg-card text-foreground border-border"
                  >
                    <option value="">Select Day</option>
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      const suffix =
                        day === 1 || day === 21 || day === 31
                          ? "st"
                          : day === 2 || day === 22
                          ? "nd"
                          : day === 3 || day === 23
                          ? "rd"
                          : "th";
                      return (
                        <option key={day} value={String(day)}>
                          {day}
                          {suffix}
                        </option>
                      );
                    })}
                    <option value="EOM">End of Month</option>
                  </Select>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Specify two due days per month (e.g. 1st &amp; 15th or 15th &amp; EOM).
            </p>
          </div>
        )}
        {formData.frequency === "Quarterly" && (
          <div>
            <label className="block text-sm font-medium text-foreground font-semibold mb-2">
              Quarterly Due Days
            </label>
            <div className="grid grid-cols-2 gap-4">
              {["Q1", "Q2", "Q3", "Q4"].map((quarter, index) => (
                <div key={quarter}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {quarter}
                  </label>
                  <Select
                    name={`due_days_${index}`}
                    value={formData.due_days?.[index] ?? ""}
                    onChange={(e) => {
                      const newDueDays = [...(formData.due_days ?? [])];
                      newDueDays[index] = (e.target as HTMLSelectElement).value;
                      setFormData((prev) => ({
                        ...prev,
                        due_days: newDueDays,
                      }));
                    }}
                    className="w-full bg-card text-foreground border-border"
                  >
                    <option value="">Select Day</option>
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      const suffix =
                        day === 1 || day === 21 || day === 31
                          ? "st"
                          : day === 2 || day === 22
                          ? "nd"
                          : day === 3 || day === 23
                          ? "rd"
                          : "th";
                      return (
                        <option key={day} value={String(day)}>
                          {day}
                          {suffix}
                        </option>
                      );
                    })}
                  </Select>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Specify a due day for each quarter in the year.
            </p>
          </div>
        )}

        {["Yearly", "Quarterly", "Weekly", "Biweekly"].includes(
          formData.frequency
        ) ? (
          <div>
            <label className="block text-sm font-medium text-foreground font-semibold">
              Start Date
            </label>
            <DateInput
              name="start_date"
              value={formData.start_date ?? ""}
              onChange={handleChange}
              required={[
                "Weekly",
                "Biweekly",
                "Yearly",
                "Quarterly",
              ].includes(formData.frequency)}
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="toggle_start_date"
                checked={showStartDate}
                onChange={() => setShowStartDate((prev) => !prev)}
              />
              <label
                htmlFor="toggle_start_date"
                className="text-sm text-foreground font-semibold"
              >
                Set a Start Date
              </label>
            </div>
            {showStartDate && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-foreground font-semibold">
                  Start Date
                </label>
                <DateInput
                  name="start_date"
                  value={formData.start_date ?? ""}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-muted/10 border border-border ring-border  rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground font-semibold">
            Transaction Match Keywords
          </label>
          <Input
            name="transaction_match_keywords"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onBlur={() =>
              setFormData((prev) => ({
                ...prev,
                transaction_match_keywords: keywordInput
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="e.g. paycheck, salary"
            className="bg-card text-foreground border-border"
          />
        </div>
      </div>

      <div className="bg-muted/10 border border-border ring-border  rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground font-semibold">
            Notes
          </label>
          <Textarea
            name="notes"
            value={formData.notes ?? ""}
            onChange={handleChange}
            className="bg-card text-foreground border-border"
          />
        </div>
      </div>

      <div className="flex justify-end items-center gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {source?.id ? "Update Source" : "Add Source"}
        </Button>
      </div>
    </form>
  );
}

