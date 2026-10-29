'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  History,
  ShieldCheck,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { formatSriLankanDateTime } from '@schoolride/shared';

export default function AdminAuditLogsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadLogs = React.useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const data = await api.get(`/admin/audit-logs?page=${p}&limit=25`);
      setLogs(data.data || []);
      setTotalCount(data.total || 0);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }
    if (user) {
      loadLogs(page);
    }
  }, [user, authLoading, router, page, loadLogs]);

  if (isLoading && logs.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / 25) || 1;

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
              Security & Administrative Audit Logs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Immutable system audit records of authentications, credential validations, status changes, and administrative actions.
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-xs">
          {totalCount} Total Events
        </Badge>
      </div>

      {/* Audit Log Table */}
      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-muted/60 text-muted-foreground uppercase font-bold border-b border-border">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    {formatSriLankanDateTime(log.createdAt)}
                  </td>

                  <td className="py-3 px-4">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {log.action}
                    </Badge>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-sans font-bold text-foreground">
                      {log.actorUser?.fullName || 'System'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {log.actorUser?.role || 'SYSTEM'}
                    </p>
                  </td>

                  <td className="py-3 px-4 text-muted-foreground">
                    {log.resourceType || 'GLOBAL'}
                  </td>

                  <td className="py-3 px-4 text-foreground/90 max-w-sm truncate font-sans">
                    {log.details || '-'}
                  </td>

                  <td className="py-3 px-4 text-muted-foreground text-[11px]">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
