'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileCheck,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  FileText,
  Shield,
  Eye,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { DriverDocumentType, VerificationStatus } from '@schoolride/shared';

interface DocUploadItem {
  type: DriverDocumentType;
  title: string;
  description: string;
  acceptedFormats: string;
}

const REQUIRED_DOCUMENTS: DocUploadItem[] = [
  {
    type: DriverDocumentType.NIC_FRONT,
    title: 'National Identity Card (NIC) - Front',
    description: 'Clear photo or scan of your Sri Lankan NIC (front side showing name and photo).',
    acceptedFormats: 'JPG, PNG or PDF (Max 5MB)',
  },
  {
    type: DriverDocumentType.NIC_BACK,
    title: 'National Identity Card (NIC) - Back',
    description: 'Sri Lankan NIC (reverse side showing address and barcode).',
    acceptedFormats: 'JPG, PNG or PDF (Max 5MB)',
  },
  {
    type: DriverDocumentType.DRIVING_LICENSE_FRONT,
    title: 'Driving License - Front Side',
    description: 'Sri Lankan Heavy Passenger or Van license showing valid expiry date and classes.',
    acceptedFormats: 'JPG, PNG or PDF (Max 5MB)',
  },
  {
    type: DriverDocumentType.DRIVING_LICENSE_BACK,
    title: 'Driving License - Back Side',
    description: 'Reverse side showing vehicle class endorsements and restrictions.',
    acceptedFormats: 'JPG, PNG or PDF (Max 5MB)',
  },
  {
    type: DriverDocumentType.POLICE_CLEARANCE,
    title: 'Police Clearance Report / Background Check',
    description: 'Recent certificate of character issued by the Sri Lanka Police Department.',
    acceptedFormats: 'PDF or High-res image (Max 5MB)',
  },
];

export default function DriverOnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = React.useState<any>(null);
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [uploadingType, setUploadingType] = React.useState<string | null>(null);

  const fileInputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/drivers/me');
      setProfile(data);
      setDocuments(data?.documents || []);
    } catch (err: any) {
      console.error('Failed to load driver documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'DRIVER')) {
      router.push('/login');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, router, loadData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: DriverDocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB maximum limit.');
      return;
    }

    setUploadingType(docType);
    try {
      // 1. Upload file to private storage
      const formData = new FormData();
      formData.append('file', file);
      const storageRes = await api.post('/storage/upload', formData);

      // 2. Link document record to driver profile
      await api.post('/drivers/me/documents', {
        documentType: docType,
        fileKey: storageRes.fileKey,
        fileName: storageRes.fileName || file.name,
        fileSize: storageRes.fileSize || file.size,
        mimeType: storageRes.mimeType || file.type,
      });

      toast.success(`Document uploaded successfully: ${file.name}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document.');
    } finally {
      setUploadingType(null);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const isVerified = profile?.verificationStatus === VerificationStatus.APPROVED;
  const isPending = profile?.verificationStatus === VerificationStatus.PENDING;
  const isRejected = profile?.verificationStatus === VerificationStatus.REJECTED;

  const uploadedCount = REQUIRED_DOCUMENTS.filter((req) =>
    documents.some((d) => d.documentType === req.type)
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/driver/dashboard" className="text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Driver Verification & Credentials
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sri Lankan child safety standards require all van operators to maintain verified identity and licensing records.
          </p>
        </div>

        <Badge
          variant={isVerified ? 'success' : isPending ? 'warning' : isRejected ? 'destructive' : 'secondary'}
          className="text-xs font-semibold uppercase tracking-wider"
        >
          {profile?.verificationStatus?.replace('_', ' ') || 'UNVERIFIED'}
        </Badge>
      </div>

      {/* Verification Status Banner */}
      {isVerified ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Operating Authority Granted</p>
            <p className="opacity-90">Your credentials have been verified by SchoolRide LK administration. Your public profile is live.</p>
          </div>
        </div>
      ) : isRejected ? (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3 text-xs text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Verification Correction Required</p>
            <p className="opacity-90">{profile?.rejectionReason || 'Please review administrative feedback and replace invalid documents.'}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-3 text-xs text-primary">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Documentation Progress: {uploadedCount} of {REQUIRED_DOCUMENTS.length} Uploaded</p>
              <p className="text-muted-foreground text-[11px]">
                Once all required documents are uploaded, our team inspects them within 24-48 business hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Cards */}
      <div className="space-y-4">
        {REQUIRED_DOCUMENTS.map((req) => {
          const doc = documents.find((d) => d.documentType === req.type);
          const isUploaded = !!doc;
          const isDocVerified = doc?.isVerified;
          const isUploading = uploadingType === req.type;

          return (
            <Card key={req.type} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">{req.title}</h3>
                  {isDocVerified ? (
                    <Badge variant="success" className="text-[10px]">Verified</Badge>
                  ) : isUploaded ? (
                    <Badge variant="warning" className="text-[10px]">Under Review</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Required</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{req.description}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{req.acceptedFormats}</p>
                {isUploaded && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                    Uploaded file: {doc.fileName} ({(doc.fileSize / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  ref={(el) => {
                    fileInputRefs.current[req.type] = el;
                  }}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, req.type)}
                />

                <Button
                  variant={isUploaded ? 'outline' : 'primary'}
                  size="sm"
                  disabled={isUploading || isDocVerified}
                  onClick={() => fileInputRefs.current[req.type]?.click()}
                  className="font-semibold text-xs"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {isUploading
                    ? 'Uploading...'
                    : isDocVerified
                    ? 'Verified'
                    : isUploaded
                    ? 'Replace Document'
                    : 'Upload Document'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
