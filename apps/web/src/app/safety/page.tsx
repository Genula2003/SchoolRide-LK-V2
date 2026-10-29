import { ShieldCheck, FileCheck, Lock, EyeOff, UserCheck, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function SafetyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          <ShieldCheck className="h-4 w-4" />
          <span>Safety, Verification & Privacy Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Trust Before Marketing Claims
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          School transport carries what Sri Lankan families value most: our children. Learn how SchoolRide LK implements security, document verification, and privacy protections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <FileCheck className="h-5 w-5" />
            </div>
            <CardTitle>Driver Identity & Legal Documents</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>
              Before any driver profile appears in public search or accepts bookings, human administrators review the driver’s official documentation:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              <li>National Identity Card (NIC) front and back.</li>
              <li>Valid Driving License (Class B/commercial).</li>
              <li>Police Clearance Certificate (where requested).</li>
              <li>Contact phone verification.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle>Vehicle Roadworthiness & Safety Kits</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>
              Children deserve safe, compliant vehicles. Drivers register every vehicle with verified documentation:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              <li>Valid Provincial Revenue License with current expiry.</li>
              <li>Commercial Passenger Vehicle Insurance policy.</li>
              <li>Emergency exit doors and functional safety latches.</li>
              <li>First aid kit and fire extinguisher on board.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <EyeOff className="h-5 w-5" />
            </div>
            <CardTitle>Child Location & Route Privacy</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>
              We protect children by minimizing public exposure:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              <li>Exact home pickup coordinates are NEVER published on public driver profiles.</li>
              <li>Live GPS coordinates are broadcast only during an authorized, in-progress ride.</li>
              <li>Access to live tracking is strictly restricted to authenticated parents with children on that trip.</li>
              <li>WebSocket connections require valid JWT authentication and room authorization.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle>Continuous Moderation & Incident Handling</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>
              Our responsibility continues throughout every school term:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              <li>Reviews can only be posted by parents who completed actual bookings.</li>
              <li>Formal complaint ticketing with mandatory admin review and status tracking.</li>
              <li>Administrative suspension powers for reported policy violations.</li>
              <li>Complete audit logging of security and moderation decisions.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card shadow-subtle space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <AlertCircle className="h-4 w-4 text-primary" />
          <span>Sri Lankan Legal & Regulatory Compliance Note</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          SchoolRide LK operates in alignment with the Motor Traffic Act of Sri Lanka and provincial passenger transport authority regulations. While SchoolRide LK provides technological verification tools and GPS monitoring, parents are encouraged to maintain direct communication with their designated school van operator.
        </p>
      </div>
    </div>
  );
}
