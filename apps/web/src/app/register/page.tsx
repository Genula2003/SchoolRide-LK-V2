'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabItem } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Bus, Users, ShieldAlert, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { SRI_LANKAN_DISTRICTS } from '@schoolride/shared';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const initialRole = searchParams.get('role') === 'DRIVER' ? 'DRIVER' : 'PARENT';
  const [activeRole, setActiveRole] = React.useState<string>(initialRole);

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [district, setDistrict] = React.useState('Colombo');
  const [city, setCity] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const roleTabs: TabItem[] = [
    { id: 'PARENT', label: 'Parent Account', icon: <Users className="h-4 w-4" /> },
    { id: 'DRIVER', label: 'Van Operator', icon: <Bus className="h-4 w-4" /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      if (activeRole === 'PARENT') {
        const payload = {
          fullName,
          email,
          phone,
          password,
          confirmPassword,
          district,
          city: city || district,
          role: 'PARENT',
        };
        const res = await api.post('/auth/register/parent', payload);
        api.setToken(res.accessToken);
        toast.success('Parent registration successful!');
        router.push('/parent/dashboard');
      } else {
        const payload = {
          fullName,
          email,
          phone,
          password,
          confirmPassword,
          district,
          role: 'DRIVER',
        };
        const res = await api.post('/auth/register/driver', payload);
        api.setToken(res.accessToken);
        toast.success('Driver account created! Please complete your onboarding.');
        router.push('/driver/onboarding');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-muted/20">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-subtle mb-1">
            <Bus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Create SchoolRide LK Account</h1>
          <p className="text-xs text-muted-foreground">Join Sri Lanka's verified school transportation platform</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex justify-center">
          <Tabs tabs={roleTabs} activeTab={activeRole} onChange={setActiveRole} />
        </div>

        <Card className="border-border shadow-card">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Input
                label="Full Name"
                placeholder={activeRole === 'PARENT' ? 'e.g. Chathura Silva' : 'e.g. Sunil Jayawardena'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@domain.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Sri Lankan Mobile"
                  placeholder="0771234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Operating District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                  >
                    {SRI_LANKAN_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.province} Province)
                      </option>
                    ))}
                  </select>
                </div>

                {activeRole === 'PARENT' && (
                  <Input
                    label="City / Town"
                    placeholder="e.g. Nugegoda"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 digit"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" variant="primary" size="lg" className="w-full font-bold" isLoading={isLoading}>
                {activeRole === 'PARENT' ? 'Register Parent Account' : 'Register as Van Operator'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Already registered?{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Sign in here
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8"><div className="h-48 w-full max-w-md bg-muted/40 animate-pulse rounded-2xl" /></div>}>
      <RegisterContent />
    </React.Suspense>
  );
}
