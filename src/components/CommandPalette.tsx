"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  ListTodo,
  Columns3,
  Shield,
  Settings,
  PlusCircle,
  Plus,
  Moon,
  Sun,
  LogOut,
  Circle,
  Clock,
  CheckCircle2,
  Keyboard,
} from "lucide-react";
import { OPEN_QUICK_CREATE_TASK_EVENT } from "@/components/QuickCreateTask";

// Custom event name for opening the command palette from other components
export const OPEN_COMMAND_PALETTE_EVENT = "open-command-palette";
// Custom event name for opening the keyboard shortcuts dialog
export const OPEN_KEYBOARD_SHORTCUTS_EVENT = "open-keyboard-shortcuts";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout, auth } = useAuth();

  // Listen for Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for custom event from Navbar button
  useEffect(() => {
    const handleCustomOpen = () => setOpen(true);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleCustomOpen);
    return () =>
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleCustomOpen);
  }, []);

  // Single-key shortcuts when not in an input field
  useEffect(() => {
    const handleSingleKey = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't trigger if a modifier key is held (except for ⌘K which is handled above)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(OPEN_KEYBOARD_SHORTCUTS_EVENT));
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(OPEN_QUICK_CREATE_TASK_EVENT));
      }
    };

    document.addEventListener("keydown", handleSingleKey);
    return () => document.removeEventListener("keydown", handleSingleKey);
  }, []);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  const isAdmin = auth?.role === "ADMIN";

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search for a command to run..."
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation Group */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard"))}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
            <CommandShortcut>D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/tasks"))}
          >
            <ListTodo className="mr-2 h-4 w-4" />
            Tasks
            <CommandShortcut>T</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/kanban"))}
          >
            <Columns3 className="mr-2 h-4 w-4" />
            Kanban Board
            <CommandShortcut>K</CommandShortcut>
          </CommandItem>
          {isAdmin && (
            <CommandItem
              onSelect={() => runCommand(() => router.push("/admin"))}
            >
              <Shield className="mr-2 h-4 w-4" />
              Admin Panel
              <CommandShortcut>A</CommandShortcut>
            </CommandItem>
          )}
          <CommandItem
            onSelect={() => runCommand(() => router.push("/settings"))}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
            <CommandShortcut>S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Actions Group */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                window.dispatchEvent(new CustomEvent(OPEN_QUICK_CREATE_TASK_EVENT))
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Task
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/tasks?create=true"))
            }
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Task (Full Page)
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                setTheme(theme === "dark" ? "light" : "dark")
              )
            }
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle Theme
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => logout())}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Keyboard Shortcuts Group */}
        <CommandGroup heading="Keyboard Shortcuts">
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                setTheme(theme === "dark" ? "light" : "dark")
              )
            }
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle Theme
            <CommandShortcut>T</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard"))}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Go to Dashboard
            <CommandShortcut>D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/tasks"))}
          >
            <ListTodo className="mr-2 h-4 w-4" />
            Go to Tasks
            <CommandShortcut>T S</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/kanban"))}
          >
            <Columns3 className="mr-2 h-4 w-4" />
            Go to Kanban
            <CommandShortcut>K</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                window.dispatchEvent(new CustomEvent(OPEN_QUICK_CREATE_TASK_EVENT))
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Task
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                window.dispatchEvent(new CustomEvent(OPEN_KEYBOARD_SHORTCUTS_EVENT))
              )
            }
          >
            <Keyboard className="mr-2 h-4 w-4" />
            Show Keyboard Shortcuts
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Status Filter Group */}
        <CommandGroup heading="Quick Status Filter">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/tasks?status=TODO"))
            }
          >
            <Circle className="mr-2 h-4 w-4 text-slate-400" />
            Show TODO Tasks
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/tasks?status=DOING"))
            }
          >
            <Clock className="mr-2 h-4 w-4 text-amber-500" />
            Show DOING Tasks
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/tasks?status=DONE"))
            }
          >
            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
            Show DONE Tasks
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
