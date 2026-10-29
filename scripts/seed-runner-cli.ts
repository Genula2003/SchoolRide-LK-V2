import { PrismaClient } from '@prisma/client';
import { seedDatabaseWithClient } from './seed-runner';

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedDatabaseWithClient(prisma);
    console.log('✅ All seed data loaded successfully!');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
