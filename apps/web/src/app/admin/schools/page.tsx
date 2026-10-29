'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  School,
  Plus,
  Search,
  MapPin,
  ArrowLeft,
  Compass,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';
import { SRI_LANKAN_DISTRICTS } from '@schoolride/shared';

export default function AdminSchoolsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [schools, setSchools] = React.useState<any[]>([]);
  const [districtFilter, setDistrictFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingSchoolId, setEditingSchoolId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: '',
    district: 'Colombo',
    city: 'Colombo',
    address: '',
    latitude: 6.9034,
    longitude: 79.8596,
  });

  const loadSchools = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (districtFilter) params.append('district', districtFilter);
      if (searchQuery.trim()) params.append('query', searchQuery.trim());

      const data = await api.get(`/schools?${params.toString()}`);
      setSchools(data || []);
    } catch (err: any) {
      console.error('Failed to load schools:', err);
    } finally {
      setIsLoading(false);
    }
  }, [districtFilter, searchQuery]);

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }
    if (user) {
      loadSchools();
    }
  }, [user, authLoading, router, loadSchools]);

  const handleOpenAdd = () => {
    setEditingSchoolId(null);
    setFormData({
      name: '',
      district: 'Colombo',
      city: 'Colombo',
      address: '',
      latitude: 6.9034,
      longitude: 79.8596,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (school: any) => {
    setEditingSchoolId(school.id);
    setFormData({
      name: school.name,
      district: school.district,
      city: school.city,
      address: school.address,
      latitude: school.latitude,
      longitude: school.longitude,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingSchoolId) {
        await api.patch(`/schools/${editingSchoolId}`, {
          ...formData,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
        });
        toast.success('School reference updated successfully.');
      } else {
        await api.post('/schools', {
          ...formData,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
        });
        toast.success('New school registered into national reference database.');
      }
      setIsDialogOpen(false);
      loadSchools();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save school.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && schools.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              School Reference Master Database
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Maintain verified school coordinates, geographic boundaries, and operating corridors across all 25 districts.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAdd}
          className="font-bold shadow-subtle shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add School Reference
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schools by name or city..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <select
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="">All Sri Lankan Districts</option>
            {SRI_LANKAN_DISTRICTS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name} ({d.province})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schools Table */}
      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground uppercase font-bold border-b border-border">
              <tr>
                <th className="py-3 px-4">School Name</th>
                <th className="py-3 px-4">District / City</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">GPS Coordinates</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {schools.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-foreground text-sm">{s.name}</p>
                  </td>

                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-[10px]">
                      {s.district} • {s.city}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                    {s.address}
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                    {s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(s)}
                      className="text-xs h-7 px-2.5"
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSchoolId ? 'Edit School Coordinates' : 'Register New School Reference'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Official School Name *
              </label>
              <Input
                placeholder="e.g. Royal College Colombo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  City / Town *
                </label>
                <Input
                  placeholder="e.g. Colombo 07"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Physical Campus Address *
              </label>
              <Input
                placeholder="e.g. Rajakeeya Mawatha, Colombo 00700"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Latitude *
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Longitude *
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save School'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
