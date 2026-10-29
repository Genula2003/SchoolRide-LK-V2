import { PGlite } from '@electric-sql/pglite';
import { createPgConfig } from '@electric-sql/pglite/node-postgres';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function test() {
  const dbDir = path.resolve(__dirname, '../data/postgres');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const pglite = new PGlite(dbDir);
  const pgConfig = createPgConfig(pglite);
  const pool = new Pool(pgConfig as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Testing PGlite + pg.Pool query...');
  const poolRes = await pool.query('SELECT 42 as answer');
  console.log('Pool query result:', poolRes.rows);

  console.log('Testing PrismaClient connect...');
  await prisma.$connect();
  console.log('Prisma connected successfully via PGlite adapter!');

  await prisma.$disconnect();
  await pool.end();
}

test().catch(console.error);
