'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  Users,
  Bus,
  AlertTriangle,
  Radio,
  FileCheck,
  School,
  History,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { formatSriLankanDateTime } from '@schoolride/shared';

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }

    async function loadOverview() {
      setIsLoading(true);
      try {
        const data = await api.get('/admin/overview');
        setOverview(data);
      } catch (err: any) {
        console.error('Failed to load admin overview:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadOverview();
    }
  }, [user, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  const m = overview?.metrics || {};
  const logs = overview?.recentAuditLogs || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Administrative Control Center
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs font-bold uppercase">
              Root Authority
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time platform oversight, safety verification queues, school references, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/verifications">
            <Button variant="primary" size="sm" className="shadow-subtle">
              <FileCheck className="h-4 w-4 mr-1.5" /> Verification Queue ({m.pendingVerifications || 0})
            </Button>
          </Link>
          <Link href="/admin/complaints">
            <Button variant="outline" size="sm" className="text-amber-600 border-amber-200">
              <AlertTriangle className="h-4 w-4 mr-1.5" /> Moderation ({m.openComplaints || 0})
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered Users */}
        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Users</p>
            <h3 className="text-2xl font-extrabold text-foreground">{m.totalUsers || 0}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {m.totalParents || 0} Parents • {m.totalDrivers || 0} Drivers
            </p>
          </div>
        </Card>

        {/* Pending Verifications */}
        <Link href="/admin/verifications" className="block">
          <Card className="p-5 flex items-center gap-4 hover:border-amber-500/50 transition-colors cursor-pointer">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Verifications</p>
              <h3 className="text-2xl font-extrabold text-foreground">{m.pendingVerifications || 0}</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                {m.verifiedDrivers || 0} Verified Drivers
              </p>
            </div>
          </Card>
        </Link>

        {/* Active Rides */}
        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Telemetry Rides</p>
            <h3 className="text-2xl font-extrabold text-foreground">{m.activeRides || 0}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Live in transit right now
            </p>
          </div>
        </Card>

        {/* Open Safety Complaints */}
        <Link href="/admin/complaints" className="block">
          <Card className="p-5 flex items-center gap-4 hover:border-destructive/50 transition-colors cursor-pointer">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Open Concerns</p>
              <h3 className="text-2xl font-extrabold text-foreground">{m.openComplaints || 0}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Requires administrative review</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/verifications" className="block">
          <Card className="p-5 space-y-2 hover:border-primary/50 transition-colors h-full">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileCheck className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Driver Verifications</h3>
            <p className="text-xs text-muted-foreground">
              Review driving licenses, NICs, vehicle inspection documents, and approve operating permissions.
            </p>
          </Card>
        </Link>

        <Link href="/admin/users" className="block">
          <Card className="p-5 space-y-2 hover:border-primary/50 transition-colors h-full">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-bold text-foreground">User Management</h3>
            <p className="text-xs text-muted-foreground">
              Inspect parent and driver accounts, enforce suspensions, and manage authorization levels.
            </p>
          </Card>
        </Link>

        <Link href="/admin/schools" className="block">
          <Card className="p-5 space-y-2 hover:border-primary/50 transition-colors h-full">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <School className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Schools Directory</h3>
            <p className="text-xs text-muted-foreground">
              Maintain official reference coordinates for government, private, and international schools across Sri Lanka.
            </p>
          </Card>
        </Link>
      </div>

      {/* Recent Security & Administrative Audit Logs */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="text-base font-bold text-foreground">Recent Administrative Audit Logs</h3>
          </div>
          <Link href="/admin/audit-logs" className="text-xs font-semibold text-primary hover:underline">
            View Complete Audit Log
          </Link>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No recent audit events recorded.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {logs.map((log: any) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono font-bold text-primary mr-2">[{log.action}]</span>
                  <span className="text-foreground">{log.details || log.resourceType}</span>
                  <span className="text-muted-foreground ml-2">
                    by <strong>{log.actorUser?.fullName || 'System'}</strong> ({log.actorUser?.role || 'SYSTEM'})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px] shrink-0">
                  {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                  <span>{formatSriLankanDateTime(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
