"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAdminUsers, useChangeRole, useToggleUserStatus } from "@/hooks/useAdmin";
import type { UserRole, UserAdminResponse } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Users,
  UserCog,
  Search,
  LayoutGrid,
  List,
  CalendarDays,
  UserCheck,
  Crown,
  ShieldCheck,
} from "lucide-react";

const roleVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ADMIN: "default",
  MANAGER: "secondary",
  USER: "outline",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  MANAGER: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  USER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch {
    return "";
  }
}

export default function AdminPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const { data: users, isLoading } = useAdminUsers();
  const changeRole = useChangeRole();
  const toggleStatus = useToggleUserStatus();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      router.replace("/");
    } else if (auth.role !== "ADMIN") {
      router.replace("/tasks");
    }
  }, [auth, router]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let result = users;

    // Role filter
    if (roleFilter !== "ALL") {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, roleFilter, search]);

  const stats = useMemo(() => {
    if (!users) return { total: 0, active: 0, admins: 0, managers: 0 };
    return {
      total: users.length,
      active: users.filter((u) => u.enabled).length,
      admins: users.filter((u) => u.role === "ADMIN").length,
      managers: users.filter((u) => u.role === "MANAGER").length,
    };
  }, [users]);

  if (!auth?.isAuthenticated || auth.role !== "ADMIN") return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</p>
                  <p className="text-2xl font-bold mt-1">{stats.active}</p>
                </div>
                <UserCheck className="h-8 w-8 text-emerald-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admins</p>
                  <p className="text-2xl font-bold mt-1">{stats.admins}</p>
                </div>
                <Crown className="h-8 w-8 text-amber-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Managers</p>
                  <p className="text-2xl font-bold mt-1">{stats.managers}</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-violet-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar: Search + Role Filter + View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or username..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-9">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden md:flex items-center border rounded-md">
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              className="h-9 rounded-r-none"
              onClick={() => setViewMode("card")}
              aria-label="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-9 rounded-l-none"
              onClick={() => setViewMode("table")}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results count */}
        {search.trim() || roleFilter !== "ALL" ? (
          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users?.length ?? 0} users
          </p>
        ) : null}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-lg" />
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            {/* Card View — always visible on mobile, toggleable on desktop */}
            <div className={viewMode === "card" ? "" : "hidden md:hidden"}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user: UserAdminResponse) => (
                  <Card key={user.id} className={`overflow-hidden transition-shadow hover:shadow-md ${!user.enabled ? "opacity-60" : ""}`}>
                    <CardContent className="p-5 space-y-4">
                      {/* User header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-11 w-11 shrink-0">
                            <AvatarFallback className={`${user.enabled ? "bg-primary/10" : "bg-muted"}`}>
                              {user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            <p className="text-xs text-muted-foreground/70 truncate">@{user.username}</p>
                          </div>
                        </div>
                        <Badge
                          className={`shrink-0 text-xs font-semibold ${roleColors[user.role] || ""}`}
                          variant={roleVariant[user.role] || "outline"}
                        >
                          {user.role}
                        </Badge>
                      </div>

                      {/* Join date */}
                      {user.createdAt && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>Joined {formatDate(user.createdAt)}</span>
                          <span className="text-muted-foreground/60">({formatRelativeTime(user.createdAt)})</span>
                        </div>
                      )}

                      {/* Last login */}
                      {user.lastLogin && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Last active {formatRelativeTime(user.lastLogin)}</span>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t" />

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground shrink-0">Role:</span>
                          <Select
                            value={user.role}
                            onValueChange={(val) =>
                              changeRole.mutate({ userId: user.id, role: val as UserRole })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="MANAGER">Manager</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant={user.enabled ? "destructive" : "default"}
                              size="sm"
                              className="h-8 text-xs shrink-0"
                            >
                              <UserCog className="mr-1 h-3.5 w-3.5" />
                              {user.enabled ? "Disable" : "Enable"}
                            </Button>
                          }
                          title={`${user.enabled ? "Disable" : "Enable"} User`}
                          description={`Are you sure you want to ${user.enabled ? "disable" : "enable"} ${user.firstName} ${user.lastName}?`}
                          onConfirm={() => toggleStatus.mutate(user.id)}
                          confirmText={user.enabled ? "Disable" : "Enable"}
                          variant={user.enabled ? "destructive" : "default"}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Table View — hidden on mobile, toggleable on desktop */}
            <div className={`hidden md:block ${viewMode === "table" ? "" : "hidden"}`}>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: UserAdminResponse) => (
                        <TableRow key={user.id} className={!user.enabled ? "opacity-60" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={user.enabled ? "bg-primary/10" : "bg-muted"}>
                                  {user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs font-semibold ${roleColors[user.role] || ""}`}
                              variant={roleVariant[user.role] || "outline"}
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.enabled ? "outline" : "destructive"} className="text-xs">
                              {user.enabled ? "Active" : "Disabled"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Select
                                value={user.role}
                                onValueChange={(val) =>
                                  changeRole.mutate({ userId: user.id, role: val as UserRole })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs w-[110px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USER">User</SelectItem>
                                  <SelectItem value="MANAGER">Manager</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <ConfirmDialog
                                trigger={
                                  <Button
                                    variant={user.enabled ? "destructive" : "default"}
                                    size="sm"
                                    className="h-8 text-xs"
                                  >
                                    <UserCog className="mr-1 h-3.5 w-3.5" />
                                    {user.enabled ? "Disable" : "Enable"}
                                  </Button>
                                }
                                title={`${user.enabled ? "Disable" : "Enable"} User`}
                                description={`Are you sure you want to ${user.enabled ? "disable" : "enable"} ${user.firstName} ${user.lastName}?`}
                                onConfirm={() => toggleStatus.mutate(user.id)}
                                confirmText={user.enabled ? "Disable" : "Enable"}
                                variant={user.enabled ? "destructive" : "default"}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No users found</p>
            {(search.trim() || roleFilter !== "ALL") && (
              <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
