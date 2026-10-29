'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Bus, ShieldAlert, ArrowRight, UserCheck, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // If already logged in, redirect to appropriate role portal
  React.useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') router.push('/admin/dashboard');
      else if (user.role === 'DRIVER') router.push('/driver/dashboard');
      else router.push('/parent/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loggedInUser = await login(email, password);
      toast.success(`Welcome back, ${loggedInUser.fullName}!`);
      if (loggedInUser.role === 'ADMIN') router.push('/admin/dashboard');
      else if (loggedInUser.role === 'DRIVER') router.push('/driver/dashboard');
      else router.push('/parent/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick switch helpers for testing
  const selectQuickRole = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMessage(null);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-muted/20">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-subtle mb-1">
            <Bus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Sign in to SchoolRide LK</h1>
          <p className="text-xs text-muted-foreground">Access your verified school transportation dashboard</p>
        </div>

        {/* 1-Click Demo Profile Switcher for Testing */}
        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Instant Demo Account Selector</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => selectQuickRole('parent@schoolride.lk', 'Password123!')}
              className="px-2 py-1.5 rounded-lg border border-border bg-card text-left text-[11px] font-medium hover:border-primary transition-colors cursor-pointer"
            >
              <div className="font-bold text-foreground">Parent</div>
              <div className="text-[10px] text-muted-foreground">Chathura</div>
            </button>
            <button
              type="button"
              onClick={() => selectQuickRole('sunil.driver@schoolride.lk', 'Password123!')}
              className="px-2 py-1.5 rounded-lg border border-border bg-card text-left text-[11px] font-medium hover:border-primary transition-colors cursor-pointer"
            >
              <div className="font-bold text-foreground">Van Driver</div>
              <div className="text-[10px] text-muted-foreground">Sunil (Verified)</div>
            </button>
            <button
              type="button"
              onClick={() => selectQuickRole('admin@schoolride.lk', 'AdminPassword123!')}
              className="px-2 py-1.5 rounded-lg border border-border bg-card text-left text-[11px] font-medium hover:border-primary transition-colors cursor-pointer"
            >
              <div className="font-bold text-foreground">Admin</div>
              <div className="text-[10px] text-muted-foreground">Platform</div>
            </button>
          </div>
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
                label="Email Address"
                type="email"
                placeholder="you@domain.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" variant="primary" size="lg" className="w-full font-bold" isLoading={isLoading}>
                Sign In <ArrowRight className="h-4 w-4 ml-1" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Don't have an account yet?{' '}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Create an account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
