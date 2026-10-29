'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, Trash2, Edit2, MapPin, GraduationCap, ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { INITIAL_SCHOOLS } from '@schoolride/shared';

export default function ParentChildrenPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [childrenList, setChildrenList] = React.useState<any[]>([]);
  const [schools, setSchools] = React.useState<any[]>(INITIAL_SCHOOLS);
  const [isLoading, setIsLoading] = React.useState(true);

  // Add/Edit Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingChildId, setEditingChildId] = React.useState<string | null>(null);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('2015-01-01');
  const [gender, setGender] = React.useState('MALE');
  const [schoolId, setSchoolId] = React.useState(INITIAL_SCHOOLS[0]?.id || '');
  const [grade, setGrade] = React.useState('Grade 6');
  const [pickupAddress, setPickupAddress] = React.useState('');
  const [dropoffAddress, setDropoffAddress] = React.useState('');
  const [specialNotes, setSpecialNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchChildren = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, schoolsRes] = await Promise.all([
        api.get('/parents/me/children'),
        api.get('/schools').catch(() => INITIAL_SCHOOLS),
      ]);
      setChildrenList(res);
      if (schoolsRes?.length > 0) {
        setSchools(schoolsRes);
      }
    } catch {
      setChildrenList([]);
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
      fetchChildren();
    }
  }, [user, authLoading, router, fetchChildren]);

  const handleOpenAddModal = () => {
    setEditingChildId(null);
    setFirstName('');
    setLastName('');
    setDateOfBirth('2015-05-10');
    setGender('MALE');
    setSchoolId(schools[0]?.id || '');
    setGrade('Grade 6');
    setPickupAddress(user?.district ? `No 10, Main Street, ${user.city || user.district}` : '');
    setDropoffAddress('');
    setSpecialNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (child: any) => {
    setEditingChildId(child.id);
    setFirstName(child.firstName);
    setLastName(child.lastName);
    setDateOfBirth(child.dateOfBirth);
    setGender(child.gender);
    setSchoolId(child.schoolId);
    setGrade(child.grade);
    setPickupAddress(child.pickupAddress);
    setDropoffAddress(child.dropoffAddress);
    setSpecialNotes(child.specialNotes || '');
    setModalOpen(true);
  };

  const handleSubmitChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !schoolId || !pickupAddress) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    const selectedSchool = schools.find((s) => s.id === schoolId);
    const dropoff = dropoffAddress || `${selectedSchool?.name || 'School Gate'}, ${selectedSchool?.city || ''}`;

    setIsSubmitting(true);
    try {
      const payload = {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        schoolId,
        grade,
        pickupAddress,
        pickupLatitude: 6.8722,
        pickupLongitude: 79.8997,
        dropoffAddress: dropoff,
        dropoffLatitude: selectedSchool?.latitude || 6.9066,
        dropoffLongitude: selectedSchool?.longitude || 79.8617,
        specialNotes,
      };

      if (editingChildId) {
        await api.patch(`/parents/me/children/${editingChildId}`, payload);
        toast.success('Child profile updated successfully.');
      } else {
        await api.post('/parents/me/children', payload);
        toast.success('Child profile added successfully.');
      }

      setModalOpen(false);
      fetchChildren();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save child profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChild = async (childId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the profile for ${name}?`)) {
      return;
    }

    try {
      await api.delete(`/parents/me/children/${childId}`);
      toast.success(`${name}'s profile has been removed.`);
      fetchChildren();
    } catch (err: any) {
      toast.error(err.message || 'Cannot delete child with active bookings.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 w-full text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <Link href="/parent/dashboard" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center mb-1">
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Child Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Register your children, specify their enrolled schools, and manage private pickup instructions.
          </p>
        </div>

        <Button onClick={handleOpenAddModal} variant="primary" size="md" className="shadow-subtle">
          <Plus className="h-4 w-4 mr-1" /> Add Child Profile
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : childrenList.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No children registered"
          description="Add a child profile to get started with finding matched school van operators."
          actionLabel="Add First Child"
          onAction={handleOpenAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {childrenList.map((child) => (
            <Card key={child.id} className="p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {child.grade} • {child.gender} • Born {child.dateOfBirth}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(child)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Edit Child"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteChild(child.id, `${child.firstName} ${child.lastName}`)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Remove Child"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                    <span>School: {child.school?.name}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="leading-relaxed">Pickup: {child.pickupAddress}</span>
                  </div>
                  {child.specialNotes && (
                    <div className="text-[11px] text-muted-foreground/80 italic pt-1 border-t border-border/40">
                      Notes: {child.specialNotes}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {child.bookings?.length > 0 ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Active Transport Enrolled
                    </span>
                  ) : (
                    'Not yet enrolled in a van'
                  )}
                </span>
                <Link href={`/drivers?schoolId=${child.schoolId}`}>
                  <Button variant="ghost" size="sm" className="text-xs text-primary">
                    Find Van for {child.firstName}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Child Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <form onSubmit={handleSubmitChild}>
          <DialogHeader>
            <DialogTitle>{editingChildId ? 'Edit Child Profile' : 'Add Child Profile'}</DialogTitle>
            <DialogDescription>
              Information is stored securely and used solely for matched school transportation services.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-left">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="e.g. Dineth"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                placeholder="e.g. Silva"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Date of Birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-xs text-foreground shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <Input
                label="Grade / Class"
                placeholder="e.g. Grade 7"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Enrolled School</label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-xs text-foreground shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                required
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.district} ({s.city})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Home Pickup Address"
              placeholder="e.g. No 45, Chapel Road, Nugegoda"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              required
            />

            <Input
              label="Special Notes / Medical Instructions (Optional)"
              placeholder="e.g. Inhaler in backpack, needs front seat"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingChildId ? 'Update Profile' : 'Save Child Profile'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
