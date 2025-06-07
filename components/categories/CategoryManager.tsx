"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Pencil, Trash2, Save, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Category = {
  id: string;
  name: string;
  user_id: string | null;
  sort_order: number | null;
};

function SortableCategoryItem({
  cat,
  editingId,
  editingName,
  setEditingId,
  setEditingName,
  handleSaveEdit,
  handleDelete,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
    backgroundColor: isDragging ? "#f9fafb" : "transparent",
  };

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-2">
      <div
        {...attributes}
        {...listeners}
        className="text-muted-foreground cursor-grab"
        aria-label="Drag to reorder"
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>
      {editingId === cat.id ? (
        <>
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="flex-1 bg-card text-foreground border-border"
          />
          <Button size="icon" onClick={() => handleSaveEdit(cat.id)}>
            <Save size={16} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditingId(null)}
            className="hover:bg-muted transition"
          >
            <X size={16} />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1">{cat.name}</span>
          {cat.user_id && (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditingId(cat.id);
                  setEditingName(cat.name);
                }}
                className="hover:bg-muted transition"
              >
                <Pencil size={16} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(cat.id)}
                className="hover:bg-muted transition"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </>
      )}
    </li>
  );
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from("categories")
      .select("id, name, user_id, sort_order")
      .order("sort_order", { ascending: true });

    if (data) setCategories(data);
  }

  async function handleAdd() {
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from("categories").insert({
      name: newCategoryName.trim(),
      user_id: (await supabase.auth.getUser()).data.user?.id,
    });

    if (!error) {
      setNewCategoryName("");
      fetchCategories();
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("categories").delete().eq("id", id);
    fetchCategories();
  }

  async function handleSaveEdit(id: string) {
    if (!editingName.trim()) return;
    await supabase
      .from("categories")
      .update({ name: editingName.trim() })
      .eq("id", id);
    setEditingId(null);
    setEditingName("");
    fetchCategories();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="bg-card text-foreground border-border placeholder:text-muted-foreground"
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={async ({ active, over }) => {
          if (!over || active.id === over.id) return;
          const oldIndex = categories.findIndex((c) => c.id === active.id);
          const newIndex = categories.findIndex((c) => c.id === over.id);
          const updated = arrayMove(categories, oldIndex, newIndex);
          setCategories(updated);

          const userId = (await supabase.auth.getUser()).data.user?.id;
          const updates = updated.map((cat, idx) => ({
            id: cat.id,
            name: cat.name,
            sort_order: idx + 1,
            user_id: cat.user_id ?? userId, // make sure it's present
          }));

          await supabase.from("categories").upsert(updates);
          fetchCategories();
        }}
      >
        <SortableContext
          items={categories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="bg-muted/10 border border-border ring-border rounded-lg  p-4">
            <ul className="space-y-2 max-h-[300px] overflow-y-auto">
              {categories.map((cat) => (
                <SortableCategoryItem
                  key={cat.id}
                  cat={cat}
                  editingId={editingId}
                  editingName={editingName}
                  setEditingId={setEditingId}
                  setEditingName={setEditingName}
                  handleSaveEdit={handleSaveEdit}
                  handleDelete={handleDelete}
                />
              ))}
            </ul>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
