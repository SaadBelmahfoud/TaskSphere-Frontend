'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { useAllUsersQuery, useUpdateUserRoleMutation, useToggleUserStatusMutation } from '@/hooks/useAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, ShieldAlert, Users } from 'lucide-react';

const roleVariant: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
  ADMIN: { variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200' },
  MANAGER: { variant: 'default', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  USER: { variant: 'secondary', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  USER: 'User',
};

export default function AdminPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [confirmTarget, setConfirmTarget] = useState<{ userId: string; username: string; currentStatus: boolean } | null>(null);

  const { data: users, isLoading, isError } = useAllUsersQuery();
  const updateRoleMutation = useUpdateUserRoleMutation();
  const toggleStatusMutation = useToggleUserStatusMutation();

  // Redirect non-admin users
  useEffect(() => {
    if (!auth.isLoading && auth.role !== 'ADMIN') {
      router.push('/tasks');
    }
  }, [auth.role, auth.isLoading, router]);

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleToggleStatus = () => {
    if (!confirmTarget) return;
    toggleStatusMutation.mutate(confirmTarget.userId, {
      onSuccess: () => setConfirmTarget(null),
    });
  };

  const formatUserStatus = (enabled: boolean) => {
    return enabled ? (
      <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-emerald-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Disabled
      </Badge>
    );
  };

  // Don't render anything while checking auth
  if (auth.isLoading || auth.role !== 'ADMIN') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16">
          <Skeleton className="h-8 w-48" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            Administration
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            User and role management
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-destructive/50">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">
                Error loading users
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {users?.length ?? 0} user{users?.length !== 1 ? 's' : ''} registered
              </span>
            </div>

            <div className="space-y-3">
              {users && users.length > 0 ? (
                users.map((user) => {
                  const role = roleVariant[user.role] || roleVariant.USER;
                  return (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          {/* Avatar */}
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>

                          {/* User info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {user.firstName} {user.lastName}
                              <span className="text-muted-foreground font-normal ml-1">
                                (@{user.username})
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>

                          {/* Role */}
                          <div className="flex items-center gap-2">
                            <Badge variant={role.variant} className={role.className}>
                              {roleLabels[user.role] || user.role}
                            </Badge>
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              disabled={updateRoleMutation.isPending}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="USER">User</option>
                              <option value="MANAGER">Manager</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>

                          {/* Status + Actions */}
                          <div className="flex items-center gap-2">
                            {formatUserStatus(user.enabled)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setConfirmTarget({
                                  userId: user.id,
                                  username: user.username,
                                  currentStatus: user.enabled,
                                })
                              }
                              disabled={toggleStatusMutation.isPending}
                              className={
                                user.enabled
                                  ? 'text-red-600 border-red-200 hover:bg-red-50'
                                  : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                              }
                            >
                              {user.enabled ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Disable</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Enable</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No registered users</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmTarget}
        title={
          confirmTarget?.currentStatus
            ? 'Disable user'
            : 'Re-enable user'
        }
        message={
          confirmTarget
            ? confirmTarget.currentStatus
              ? `Are you sure you want to disable user @${confirmTarget.username}? They will not be able to log in.`
              : `Are you sure you want to re-enable user @${confirmTarget.username}?`
            : ''
        }
        confirmLabel={
          confirmTarget?.currentStatus ? 'Disable' : 'Enable'
        }
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmTarget(null)}
        isLoading={toggleStatusMutation.isPending}
      />
    </AppLayout>
  );
}
