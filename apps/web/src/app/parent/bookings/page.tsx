'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bus,
  Calendar,
  Clock,
  Star,
  MapPin,
  XCircle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { formatLKR, formatSriLankanDateTime } from '@schoolride/shared';
import { toast } from 'sonner';

export default function ParentBookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [reviewBookingId, setReviewBookingId] = React.useState<string | null>(null);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);

  // Selected Booking Details Modal
  const [selectedBooking, setSelectedBooking] = React.useState<any | null>(null);

  const fetchBookings = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/bookings');
      setBookings(res);
    } catch {
      setBookings([]);
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
      fetchBookings();
    }
  }, [user, authLoading, router, fetchBookings]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking request?')) {
      return;
    }

    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        targetStatus: 'CANCELLED',
        reason: 'Cancelled by parent',
      });
      toast.success('Booking cancelled.');
      fetchBookings();
      if (selectedBooking) setSelectedBooking(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking.');
    }
  };

  const handleOpenReviewModal = (booking: any) => {
    setReviewBookingId(booking.id);
    setRating(5);
    setComment('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBookingId || !comment.trim()) {
      toast.error('Please enter a review comment.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.post('/reviews', {
        bookingId: reviewBookingId,
        rating,
        comment,
      });
      toast.success('Thank you! Your verified review has been submitted.');
      setReviewModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 w-full text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <Link href="/parent/dashboard" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center mb-1">
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Transportation Bookings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Review status history, manage active transport arrangements, and rate completed services.
          </p>
        </div>

        <Link href="/drivers">
          <Button variant="primary" size="sm" className="shadow-subtle">
            <Bus className="h-4 w-4 mr-1" /> Request New Van
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<Bus className="h-8 w-8" />}
          title="No bookings recorded"
          description="You haven't requested any school transport services yet. Explore verified drivers to get started."
          actionLabel="Find a School Van"
          onAction={() => router.push('/drivers')}
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isCompleted = booking.status === 'COMPLETED';
            const isActive = booking.status === 'ACTIVE';
            const isPending = booking.status === 'PENDING';
            const isAccepted = booking.status === 'ACCEPTED';
            const hasReview = Boolean(booking.review);

            return (
              <Card
                key={booking.id}
                className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/40 transition-colors"
              >
                {/* Left details */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base shrink-0 border border-primary/20">
                    {booking.child?.firstName[0]}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        {booking.child?.firstName} {booking.child?.lastName}
                      </h3>
                      <Badge
                        variant={
                          isActive
                            ? 'success'
                            : isPending
                            ? 'warning'
                            : isAccepted
                            ? 'info'
                            : isCompleted
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {booking.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        #{booking.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        Driver: <strong className="text-foreground">{booking.driverProfile?.user?.fullName}</strong> ({booking.driverProfile?.user?.phone})
                      </p>
                      <p>
                        Vehicle: {booking.vehicle?.make} {booking.vehicle?.model} (<span className="font-mono">{booking.vehicle?.licensePlate}</span>)
                      </p>
                      <p className="flex items-center gap-3 pt-0.5 font-medium text-foreground">
                        <span>Morning Pickup: {booking.pickupTimeMorning} AM</span>
                        <span>•</span>
                        <span>Afternoon Dropoff: {booking.dropoffTimeAfternoon}</span>
                        <span>•</span>
                        <span className="font-mono">{formatLKR(booking.monthlyFeeMinorUnits, true)}/mo</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    View Timeline
                  </Button>

                  {isActive && (
                    <Link href="/parent/rides/live">
                      <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                        Track Live
                      </Button>
                    </Link>
                  )}

                  {isCompleted && !hasReview && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenReviewModal(booking)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                    >
                      <Star className="h-3.5 w-3.5 mr-1 fill-current" /> Rate Driver
                    </Button>
                  )}

                  {(isPending || isAccepted) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-destructive hover:bg-destructive/10 text-xs"
                    >
                      Cancel Request
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Details & Status History Timeline Modal */}
      {selectedBooking && (
        <Dialog open={Boolean(selectedBooking)} onOpenChange={() => setSelectedBooking(null)}>
          <DialogHeader>
            <DialogTitle>Booking Details & Status History</DialogTitle>
            <DialogDescription>
              Booking Reference: #{selectedBooking.id.slice(0, 8)} • Child: {selectedBooking.child?.firstName} {selectedBooking.child?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
              <div className="font-semibold text-foreground">Route & Timing Details:</div>
              <p className="text-muted-foreground">Pickup: {selectedBooking.pickupAddress}</p>
              <p className="text-muted-foreground">Dropoff: {selectedBooking.dropoffAddress}</p>
              <p className="text-muted-foreground font-mono">
                Schedule: {selectedBooking.pickupTimeMorning} AM – {selectedBooking.dropoffTimeAfternoon} PM
              </p>
              <p className="text-muted-foreground font-mono font-bold text-foreground">
                Monthly Rate: {formatLKR(selectedBooking.monthlyFeeMinorUnits, true)}
              </p>
            </div>

            {/* Status History Timeline */}
            <div className="space-y-2">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Status Audit Timeline
              </h4>
              <div className="space-y-2 border-l-2 border-primary/30 pl-3">
                {selectedBooking.statusHistory?.map((h: any) => (
                  <div key={h.id} className="relative pb-2">
                    <span className="font-bold text-foreground">{h.toStatus}</span>
                    <span className="text-[10px] text-muted-foreground block">
                      {formatSriLankanDateTime(h.createdAt)}
                    </span>
                    {h.reason && <p className="text-muted-foreground italic mt-0.5">"{h.reason}"</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>
              Close
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* Review Driver Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <form onSubmit={handleSubmitReview}>
          <DialogHeader>
            <DialogTitle>Rate & Review Van Driver</DialogTitle>
            <DialogDescription>
              Share your genuine feedback on safety, punctuality, and care to help fellow Sri Lankan parents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-left">
            {/* Rating Stars */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm font-bold text-foreground ml-2">{rating} of 5 Stars</span>
              </div>
            </div>

            <Textarea
              label="Your Written Feedback"
              placeholder="e.g. Always on time, very cautious driver, courteous and communicates route delays immediately."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewModalOpen(false)}
              disabled={isSubmittingReview}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingReview}>
              Publish Review
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
