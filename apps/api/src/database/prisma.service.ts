import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createPgConfig } = require('@electric-sql/pglite/node-postgres');
import * as path from 'path';
import * as fs from 'fs';

let pgliteInstance: PGlite | null = null;
let poolInstance: Pool | null = null;

function resolvePrismaConfig(): any {
  const dbUrl = process.env.DATABASE_URL;
  // If remote database URL provided (e.g., Supabase / Neon / remote PostgreSQL)
  if (dbUrl && !dbUrl.includes('localhost:5432') && !dbUrl.includes('127.0.0.1:5432')) {
    return { datasourceUrl: dbUrl };
  }

  // Find data/postgres directory
  const rootDbDir = path.resolve(process.cwd(), 'data/postgres');
  const parentDbDir = path.resolve(process.cwd(), '../../data/postgres');
  const moduleDbDir = path.resolve(__dirname, '../../../../data/postgres');
  const dbDir = fs.existsSync(rootDbDir)
    ? rootDbDir
    : fs.existsSync(parentDbDir)
      ? parentDbDir
      : fs.existsSync(moduleDbDir)
        ? moduleDbDir
        : rootDbDir;

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  pgliteInstance = new PGlite(dbDir);
  const pgConfig = createPgConfig(pgliteInstance);
  poolInstance = new Pool(pgConfig as any);
  const adapter = new PrismaPg(poolInstance);

  return { adapter };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super(resolvePrismaConfig());
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected to database successfully');
    } catch (error) {
      this.logger.error(`Database connection error: ${error instanceof Error ? error.message : error}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    if (poolInstance) {
      await poolInstance.end();
    }
    this.logger.log('Prisma disconnected from database');
  }
}
