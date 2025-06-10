"use client";

import { useState } from "react";
import type { IncomeSource } from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { IncomeSourcesList } from "@/components/income-sources/IncomeSourcesList";
import { IncomeSourceForm } from "@/components/income-sources/IncomeSourceForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function IncomeSourcesPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editItem, setEditItem] = useState<IncomeSource | null>(null);

  return (
    <AuthGuard>
      <div className="hidden force-scrollbar-classes" />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Income Sources</h1>
        <p className="text-sm text-muted-foreground">
          Manage your regular sources of income.
        </p>

        <Button
          onClick={() => {
            setEditItem(null);
            setShowForm(true);
          }}
        >
          + Add Income Source
        </Button>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent
            className="max-w-xl p-6 shadow-xl ring-border"
            header={
              <DialogHeader>
                <DialogTitle>
                  {editItem ? `Edit Income Source` : `Add Income Source`}
                </DialogTitle>
              </DialogHeader>
            }
          >
            <IncomeSourceForm
              source={editItem}
              onClose={() => setShowForm(false)}
              onSave={() => {
                setShowForm(false);
                setRefreshKey((prev) => prev + 1);
              }}
            />
          </DialogContent>
        </Dialog>

        <IncomeSourcesList
          key={refreshKey}
          editable
          onEdit={(item) => {
            setEditItem(item);
            setShowForm(true);
          }}
        />
      </div>
    </AuthGuard>
  );
}

