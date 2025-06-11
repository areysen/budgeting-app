"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DateInput } from "@/components/ui/date";
import type { Category, OneOff, Vault } from "@/types";
import { formatDisplayDate } from "@/lib/utils/date/format";

interface Props {
  forecastStart: string | null;
  onSaved?: () => void;
}

export default function OneOffSection({ forecastStart, onSaved }: Props) {
  const [oneOffs, setOneOffs] = useState<OneOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
    is_income: false,
    notes: "",
    category_id: "",
    vault_id: null as string | null,
    date: null as string | null,
    transaction_match_keywords: [] as string[],
  });
  // --- Inline edit/delete state ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("vaults")
      .select("id, name")
      .then(({ data }) => {
        if (data) setVaults(data);
      });
  }, []);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setCategories(
            data.map((c) => ({ ...c, sort_order: null })) // add missing field
          );
        }
      });
  }, []);

  const fetchOneOffs = async () => {
    if (!forecastStart) return;
    setLoading(true);
    const { data } = await supabase
      .from("forecast_oneoffs")
      .select(
        "id, name, amount, is_income, forecast_start, category_id, vault_id, date, transaction_match_keywords, notes"
      )
      .eq("forecast_start", forecastStart);
    setOneOffs((data as OneOff[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOneOffs();
  }, [forecastStart]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forecastStart) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      alert("User not found. Please log in again.");
      return;
    }

    const parsedKeywords = keywordInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const newItem = {
      ...(editingId ? { id: editingId } : {}),
      name: formData.name.trim(),
      amount: Number(formData.amount),
      is_income: formData.is_income,
      notes: formData.notes.trim() || null,
      forecast_start: forecastStart,
      category_id: formData.category_id || null,
      vault_id: formData.vault_id || null,
      date: formData.date || null,
      transaction_match_keywords:
        parsedKeywords.length > 0 ? parsedKeywords : null,
      user_id: user.id,
    };

    const { error } = await supabase.from("forecast_oneoffs").upsert([newItem]);

    if (!error) {
      setDialogOpen(false);
      setFormData({
        name: "",
        amount: 0,
        is_income: false,
        notes: "",
        category_id: "",
        vault_id: null,
        date: null,
        transaction_match_keywords: [],
      });
      setKeywordInput("");
      setEditingId(null);
      fetchOneOffs();
      onSaved?.();
    } else {
      alert("Failed to save item");
    }
  };

  return (
    <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-foreground">One-Off Items</h2>
        {forecastStart && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: "",
                    amount: 0,
                    is_income: false,
                    notes: "",
                    category_id: "",
                    vault_id: null,
                    date: null,
                    transaction_match_keywords: [],
                  });
                  setKeywordInput("");
                  setDialogOpen(true);
                }}
              >
                + Add One-Off
              </Button>
            </DialogTrigger>
            <DialogContent
              header={
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit One-Off Item" : "Add One-Off Item"}
                  </DialogTitle>
                  <DialogDescription>
                    Provide details for a single income or expense item.
                  </DialogDescription>
                </DialogHeader>
              }
            >
              <form onSubmit={handleAdd} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground font-semibold">
                      Name
                    </label>
                    <Input
                      autoFocus
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
                  <div>
                    <label className="block text-sm font-medium text-foreground font-semibold">
                      Date
                    </label>
                    <DateInput
                      name="date"
                      value={formData.date ?? ""}
                      onChange={handleChange}
                      className="bg-card text-foreground border-border"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_income"
                      name="is_income"
                      checked={formData.is_income}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="is_income"
                      className="text-sm text-foreground font-semibold"
                    >
                      Income Item?
                    </label>
                  </div>
                </div>

                {/* Allocation Details */}
                <div className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-4">
                  {!formData.is_income && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground font-semibold">
                          Vault
                        </label>
                        <Select
                          name="vault_id"
                          value={formData.vault_id ?? ""}
                          onChange={handleChange}
                          className="w-full bg-card text-foreground border-border"
                        >
                          <option value="">None</option>
                          {vaults.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground font-semibold">
                          Category
                        </label>
                        <Select
                          name="category_id"
                          value={formData.category_id}
                          onChange={handleChange}
                          className="w-full bg-card text-foreground border-border"
                        >
                          <option value="">None</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </>
                  )}
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
                      placeholder="e.g. vet, petco"
                      className="bg-card text-foreground border-border"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground font-semibold">
                      Notes
                    </label>
                    <Textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="bg-card text-foreground border-border"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : oneOffs.length === 0 ? (
        <p className="text-muted-foreground text-sm">No one-off items.</p>
      ) : (
        <div className="space-y-2">
          {[...oneOffs]
            .sort((a, b) => {
              const aDate = new Date(a.date || a.forecast_start).getTime();
              const bDate = new Date(b.date || b.forecast_start).getTime();
              return aDate - bDate;
            })
            .map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background hover:bg-muted transition"
              >
                <div className="text-sm font-medium text-foreground">
                  {o.name}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-medium">
                      ${o.amount.toFixed(2)} {o.is_income ? "💰" : "💸"}
                    </span>
                    <button
                      className="w-8 h-8 flex items-center justify-center text-sm text-blue-600 bg-muted rounded-full hover:bg-blue-100"
                      onClick={() => {
                        setFormData({
                          name: o.name,
                          amount: o.amount,
                          is_income: o.is_income,
                          notes: o.notes ?? "",
                          category_id: o.category_id ?? "",
                          vault_id: o.vault_id ?? null,
                          date: o.date ?? null,
                          transaction_match_keywords:
                            o.transaction_match_keywords ?? [],
                        });
                        setKeywordInput(
                          o.transaction_match_keywords?.join(", ") ?? ""
                        );
                        setEditingId(o.id ?? null);
                        setDialogOpen(true);
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="w-8 h-8 flex items-center justify-center text-sm text-red-600 bg-muted rounded-full hover:bg-red-100"
                      onClick={() => setConfirmDeleteId(o.id ?? null)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                  <div>
                    {(o.date || o.forecast_start) &&
                      `${o.is_income ? "Expected" : "Due"} ${formatDisplayDate(
                        o.date || o.forecast_start
                      )}`}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      {/* Delete confirmation UI */}
      {confirmDeleteId && (
        <div className="text-sm text-center mt-4">
          <p>Are you sure you want to delete this item?</p>
          <div className="flex justify-center gap-4 mt-2">
            <button
              className="text-red-600 font-semibold"
              onClick={async () => {
                await supabase
                  .from("forecast_oneoffs")
                  .delete()
                  .eq("id", confirmDeleteId);
                setConfirmDeleteId(null);
                fetchOneOffs();
                onSaved?.();
              }}
            >
              Yes, Delete
            </button>
            <button
              className="text-muted-foreground"
              onClick={() => setConfirmDeleteId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
