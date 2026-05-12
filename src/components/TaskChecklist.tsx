"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ClipboardCheck, CheckCircle2 } from "lucide-react";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

const initialMockData: ChecklistItem[] = [
  { id: "1", text: "Write unit tests", checked: true },
  { id: "2", text: "Code review", checked: true },
  { id: "3", text: "Update documentation", checked: false },
  { id: "4", text: "Deploy to staging", checked: false },
  { id: "5", text: "QA sign-off", checked: false },
];

interface TaskChecklistProps {
  onProgressChange?: (completed: number, total: number) => void;
}

export default function TaskChecklist({ onProgressChange }: TaskChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialMockData);
  const [newItemText, setNewItemText] = useState("");
  const [flashId, setFlashId] = useState<string | null>(null);

  const completedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  // Notify parent of progress changes
  const notifyProgress = useCallback(
    (updatedItems: ChecklistItem[]) => {
      if (onProgressChange) {
        const completed = updatedItems.filter((i) => i.checked).length;
        const total = updatedItems.length;
        onProgressChange(completed, total);
      }
    },
    [onProgressChange]
  );

  const toggleItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      // Flash green on check
      const target = updated.find((i) => i.id === id);
      if (target?.checked) {
        setFlashId(id);
        setTimeout(() => setFlashId(null), 600);
      }
      notifyProgress(updated);
      return updated;
    });
  };

  const deleteItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      notifyProgress(updated);
      return updated;
    });
  };

  const addItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text,
      checked: false,
    };
    setItems((prev) => {
      const updated = [...prev, newItem];
      notifyProgress(updated);
      return updated;
    });
    setNewItemText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addItem();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          {allDone && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3" />
              All done!
            </Badge>
          )}
        </div>
        <Progress
          value={progressPercent}
          className={`h-1.5 transition-all ${allDone ? "[&>[data-slot=progress-indicator]]:bg-emerald-500" : ""}`}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-0.5">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: 1,
                x: 0,
                backgroundColor: flashId === item.id
                  ? "rgba(16, 185, 129, 0.15)"
                  : "transparent",
              }}
              exit={{ opacity: 0, x: 10, height: 0 }}
              transition={{
                opacity: { duration: 0.2 },
                x: { duration: 0.2 },
                backgroundColor: { duration: 0.4 },
                height: { duration: 0.15 },
              }}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => toggleItem(item.id)}
                className="shrink-0"
              />
              <span
                className={`flex-1 text-sm transition-all duration-200 ${
                  item.checked
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {item.text}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => deleteItem(item.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add item input */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Plus className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Add item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8 border-dashed border-2 focus:border-solid transition-colors h-9 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={!newItemText.trim()}
          className="shrink-0 gap-1 h-9"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}
