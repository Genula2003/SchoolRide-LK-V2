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
import { ArrowLeft, User, Phone, MapPin, ShieldCheck, Save } from 'lucide-react';
import { toast } from 'sonner';
import { SRI_LANKAN_DISTRICTS } from '@schoolride/shared';

export default function ParentSettingsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const [formData, setFormData] = React.useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: 'Colombo',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'PARENT')) {
      router.push('/login');
      return;
    }

    async function loadProfile() {
      try {
        const data = await api.get('/parents/me');
        if (data) {
          setFormData({
            fullName: data.user?.fullName || user?.fullName || '',
            phone: data.user?.phone || user?.phone || '',
            address: data.address || '',
            city: data.city || '',
            district: data.district || 'Colombo',
            emergencyContactName: data.emergencyContactName || '',
            emergencyContactPhone: data.emergencyContactPhone || '',
          });
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch('/parents/me/profile', formData);
      toast.success('Your profile settings have been updated successfully.');
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
            <Link href="/parent/dashboard" className="text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Parent Account & Safety Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your personal profile, residential details, and primary emergency dispatch contact.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Personal Profile</h3>
              <p className="text-xs text-muted-foreground">Used for identification and communications.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Full Name *
              </label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Phone Number (Sri Lankan) *
              </label>
              <Input
                placeholder="0771234567 or +94771234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Account Email
            </label>
            <Input value={user?.email || ''} disabled className="bg-muted cursor-not-allowed opacity-75" />
            <p className="text-[11px] text-muted-foreground mt-1">
              Email addresses cannot be changed directly for security purposes.
            </p>
          </div>
        </Card>

        {/* Residential Location */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Residential Address</h3>
              <p className="text-xs text-muted-foreground">Reference location for route optimization.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Street Address *
            </label>
            <Input
              placeholder="e.g. 45/2 Galle Road"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                City / Suburb *
              </label>
              <Input
                placeholder="e.g. Kollupitiya"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                District *
              </label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                required
              >
                {SRI_LANKAN_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.province} Province)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Emergency Dispatch Contact</h3>
              <p className="text-xs text-muted-foreground">
                In case of transport emergencies or unforeseen road incidents.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Emergency Contact Name *
              </label>
              <Input
                placeholder="e.g. Kumari Perera (Spouse / Guardian)"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Emergency Contact Phone *
              </label>
              <Input
                placeholder="e.g. 0777654321"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                required
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" disabled={isSaving} className="font-bold shadow-subtle">
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Saving Changes...' : 'Save Profile Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
