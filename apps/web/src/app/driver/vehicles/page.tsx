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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Car,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Flame,
  Cross,
  Wind,
} from 'lucide-react';
import { toast } from 'sonner';
import { VehicleType, VerificationStatus } from '@schoolride/shared';

export default function DriverVehiclesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    vehicleType: VehicleType.VAN,
    make: 'Toyota',
    model: 'HiAce Commuter',
    year: 2018,
    licensePlate: 'WP NA-4512',
    capacity: 14,
    isAirConditioned: true,
    hasEmergencyExit: true,
    hasFireExtinguisher: true,
    hasFirstAidKit: true,
    insuranceExpiry: '2026-12-31',
    revenueLicenseExpiry: '2026-12-31',
  });

  const loadVehicles = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/drivers/me');
      setVehicles(data?.vehicles || []);
    } catch (err: any) {
      console.error('Failed to load vehicles:', err);
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
      loadVehicles();
    }
  }, [user, authLoading, router, loadVehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/drivers/me/vehicles', {
        ...formData,
        year: Number(formData.year),
        capacity: Number(formData.capacity),
      });

      toast.success('Vehicle registered successfully! Submitted for inspection.');
      setIsDialogOpen(false);
      loadVehicles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to register vehicle.');
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
              Vehicle Fleet Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage school vans, mini-buses, and vehicles registered to your transport service.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsDialogOpen(true)}
          className="font-bold shadow-subtle shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Register New Vehicle
        </Button>
      </div>

      {/* Vehicle Cards */}
      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No Vehicles Registered"
          description="You haven't added any school transport vehicles yet. Add your van or bus to begin receiving passenger bookings."
          action={{
            label: 'Register Vehicle',
            onClick: () => setIsDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicles.map((v) => {
            const isApproved = v.verificationStatus === VerificationStatus.APPROVED;
            return (
              <Card key={v.id} className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Car className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {v.make} {v.model}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        Plate: <strong className="text-foreground">{v.licensePlate}</strong> • Year: {v.year}
                      </p>
                    </div>
                  </div>

                  <Badge variant={isApproved ? 'success' : 'warning'} className="text-xs font-semibold">
                    {v.verificationStatus || 'PENDING'}
                  </Badge>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[11px]">Type</span>
                    <strong className="text-foreground">{v.vehicleType}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[11px]">Passenger Capacity</span>
                    <strong className="text-foreground">{v.capacity} Children</strong>
                  </div>
                </div>

                {/* Safety Features */}
                <div className="space-y-2 pt-1 border-t border-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Safety & Comfort Equipment
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {v.isAirConditioned && (
                      <Badge variant="outline" className="gap-1 border-blue-500/30 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20">
                        <Wind className="h-3 w-3" /> Air Conditioned
                      </Badge>
                    )}
                    {v.hasFireExtinguisher && (
                      <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20">
                        <Flame className="h-3 w-3" /> Fire Extinguisher
                      </Badge>
                    )}
                    {v.hasFirstAidKit && (
                      <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <ShieldCheck className="h-3 w-3" /> First Aid Kit
                      </Badge>
                    )}
                    {v.hasEmergencyExit && (
                      <Badge variant="outline" className="gap-1 border-slate-500/30 text-foreground">
                        Emergency Exit
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground pt-1 flex justify-between">
                  <span>Revenue Lic: {v.revenueLicenseExpiry}</span>
                  <span>Insurance: {v.insuranceExpiry}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Dialog for Registering Vehicle */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Register School Transport Vehicle</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Vehicle Type *
                </label>
                <select
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                >
                  <option value={VehicleType.VAN}>School Van</option>
                  <option value={VehicleType.MINI_BUS}>Mini Bus (Coaster / Rosa)</option>
                  <option value={VehicleType.BUS}>Standard Bus</option>
                  <option value={VehicleType.CAR}>Sedan / Car</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  License Plate Number *
                </label>
                <Input
                  placeholder="e.g. WP NA-4512"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Make *
                </label>
                <Input
                  placeholder="e.g. Toyota"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Model *
                </label>
                <Input
                  placeholder="e.g. HiAce"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Model Year *
                </label>
                <Input
                  type="number"
                  min={2000}
                  max={2026}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Seating Capacity *
                </label>
                <Input
                  type="number"
                  min={3}
                  max={50}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Insurance Expiry *
                </label>
                <Input
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Revenue Lic Expiry *
                </label>
                <Input
                  type="date"
                  value={formData.revenueLicenseExpiry}
                  onChange={(e) => setFormData({ ...formData, revenueLicenseExpiry: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Equipment & Safety Checks
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAirConditioned}
                    onChange={(e) => setFormData({ ...formData, isAirConditioned: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                  <span>Air Conditioning (A/C)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasFireExtinguisher}
                    onChange={(e) => setFormData({ ...formData, hasFireExtinguisher: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                  <span>Fire Extinguisher Installed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasFirstAidKit}
                    onChange={(e) => setFormData({ ...formData, hasFirstAidKit: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                  <span>First Aid Emergency Kit</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasEmergencyExit}
                    onChange={(e) => setFormData({ ...formData, hasEmergencyExit: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                  <span>Emergency Rear Exit</span>
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
