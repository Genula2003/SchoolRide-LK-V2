'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Plus,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  FileText,
  Bus,
} from 'lucide-react';
import { toast } from 'sonner';
import { ComplaintCategory, formatSriLankanDateTime } from '@schoolride/shared';

export default function ParentComplaintsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = React.useState<any[]>([]);
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    bookingId: '',
    category: ComplaintCategory.SAFETY,
    title: '',
    description: '',
  });

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [compRes, bookRes] = await Promise.all([
        api.get('/complaints/my').catch(() => []),
        api.get('/bookings').catch(() => []),
      ]);
      setComplaints(compRes);
      setBookings(bookRes);
    } catch (err: any) {
      console.error('Failed to load complaints:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'PARENT')) {
      router.push('/login');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, router, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please enter both a title and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find driver userId if bookingId is selected
      let targetUserId: string | undefined = undefined;
      if (formData.bookingId) {
        const found = bookings.find((b) => b.id === formData.bookingId);
        targetUserId = found?.driverProfile?.userId;
      }

      await api.post('/complaints', {
        bookingId: formData.bookingId || undefined,
        targetUserId: targetUserId || undefined,
        category: formData.category,
        title: formData.title.trim(),
        description: formData.description.trim(),
      });

      toast.success('Your concern has been submitted to SchoolRide Trust & Safety team.');
      setIsDialogOpen(false);
      setFormData({
        bookingId: '',
        category: ComplaintCategory.SAFETY,
        title: '',
        description: '',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="warning">Submitted</Badge>;
      case 'UNDER_INVESTIGATION':
        return <Badge variant="primary">Under Investigation</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">Resolved</Badge>;
      case 'DISMISSED':
        return <Badge variant="secondary">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/parent/dashboard" className="text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Safety & Concerns Portal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Report any safety concerns, schedule deviations, or driver misconduct. Our administrative team investigates every report.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsDialogOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-subtle shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> File Incident Report
        </Button>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No Incident Reports Filed"
          description="You haven't filed any complaints or safety reports. If you experience an issue with driving standards, vehicle hygiene, or punctuality, report it here for immediate moderation."
          action={{
            label: 'Report a Concern',
            onClick: () => setIsDialogOpen(true),
          }}
        />
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <Card key={c.id} className="p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{c.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Ticket #{c.id.slice(0, 8)} • Category: <strong className="text-foreground">{c.category.replace('_', ' ')}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(c.status)}
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {formatSriLankanDateTime(c.createdAt)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border/50">
                {c.description}
              </div>

              {c.booking && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Bus className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Linked Booking: {c.booking.child?.firstName} {c.booking.child?.lastName} with {c.booking.driverProfile?.user?.fullName || 'Driver'}
                  </span>
                </div>
              )}

              {/* Admin Resolution Section */}
              {c.resolutionNotes && (
                <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Administrative Resolution
                  </p>
                  <p className="text-foreground/80">{c.resolutionNotes}</p>
                  {c.resolvedAt && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Resolved: {formatSriLankanDateTime(c.resolvedAt)}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog for Filing Complaint */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>File a Safety Incident or Concern</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Incident Category *
              </label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value={ComplaintCategory.SAFETY}>Reckless or Dangerous Driving</option>
                <option value={ComplaintCategory.PUNCTUALITY}>Chronic Tardiness / Missed Trips</option>
                <option value={ComplaintCategory.BEHAVIOR}>Unprofessional or Inappropriate Behavior</option>
                <option value={ComplaintCategory.VEHICLE_CONDITION}>Unsafe / Poor Vehicle Condition</option>
                <option value={ComplaintCategory.BILLING}>Disputed Fees or Billing</option>
                <option value={ComplaintCategory.OTHER}>Other Operational Incident</option>
              </select>
            </div>

            {/* Linked Booking */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Related Transport Booking (Optional)
              </label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.bookingId}
                onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
              >
                <option value="">-- No specific booking linked --</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.child?.firstName} {b.child?.lastName} (Driver: {b.driverProfile?.user?.fullName || 'Assigned'})
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Incident Subject *
              </label>
              <Input
                placeholder="e.g. Overcrowding on morning route, driver using mobile phone"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Detailed Description & Date/Time *
              </label>
              <Textarea
                rows={4}
                placeholder="Provide specific details including time of day, location, and nature of the occurrence..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700">
                {isSubmitting ? 'Submitting Report...' : 'Submit Incident Report'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
