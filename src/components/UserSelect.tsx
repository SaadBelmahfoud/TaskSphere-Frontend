"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import type { UserAdminResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSelectProps {
  /** Currently selected username (assigneeId) */
  value?: string | null;
  /** Callback when a user is selected. Passes the user's username. */
  onValueChange: (username: string | null) => void;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Placeholder text when no user is selected */
  placeholder?: string;
}

/** Role badge color mapping */
const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  MANAGER: "secondary",
  USER: "outline",
};

/**
 * Reusable searchable user selection dropdown.
 * Shows users with avatar initial, full name, email, and role badge.
 * Includes an "Unassigned" option to clear the selection.
 */
export default function UserSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select assignee...",
}: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: users = [], isLoading } = useUsers();

  // Find the currently selected user for display
  const selectedUser = users.find((u) => u.username === value);

  const handleSelect = (username: string) => {
    if (username === "__none__") {
      onValueChange(null);
    } else {
      onValueChange(username);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(null);
  };

  // Get initials from first/last name
  const getInitials = (user: UserAdminResponse) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username?.substring(0, 2).toUpperCase() || "U";
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading users...
              </span>
            ) : selectedUser ? (
              <span className="flex items-center gap-2 truncate">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {getInitials(selectedUser)}
                </span>
                <span className="truncate">
                  {selectedUser.firstName} {selectedUser.lastName}
                </span>
                <span className="text-muted-foreground text-xs truncate hidden sm:inline">
                  {selectedUser.email}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search by name or email..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {/* Unassigned / Clear option */}
                <CommandItem
                  value="__none__"
                  onSelect={() => handleSelect("__none__")}
                  className="cursor-pointer"
                >
                  <span
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                      !value ? "bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    )}
                  >
                    {!value && <Check className="h-3 w-3" />}
                  </span>
                  <span className="text-muted-foreground italic">Unassigned</span>
                </CommandItem>

                {/* User options */}
                {users
                  .filter((u) => u.enabled !== false)
                  .map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`${user.firstName} ${user.lastName} ${user.email} ${user.username}`}
                      onSelect={() => handleSelect(user.username)}
                      className="cursor-pointer"
                    >
                      <span
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                          value === user.username
                            ? "bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {value === user.username && <Check className="h-3 w-3" />}
                      </span>
                      <span className="flex items-center gap-2 w-full min-w-0">
                        {/* Avatar initial */}
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(user)}
                        </span>
                        {/* Name + email */}
                        <span className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </span>
                        {/* Role badge */}
                        <Badge
                          variant={roleBadgeVariant[user.role] || "outline"}
                          className="ml-auto text-[10px] px-1.5 py-0 shrink-0"
                        >
                          {user.role}
                        </Badge>
                      </span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Clear button when a user is selected */}
      {value && !disabled && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={handleClear}
          title="Clear assignee"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Resolve a username to a display name from the users list.
 * Returns a formatted display string or falls back to the raw username.
 */
export function useResolvedUser(username: string | null | undefined) {
  const { data: users = [] } = useUsers();
  if (!username) return null;
  const user = users.find((u) => u.username === username);
  if (!user) return { username, displayName: username, email: null };
  return {
    username,
    displayName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    initials: user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user.username?.substring(0, 2).toUpperCase() || "U",
  };
}
