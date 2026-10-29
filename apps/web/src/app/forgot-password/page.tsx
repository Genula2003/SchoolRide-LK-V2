'use client';

import * as React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bus, KeyRound, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [resetToken, setResetToken] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setIsSubmitted(true);
      if (res?.resetToken) {
        setResetToken(res.resetToken);
      }
      toast.success('Password recovery instructions sent to your email.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Reset Account Password
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your registered email address to receive password recovery instructions.
          </p>
        </div>

        <Card className="p-6 shadow-elevated border-border">
          {isSubmitted ? (
            <div className="text-center space-y-4 py-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Check Your Inbox</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If an account exists for <strong className="text-foreground">{email}</strong>, we have dispatched single-use password recovery instructions.
              </p>

              {/* Dev convenience display if token returned */}
              {resetToken && (
                <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs text-left space-y-2">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Development Environment Reset Link:
                  </p>
                  <Link
                    href={`/reset-password?token=${resetToken}`}
                    className="block font-mono text-[11px] text-primary hover:underline break-all"
                  >
                    /reset-password?token={resetToken}
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="parent@schoolride.lk"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full justify-center font-bold shadow-subtle"
              >
                <KeyRound className="h-4 w-4 mr-1.5" />
                {isSubmitting ? 'Sending Request...' : 'Send Recovery Instructions'}
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
      </div>
    </div>
  );
}
