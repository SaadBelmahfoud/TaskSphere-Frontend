"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAdminUsers, useChangeRole, useToggleUserStatus } from "@/hooks/useAdmin";
import type { UserRole, UserAdminResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, UserCog, Search, Users, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const roleConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  ADMIN: { variant: "default", color: "bg-primary/10 text-primary" },
  MANAGER: { variant: "secondary", color: "bg-amber/10 text-amber" },
  USER: { variant: "outline", color: "bg-muted text-muted-foreground" },
};

export default function AdminPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const { data: users, isLoading } = useAdminUsers();
  const changeRole = useChangeRole();
  const toggleStatus = useToggleUserStatus();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      router.replace("/");
    } else if (auth.role !== "ADMIN") {
      router.replace("/tasks");
    }
  }, [auth, router]);

  if (!auth?.isAuthenticated || auth.role !== "ADMIN") return null;

  const filteredUsers = users?.filter((user: UserAdminResponse) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(q) ||
      user.username?.toLowerCase().includes(q) ||
      user.firstName?.toLowerCase().includes(q) ||
      user.lastName?.toLowerCase().includes(q)
    );
  });

  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter((u: UserAdminResponse) => u.enabled).length || 0;
  const disabledUsers = totalUsers - activeUsers;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-teal/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal/10">
                <UserCheck className="h-5 w-5 text-teal" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{disabledUsers}</p>
                <p className="text-xs text-muted-foreground">Disabled</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* User cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user: UserAdminResponse) => {
              const roleConf = roleConfig[user.role] || roleConfig.USER;
              return (
                <Card key={user.id} className={cn("transition-all", !user.enabled && "opacity-60")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={cn("text-sm", roleConf.color)}>
                            {user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant={roleConf.variant} className={cn("text-xs", roleConf.color)}>
                        {user.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-14 shrink-0">Role:</span>
                      <Select
                        value={user.role}
                        onValueChange={(val) =>
                          changeRole.mutate({ userId: user.id, role: val as UserRole })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">USER</SelectItem>
                          <SelectItem value="MANAGER">MANAGER</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs font-medium",
                        user.enabled ? "text-teal" : "text-destructive"
                      )}>
                        {user.enabled ? "● Enabled" : "● Disabled"}
                      </span>
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant={user.enabled ? "destructive" : "default"}
                            size="sm"
                            className="h-7 text-xs"
                          >
                            <UserCog className="mr-1 h-3 w-3" />
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
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">No users found</p>
            {searchQuery && (
              <p className="text-sm mt-1">Try adjusting your search query</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
