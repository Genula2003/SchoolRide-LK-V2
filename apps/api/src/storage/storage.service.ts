import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;
  private readonly supabase: SupabaseClient | null = null;
  private readonly bucketName: string;

  constructor(private readonly prisma: PrismaService) {
    this.uploadDir = path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    this.bucketName = process.env.STORAGE_BUCKET || 'schoolride-documents';

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.logger.log(`Supabase client initialized for storage endpoint: ${supabaseUrl}`);
      } catch (err) {
        this.logger.warn(`Failed to initialize Supabase client: ${err}`);
      }
    }
  }

  async saveFile(
    userId: string,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File exceeds the 5MB size limit.');
    }

    // Validate MIME types
    const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed formats: JPEG, PNG, WebP, PDF.',
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const safeKey = `${crypto.randomUUID()}${ext}`;

    // 1. Resilient Local Disk Storage (ensures offline testing & zero-dependency local runs)
    const destination = path.join(this.uploadDir, safeKey);
    await fs.promises.writeFile(destination, file.buffer);

    // 2. Cloud Storage upload to Supabase if configured
    let cloudPublicUrl: string | undefined = undefined;
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .upload(safeKey, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (error) {
          this.logger.warn(`Supabase Storage upload notice: ${error.message}. Local copy preserved.`);
        } else if (data) {
          const { data: publicUrlData } = this.supabase.storage
            .from(this.bucketName)
            .getPublicUrl(safeKey);
          cloudPublicUrl = publicUrlData?.publicUrl;
          this.logger.log(`Document successfully synchronized with Supabase Storage: ${safeKey}`);
        }
      } catch (err: any) {
        this.logger.warn(`Supabase Storage communication error: ${err.message}. Local copy preserved.`);
      }
    }

    return {
      fileKey: safeKey,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      url: cloudPublicUrl || `/api/storage/files/${safeKey}`,
    };
  }

  async getFileStream(userId: string, userRole: string, fileKey: string) {
    // Security check: Only admins or the document owner may access private documents
    const doc = await this.prisma.driverDocument.findFirst({
      where: { fileKey },
      include: { driverProfile: true },
    });

    if (doc) {
      if (userRole !== 'ADMIN' && doc.driverProfile.userId !== userId) {
        throw new ForbiddenException('Access denied. You do not have permission to view this document.');
      }
    }

    const filePath = path.join(this.uploadDir, path.basename(fileKey));
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Requested file not found on server.');
    }

    return {
      stream: fs.createReadStream(filePath),
      filePath,
    };
  }
}
