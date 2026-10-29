'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { NotificationPopover } from './ui/notification-popover';
import { Shield, Bus, Menu, X, LogOut, ChevronDown, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/80 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-subtle group-hover:scale-105 transition-transform duration-150">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-base sm:text-lg text-foreground">
                SchoolRide
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-accent/20 text-accent-ceylon border border-accent/30 uppercase tracking-wider">
                LK
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block -mt-0.5">
              Verified Sri Lankan School Transport
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/drivers"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              isActive('/drivers')
                ? 'text-primary font-semibold bg-primary/10'
                : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Find Van Drivers
          </Link>

          {user?.role === 'PARENT' && (
            <>
              <Link
                href="/parent/dashboard"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  pathname.startsWith('/parent')
                    ? 'text-primary font-semibold bg-primary/10'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Parent Dashboard
              </Link>
              <Link
                href="/parent/rides/live"
                className="px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Live Tracking
              </Link>
            </>
          )}

          {user?.role === 'DRIVER' && (
            <>
              <Link
                href="/driver/dashboard"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  pathname.startsWith('/driver/dashboard')
                    ? 'text-primary font-semibold bg-primary/10'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Driver Portal
              </Link>
              <Link
                href="/driver/console"
                className="px-3 py-1.5 rounded-lg text-primary font-semibold bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1.5"
              >
                <Bus className="h-4 w-4" />
                Ride Console
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              href="/admin/dashboard"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/admin')
                  ? 'text-primary font-semibold bg-primary/10'
                  : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Admin Oversight
            </Link>
          )}

          <Link
            href="/safety"
            className="px-3 py-1.5 rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1"
          >
            <Shield className="h-4 w-4 text-primary" />
            Safety & Trust
          </Link>
        </nav>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationPopover />

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer select-none text-left"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                    {user.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-foreground leading-none">{user.fullName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{user.role.toLowerCase()}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.96 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card p-1.5 shadow-floating z-50"
                    >
                      <div className="px-3 py-2 border-b border-border/60 mb-1">
                        <p className="text-xs font-semibold text-foreground truncate">{user.fullName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>

                      {user.role === 'PARENT' && (
                        <>
                          <Link
                            href="/parent/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Dashboard
                          </Link>
                          <Link
                            href="/parent/children"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            My Children
                          </Link>
                          <Link
                            href="/parent/bookings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Bookings
                          </Link>
                          <Link
                            href="/parent/complaints"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 hover:bg-muted/60 transition-colors"
                          >
                            Report Concern
                          </Link>
                          <Link
                            href="/parent/settings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Settings & Profile
                          </Link>
                        </>
                      )}

                      {user.role === 'DRIVER' && (
                        <>
                          <Link
                            href="/driver/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Dashboard
                          </Link>
                          <Link
                            href="/driver/console"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Route Console
                          </Link>
                          <Link
                            href="/driver/bookings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Incoming Requests
                          </Link>
                          <Link
                            href="/driver/vehicles"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Fleet Vehicles
                          </Link>
                          <Link
                            href="/driver/onboarding"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Verification Docs
                          </Link>
                          <Link
                            href="/driver/settings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Routes & Bio
                          </Link>
                        </>
                      )}

                      {user.role === 'ADMIN' && (
                        <>
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Control Overview
                          </Link>
                          <Link
                            href="/admin/verifications"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Driver Verifications
                          </Link>
                          <Link
                            href="/admin/users"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            User Moderation
                          </Link>
                          <Link
                            href="/admin/schools"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Schools Master DB
                          </Link>
                          <Link
                            href="/admin/complaints"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 hover:bg-muted/60 transition-colors"
                          >
                            Safety Complaints
                          </Link>
                          <Link
                            href="/admin/audit-logs"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Security Audit Trail
                          </Link>
                        </>
                      )}

                      <div className="border-t border-border/60 my-1" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border bg-card px-4 pt-2 pb-6 space-y-2 overflow-hidden"
          >
            <Link
              href="/drivers"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-foreground hover:text-primary"
            >
              Find Van Drivers
            </Link>
            <Link
              href="/safety"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-foreground hover:text-primary"
            >
              Safety & Verification
            </Link>

            {user?.role === 'PARENT' && (
              <>
                <Link
                  href="/parent/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-primary"
                >
                  Parent Dashboard
                </Link>
                <Link
                  href="/parent/rides/live"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-emerald-600"
                >
                  Live Ride Tracking
                </Link>
              </>
            )}

            {user?.role === 'DRIVER' && (
              <>
                <Link
                  href="/driver/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-primary"
                >
                  Driver Portal
                </Link>
                <Link
                  href="/driver/console"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-primary"
                >
                  Ride Console
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-primary"
              >
                Admin Oversight
              </Link>
            )}

            {!user && (
              <div className="pt-4 flex gap-2">
                <Link href="/login" className="w-1/2">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" className="w-1/2">
                  <Button variant="primary" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
