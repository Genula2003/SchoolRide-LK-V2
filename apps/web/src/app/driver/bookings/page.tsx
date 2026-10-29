'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bus,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Calendar,
  ArrowLeft,
  User,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatLKR, BookingStatus, formatSriLankanDateTime } from '@schoolride/shared';

export default function DriverBookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = React.useState<any[]>([]);
  const [filter, setFilter] = React.useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'ARCHIVED'>('PENDING');
  const [isLoading, setIsLoading] = React.useState(true);

  // Reject modal state
  const [rejectingBookingId, setRejectingBookingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadBookings = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/bookings');
      setBookings(data || []);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'DRIVER')) {
      router.push('/login');
      return;
    }
    if (user) {
      loadBookings();
    }
  }, [user, authLoading, router, loadBookings]);

  const handleAccept = async (bookingId: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        targetStatus: BookingStatus.ACCEPTED,
      });
      toast.success('Transport booking accepted! Passenger added to manifest.');
      loadBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept booking request.');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBookingId) return;

    setIsSubmitting(true);
    try {
      await api.patch(`/bookings/${rejectingBookingId}/status`, {
        targetStatus: BookingStatus.REJECTED,
        reason: rejectReason.trim() || undefined,
      });
      toast.info('Booking request declined.');
      setRejectingBookingId(null);
      setRejectReason('');
      loadBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'PENDING') return b.status === BookingStatus.PENDING;
    if (filter === 'ACCEPTED') return b.status === BookingStatus.ACCEPTED || b.status === BookingStatus.ACTIVE;
    if (filter === 'ARCHIVED') return b.status === BookingStatus.COMPLETED || b.status === BookingStatus.REJECTED || b.status === BookingStatus.CANCELLED;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/driver/dashboard" className="text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Booking Requests & Passengers
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Review transport inquiries submitted by parents, verify route feasibility, and accept enrollments.
          </p>
        </div>

        <Tabs value={filter} onValueChange={(val) => setFilter(val as any)}>
          <TabsList>
            <TabsTrigger value="PENDING">
              Pending ({bookings.filter((b) => b.status === 'PENDING').length})
            </TabsTrigger>
            <TabsTrigger value="ACCEPTED">
              Active ({bookings.filter((b) => b.status === 'ACCEPTED' || b.status === 'ACTIVE').length})
            </TabsTrigger>
            <TabsTrigger value="ARCHIVED">History</TabsTrigger>
            <TabsTrigger value="ALL">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={Bus}
          title="No Bookings in this Category"
          description="There are currently no transport bookings matching this filter status."
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isPending = b.status === BookingStatus.PENDING;
            const isAccepted = b.status === BookingStatus.ACCEPTED;
            const isActive = b.status === BookingStatus.ACTIVE;

            return (
              <Card key={b.id} className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {b.child?.firstName} {b.child?.lastName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Grade: <strong className="text-foreground">{b.child?.grade}</strong> • School:{' '}
                        <strong className="text-foreground">{b.child?.school?.name}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        isActive || isAccepted
                          ? 'success'
                          : isPending
                          ? 'warning'
                          : 'secondary'
                      }
                      className="text-xs font-semibold"
                    >
                      {b.status}
                    </Badge>
                    <span className="text-xs font-extrabold text-primary font-mono ml-2">
                      {formatLKR(b.monthlyFeeMinorUnits)}/mo
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground flex items-start gap-1.5">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span>
                        <strong>Pickup Address:</strong> {b.pickupAddress}
                      </span>
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        Morning Pickup: <strong>{b.pickupTimeMorning || '06:45'}</strong> • Return:{' '}
                        <strong>{b.dropoffTimeAfternoon || '14:30'}</strong>
                      </span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        Parent: <strong>{b.parent?.user?.fullName}</strong>
                      </span>
                    </p>
                    {b.parent?.user?.phone && (
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>
                          Contact:{' '}
                          <a href={`tel:${b.parent.user.phone}`} className="text-primary hover:underline font-mono">
                            {b.parent.user.phone}
                          </a>
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {b.notes && (
                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground italic">
                    Parent note: "{b.notes}"
                  </div>
                )}

                {/* Actions for Pending Requests */}
                {isPending && (
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectingBookingId(b.id)}
                      className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Decline Request
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAccept(b.id)}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept Enrollment
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Decline Reason Dialog */}
      <Dialog open={!!rejectingBookingId} onOpenChange={(open) => !open && setRejectingBookingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Decline Booking Request</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleReject} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Reason for Declining (Optional)
              </label>
              <Textarea
                rows={3}
                placeholder="e.g. Van capacity reached for this school route, or pickup address outside coverage corridor."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectingBookingId(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Declining...' : 'Confirm Decline'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
