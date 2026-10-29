import Link from 'next/link';
import { Bus, Shield, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 text-foreground/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Platform Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-subtle">
                <Bus className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-foreground">SchoolRide LK</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sri Lanka's dedicated school transport network connecting verified van drivers with families across Western, Central, Southern, and all 25 administrative districts.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>Multi-tier driver and vehicle verification</span>
            </div>
          </div>

          {/* Column 2: Parent Resources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Parents
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/drivers" className="hover:text-primary transition-colors">
                  Find Verified Drivers
                </Link>
              </li>
              <li>
                <Link href="/parent/dashboard" className="hover:text-primary transition-colors">
                  Parent Dashboard
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-primary transition-colors">
                  Safety & Background Standards
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-primary transition-colors">
                  Create Parent Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Van Drivers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Van Drivers & Operators
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/register" className="hover:text-primary transition-colors">
                  Register as Driver
                </Link>
              </li>
              <li>
                <Link href="/driver/dashboard" className="hover:text-primary transition-colors">
                  Driver Portal
                </Link>
              </li>
              <li>
                <Link href="/driver/onboarding" className="hover:text-primary transition-colors">
                  Verification Guidelines
                </Link>
              </li>
              <li>
                <Link href="/driver/console" className="hover:text-primary transition-colors">
                  Live Ride Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Operations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Support & Location
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>Colombo 07, Western Province, Sri Lanka</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>+94 11 234 5678 (Mon–Fri, 6:00 AM – 6:00 PM)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>support@schoolride.lk</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} SchoolRide LK. All rights reserved. Timezone: Asia/Colombo.</p>
          <div className="flex gap-6">
            <Link href="/safety" className="hover:underline">
              Privacy & Child Safety Policy
            </Link>
            <Link href="/safety" className="hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
