import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  INITIAL_SCHOOLS,
  UserRole,
  AccountStatus,
  VerificationStatus,
  VehicleType,
  DriverDocumentType,
  VehicleDocumentType,
  BookingStatus,
  NotificationType,
} from '@schoolride/shared';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Starting database seed for SchoolRide LK...');

  // 1. Seed Reference Schools
  console.log('📍 Seeding Sri Lankan Reference Schools...');
  for (const school of INITIAL_SCHOOLS) {
    await prisma.school.upsert({
      where: { name: school.name },
      update: {
        district: school.district,
        city: school.city,
        address: school.address,
        latitude: school.latitude,
        longitude: school.longitude,
        contactNumber: school.contactNumber,
        isActive: true,
      },
      create: {
        id: school.id,
        name: school.name,
        district: school.district,
        city: school.city,
        address: school.address,
        latitude: school.latitude,
        longitude: school.longitude,
        contactNumber: school.contactNumber,
        isActive: true,
      },
    });
  }
  console.log(`✅ Seeded ${INITIAL_SCHOOLS.length} reference schools.`);

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);

  // 2. Seed System Administrator
  console.log('🛡️ Seeding System Administrator...');
  await prisma.user.upsert({
    where: { email: 'admin@schoolride.lk' },
    update: {
      fullName: 'Platform Administrator',
      phone: '+94771234567',
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      district: 'Colombo',
      city: 'Colombo 07',
    },
    create: {
      email: 'admin@schoolride.lk',
      passwordHash: adminPasswordHash,
      fullName: 'Platform Administrator',
      phone: '+94771234567',
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      district: 'Colombo',
      city: 'Colombo 07',
    },
  });

  // 3. Seed Verified Drivers
  console.log('🚐 Seeding Verified Van Drivers...');
  
  // Driver 1: Sunil Jayawardena (Colombo 07/05)
  const driver1User = await prisma.user.upsert({
    where: { email: 'sunil.driver@schoolride.lk' },
    update: {},
    create: {
      email: 'sunil.driver@schoolride.lk',
      passwordHash: defaultPasswordHash,
      fullName: 'Sunil Jayawardena',
      phone: '+94771234001',
      role: UserRole.DRIVER,
      status: AccountStatus.ACTIVE,
      district: 'Colombo',
      city: 'Nugegoda',
    },
  });

  const driver1Profile = await prisma.driverProfile.upsert({
    where: { userId: driver1User.id },
    update: {},
    create: {
      userId: driver1User.id,
      nicNumber: '197512345678',
      licenseNumber: 'B1234567',
      experienceYears: 14,
      bio: 'Professional school van operator with over 14 years accident-free service in Colombo. Specialised in Royal College and Visakha Vidyalaya morning and afternoon routes.',
      ratingAverage: 4.95,
      ratingCount: 38,
      verificationStatus: VerificationStatus.APPROVED,
      verifiedAt: new Date(),
    },
  });

  const driver1Vehicle = await prisma.vehicle.upsert({
    where: { licensePlate: 'WP NA-4521' },
    update: {},
    create: {
      driverProfileId: driver1Profile.id,
      vehicleType: VehicleType.VAN,
      make: 'Toyota',
      model: 'HiAce Super GL',
      year: 2018,
      licensePlate: 'WP NA-4521',
      capacity: 14,
      isAirConditioned: true,
      hasEmergencyExit: true,
      hasFireExtinguisher: true,
      hasFirstAidKit: true,
      insuranceExpiry: '2027-08-15',
      revenueLicenseExpiry: '2027-08-15',
      verificationStatus: VerificationStatus.APPROVED,
    },
  });

  await prisma.serviceArea.upsert({
    where: { id: `sa-${driver1Profile.id}` },
    update: {},
    create: {
      id: `sa-${driver1Profile.id}`,
      driverProfileId: driver1Profile.id,
      district: 'Colombo',
      city: 'Nugegoda',
      operatingAreas: ['Nugegoda', 'Maharagama', 'Kotte', 'Bambalapitiya', 'Cinnamon Gardens'],
      monthlyRateMinorUnits: 1800000,
    },
  });

  await prisma.driverSchoolCoverage.upsert({
    where: { driverProfileId_schoolId: { driverProfileId: driver1Profile.id, schoolId: 'school-col-01' } },
    update: {},
    create: { driverProfileId: driver1Profile.id, schoolId: 'school-col-01' },
  });
  await prisma.driverSchoolCoverage.upsert({
    where: { driverProfileId_schoolId: { driverProfileId: driver1Profile.id, schoolId: 'school-col-02' } },
    update: {},
    create: { driverProfileId: driver1Profile.id, schoolId: 'school-col-02' },
  });

  // Driver 2: Nimal Fernando (Colombo 10)
  const driver2User = await prisma.user.upsert({
    where: { email: 'nimal.driver@schoolride.lk' },
    update: {},
    create: {
      email: 'nimal.driver@schoolride.lk',
      passwordHash: defaultPasswordHash,
      fullName: 'Nimal Fernando',
      phone: '+94771234002',
      role: UserRole.DRIVER,
      status: AccountStatus.ACTIVE,
      district: 'Colombo',
      city: 'Kelaniya',
    },
  });

  const driver2Profile = await prisma.driverProfile.upsert({
    where: { userId: driver2User.id },
    update: {},
    create: {
      userId: driver2User.id,
      nicNumber: '198212345678',
      licenseNumber: 'B8765432',
      experienceYears: 9,
      bio: 'Safe and punctual transport serving Ananda College and Nalanda College. Equipped with GPS and safety kits.',
      ratingAverage: 4.88,
      ratingCount: 22,
      verificationStatus: VerificationStatus.APPROVED,
      verifiedAt: new Date(),
    },
  });

  await prisma.vehicle.upsert({
    where: { licensePlate: 'WP PB-8812' },
    update: {},
    create: {
      driverProfileId: driver2Profile.id,
      vehicleType: VehicleType.VAN,
      make: 'Nissan',
      model: 'Caravan NV350',
      year: 2019,
      licensePlate: 'WP PB-8812',
      capacity: 16,
      isAirConditioned: true,
      hasEmergencyExit: true,
      hasFireExtinguisher: true,
      hasFirstAidKit: true,
      insuranceExpiry: '2027-05-20',
      revenueLicenseExpiry: '2027-05-20',
      verificationStatus: VerificationStatus.APPROVED,
    },
  });

  await prisma.driverSchoolCoverage.upsert({
    where: { driverProfileId_schoolId: { driverProfileId: driver2Profile.id, schoolId: 'school-col-03' } },
    update: {},
    create: { driverProfileId: driver2Profile.id, schoolId: 'school-col-03' },
  });
  await prisma.driverSchoolCoverage.upsert({
    where: { driverProfileId_schoolId: { driverProfileId: driver2Profile.id, schoolId: 'school-col-04' } },
    update: {},
    create: { driverProfileId: driver2Profile.id, schoolId: 'school-col-04' },
  });

  // Driver 3: Kamal Wickramasinghe (Kandy)
  const driver3User = await prisma.user.upsert({
    where: { email: 'kamal.driver@schoolride.lk' },
    update: {},
    create: {
      email: 'kamal.driver@schoolride.lk',
      passwordHash: defaultPasswordHash,
      fullName: 'Kamal Wickramasinghe',
      phone: '+94771234003',
      role: UserRole.DRIVER,
      status: AccountStatus.ACTIVE,
      district: 'Kandy',
      city: 'Peradeniya',
    },
  });

  const driver3Profile = await prisma.driverProfile.upsert({
    where: { userId: driver3User.id },
    update: {},
    create: {
      userId: driver3User.id,
      nicNumber: '197012345678',
      licenseNumber: 'B4455667',
      experienceYears: 18,
      bio: 'Trusted Kandy school service serving Trinity College and Dharmaraja College for over 18 years. Certified first aider.',
      ratingAverage: 5.0,
      ratingCount: 45,
      verificationStatus: VerificationStatus.APPROVED,
      verifiedAt: new Date(),
    },
  });

  await prisma.vehicle.upsert({
    where: { licensePlate: 'CP GA-3390' },
    update: {},
    create: {
      driverProfileId: driver3Profile.id,
      vehicleType: VehicleType.VAN,
      make: 'Toyota',
      model: 'HiAce Commuter',
      year: 2017,
      licensePlate: 'CP GA-3390',
      capacity: 15,
      isAirConditioned: true,
      hasEmergencyExit: true,
      hasFireExtinguisher: true,
      hasFirstAidKit: true,
      insuranceExpiry: '2027-09-30',
      revenueLicenseExpiry: '2027-09-30',
      verificationStatus: VerificationStatus.APPROVED,
    },
  });

  await prisma.driverSchoolCoverage.upsert({
    where: { driverProfileId_schoolId: { driverProfileId: driver3Profile.id, schoolId: 'school-kdy-01' } },
    update: {},
    create: { driverProfileId: driver3Profile.id, schoolId: 'school-kdy-01' },
  });
  await prisma.driverSchoolCoverage.upsert({
    where: { driverProfileId_schoolId: { driverProfileId: driver3Profile.id, schoolId: 'school-kdy-02' } },
    update: {},
    create: { driverProfileId: driver3Profile.id, schoolId: 'school-kdy-02' },
  });

  // Driver 4 (Pending Verification)
  const driver4User = await prisma.user.upsert({
    where: { email: 'ruwan.pending@schoolride.lk' },
    update: {},
    create: {
      email: 'ruwan.pending@schoolride.lk',
      passwordHash: defaultPasswordHash,
      fullName: 'Ruwan Senaratne',
      phone: '+94771234005',
      role: UserRole.DRIVER,
      status: AccountStatus.PENDING_VERIFICATION,
      district: 'Colombo',
      city: 'Homagama',
    },
  });

  const driver4Profile = await prisma.driverProfile.upsert({
    where: { userId: driver4User.id },
    update: {},
    create: {
      userId: driver4User.id,
      nicNumber: '199012345678',
      licenseNumber: 'B9988776',
      experienceYears: 4,
      bio: 'New applicant seeking verification for Homagama to Colombo 07 school routes.',
      ratingAverage: 5.0,
      ratingCount: 0,
      verificationStatus: VerificationStatus.PENDING,
    },
  });

  await prisma.driverDocument.createMany({
    data: [
      {
        driverProfileId: driver4Profile.id,
        documentType: DriverDocumentType.NIC_FRONT,
        fileKey: 'docs/sample-nic-front.jpg',
        fileName: 'national-id-front.jpg',
        fileSize: 450200,
        mimeType: 'image/jpeg',
        isVerified: false,
      },
      {
        driverProfileId: driver4Profile.id,
        documentType: DriverDocumentType.DRIVING_LICENSE_FRONT,
        fileKey: 'docs/sample-license-front.jpg',
        fileName: 'driving-license.jpg',
        fileSize: 520100,
        mimeType: 'image/jpeg',
        isVerified: false,
      },
    ],
  });

  // 4. Parents & Children
  console.log('👨‍👩‍👧 Seeding Parent and Children profiles...');
  const parent1User = await prisma.user.upsert({
    where: { email: 'parent@schoolride.lk' },
    update: {},
    create: {
      email: 'parent@schoolride.lk',
      passwordHash: defaultPasswordHash,
      fullName: 'Chathura Silva',
      phone: '+94779876543',
      role: UserRole.PARENT,
      status: AccountStatus.ACTIVE,
      district: 'Colombo',
      city: 'Nugegoda',
    },
  });

  const parent1Profile = await prisma.parentProfile.upsert({
    where: { userId: parent1User.id },
    update: {},
    create: {
      userId: parent1User.id,
      address: 'No 45, Chapel Road, Nugegoda',
      city: 'Nugegoda',
      district: 'Colombo',
      emergencyContactName: 'Manel Silva (Mother)',
      emergencyContactPhone: '+94779876544',
    },
  });

  const child1 = await prisma.child.upsert({
    where: { id: 'child-01' },
    update: {},
    create: {
      id: 'child-01',
      parentId: parent1Profile.id,
      firstName: 'Dineth',
      lastName: 'Silva',
      dateOfBirth: '2014-05-12',
      gender: 'MALE',
      schoolId: 'school-col-01',
      grade: 'Grade 7',
      pickupAddress: 'No 45, Chapel Road, Nugegoda',
      pickupLatitude: 6.8722,
      pickupLongitude: 79.8997,
      dropoffAddress: 'Royal College, Rajakeeya Mawatha, Colombo 07',
      dropoffLatitude: 6.9066,
      dropoffLongitude: 79.8617,
      specialNotes: 'Prefers front seat if possible. Has asthma inhaler in bag.',
    },
  });

  await prisma.child.upsert({
    where: { id: 'child-02' },
    update: {},
    create: {
      id: 'child-02',
      parentId: parent1Profile.id,
      firstName: 'Senuri',
      lastName: 'Silva',
      dateOfBirth: '2017-09-20',
      gender: 'FEMALE',
      schoolId: 'school-col-02',
      grade: 'Grade 4',
      pickupAddress: 'No 45, Chapel Road, Nugegoda',
      pickupLatitude: 6.8722,
      pickupLongitude: 79.8997,
      dropoffAddress: 'Visakha Vidyalaya, Vajira Road, Colombo 05',
      dropoffLatitude: 6.8903,
      dropoffLongitude: 79.8596,
      specialNotes: 'Accompanied by brother Dineth in the morning.',
    },
  });

  // 5. Active Booking
  console.log('📋 Seeding Booking...');
  const booking1 = await prisma.bookingRequest.upsert({
    where: { id: 'booking-01' },
    update: {},
    create: {
      id: 'booking-01',
      parentId: parent1Profile.id,
      childId: child1.id,
      driverProfileId: driver1Profile.id,
      vehicleId: driver1Vehicle.id,
      pickupAddress: child1.pickupAddress,
      pickupLatitude: child1.pickupLatitude,
      pickupLongitude: child1.pickupLongitude,
      dropoffAddress: child1.dropoffAddress,
      dropoffLatitude: child1.dropoffLatitude,
      dropoffLongitude: child1.dropoffLongitude,
      pickupTimeMorning: '06:30',
      dropoffTimeAfternoon: '14:00',
      startDate: '2026-01-10',
      monthlyFeeMinorUnits: 1800000,
      status: BookingStatus.ACTIVE,
      notes: 'Confirmed for the 2026 school year.',
    },
  });

  await prisma.review.upsert({
    where: { bookingId: booking1.id },
    update: {},
    create: {
      bookingId: booking1.id,
      parentId: parent1Profile.id,
      driverProfileId: driver1Profile.id,
      rating: 5,
      comment: 'Uncle Sunil has been taking Dineth to Royal College every day without a minute of delay. Highly trustworthy and caring driver!',
      isPublic: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: parent1User.id,
      title: 'Booking Confirmed with Sunil Jayawardena',
      message: 'Your transport service for Dineth to Royal College Colombo is active.',
      type: NotificationType.BOOKING_ACCEPTED,
      read: false,
    },
  });

  console.log('✨ Database seed completed successfully!');
}

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
