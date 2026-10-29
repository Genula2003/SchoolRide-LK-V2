'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Bus,
  ShieldCheck,
  Plus,
  ArrowRight,
  Clock,
  Radio,
  Star,
  MapPin,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { formatLKR } from '@schoolride/shared';

export default function ParentDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [childrenList, setChildrenList] = React.useState<any[]>([]);
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [activeRide, setActiveRide] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'PARENT')) {
      router.push('/login');
      return;
    }

    async function loadParentData() {
      if (!user) return;
      setIsLoading(true);
      try {
        const [childrenRes, bookingsRes, activeRideRes] = await Promise.all([
          api.get('/parents/me/children').catch(() => []),
          api.get('/bookings').catch(() => []),
          api.get('/rides/active').catch(() => null),
        ]);
        setChildrenList(childrenRes);
        setBookings(bookingsRes);
        setActiveRide(activeRideRes);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadParentData();
    }
  }, [user, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const activeBookings = bookings.filter((b) => b.status === 'ACTIVE' || b.status === 'ACCEPTED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Parent Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your registered children, school transport bookings, and live ride monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/parent/children">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Child
            </Button>
          </Link>
          <Link href="/drivers">
            <Button variant="primary" size="sm" className="shadow-subtle">
              <Bus className="h-4 w-4 mr-1" /> Find Van Operator
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Ride Alert Banner (If in progress!) */}
      {activeRide && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-subtle animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold shadow-subtle shrink-0">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Your Child's School Route is Live Now
                </h3>
                <Badge variant="success">IN PROGRESS</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Route: {activeRide.routeName} • Driver: {activeRide.driverProfile?.user?.fullName}
              </p>
            </div>
          </div>

          <Link href="/parent/rides/live">
            <Button variant="primary" size="md" className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-elevated">
              Open Live Tracking Map <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registered Children</p>
            <h3 className="text-2xl font-extrabold text-foreground">{childrenList.length}</h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <Bus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Van Services</p>
            <h3 className="text-2xl font-extrabold text-foreground">{activeBookings.length}</h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Requests</p>
            <h3 className="text-2xl font-extrabold text-foreground">{pendingBookings.length}</h3>
          </div>
        </Card>
      </div>

      {/* Registered Children Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Registered Children
          </h2>
          <Link href="/parent/children" className="text-xs text-primary font-semibold hover:underline">
            Manage Children
          </Link>
        </div>

        {childrenList.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No children registered yet"
            description="Add your child profile with their school details and pickup location to begin finding matching school van routes."
            actionLabel="Register a Child"
            onAction={() => router.push('/parent/children')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {childrenList.map((child) => (
              <Card key={child.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {child.grade} • {child.gender}
                    </p>
                  </div>
                  <Badge variant="outline">{child.school?.district}</Badge>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    School: {child.school?.name}
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-5 truncate">
                    Pickup: {child.pickupAddress}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border/40">
                  <span className="text-xs text-muted-foreground">
                    {child.bookings?.length > 0 ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Van Service Enrolled
                      </span>
                    ) : (
                      'No van service linked yet'
                    )}
                  </span>
                  <Link href={`/drivers?schoolId=${child.schoolId}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-primary">
                      Find Van <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Transport Bookings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Bus className="h-5 w-5 text-primary" /> Transportation Bookings
          </h2>
          <Link href="/parent/bookings" className="text-xs text-primary font-semibold hover:underline">
            View All Bookings
          </Link>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            icon={<Bus className="h-6 w-6" />}
            title="No transportation bookings yet"
            description="Find a verified school van driver for your child's route and submit a booking request."
            actionLabel="Discover Van Operators"
            onAction={() => router.push('/drivers')}
          />
        ) : (
          <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs shrink-0">
                    {b.child?.firstName[0]}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">
                        {b.child?.firstName} {b.child?.lastName}
                      </h4>
                      <Badge
                        variant={
                          b.status === 'ACTIVE'
                            ? 'success'
                            : b.status === 'PENDING'
                            ? 'warning'
                            : b.status === 'COMPLETED'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Driver: {b.driverProfile?.user?.fullName} ({b.driverProfile?.user?.phone})
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Pickup: {b.pickupTimeMorning} AM • Fee: {formatLKR(b.monthlyFeeMinorUnits, true)}/mo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link href={`/parent/bookings`}>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </Link>
                  {b.status === 'ACTIVE' && (
                    <Link href="/parent/rides/live">
                      <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        Live Tracking
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
