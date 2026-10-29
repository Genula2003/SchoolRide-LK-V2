'use client';

import * as React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Search,
  MapPin,
  Star,
  Bus,
  ShieldCheck,
  ArrowRight,
  Filter,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import { formatLKR, SRI_LANKAN_DISTRICTS, INITIAL_SCHOOLS } from '@schoolride/shared';

export default function DriversDirectoryPage() {
  const [drivers, setDrivers] = React.useState<any[]>([]);
  const [schools, setSchools] = React.useState<any[]>(INITIAL_SCHOOLS);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters
  const [district, setDistrict] = React.useState('');
  const [schoolId, setSchoolId] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [vehicleType, setVehicleType] = React.useState('');

  const fetchDrivers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (district) params.append('district', district);
      if (schoolId) params.append('schoolId', schoolId);
      if (query) params.append('query', query);
      if (vehicleType) params.append('vehicleType', vehicleType);

      const res = await api.get(`/drivers?${params.toString()}`);
      setDrivers(res.data || []);
    } catch {
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  }, [district, schoolId, query, vehicleType]);

  React.useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleResetFilters = () => {
    setDistrict('');
    setSchoolId('');
    setQuery('');
    setVehicleType('');
  };

  const filteredSchools = district
    ? schools.filter((s) => s.district.toLowerCase() === district.toLowerCase())
    : schools;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Verified School Van Drivers
            </h1>
            <Badge variant="success">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verified Only
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Search licensed, background-checked school transport operators across Sri Lanka
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(district || schoolId || query || vehicleType) && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* District Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            District
          </label>
          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setSchoolId(''); // Reset school if district changes
            }}
            className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-xs text-foreground shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <option value="">All Sri Lankan Districts</option>
            {SRI_LANKAN_DISTRICTS.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* School Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            School Served
          </label>
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-xs text-foreground shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <option value="">All Schools</option>
            {filteredSchools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.district})
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle Type */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Vehicle Type
          </label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-xs text-foreground shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <option value="">All Vehicle Types</option>
            <option value="VAN">School Van (HiAce, Caravan)</option>
            <option value="MINI_BUS">Mini Bus</option>
            <option value="CAR">Car / Station Wagon</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Search Operator / City
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="e.g. Sunil or Nugegoda"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-xs text-foreground shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Driver Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={<Bus className="h-7 w-7" />}
          title="No verified drivers found"
          description="No school van operators currently match your filter criteria. Try expanding your district or school selection."
          actionLabel="Clear All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => {
            const primaryVehicle = driver.vehicles[0];
            const primaryArea = driver.serviceAreas[0];

            return (
              <Card
                key={driver.id}
                className="overflow-hidden hover:border-primary/40 hover:shadow-floating transition-all flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Driver Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base border border-primary/20 shrink-0">
                        {driver.fullName
                          .split(' ')
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-foreground truncate">{driver.fullName}</h3>
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          {driver.city || driver.district}, {driver.district}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold shrink-0">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{driver.ratingAverage.toFixed(1)}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">({driver.ratingCount})</span>
                    </div>
                  </div>

                  {/* Vehicle Spec Pill */}
                  {primaryVehicle && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span>
                          {primaryVehicle.make} {primaryVehicle.model} ({primaryVehicle.year})
                        </span>
                        <span className="text-muted-foreground font-mono">{primaryVehicle.capacity} seats</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {primaryVehicle.isAirConditioned && <span>• A/C</span>}
                        {primaryVehicle.hasEmergencyExit && <span>• Emergency Exit</span>}
                        <span>• First Aid Kit</span>
                      </div>
                    </div>
                  )}

                  {/* Schools Covered */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" /> Schools Covered ({driver.schools.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {driver.schools.slice(0, 3).map((school: any) => (
                        <span
                          key={school.id}
                          className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] font-medium text-foreground truncate max-w-[200px]"
                        >
                          {school.name}
                        </span>
                      ))}
                      {driver.schools.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground">
                          +{driver.schools.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bio snippet */}
                  {driver.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {driver.bio}
                    </p>
                  )}
                </div>

                {/* Footer with Price and View Button */}
                <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                      Starting Monthly Fee
                    </span>
                    <span className="text-sm font-bold text-foreground font-mono">
                      {primaryArea?.monthlyRateMinorUnits
                        ? formatLKR(primaryArea.monthlyRateMinorUnits, true)
                        : 'Rs. 15,000'}{' '}
                      <span className="text-[10px] font-normal text-muted-foreground">/ child</span>
                    </span>
                  </div>

                  <Link href={`/drivers/${driver.id}`}>
                    <Button variant="primary" size="sm" className="shadow-subtle">
                      View Profile <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
