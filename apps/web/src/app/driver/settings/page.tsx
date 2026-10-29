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
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, MapPin, School, Save, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { SRI_LANKAN_DISTRICTS } from '@schoolride/shared';

export default function DriverSettingsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [schoolsList, setSchoolsList] = React.useState<any[]>([]);

  // Profile form state
  const [profileData, setProfileData] = React.useState({
    fullName: '',
    phone: '',
    nicNumber: '',
    licenseNumber: '',
    experienceYears: 5,
    bio: '',
    district: 'Colombo',
    city: 'Colombo',
  });

  // Coverage form state
  const [selectedSchoolIds, setSelectedSchoolIds] = React.useState<string[]>([]);
  const [operatingAreasText, setOperatingAreasText] = React.useState('Nugegoda, Kohuwala, Havelock Town, Bambalapitiya');
  const [monthlyRateLKR, setMonthlyRateLKR] = React.useState(12500);

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'DRIVER')) {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        const [driverRes, schoolsRes] = await Promise.all([
          api.get('/drivers/me').catch(() => null),
          api.get('/schools').catch(() => []),
        ]);

        setSchoolsList(schoolsRes);

        if (driverRes) {
          setProfileData({
            fullName: driverRes.user?.fullName || user?.fullName || '',
            phone: driverRes.user?.phone || user?.phone || '',
            nicNumber: driverRes.nicNumber || '',
            licenseNumber: driverRes.licenseNumber || '',
            experienceYears: driverRes.experienceYears || 5,
            bio: driverRes.bio || '',
            district: driverRes.user?.district || 'Colombo',
            city: driverRes.user?.city || 'Colombo',
          });

          if (driverRes.schoolCoverages?.length > 0) {
            setSelectedSchoolIds(driverRes.schoolCoverages.map((sc: any) => sc.schoolId));
          }

          if (driverRes.serviceAreas?.length > 0) {
            const primaryArea = driverRes.serviceAreas[0];
            if (primaryArea.monthlyRateMinorUnits) {
              setMonthlyRateLKR(Math.round(primaryArea.monthlyRateMinorUnits / 100));
            }
            if (primaryArea.operatingAreas) {
              setOperatingAreasText(
                Array.isArray(primaryArea.operatingAreas)
                  ? primaryArea.operatingAreas.join(', ')
                  : primaryArea.operatingAreas
              );
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to load driver settings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch('/drivers/me/profile', {
        ...profileData,
        experienceYears: Number(profileData.experienceYears),
      });

      // Update coverage as well
      const areas = operatingAreasText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (selectedSchoolIds.length > 0) {
        await api.patch('/drivers/me/coverage', {
          schoolIds: selectedSchoolIds,
          serviceDistricts: [profileData.district],
          operatingAreas: areas.length > 0 ? areas : ['Colombo'],
          monthlyRatePerChild: monthlyRateLKR * 100,
        });
      }

      toast.success('Driver profile and service routes updated successfully.');
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/driver/dashboard" className="text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Driver Profile & Route Coverage
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure your professional biography, served school corridors, and monthly fee pricing.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Operator Biography</h3>
              <p className="text-xs text-muted-foreground">Displayed on your public driver discovery card.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Full Name *
              </label>
              <Input
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Contact Phone Number (Sri Lankan) *
              </label>
              <Input
                placeholder="0771234567"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                NIC Number *
              </label>
              <Input
                placeholder="851234567V"
                value={profileData.nicNumber}
                onChange={(e) => setProfileData({ ...profileData, nicNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Driving License Number *
              </label>
              <Input
                placeholder="B1234567"
                value={profileData.licenseNumber}
                onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Years of Driving Experience *
              </label>
              <Input
                type="number"
                min={1}
                max={50}
                value={profileData.experienceYears}
                onChange={(e) => setProfileData({ ...profileData, experienceYears: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Home District *
              </label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={profileData.district}
                onChange={(e) => setProfileData({ ...profileData, district: e.target.value })}
                required
              >
                {SRI_LANKAN_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.province})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Home City / Town *
              </label>
              <Input
                placeholder="e.g. Maharagama"
                value={profileData.city}
                onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Professional Biography & Service Overview *
            </label>
            <Textarea
              rows={3}
              placeholder="e.g. Over 10 years of incident-free school transport along the High-Level road corridor. Child safety and punctuality prioritized."
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              required
            />
          </div>
        </Card>

        {/* Coverage & Route Card */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <School className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Route Corridors & Schools Served</h3>
              <p className="text-xs text-muted-foreground">
                Matches your service with parents searching for transportation to these institutions.
              </p>
            </div>
          </div>

          {/* School Multiselect */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Select Schools Served ({selectedSchoolIds.length} Selected) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-border rounded-xl p-3">
              {schoolsList.map((s) => {
                const isSelected = selectedSchoolIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSchoolIds([...selectedSchoolIds, s.id]);
                        } else {
                          setSelectedSchoolIds(selectedSchoolIds.filter((id) => id !== s.id));
                        }
                      }}
                      className="rounded border-border text-primary"
                    />
                    <span>{s.name} ({s.district})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Operating Neighborhoods */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Operating Suburbs / Pickup Corridors (Comma separated) *
            </label>
            <Input
              placeholder="e.g. Nugegoda, Kohuwala, Havelock Town, Bambalapitiya"
              value={operatingAreasText}
              onChange={(e) => setOperatingAreasText(e.target.value)}
              required
            />
          </div>

          {/* Monthly Rate */}
          <div className="max-w-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Standard Monthly Fee Per Student (LKR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-muted-foreground">Rs.</span>
              <Input
                type="number"
                min={2000}
                max={60000}
                step={500}
                className="pl-10"
                value={monthlyRateLKR}
                onChange={(e) => setMonthlyRateLKR(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" disabled={isSaving} className="font-bold shadow-subtle">
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Saving Profile & Coverage...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
