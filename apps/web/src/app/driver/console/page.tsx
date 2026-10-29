'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Radio,
  Bus,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Navigation,
  ArrowLeft,
  AlertTriangle,
  Play,
  Square,
  Users,
  Compass,
} from 'lucide-react';
import { toast } from 'sonner';
import { PassengerPickupStatus, formatSriLankanTime } from '@schoolride/shared';

export default function DriverConsolePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = React.useState<any>(null);
  const [activeRide, setActiveRide] = React.useState<any>(null);
  const [acceptedBookings, setAcceptedBookings] = React.useState<any[]>([]);
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // New ride start form state
  const [routeName, setRouteName] = React.useState('Morning School Run - Colombo Central');
  const [selectedVehicleId, setSelectedVehicleId] = React.useState('');
  const [selectedBookingIds, setSelectedBookingIds] = React.useState<string[]>([]);
  const [isStartingRide, setIsStartingRide] = React.useState(false);

  // Active ride operational state
  const [isBroadcasting, setIsBroadcasting] = React.useState(true);
  const [currentSpeed, setCurrentSpeed] = React.useState(32);
  const [lastPing, setLastPing] = React.useState<Date | null>(null);
  const [isEndingRide, setIsEndingRide] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [profRes, rideRes, bookingsRes] = await Promise.all([
        api.get('/drivers/me').catch(() => null),
        api.get('/rides/active').catch(() => null),
        api.get('/bookings').catch(() => []),
      ]);

      setProfile(profRes);
      setActiveRide(rideRes);
      const accepted = (bookingsRes || []).filter(
        (b: any) => b.status === 'ACCEPTED' || b.status === 'ACTIVE'
      );
      setAcceptedBookings(accepted);
      setSelectedBookingIds(accepted.map((b: any) => b.id));

      if (profRes?.vehicles?.length > 0) {
        setVehicles(profRes.vehicles);
        setSelectedVehicleId(profRes.vehicles[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load driver console data:', err);
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
      loadData();
    }
  }, [user, authLoading, router, loadData]);

  // Periodic Telemetry Broadcaster when Ride is Active
  React.useEffect(() => {
    if (!activeRide?.id || !isBroadcasting) return;

    let step = 0;
    // Colombo central coordinates path simulation
    const baseLat = activeRide.currentLatitude || 6.9034;
    const baseLng = activeRide.currentLongitude || 79.8596;

    const interval = setInterval(async () => {
      step += 1;
      const dLat = (Math.sin(step / 3) * 0.0008);
      const dLng = (Math.cos(step / 3) * 0.0008);
      const newLat = baseLat + dLat;
      const newLng = baseLng + dLng;
      const simSpeed = 25 + Math.floor(Math.random() * 18);

      try {
        await api.post(`/rides/${activeRide.id}/location`, {
          latitude: newLat,
          longitude: newLng,
          speed: simSpeed,
          heading: (step * 25) % 360,
        });
        setCurrentSpeed(simSpeed);
        setLastPing(new Date());
      } catch (err: any) {
        console.warn('Telemetry ping failed:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeRide?.id, isBroadcasting]);

  // Handle starting a new ride session
  const handleStartRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      toast.error('Please select an active vehicle.');
      return;
    }
    if (selectedBookingIds.length === 0) {
      toast.error('Please select at least one student for this route.');
      return;
    }

    setIsStartingRide(true);
    try {
      // Default to Colombo center if GPS denied
      const initialLat = 6.9034;
      const initialLng = 79.8596;

      const newRide = await api.post('/rides/start', {
        vehicleId: selectedVehicleId,
        bookingIds: selectedBookingIds,
        routeName,
        initialLatitude: initialLat,
        initialLongitude: initialLng,
      });

      toast.success('School ride session initiated. Telemetry stream is now live!');
      setActiveRide(newRide);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start ride session.');
    } finally {
      setIsStartingRide(false);
    }
  };

  // Handle updating individual passenger status
  const handleUpdatePassengerStatus = async (
    passengerId: string,
    pickupStatus: PassengerPickupStatus
  ) => {
    if (!activeRide) return;
    try {
      await api.patch(`/rides/${activeRide.id}/passenger-status`, {
        passengerId,
        pickupStatus,
      });

      toast.success(`Passenger updated to ${pickupStatus}`);
      setActiveRide((prev: any) => ({
        ...prev,
        passengers: prev.passengers.map((p: any) =>
          p.id === passengerId ? { ...p, pickupStatus } : p
        ),
      }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update passenger status.');
    }
  };

  // Handle concluding the entire route
  const handleCompleteRide = async () => {
    if (!activeRide) return;
    if (!confirm('Are you sure you want to end this school route? This will notify all parents and conclude live GPS streaming.')) {
      return;
    }

    setIsEndingRide(true);
    try {
      await api.post(`/rides/${activeRide.id}/complete`, {});
      toast.success('School route completed successfully. Outstanding work!');
      setActiveRide(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete ride session.');
    } finally {
      setIsEndingRide(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

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
              Route Operations Console
            </h1>
            {activeRide ? (
              <Badge variant="success" className="gap-1.5 ml-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                ROUTE IN PROGRESS
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-2">IDLE</Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage live morning and afternoon school transit, dispatch GPS telemetry, and record student check-ins.
          </p>
        </div>
      </div>

      {/* STATE 1: ACTIVE RIDE IN PROGRESS */}
      {activeRide ? (
        <div className="space-y-6">
          {/* Telemetry Control Center Card */}
          <Card className="p-6 bg-gradient-to-br from-card via-card to-emerald-500/5 border-emerald-500/30 space-y-6 shadow-elevated">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Live Dispatch Session
                </span>
                <h2 className="text-xl font-extrabold text-foreground mt-0.5">
                  {activeRide.routeName}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vehicle: {activeRide.vehicle?.model} ({activeRide.vehicle?.licensePlate})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBroadcasting(!isBroadcasting)}
                  className={isBroadcasting ? 'border-emerald-500 text-emerald-600' : 'border-amber-500 text-amber-600'}
                >
                  <Radio className={`h-3.5 w-3.5 mr-1.5 ${isBroadcasting ? 'animate-pulse' : ''}`} />
                  {isBroadcasting ? 'Broadcasting GPS' : 'GPS Paused'}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCompleteRide}
                  disabled={isEndingRide}
                  className="font-bold shadow-subtle"
                >
                  <Square className="h-3.5 w-3.5 mr-1.5 fill-current" />
                  {isEndingRide ? 'Ending Route...' : 'Conclude Route'}
                </Button>
              </div>
            </div>

            {/* Live Telemetry Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-background/80 border border-border flex items-center gap-3">
                <Compass className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">Estimated Speed</p>
                  <p className="text-lg font-bold font-mono text-foreground">{currentSpeed} km/h</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-background/80 border border-border flex items-center gap-3">
                <Clock className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">Last Cloud Ping</p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    {lastPing ? lastPing.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo' }) : 'Active'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-background/80 border border-border flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">Students On Board</p>
                  <p className="text-lg font-bold font-mono text-foreground">
                    {activeRide.passengers?.filter((p: any) => p.pickupStatus === 'PICKED_UP').length || 0} / {activeRide.passengers?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Student Passenger Checklist */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Passenger Check-in Manifest</h3>
                <p className="text-xs text-muted-foreground">
                  Update student transit state in real time. Parents receive immediate push notifications.
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {activeRide.passengers?.length || 0} Total Manifest
              </span>
            </div>

            <div className="space-y-3">
              {activeRide.passengers?.map((p: any) => {
                const isScheduled = p.pickupStatus === PassengerPickupStatus.SCHEDULED;
                const isPickedUp = p.pickupStatus === PassengerPickupStatus.PICKED_UP;
                const isDroppedOff = p.pickupStatus === PassengerPickupStatus.DROPPED_OFF;
                const isAbsent = p.pickupStatus === PassengerPickupStatus.ABSENT;

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-foreground">
                          {p.child?.firstName} {p.child?.lastName}
                        </p>
                        <Badge
                          variant={
                            isDroppedOff
                              ? 'success'
                              : isPickedUp
                              ? 'primary'
                              : isAbsent
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {p.pickupStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        School: {p.child?.school?.name || 'School Destination'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={isPickedUp ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleUpdatePassengerStatus(p.id, PassengerPickupStatus.PICKED_UP)}
                        className="text-xs font-semibold"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Picked Up
                      </Button>

                      <Button
                        variant={isDroppedOff ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleUpdatePassengerStatus(p.id, PassengerPickupStatus.DROPPED_OFF)}
                        className={`text-xs font-semibold ${isDroppedOff ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      >
                        <MapPin className="h-3.5 w-3.5 mr-1" /> Dropped Off
                      </Button>

                      <Button
                        variant={isAbsent ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => handleUpdatePassengerStatus(p.id, PassengerPickupStatus.ABSENT)}
                        className="text-xs font-semibold text-muted-foreground"
                      >
                        Absent
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : (
        /* STATE 2: START NEW RIDE FORM */
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Initiate School Transport Route</h2>
              <p className="text-xs text-muted-foreground">
                Select your designated vehicle and passengers to begin live route telemetry broadcasting.
              </p>
            </div>
          </div>

          <form onSubmit={handleStartRide} className="space-y-5">
            {/* Route Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Route Description / Direction *
              </label>
              <Input
                placeholder="e.g. Morning Pickup - Royal College, Visakha, Thurstan"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                required
              />
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Designated Vehicle *
              </label>
              {vehicles.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
                  You haven't registered any vehicles yet. Please{' '}
                  <Link href="/driver/vehicles" className="font-bold underline">
                    add a vehicle
                  </Link>{' '}
                  before starting a route.
                </div>
              ) : (
                <select
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.model} ({v.licensePlate}) • {v.seatingCapacity} Seats {v.hasAirConditioning ? '• A/C' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Student Passenger Checkbox Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Students for This Trip *
                </label>
                <span className="text-xs text-muted-foreground font-mono">
                  {selectedBookingIds.length} of {acceptedBookings.length} selected
                </span>
              </div>

              {acceptedBookings.length === 0 ? (
                <div className="p-4 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground text-center">
                  You currently have no accepted student bookings. Once parents request transport and you accept their bookings, they will appear here.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto border border-border rounded-xl p-3">
                  {acceptedBookings.map((b) => {
                    const isChecked = selectedBookingIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-background border-border/80 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBookingIds([...selectedBookingIds, b.id]);
                              } else {
                                setSelectedBookingIds(selectedBookingIds.filter((id) => id !== b.id));
                              }
                            }}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          />
                          <div>
                            <p className="font-bold text-foreground">
                              {b.child?.firstName} {b.child?.lastName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              School: {b.child?.school?.name} • Pickup: {b.pickupAddress}
                            </p>
                          </div>
                        </div>

                        <Badge variant="outline" className="text-[10px]">
                          {b.pickupTimeMorning || 'Morning'}
                        </Badge>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isStartingRide || vehicles.length === 0 || acceptedBookings.length === 0}
                className="w-full justify-center font-bold shadow-elevated bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="h-4 w-4 mr-2 fill-current" />
                {isStartingRide ? 'Initiating Route Telemetry...' : 'Start Live Route & Begin Broadcast'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
