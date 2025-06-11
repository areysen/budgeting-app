"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (newId: string) => void;
};

export default function AddCategoryDialog({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: name.trim(),
        user_id: user?.id,
      })
      .select()
      .single();

    setSaving(false);

    if (!error && data) {
      onCreated(data.id);
      onClose();
      setName("");
    } else {
      alert("Failed to add category");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="p-6 shadow-xl ring-border"
        header={
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Enter a name for the new category.
            </DialogDescription>
          </DialogHeader>
        }
      >
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="bg-card text-foreground border-border placeholder:text-muted-foreground"
        />
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim() || saving}>
            {saving ? "Saving..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
