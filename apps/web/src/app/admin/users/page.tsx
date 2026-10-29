'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Search,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  UserCheck,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { AccountStatus, UserRole, formatSriLankanDateTime } from '@schoolride/shared';

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = React.useState<any[]>([]);
  const [roleFilter, setRoleFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  // Suspend modal state
  const [suspendingUser, setSuspendingUser] = React.useState<any>(null);
  const [suspendReason, setSuspendReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('query', searchQuery.trim());

      const data = await api.get(`/admin/users?${params.toString()}`);
      setUsers(data || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, statusFilter, searchQuery]);

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }
    if (user) {
      loadUsers();
    }
  }, [user, authLoading, router, loadUsers]);

  const handleUpdateStatus = async (targetUser: any, status: AccountStatus, reason?: string) => {
    try {
      await api.patch(`/admin/users/${targetUser.id}/status`, {
        status,
        reason,
      });
      toast.success(`User account status updated to ${status}`);
      setSuspendingUser(null);
      setSuspendReason('');
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Platform User Directory & Moderation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Search, inspect, and manage accounts for registered parents, van drivers, and administrative staff.
          </p>
        </div>

        <span className="text-xs font-mono text-muted-foreground">
          {users.length} Records Found
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone number..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <select
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value={UserRole.PARENT}>Parents</option>
            <option value={UserRole.DRIVER}>Van Operators</option>
            <option value={UserRole.ADMIN}>Administrators</option>
          </select>
        </div>

        <div>
          <select
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value={AccountStatus.ACTIVE}>Active</option>
            <option value={AccountStatus.SUSPENDED}>Suspended</option>
            <option value={AccountStatus.PENDING_VERIFICATION}>Pending</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground uppercase font-bold border-b border-border">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">District / City</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {users.map((u) => {
                const isActive = u.status === AccountStatus.ACTIVE;
                const isSuspended = u.status === AccountStatus.SUSPENDED;

                return (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground">{u.fullName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{u.email}</p>
                      {u.phone && <p className="text-[10px] text-muted-foreground">{u.phone}</p>}
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          u.role === UserRole.ADMIN
                            ? 'destructive'
                            : u.role === UserRole.DRIVER
                            ? 'primary'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {u.role}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={isActive ? 'success' : isSuspended ? 'destructive' : 'warning'}
                        className="text-[10px]"
                      >
                        {u.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">
                      {u.district || 'Colombo'}{u.city ? `, ${u.city}` : ''}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {formatSriLankanDateTime(u.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {u.role !== UserRole.ADMIN && (
                        isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSuspendingUser(u)}
                            className="text-[11px] text-destructive hover:bg-destructive/10 border-destructive/30 h-7 px-2"
                          >
                            <UserX className="h-3 w-3 mr-1" /> Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(u, AccountStatus.ACTIVE)}
                            className="text-[11px] text-emerald-600 hover:bg-emerald-50 border-emerald-500/30 h-7 px-2"
                          >
                            <UserCheck className="h-3 w-3 mr-1" /> Reactivate
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Suspend Confirmation Dialog */}
      <Dialog open={!!suspendingUser} onOpenChange={(open) => !open && setSuspendingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend User Account</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsSubmitting(true);
              handleUpdateStatus(suspendingUser, AccountStatus.SUSPENDED, suspendReason);
            }}
            className="space-y-4 py-2"
          >
            <p className="text-xs text-muted-foreground">
              Are you sure you want to suspend <strong>{suspendingUser?.fullName}</strong>? This will revoke active sessions and prevent login.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Reason for Suspension *
              </label>
              <Textarea
                rows={3}
                placeholder="e.g. Violation of safety terms, unverified identity, or repeated complaint reports."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSuspendingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Suspending...' : 'Confirm Suspension'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
