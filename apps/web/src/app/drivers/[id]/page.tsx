'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  MapPin,
  Star,
  Bus,
  CheckCircle2,
  Calendar,
  Clock,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { formatLKR, formatSriLankanDateTime } from '@schoolride/shared';
import { toast } from 'sonner';

export default function DriverPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const driverId = params.id as string;

  const [driver, setDriver] = React.useState<any>(null);
  const [childrenList, setChildrenList] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Booking Request Modal State
  const [bookingModalOpen, setBookingModalOpen] = React.useState(false);
  const [selectedChildId, setSelectedChildId] = React.useState('');
  const [selectedVehicleId, setSelectedVehicleId] = React.useState('');
  const [pickupAddress, setPickupAddress] = React.useState('');
  const [dropoffAddress, setDropoffAddress] = React.useState('');
  const [pickupTimeMorning, setPickupTimeMorning] = React.useState('06:30');
  const [dropoffTimeAfternoon, setDropoffTimeAfternoon] = React.useState('14:00');
  const [startDate, setStartDate] = React.useState('2026-02-01');
  const [notes, setNotes] = React.useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = React.useState(false);

  React.useEffect(() => {
    async function loadDriverData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get(`/drivers/${driverId}/public`);
        setDriver(data);
        if (data.vehicles?.length > 0) {
          setSelectedVehicleId(data.vehicles[0].id);
        }

        // If parent is logged in, fetch their children for booking dropdown
        if (user?.role === 'PARENT') {
          const children = await api.get('/parents/me/children').catch(() => []);
          setChildrenList(children);
          if (children.length > 0) {
            setSelectedChildId(children[0].id);
            setPickupAddress(children[0].pickupAddress || '');
            setDropoffAddress(children[0].dropoffAddress || '');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Driver profile not found.');
      } finally {
        setIsLoading(false);
      }
    }
    loadDriverData();
  }, [driverId, user]);

  const handleOpenBookingModal = () => {
    if (!user) {
      toast.info('Please sign in or create a parent account to request a booking.');
      router.push(`/login?redirect=/drivers/${driverId}`);
      return;
    }
    if (user.role !== 'PARENT') {
      toast.error('Only registered parents can submit transport bookings.');
      return;
    }
    if (childrenList.length === 0) {
      toast.info('Please register your child before submitting a transport booking.');
      router.push('/parent/children');
      return;
    }
    setBookingModalOpen(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !selectedVehicleId) {
      toast.error('Please select both a child and a vehicle.');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const selectedChild = childrenList.find((c) => c.id === selectedChildId);
      const primaryArea = driver?.serviceAreas?.[0];
      const monthlyFee = primaryArea?.monthlyRateMinorUnits || 1800000;

      await api.post('/bookings', {
        driverProfileId: driver.id,
        vehicleId: selectedVehicleId,
        childId: selectedChildId,
        pickupAddress: pickupAddress || selectedChild?.pickupAddress || 'Home Address',
        pickupLatitude: selectedChild?.pickupLatitude || 6.8722,
        pickupLongitude: selectedChild?.pickupLongitude || 79.8997,
        dropoffAddress: dropoffAddress || selectedChild?.dropoffAddress || 'School Gate',
        dropoffLatitude: selectedChild?.dropoffLatitude || 6.9066,
        dropoffLongitude: selectedChild?.dropoffLongitude || 79.8617,
        pickupTimeMorning,
        dropoffTimeAfternoon,
        startDate,
        monthlyFeeMinorUnits: monthlyFee,
        notes,
      });

      toast.success('Transport booking request submitted! The driver will review and confirm.');
      setBookingModalOpen(false);
      router.push('/parent/bookings');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit booking request.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Driver Not Available</h2>
        <p className="text-xs text-muted-foreground">{error || 'This driver profile is not currently public.'}</p>
        <Link href="/drivers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const primaryArea = driver.serviceAreas?.[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 w-full">
      {/* Back button */}
      <Link href="/drivers" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Drivers Directory
      </Link>

      {/* Main Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-2xl shadow-elevated shrink-0">
            {driver.fullName
              .split(' ')
              .map((n: string) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{driver.fullName}</h1>
              <Badge variant="success">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verified Operator
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              Operating in {driver.city || driver.district}, {driver.district} District
            </p>
            <div className="flex items-center gap-4 text-xs text-foreground font-medium pt-1">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <Star className="h-4 w-4 fill-current" />
                {driver.ratingAverage.toFixed(1)} ({driver.ratingCount} reviews)
              </span>
              <span>•</span>
              <span>{driver.experienceYears} Years Experience</span>
            </div>
          </div>
        </div>

        {/* Pricing & Booking Trigger */}
        <div className="flex flex-col sm:items-end justify-center border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-6 shrink-0 space-y-2">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
              Agreed Monthly Fee
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
              {primaryArea?.monthlyRateMinorUnits
                ? formatLKR(primaryArea.monthlyRateMinorUnits, true)
                : 'Rs. 18,000'}
              <span className="text-xs font-normal text-muted-foreground"> / child</span>
            </span>
          </div>

          <Button onClick={handleOpenBookingModal} variant="primary" size="lg" className="w-full sm:w-auto font-bold shadow-elevated">
            <Bus className="h-4 w-4" /> Book Van Transport
          </Button>
        </div>
      </div>

      {/* Grid: Vehicle Details & School Coverage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" /> Approved Fleet Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {driver.vehicles?.map((vehicle: any) => (
              <div key={vehicle.id} className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </span>
                  <Badge variant="outline">{vehicle.vehicleType}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{vehicle.capacity} Passenger Capacity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{vehicle.isAirConditioned ? 'Air Conditioned' : 'Non-A/C'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Emergency Exit Door</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>First Aid & Extinguisher</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Schools Served */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" /> Schools Covered ({driver.schools?.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {driver.schools?.map((school: any) => (
              <div key={school.id} className="p-3 rounded-xl bg-card border border-border flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground">{school.name}</h4>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    {school.address}
                  </p>
                </div>
                <Badge variant="success" className="text-[10px] shrink-0">
                  Daily Route
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Driver Bio & Service Description */}
      {driver.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About the Van Operator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {driver.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Parent Reviews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-current" />
              Parent Reviews ({driver.reviews?.length || 0})
            </CardTitle>
            <div className="text-xs font-bold text-foreground">
              Average: {driver.ratingAverage.toFixed(1)} / 5.0
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(!driver.reviews || driver.reviews.length === 0) ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No written reviews submitted yet.
            </p>
          ) : (
            driver.reviews.map((review: any) => (
              <div key={review.id} className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{review.parentName}</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">"{review.comment}"</p>
                <span className="text-[10px] text-muted-foreground/70 block">
                  {formatSriLankanDateTime(review.createdAt)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* BOOKING REQUEST MODAL */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <form onSubmit={handleSubmitBooking}>
          <DialogHeader>
            <DialogTitle>Request School Van Transport</DialogTitle>
            <DialogDescription>
              Submit transportation request to {driver.fullName}. The driver will confirm schedule and seat availability.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-left">
            {/* Child Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Select Child</label>
              <select
                value={selectedChildId}
                onChange={(e) => {
                  setSelectedChildId(e.target.value);
                  const found = childrenList.find((c) => c.id === e.target.value);
                  if (found) {
                    setPickupAddress(found.pickupAddress);
                    setDropoffAddress(found.dropoffAddress);
                  }
                }}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-xs text-foreground shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                required
              >
                {childrenList.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.firstName} {child.lastName} ({child.grade} at {child.school?.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Designated Van</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-xs text-foreground shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                required
              >
                {driver.vehicles?.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.capacity} passenger seats)
                  </option>
                ))}
              </select>
            </div>

            {/* Pickup & Dropoff Address */}
            <Input
              label="Home Pickup Address"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              required
            />
            <Input
              label="School Dropoff Address"
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Morning Pickup Time"
                type="time"
                value={pickupTimeMorning}
                onChange={(e) => setPickupTimeMorning(e.target.value)}
                required
              />
              <Input
                label="Afternoon Return Time"
                type="time"
                value={dropoffTimeAfternoon}
                onChange={(e) => setDropoffTimeAfternoon(e.target.value)}
                required
              />
            </div>

            <Input
              label="Service Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />

            <Input
              label="Special Instructions / Health Notes (Optional)"
              placeholder="e.g. Asthma inhaler in bag, front seat preference"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBookingModalOpen(false)}
              disabled={isSubmittingBooking}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingBooking}>
              Confirm & Submit Request
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
