"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const shortcuts = [
  { category: "Navigation", items: [
    { keys: ["⌘", "K"], description: "Open command palette" },
    { keys: ["G", "D"], description: "Go to Dashboard" },
    { keys: ["G", "T"], description: "Go to Tasks" },
    { keys: ["G", "K"], description: "Go to Kanban" },
    { keys: ["G", "A"], description: "Go to Admin" },
  ]},
  { category: "Actions", items: [
    { keys: ["⌘", "N"], description: "Quick create task" },
    { keys: ["N"], description: "Create new task (full page)" },
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["T"], description: "Toggle theme" },
    { keys: ["Esc"], description: "Close dialog/palette" },
  ]},
  { category: "Task List", items: [
    { keys: ["↑", "↓"], description: "Navigate tasks" },
    { keys: ["Enter"], description: "Open selected task" },
    { keys: ["1", "2", "3"], description: "Filter by status" },
    { keys: ["/"], description: "Focus search" },
  ]},
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and interact with TaskSphere faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((category, idx) => (
            <div key={category.category}>
              {idx > 0 && <Separator className="mb-4" />}
              <h3 className="text-sm font-semibold mb-2">{category.category}</h3>
              <div className="space-y-2">
                {category.items.map((item) => (
                  <div key={item.description} className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <span key={keyIdx}>
                          {keyIdx > 0 && <span className="text-xs text-muted-foreground mx-0.5">+</span>}
                          <kbd className="inline-flex h-6 items-center justify-center rounded border border-border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
