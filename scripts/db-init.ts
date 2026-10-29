import { PGlite } from '@electric-sql/pglite';
import { createPgConfig } from '@electric-sql/pglite/node-postgres';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function initAndSeed() {
  console.log('🚀 Initializing SchoolRide LK PostgreSQL Database...');

  const dbDir = path.resolve(__dirname, '../data/postgres');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const pglite = new PGlite(dbDir);
  const sqlPath = path.resolve(__dirname, '../apps/api/prisma/migrations/init.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  console.log('📦 Executing schema migration SQL...');
  await pglite.exec(sqlContent);
  console.log('✅ PostgreSQL Schema created successfully!');

  // Now seed data using Prisma
  const pgConfig = createPgConfig(pglite);
  const pool = new Pool(pgConfig as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Seeding database...');
  const { seedDatabaseWithClient } = await import('./seed-runner');
  await seedDatabaseWithClient(prisma);

  await prisma.$disconnect();
  await pool.end();
  console.log('🎉 Database initialization and seed complete!');
}

initAndSeed().catch((err) => {
  console.error('Database init error:', err);
  process.exit(1);
});
