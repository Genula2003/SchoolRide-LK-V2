'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  User,
  Bus,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { ComplaintStatus, formatSriLankanDateTime } from '@schoolride/shared';

export default function AdminComplaintsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = React.useState<any[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'OPEN' | 'RESOLVED'>('OPEN');
  const [isLoading, setIsLoading] = React.useState(true);

  // Moderation modal
  const [resolvingComplaint, setResolvingComplaint] = React.useState<any>(null);
  const [resolutionStatus, setResolutionStatus] = React.useState(ComplaintStatus.RESOLVED);
  const [resolutionNotes, setResolutionNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadComplaints = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/complaints');
      setComplaints(data || []);
    } catch (err: any) {
      console.error('Failed to load complaints:', err);
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
      loadComplaints();
    }
  }, [user, authLoading, router, loadComplaints]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    if (!resolutionNotes.trim()) {
      toast.error('Please enter resolution notes describing the moderation outcome.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/complaints/${resolvingComplaint.id}/resolve`, {
        status: resolutionStatus,
        resolutionNotes: resolutionNotes.trim(),
      });
      toast.success('Incident ticket resolved and parties notified.');
      setResolvingComplaint(null);
      setResolutionNotes('');
      loadComplaints();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const filtered = complaints.filter((c) => {
    if (statusFilter === 'OPEN') return c.status === 'OPEN' || c.status === 'UNDER_INVESTIGATION';
    if (statusFilter === 'RESOLVED') return c.status === 'RESOLVED' || c.status === 'DISMISSED';
    return true;
  });

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
              Safety Complaints & Incident Moderation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Investigate safety reports, driving infractions, route deviations, and enforce accountability.
          </p>
        </div>

        <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
          <TabsList>
            <TabsTrigger value="OPEN">
              Active ({complaints.filter((c) => c.status === 'OPEN' || c.status === 'UNDER_INVESTIGATION').length})
            </TabsTrigger>
            <TabsTrigger value="RESOLVED">
              Resolved ({complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'DISMISSED').length})
            </TabsTrigger>
            <TabsTrigger value="ALL">All ({complaints.length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Complaints List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Incident Reports in this View"
          description="There are currently no tickets matching the active moderation filter."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const isOpen = c.status === 'OPEN';
            const isResolved = c.status === 'RESOLVED';

            return (
              <Card key={c.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{c.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Ticket #{c.id.slice(0, 8)} • Category: <strong className="text-foreground">{c.category.replace(/_/g, ' ')}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={isOpen ? 'warning' : isResolved ? 'success' : 'secondary'}>
                      {c.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatSriLankanDateTime(c.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/40 p-4 rounded-xl border border-border">
                  {c.description}
                </div>

                {/* Parties Involved */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/20 p-3 rounded-lg border border-border/60">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Reported By</span>
                    <strong className="text-foreground">{c.createdByUser?.fullName || 'Parent'}</strong> ({c.createdByUser?.role}) • {c.createdByUser?.phone || 'No phone'}
                  </div>

                  {c.targetUser && (
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Subject Driver / User</span>
                      <strong className="text-foreground">{c.targetUser.fullName}</strong> • {c.targetUser.phone}
                    </div>
                  )}
                </div>

                {/* Resolution Notes if Resolved */}
                {c.resolutionNotes && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Administrative Resolution Notes
                    </p>
                    <p className="text-foreground/80">{c.resolutionNotes}</p>
                    {c.resolvedAt && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Concluded: {formatSriLankanDateTime(c.resolvedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Button */}
                {isOpen && (
                  <div className="flex justify-end pt-2 border-t border-border">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setResolvingComplaint(c);
                        setResolutionStatus(ComplaintStatus.RESOLVED);
                        setResolutionNotes('');
                      }}
                      className="font-bold bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 mr-1.5" /> Moderate & Resolve Incident
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Resolution Dialog */}
      <Dialog open={!!resolvingComplaint} onOpenChange={(open) => !open && setResolvingComplaint(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Administrative Resolution</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleResolve} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Moderation Outcome *
              </label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value as any)}
              >
                <option value={ComplaintStatus.RESOLVED}>Resolved (Corrective Action Taken)</option>
                <option value={ComplaintStatus.UNDER_REVIEW}>Escalate (Under Ongoing Investigation)</option>
                <option value={ComplaintStatus.DISMISSED}>Dismiss (Unsubstantiated / Inapplicable)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Administrative Notes & Conclusion *
              </label>
              <Textarea
                rows={4}
                placeholder="State the findings of the investigation, driver response, and corrective measures enforced..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResolvingComplaint(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Submit Resolution'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
