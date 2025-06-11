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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Category, OneOff } from "@/types";

interface Props {
  forecastStart: string | null;
}

export default function OneOffSection({ forecastStart }: Props) {
  const [oneOffs, setOneOffs] = useState<OneOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
    is_income: false,
    notes: "",
    category_id: "",
  });

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true })
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  const fetchOneOffs = async () => {
    if (!forecastStart) return;
    setLoading(true);
    const { data } = await supabase
      .from("forecast_oneoffs")
      .select("*")
      .eq("forecast_start", forecastStart);
    setOneOffs((data as OneOff[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOneOffs();
  }, [forecastStart]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
    const { error } = await supabase.from("forecast_oneoffs").insert([
      {
        name: formData.name.trim(),
        amount: Number(formData.amount),
        is_income: formData.is_income,
        notes: formData.notes.trim() || null,
        forecast_start: forecastStart,
        category_id: formData.category_id || null,
        user_id: user?.id,
      },
    ]);

    if (!error) {
      setDialogOpen(false);
      setFormData({ name: "", amount: 0, is_income: false, notes: "", category_id: "" });
      fetchOneOffs();
    } else {
      alert("Failed to add item");
    }
  };

  return (
    <section className="bg-muted/10 border border-border ring-border rounded-lg p-6 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-foreground">One-Off Items</h2>
        {forecastStart && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">➕ Add One-Off</Button>
            </DialogTrigger>
            <DialogContent
              header={
                <DialogHeader>
                  <DialogTitle>Add One-Off Item</DialogTitle>
                </DialogHeader>
              }
            >
              <form onSubmit={handleAdd} className="space-y-4">
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_income"
                    name="is_income"
                    checked={formData.is_income}
                    onChange={handleChange}
                  />
                  <label htmlFor="is_income" className="text-sm text-foreground font-semibold">
                    Income Item?
                  </label>
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
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
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
        <ul className="ml-4 mt-2 list-disc text-sm">
          {oneOffs.map((o) => (
            <li key={o.id}>
              {o.name} (${o.amount.toFixed(2)}){" "}
              {o.is_income ? "[Income]" : "[Expense]"}
              {o.notes ? ` — ${o.notes}` : ""}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
