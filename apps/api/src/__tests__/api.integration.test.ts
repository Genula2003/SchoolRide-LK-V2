import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';

describe('SchoolRide LK — API Integration Test Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let parentToken: string;
  let driverToken: string;
  let adminToken: string;
  let testChildId: string;
  let approvedDriverProfileId: string;
  let approvedVehicleId: string;
  let createdBookingId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);

    // Get an approved driver from seed
    const approvedDriver = await prisma.driverProfile.findFirst({
      where: { verificationStatus: 'APPROVED' },
      include: { vehicles: true, user: true },
    });
    expect(approvedDriver).toBeDefined();
    approvedDriverProfileId = approvedDriver!.id;
    approvedVehicleId = approvedDriver!.vehicles[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication & Role Enforcement', () => {
    it('successfully logs in with seed administrator credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@schoolride.lk',
          password: 'AdminPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.accessToken).toBeDefined();
      adminToken = res.body.accessToken;
    });

    it('successfully logs in with verified driver credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'sunil.driver@schoolride.lk',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('DRIVER');
      expect(res.body.accessToken).toBeDefined();
      driverToken = res.body.accessToken;
    });

    it('successfully logs in with parent credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'parent@schoolride.lk',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('PARENT');
      expect(res.body.accessToken).toBeDefined();
      parentToken = res.body.accessToken;
    });

    it('rejects invalid login credentials with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'parent@schoolride.lk',
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
    });

    it('rejects unauthorized access to admin overview without token', async () => {
      const res = await request(app.getHttpServer()).get('/api/admin/overview');
      expect(res.status).toBe(401);
    });

    it('rejects parent access to admin overview with 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('2. Parent Experience & Child Management', () => {
    it('fetches existing children for parent', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/parents/me/children')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      testChildId = res.body[0].id;
    });

    it('creates a new child profile for parent', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/parents/me/children')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          firstName: 'Anuki',
          lastName: 'Silva',
          gender: 'FEMALE',
          dateOfBirth: '2018-04-10',
          schoolId: 'school-col-02', // Visakha Vidyalaya
          grade: 'Grade 3',
          pickupAddress: 'No 45, Chapel Road, Nugegoda',
          pickupLatitude: 6.8722,
          pickupLongitude: 79.8997,
          dropoffAddress: 'Visakha Vidyalaya, Colombo 05',
          dropoffLatitude: 6.8903,
          dropoffLongitude: 79.8596,
        });

      expect(res.status).toBe(201);
      expect(res.body.firstName).toBe('Anuki');
      expect(res.body.school.name).toBe('Visakha Vidyalaya');
    });
  });

  describe('3. Public Driver Discovery & Privacy Protection', () => {
    it('returns only verified (APPROVED) drivers in public search', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/drivers')
        .query({ district: 'Colombo' });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      // Verify all drivers in public search are APPROVED
      for (const driver of res.body.data) {
        expect(driver.verificationStatus).toBe('APPROVED');
        // Ensure sensitive fields (NIC, License Number) are NEVER exposed publicly
        expect((driver as any).nicNumber).toBeUndefined();
        expect((driver as any).licenseNumber).toBeUndefined();
      }
    });

    it('does NOT expose unverified or pending drivers in public search', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/drivers')
        .query({ query: 'Ruwan Senaratne' }); // Pending driver from seed

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0); // Must be zero!
    });
  });

  describe('4. Booking State Machine & Operations', () => {
    it('allows parent to submit a booking request for child', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          driverProfileId: approvedDriverProfileId,
          vehicleId: approvedVehicleId,
          childId: testChildId,
          pickupAddress: 'No 45, Chapel Road, Nugegoda',
          pickupLatitude: 6.8722,
          pickupLongitude: 79.8997,
          dropoffAddress: 'Royal College, Colombo 07',
          dropoffLatitude: 6.9066,
          dropoffLongitude: 79.8617,
          pickupTimeMorning: '06:30',
          dropoffTimeAfternoon: '14:00',
          startDate: '2026-02-01',
          monthlyFeeMinorUnits: 1800000,
        });

      // Note: If child already has an active booking with this driver from seed, duplicate check properly catches it
      if (res.status === 400) {
        expect(res.body.message).toContain('already pending or active');
      } else {
        expect(res.status).toBe(201);
        expect(res.body.status).toBe('PENDING');
        createdBookingId = res.body.id;
      }
    });

    it('enforces that drivers can view their assigned bookings', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/bookings')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Administration & Moderation', () => {
    it('returns real database-backed metrics on admin overview', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics.totalUsers).toBeGreaterThanOrEqual(4);
      expect(res.body.metrics.verifiedDrivers).toBeGreaterThanOrEqual(2);
      expect(res.body.metrics.pendingVerifications).toBeGreaterThanOrEqual(1);
    });

    it('fetches pending driver verification queue for admin inspection', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/verifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const pendingDriver = res.body.find((d: any) => d.verificationStatus === 'PENDING');
      expect(pendingDriver).toBeDefined();
      expect(pendingDriver.documents.length).toBeGreaterThanOrEqual(1);
    });
  });
});
