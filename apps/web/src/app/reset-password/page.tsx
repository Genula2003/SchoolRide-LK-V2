'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bus, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Missing or invalid password reset token.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
      });

      setIsSuccess(true);
      toast.success('Your password has been successfully reset.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 shadow-elevated border-border">
      {isSuccess ? (
        <div className="text-center space-y-4 py-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">Password Reset Complete</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your account password has been updated securely. You can now sign in with your new credentials.
          </p>

          <div className="pt-2">
            <Link href="/login">
              <Button variant="primary" size="md" className="w-full justify-center font-bold">
                Sign In to Account
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              New Password (Min 8 Characters) *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                className="pl-9"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                className="pl-9"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting || !token}
            className="w-full justify-center font-bold shadow-subtle"
          >
            {isSubmitting ? 'Updating Password...' : 'Reset Password'}
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-elevated">
              <Bus className="h-6 w-6 group-hover:scale-105 transition-transform" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-foreground">
              SchoolRide <span className="text-primary">LK</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Create New Password
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your new secure password to restore access to your SchoolRide LK account.
          </p>
        </div>

        <React.Suspense fallback={<div className="h-48 rounded-2xl bg-muted/40 animate-pulse" />}>
          <ResetPasswordForm />
        </React.Suspense>
      </div>
    </div>
  );
}
