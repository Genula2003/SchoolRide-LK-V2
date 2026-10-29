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
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Car,
  User,
  ShieldCheck,
  Phone,
  Calendar,
  Eye,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { VerificationStatus, formatSriLankanDateTime } from '@schoolride/shared';

export default function AdminVerificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [queue, setQueue] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Rejection modal
  const [rejectingDriverId, setRejectingDriverId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadQueue = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/admin/verifications');
      setQueue(data || []);
    } catch (err: any) {
      console.error('Failed to load verification queue:', err);
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
      loadQueue();
    }
  }, [user, authLoading, router, loadQueue]);

  const handleApprove = async (driverId: string) => {
    try {
      await api.patch(`/admin/verifications/${driverId}/approve`, {});
      toast.success('Driver credentials verified and operating authority granted!');
      loadQueue();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve driver.');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDriverId) return;

    if (!rejectReason.trim()) {
      toast.error('Please specify a rejection reason for the applicant.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/admin/verifications/${rejectingDriverId}/reject`, {
        reason: rejectReason.trim(),
      });
      toast.info('Driver application rejected and correction requested.');
      setRejectingDriverId(null);
      setRejectReason('');
      loadQueue();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject driver.');
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
              Driver Verification Inspection Queue
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Strict child safety compliance: inspect identity documents, police clearance, and vehicle roadworthiness before granting live status.
          </p>
        </div>

        <Badge variant="warning" className="text-xs font-semibold uppercase tracking-wider shrink-0">
          {queue.length} Pending Applications
        </Badge>
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Verification Queue is Clear"
          description="There are currently no driver applications awaiting administrative review. Outstanding work!"
        />
      ) : (
        <div className="space-y-6">
          {queue.map((driver) => (
            <Card key={driver.id} className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {driver.user?.fullName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Email: {driver.user?.email} • Phone: <strong className="text-foreground">{driver.user?.phone}</strong> • Region:{' '}
                      {driver.user?.district} ({driver.user?.city})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="warning">
                    {driver.verificationStatus}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Applied: {formatSriLankanDateTime(driver.createdAt)}
                  </span>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Service Bio:</strong> {driver.bio || 'No description provided.'}
                <div className="mt-1 flex items-center gap-4 text-[11px]">
                  <span>Driving Experience: <strong className="text-foreground">{driver.experienceYears || 0} years</strong></span>
                  <span>NIC: <strong className="text-foreground font-mono">{driver.nicNumber || 'N/A'}</strong></span>
                  <span>License No: <strong className="text-foreground font-mono">{driver.licenseNumber || 'N/A'}</strong></span>
                </div>
              </div>

              {/* Submitted Documents Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Uploaded Verification Documents ({driver.documents?.length || 0})
                </h4>
                {driver.documents?.length === 0 ? (
                  <p className="text-xs text-amber-600 italic">No documents uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {driver.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-lg border border-border bg-background flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <p className="font-bold text-foreground">{doc.documentType.replace(/_/g, ' ')}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[150px]">
                            {doc.fileName}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                          Submitted
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Registered Vehicles */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Associated Fleet Vehicles ({driver.vehicles?.length || 0})
                </h4>
                {driver.vehicles?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No vehicles registered.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {driver.vehicles.map((v: any) => (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-foreground">
                            {v.make} {v.model} ({v.year})
                          </strong>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {v.licensePlate}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Capacity: {v.capacity} Children • {v.isAirConditioned ? 'A/C Equipped' : 'Non A/C'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approval Action Bar */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectingDriverId(driver.id)}
                  className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject Application
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(driver.id)}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve & Grant Operating Authority
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Reason Dialog */}
      <Dialog open={!!rejectingDriverId} onOpenChange={(open) => !open && setRejectingDriverId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Driver Application</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleReject} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Rejection Reason & Required Corrections *
              </label>
              <Textarea
                rows={4}
                placeholder="e.g. Driving license image is unreadable. Please provide a clear scan showing the expiration date and heavy vehicle endorsement."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectingDriverId(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
