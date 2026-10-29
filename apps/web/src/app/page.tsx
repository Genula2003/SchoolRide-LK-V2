'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
  Navigation,
  FileCheck,
  HeartHandshake,
  ChevronRight,
  HelpCircle,
  Bus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { INITIAL_SCHOOLS, SRI_LANKAN_DISTRICTS } from '@schoolride/shared';

export default function HomePage() {
  const [selectedDistrict, setSelectedDistrict] = React.useState('Colombo');

  return (
    <div className="flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/80 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Heading and CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span>Verified School Transport for Sri Lankan Families</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                Safe, reliable school vans.{' '}
                <span className="text-primary">Every school morning.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Connect directly with verified school van operators across Sri Lankan districts. Real-time GPS ride tracking, verified identity documents, and transparent booking management for peace of mind.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/drivers">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-elevated">
                    <Search className="h-4 w-4" />
                    Find Van Drivers
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register?role=DRIVER">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Bus className="h-4 w-4" />
                    Register as Van Operator
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-border/60 max-w-lg">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">25</p>
                  <p className="text-xs text-muted-foreground">Districts Covered</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">100%</p>
                  <p className="text-xs text-muted-foreground">Identity Inspected</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">GPS</p>
                  <p className="text-xs text-muted-foreground">Live Telemetry</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Product Preview Card */}
            <div className="lg:col-span-5 relative">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-border bg-card p-6 shadow-floating space-y-4"
              >
                {/* Active Ride Simulation Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Active Route in Progress
                      </span>
                      <p className="text-xs text-muted-foreground">Morning Colombo 07 Route</p>
                    </div>
                  </div>
                  <Badge variant="success">Live GPS</Badge>
                </div>

                {/* Driver & Vehicle Snippet */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-subtle shrink-0">
                    SJ
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground truncate">
                        Sunil Jayawardena
                      </span>
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Toyota HiAce Super GL • <span className="font-mono">WP NA-4521</span>
                    </p>
                  </div>
                </div>

                {/* Simulated Map Snapshot Card */}
                <div className="relative h-44 rounded-xl overflow-hidden border border-border bg-slate-900 flex flex-col justify-between p-4">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono backdrop-blur-md">
                      Speed: 38 km/h • Heading: North
                    </span>
                    <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-semibold shadow-subtle">
                      ETA: 7:18 AM
                    </span>
                  </div>

                  <div className="relative z-10 bg-black/70 backdrop-blur-md rounded-lg p-2.5 border border-white/10 text-white text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">Approving Rajakeeya Mawatha near Royal College</span>
                    </div>
                  </div>
                </div>

                {/* Passenger Status Checklist */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-card border border-border/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-foreground">Dineth Silva (Grade 7)</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">Picked up 6:35 AM</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-card border border-border/60">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="font-medium text-foreground">Senuri Silva (Grade 4)</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">En Route to Visakha</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="py-16 md:py-24 border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Simple & Transparent
            </h2>
            <h3 className="text-3xl font-extrabold text-foreground">
              How SchoolRide LK Works
            </h3>
            <p className="text-sm text-muted-foreground">
              A reliable process engineered for parents and drivers from request to daily school arrival.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-subtle space-y-4 hover:border-primary/40 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
                1
              </div>
              <h4 className="text-base font-bold text-foreground">
                Discover Verified Van Operators
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Filter by your child's school, your district, vehicle capacity, and operating neighborhoods. Review verified driver profiles, safety equipment, and parent feedback.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-subtle space-y-4 hover:border-primary/40 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
                2
              </div>
              <h4 className="text-base font-bold text-foreground">
                Submit & Confirm Bookings
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide private pickup/dropoff details and schedule. The driver confirms seat availability, route compatibility, and agreed monthly fees in LKR.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-subtle space-y-4 hover:border-primary/40 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
                3
              </div>
              <h4 className="text-base font-bold text-foreground">
                Track Live Trips Every Morning
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Follow your child's van on an interactive map. Receive real-time push updates when your child is picked up and safely dropped off at the school gate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SAFETY & VERIFICATION STANDARD */}
      <section className="py-16 md:py-24 border-b border-border/80 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Child Safety & Verification Pillars</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground">
                Trust earned through rigorous inspection.
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                We believe trust is built on verifiable requirements rather than marketing slogans. Every driver on SchoolRide LK must submit proof of identity, legal credentials, and vehicle roadworthiness before accepting student bookings.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Government Identity & Driving License</h5>
                    <p className="text-xs text-muted-foreground">National Identity Card (NIC) and valid commercial/heavy motor vehicle driving license verified by staff.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Vehicle Revenue License & Insurance Fitness</h5>
                    <p className="text-xs text-muted-foreground">Active provincial revenue licenses, valid passenger vehicle insurance policies, and annual fitness checks.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Private Child Location Protection</h5>
                    <p className="text-xs text-muted-foreground">Home pickup coordinates are never made public. Live GPS coordinates are transmitted exclusively during an active ride to authorized parents.</p>
                  </div>
                </div>
              </div>

              <Link href="/safety" className="inline-block pt-2">
                <Button variant="outline" size="sm">
                  Read Full Verification Policy <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-border bg-card shadow-subtle space-y-2">
                <FileCheck className="h-8 w-8 text-primary" />
                <h5 className="text-sm font-bold text-foreground">Doc Inspection</h5>
                <p className="text-xs text-muted-foreground">Administrator review queue verifying expiry dates and clarity before granting approved status.</p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card shadow-subtle space-y-2">
                <Navigation className="h-8 w-8 text-primary" />
                <h5 className="text-sm font-bold text-foreground">Active Telemetry</h5>
                <p className="text-xs text-muted-foreground">WebSocket-driven coordinates broadcast with speed, direction, and heartbeat freshness.</p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card shadow-subtle space-y-2">
                <Users className="h-8 w-8 text-primary" />
                <h5 className="text-sm font-bold text-foreground">Eligible Reviews</h5>
                <p className="text-xs text-muted-foreground">Ratings and feedback submitted only by verified parents with confirmed transport history.</p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card shadow-subtle space-y-2">
                <HeartHandshake className="h-8 w-8 text-primary" />
                <h5 className="text-sm font-bold text-foreground">Prompt Moderation</h5>
                <p className="text-xs text-muted-foreground">Dedicated complaint workflow with direct administrative intervention and accountability.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SRI LANKAN SCHOOL DIRECTORY SHOWCASE */}
      <section className="py-16 md:py-24 border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Island-Wide Reach
            </h2>
            <h3 className="text-3xl font-extrabold text-foreground">
              Serving Leading Sri Lankan Schools
            </h3>
            <p className="text-sm text-muted-foreground">
              Discover school van operators with established coverage routes to premier national and provincial schools.
            </p>
          </div>

          {/* District selector pills */}
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {['Colombo', 'Gampaha', 'Kandy', 'Galle'].map((district) => (
              <button
                key={district}
                onClick={() => setSelectedDistrict(district)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedDistrict === district
                    ? 'bg-primary text-primary-foreground shadow-subtle'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {district} District
              </button>
            ))}
          </div>

          {/* Filtered Schools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left pt-4">
            {INITIAL_SCHOOLS.filter((s) => s.district === selectedDistrict).map((school) => (
              <div
                key={school.id}
                className="p-4 rounded-xl border border-border bg-card shadow-subtle hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">{school.name}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    {school.address}
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-border/40 mt-3">
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Active Coverage
                  </span>
                  <Link
                    href={`/drivers?schoolId=${school.id}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    View Vans <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <Link href="/drivers">
              <Button variant="outline" size="md">
                View All Sri Lankan Schools & Districts
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-16 md:py-24 border-b border-border/80 bg-muted/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-left">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Frequently Asked Questions
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Everything you need to know about safety, booking, fees, and tracking.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                How are van drivers verified on SchoolRide LK?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                Drivers must upload valid government NIC identity cards, commercial driving licenses, vehicle revenue licenses, and passenger insurance documentation. Platform moderators review document clarity and expiry dates before a driver can be approved for public discovery.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                Is my child's location information kept private?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                Yes. Exact home pickup coordinates and children's profiles are strictly private and never publicly searchable. Live GPS tracking is transmitted exclusively through secure authenticated sessions only to parents whose child is assigned to that active ride.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                How are monthly transportation fees handled?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                Drivers set their standard monthly rate per child in Sri Lankan Rupees (LKR) based on operating districts and route distance. Booking requests clearly confirm the agreed fee before confirmation.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                What if a van driver cancels or is delayed?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                Drivers provide status updates directly through their ride console. If an issue arises, parents can register an official complaint ticket, which is escalated immediately to platform moderation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION FOOTER BANNER */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to find safe school transportation?
          </h3>
          <p className="text-base text-primary-100 max-w-xl mx-auto leading-relaxed">
            Join families across Sri Lanka who rely on verified van operators for their children's daily journey to school.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link href="/register">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto font-bold">
                Get Started as a Parent
              </Button>
            </Link>
            <Link href="/register?role=DRIVER">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-transparent border-primary-100 text-white hover:bg-white/10"
              >
                Register Van Fleet
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
