'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Radio,
  Bus,
  ShieldCheck,
  Phone,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Navigation,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

// Dynamically import Leaflet map with SSR disabled
const LiveRideMap = dynamic(() => import('@/components/map/live-ride-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] w-full rounded-2xl bg-muted/40 animate-pulse flex flex-col items-center justify-center gap-3 border border-border">
      <Bus className="h-10 w-10 text-muted-foreground animate-bounce" />
      <p className="text-sm text-muted-foreground font-medium">Loading high-precision tracking map...</p>
    </div>
  ),
});

export default function ParentLiveTrackingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeRide, setActiveRide] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [socketConnected, setSocketConnected] = React.useState(false);
  const [currentCoords, setCurrentCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [speed, setSpeed] = React.useState<number>(0);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const [passengers, setPassengers] = React.useState<any[]>([]);
  const [trail, setTrail] = React.useState<[number, number][]>([]);

  // 1. Initial Load of Active Ride
  const loadActiveRide = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/rides/active');
      if (data) {
        setActiveRide(data);
        if (data.currentLatitude && data.currentLongitude) {
          setCurrentCoords({ lat: data.currentLatitude, lng: data.currentLongitude });
          setTrail([[data.currentLatitude, data.currentLongitude]]);
        }
        if (data.lastLocationUpdateAt) {
          setLastUpdate(new Date(data.lastLocationUpdateAt));
        }
        if (data.passengers) {
          setPassengers(data.passengers);
        }
      } else {
        setActiveRide(null);
      }
    } catch (err: any) {
      console.error('Failed to load active ride:', err);
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
      loadActiveRide();
    }
  }, [user, authLoading, router, loadActiveRide]);

  // 2. Establish Real-time Socket.io Connection
  React.useEffect(() => {
    if (!activeRide?.id) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('sr_token') : null;
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const socket: Socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_ride', { rideSessionId: activeRide.id });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('location_update', (telemetry: { latitude: number; longitude: number; speed?: number; heading?: number; timestamp: string }) => {
      setCurrentCoords({ lat: telemetry.latitude, lng: telemetry.longitude });
      if (telemetry.speed !== undefined) setSpeed(telemetry.speed);
      setLastUpdate(new Date(telemetry.timestamp));
      setTrail((prev) => [...prev.slice(-40), [telemetry.latitude, telemetry.longitude]]);
    });

    socket.on('passenger_update', (update: { passengerId: string; childName: string; pickupStatus: string }) => {
      toast.info(`Status update: ${update.childName} is marked as ${update.pickupStatus}`);
      setPassengers((prev) =>
        prev.map((p) => (p.id === update.passengerId ? { ...p, pickupStatus: update.pickupStatus } : p))
      );
    });

    socket.on('ride_ended', () => {
      toast.success('The school ride route has concluded safely.');
      setActiveRide(null);
    });

    socket.on('error', (err: any) => {
      console.error('WebSocket Error:', err);
      toast.error(err.message || 'Tracking connection issue');
    });

    return () => {
      socket.emit('leave_ride', { rideSessionId: activeRide.id });
      socket.disconnect();
    };
  }, [activeRide?.id]);

  if (isLoading || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[480px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!activeRide) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full text-center space-y-6">
        <EmptyState
          icon={Bus}
          title="No Active School Van In Transit"
          description="Your van operator has not initiated a morning or afternoon transit session for your child right now. Active rides appear automatically as soon as the driver begins the route."
          action={{
            label: 'Check Again',
            onClick: () => loadActiveRide(),
          }}
        />
        <div className="pt-4">
          <Link href="/parent/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const driver = activeRide.driverProfile?.user;
  const vehicle = activeRide.vehicle;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/parent/dashboard" className="text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Live School Ride Telemetry
            </h1>
            <Badge variant={socketConnected ? 'success' : 'warning'} className="gap-1.5 font-medium ml-2">
              <span className={`h-2 w-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              {socketConnected ? 'Live Signal Active' : 'Connecting...'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Route: <strong className="text-foreground">{activeRide.routeName}</strong> • Authorized parent tracking session
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => loadActiveRide()}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Link href="/parent/complaints">
            <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Report Concern
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Map & Operational Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Leaflet Map */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="h-[520px] w-full">
            {currentCoords ? (
              <LiveRideMap
                currentLat={currentCoords.lat}
                currentLng={currentCoords.lng}
                routeName={activeRide.routeName}
                driverName={driver?.fullName}
                passengers={passengers}
                trail={trail}
              />
            ) : (
              <div className="h-full w-full rounded-2xl bg-muted flex items-center justify-center border border-border">
                <p className="text-sm text-muted-foreground">Waiting for initial GPS coordinates from driver...</p>
              </div>
            )}
          </div>

          {/* Telemetry Status Bar */}
          <div className="p-3.5 rounded-xl bg-card border border-border flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
              <span>Current Speed: <strong className="text-foreground font-mono">{Math.round(speed)} km/h</strong></span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                Last ping: <strong className="text-foreground">{lastUpdate ? lastUpdate.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo' }) : 'Pending'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Secured TLS WebSocket Stream</span>
            </div>
          </div>
        </div>

        {/* Right Col: Driver & Passenger Info */}
        <div className="space-y-6">
          {/* Driver & Vehicle Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Driver & Vehicle
              </h3>
              <Badge variant="outline" className="text-primary border-primary/20">
                Verified
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-base font-extrabold text-foreground">{driver?.fullName || 'Assigned Driver'}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bus className="h-3.5 w-3.5 text-primary" />
                <span>{vehicle?.model || 'Toyota HiAce'} ({vehicle?.licensePlate || 'WP NA-4512'})</span>
              </div>
              {vehicle?.hasAirConditioning && (
                <Badge variant="secondary" className="text-[10px] py-0 px-2">
                  Air Conditioned
                </Badge>
              )}
            </div>

            {driver?.phone && (
              <a href={`tel:${driver.phone}`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-center">
                  <Phone className="h-3.5 w-3.5 mr-1.5 text-primary" /> Call Driver
                </Button>
              </a>
            )}
          </Card>

          {/* Passenger Checklist Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Passenger Manifest
              </h3>
              <span className="text-xs text-muted-foreground font-mono">{passengers.length} Assigned</span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {passengers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No passenger records linked to this session.</p>
              ) : (
                passengers.map((p) => {
                  const isPickedUp = p.pickupStatus === 'PICKED_UP';
                  const isDroppedOff = p.pickupStatus === 'DROPPED_OFF';
                  const isAbsent = p.pickupStatus === 'ABSENT';

                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-foreground">
                          {p.child?.firstName} {p.child?.lastName}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {p.child?.school?.name || 'School Destination'}
                        </p>
                      </div>

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
                        className="text-[10px] font-semibold"
                      >
                        {isDroppedOff
                          ? 'Dropped Off'
                          : isPickedUp
                          ? 'On Board'
                          : isAbsent
                          ? 'Absent'
                          : 'Waiting'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
