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
  Bus,
  ShieldCheck,
  ShieldAlert,
  Users,
  Calendar,
  Star,
  Radio,
  ArrowRight,
  FileCheck,
  Clock,
  Car,
  AlertCircle,
  Plus,
  Compass,
} from 'lucide-react';
import { formatLKR, VerificationStatus } from '@schoolride/shared';

export default function DriverDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = React.useState<any>(null);
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [activeRide, setActiveRide] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'DRIVER')) {
      router.push('/login');
      return;
    }

    async function loadDriverData() {
      if (!user) return;
      setIsLoading(true);
      try {
        const [profileRes, bookingsRes, activeRideRes] = await Promise.all([
          api.get('/drivers/me').catch(() => null),
          api.get('/bookings').catch(() => []),
          api.get('/rides/active').catch(() => null),
        ]);
        setProfile(profileRes);
        setBookings(bookingsRes);
        setActiveRide(activeRideRes);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadDriverData();
    }
  }, [user, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isVerified = profile?.verificationStatus === VerificationStatus.APPROVED;
  const isPending = profile?.verificationStatus === VerificationStatus.PENDING;
  const isRejected = profile?.verificationStatus === VerificationStatus.REJECTED;

  const pendingRequests = bookings.filter((b) => b.status === 'PENDING');
  const activeBookings = bookings.filter((b) => b.status === 'ACCEPTED' || b.status === 'ACTIVE');

  const monthlyProjectedRevenue = activeBookings.reduce(
    (acc, b) => acc + (b.monthlyFeeMinorUnits || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Van Operator Portal
            </h1>
            <Badge
              variant={isVerified ? 'success' : isPending ? 'warning' : 'destructive'}
              className="text-xs font-semibold uppercase tracking-wider"
            >
              {profile?.verificationStatus?.replace('_', ' ') || 'UNVERIFIED'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Driver: <strong className="text-foreground">{user?.fullName}</strong> • Sri Lankan Transport Service ID #{profile?.id?.slice(0, 8)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/driver/vehicles">
            <Button variant="outline" size="sm">
              <Car className="h-4 w-4 mr-1.5" /> Fleet Vehicles
            </Button>
          </Link>
          <Link href="/driver/console">
            <Button variant="primary" size="sm" className="shadow-subtle">
              <Radio className="h-4 w-4 mr-1.5" /> Route Console
            </Button>
          </Link>
        </div>
      </div>

      {/* Verification Notice Banner */}
      {!isVerified && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-subtle ${
            isPending
              ? 'bg-amber-500/10 border-amber-500/30'
              : isRejected
              ? 'bg-destructive/10 border-destructive/30'
              : 'bg-primary/10 border-primary/30'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold shrink-0 ${
                isPending
                  ? 'bg-amber-500 text-white'
                  : isRejected
                  ? 'bg-destructive text-white'
                  : 'bg-primary text-white'
              }`}
            >
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isPending
                  ? 'Document Verification In Progress'
                  : isRejected
                  ? 'Action Required: Verification Corrections Needed'
                  : 'Complete Your Driver Onboarding Checklist'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPending
                  ? 'Your driving license, police clearance, and vehicle documents are under administrative inspection.'
                  : isRejected
                  ? profile?.rejectionReason || 'Please resubmit valid vehicle and identification records.'
                  : 'Submit your driving credentials and vehicle registration to accept parent bookings and go live.'}
              </p>
            </div>
          </div>

          <Link href="/driver/onboarding">
            <Button variant="outline" size="sm" className="font-bold shrink-0">
              Manage Documents <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Active Ride In-Progress Banner */}
      {activeRide && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold shadow-subtle shrink-0">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">School Ride Route Currently Active</h3>
                <Badge variant="success">BROADCASTING</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Route: {activeRide.routeName} • {activeRide.passengers?.length || 0} passengers checked in
              </p>
            </div>
          </div>

          <Link href="/driver/console">
            <Button variant="primary" size="md" className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-elevated">
              Open Route Console <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Students */}
        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Students</p>
            <h3 className="text-2xl font-extrabold text-foreground">{activeBookings.length}</h3>
          </div>
        </Card>

        {/* Projected Monthly Revenue */}
        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <span className="text-xl font-bold font-mono">Rs</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projected Revenue</p>
            <h3 className="text-2xl font-extrabold text-foreground">{formatLKR(monthlyProjectedRevenue)}</h3>
          </div>
        </Card>

        {/* Pending Requests */}
        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Requests</p>
            <h3 className="text-2xl font-extrabold text-foreground">{pendingRequests.length}</h3>
          </div>
        </Card>

        {/* Rating */}
        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-600 shrink-0">
            <Star className="h-6 w-6 fill-yellow-500" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Driver Rating</p>
            <h3 className="text-2xl font-extrabold text-foreground">
              {profile?.rating ? `${profile.rating.toFixed(1)} / 5.0` : '5.0'}
            </h3>
          </div>
        </Card>
      </div>

      {/* Grid: Pending Requests & Enrolled Passenger Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Booking Requests */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h3 className="text-base font-bold text-foreground">Pending Booking Requests</h3>
            </div>
            <Link href="/driver/bookings" className="text-xs font-semibold text-primary hover:underline">
              View All ({pendingRequests.length})
            </Link>
          </div>

          {pendingRequests.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No pending booking requests at this time.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-foreground">
                      {b.child?.firstName} {b.child?.lastName} ({b.child?.grade})
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      School: {b.child?.school?.name || 'School'} • Fee: {formatLKR(b.monthlyFeeMinorUnits)}/mo
                    </p>
                  </div>

                  <Link href="/driver/bookings">
                    <Button variant="outline" size="sm" className="font-semibold text-xs">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Assigned Student Passengers */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">Active Passenger Manifest</h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">{activeBookings.length} Students</span>
          </div>

          {activeBookings.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No accepted students yet. Ensure your profile and vehicle details are complete to receive bookings.
            </p>
          ) : (
            <div className="space-y-3">
              {activeBookings.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-foreground">
                      {b.child?.firstName} {b.child?.lastName}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Pickup: {b.pickupAddress} • School: {b.child?.school?.name}
                    </p>
                  </div>

                  <Badge variant="success" className="text-[10px]">
                    Enrolled
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
