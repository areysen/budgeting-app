"use client";

import { useState } from "react";
import type { FixedItem } from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { FixedItemsList } from "@/components/fixed-items/FixedItemsList";
import { FixedItemForm } from "@/components/fixed-items/FixedItemForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryManager } from "@/components/categories/CategoryManager";
import { Button } from "@/components/ui/button";

export default function FixedItemsPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editItem, setEditItem] = useState<FixedItem | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  return (
    <AuthGuard>
      <div className="hidden force-scrollbar-classes" />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          Fixed Budget Items
        </h1>
        <p className="text-sm text-muted-foreground">
          This is where you’ll manage your recurring income and expenses. You
          can add, edit, or remove fixed items that drive your budget planning.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setEditItem(null);
              setShowForm(true);
            }}
          >
            + Add Fixed Item
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowCategoryManager(true)}
          >
            Manage Categories
          </Button>
        </div>
        <Dialog
          open={showCategoryManager}
          onOpenChange={setShowCategoryManager}
        >
          <DialogContent
            className="max-w-md p-6 shadow-xl ring-border"
            header={
              <DialogHeader>
                <DialogTitle>Manage Categories</DialogTitle>
              </DialogHeader>
            }
          >
            <CategoryManager />
          </DialogContent>
        </Dialog>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent
            className="max-w-xl p-6 shadow-xl ring-border"
            header={
              <DialogHeader>
                <DialogTitle>
                  {editItem ? `Edit Fixed Item` : `Add Fixed Item`}
                </DialogTitle>
              </DialogHeader>
            }
          >
            <FixedItemForm
              item={editItem}
              onClose={() => setShowForm(false)}
              onSave={() => {
                setShowForm(false);
                setRefreshKey((prev) => prev + 1);
              }}
            />
          </DialogContent>
        </Dialog>

        <FixedItemsList
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
