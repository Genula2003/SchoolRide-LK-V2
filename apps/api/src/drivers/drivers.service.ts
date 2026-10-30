import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  UpdateDriverProfileInput,
  CreateVehicleInput,
  UpdateCoverageInput,
  DriverSearchFilterInput,
  VerificationStatus,
  DriverDocumentType,
  VehicleDocumentType,
  NotificationType,
} from '@schoolride/shared';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public discovery search for drivers.
   * STRICT SECURITY: Only drivers with VerificationStatus.APPROVED are returned.
   * Sensitive private fields (NIC, License Number) are stripped out.
   */
  async searchDrivers(filters: DriverSearchFilterInput) {
    const where: any = {
      verificationStatus: VerificationStatus.APPROVED,
      user: {
        status: 'ACTIVE',
      },
    };

    if (filters.district) {
      where.OR = [
        { user: { district: { equals: filters.district } } },
        { serviceAreas: { some: { district: { equals: filters.district } } } },
      ];
    }

    if (filters.schoolId) {
      where.schoolCoverages = {
        some: { schoolId: filters.schoolId },
      };
    }

    if (filters.minRating && filters.minRating > 0) {
      where.ratingAverage = {
        gte: filters.minRating,
      };
    }

    if (filters.vehicleType) {
      where.vehicles = {
        some: {
          vehicleType: filters.vehicleType,
          verificationStatus: VerificationStatus.APPROVED,
        },
      };
    }

    if (filters.query) {
      where.OR = [
        { user: { fullName: { contains: filters.query } } },
        { bio: { contains: filters.query } },
        { serviceAreas: { some: { city: { contains: filters.query } } } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const [total, drivers] = await Promise.all([
      this.prisma.driverProfile.count({ where }),
      this.prisma.driverProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              fullName: true,
              district: true,
              city: true,
            },
          },
          vehicles: {
            where: { verificationStatus: VerificationStatus.APPROVED },
          },
          serviceAreas: true,
          schoolCoverages: {
            include: { school: true },
          },
        },
        orderBy: [{ ratingAverage: 'desc' }, { ratingCount: 'desc' }],
      }),
    ]);

    // Sanitize driver profiles for public exposure
    const publicDrivers = drivers.map((driver) => ({
      id: driver.id,
      fullName: driver.user.fullName,
      district: driver.user.district,
      city: driver.user.city,
      experienceYears: driver.experienceYears,
      bio: driver.bio,
      ratingAverage: driver.ratingAverage,
      ratingCount: driver.ratingCount,
      verificationStatus: driver.verificationStatus,
      vehicles: driver.vehicles.map((v) => ({
        id: v.id,
        vehicleType: v.vehicleType,
        make: v.make,
        model: v.model,
        year: v.year,
        capacity: v.capacity,
        isAirConditioned: v.isAirConditioned,
        hasEmergencyExit: v.hasEmergencyExit,
      })),
      serviceAreas: driver.serviceAreas.map((sa) => ({
        id: sa.id,
        district: sa.district,
        city: sa.city,
        operatingAreas: this.parseOperatingAreas(sa.operatingAreas),
        monthlyRateMinorUnits: sa.monthlyRateMinorUnits,
      })),
      schools: driver.schoolCoverages.map((sc) => ({
        id: sc.school.id,
        name: sc.school.name,
        district: sc.school.district,
        city: sc.school.city,
      })),
    }));

    return {
      data: publicDrivers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Public detailed driver profile for booking view.
   */
  async getPublicDriverProfile(driverId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            fullName: true,
            district: true,
            city: true,
          },
        },
        vehicles: {
          where: { verificationStatus: VerificationStatus.APPROVED },
        },
        serviceAreas: true,
        schoolCoverages: {
          include: { school: true },
        },
        reviews: {
          where: { isPublic: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            parent: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
    });

    if (!driver || driver.verificationStatus !== VerificationStatus.APPROVED) {
      throw new NotFoundException('Driver not found or not currently eligible for booking.');
    }

    return {
      id: driver.id,
      fullName: driver.user.fullName,
      district: driver.user.district,
      city: driver.user.city,
      experienceYears: driver.experienceYears,
      bio: driver.bio,
      ratingAverage: driver.ratingAverage,
      ratingCount: driver.ratingCount,
      verificationStatus: driver.verificationStatus,
      vehicles: driver.vehicles.map((v) => ({
        id: v.id,
        vehicleType: v.vehicleType,
        make: v.make,
        model: v.model,
        year: v.year,
        capacity: v.capacity,
        isAirConditioned: v.isAirConditioned,
        hasEmergencyExit: v.hasEmergencyExit,
        hasFireExtinguisher: v.hasFireExtinguisher,
        hasFirstAidKit: v.hasFirstAidKit,
      })),
      serviceAreas: driver.serviceAreas.map((sa) => ({
        id: sa.id,
        district: sa.district,
        city: sa.city,
        operatingAreas: this.parseOperatingAreas(sa.operatingAreas),
        monthlyRateMinorUnits: sa.monthlyRateMinorUnits,
      })),
      schools: driver.schoolCoverages.map((sc) => ({
        id: sc.school.id,
        name: sc.school.name,
        district: sc.school.district,
        city: sc.school.city,
        address: sc.school.address,
        latitude: sc.school.latitude,
        longitude: sc.school.longitude,
      })),
      reviews: driver.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        parentName: r.parent.user.fullName,
      })),
    };
  }

  /**
   * Private driver portal: Driver views their own profile with documents and verification status.
   */
  async getMyDriverProfile(userId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            status: true,
            district: true,
            city: true,
          },
        },
        vehicles: {
          include: { documents: true },
        },
        documents: true,
        serviceAreas: true,
        schoolCoverages: {
          include: { school: true },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found.');
    }

    return {
      ...driver,
      serviceAreas: driver.serviceAreas.map((sa) => ({
        ...sa,
        operatingAreas: this.parseOperatingAreas(sa.operatingAreas),
      })),
    };
  }

  async updateDriverProfile(userId: string, input: UpdateDriverProfileInput) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found.');
    }

    const [updatedUser, updatedDriver] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          fullName: input.fullName,
          phone: input.phone,
          district: input.district,
          city: input.city,
        },
      }),
      this.prisma.driverProfile.update({
        where: { userId },
        data: {
          nicNumber: input.nicNumber,
          licenseNumber: input.licenseNumber,
          experienceYears: input.experienceYears,
          bio: input.bio,
        },
      }),
    ]);

    return { ...updatedDriver, user: updatedUser };
  }

  async addVehicle(userId: string, input: CreateVehicleInput) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found.');
    }

    // Check plate uniqueness
    const existingPlate = await this.prisma.vehicle.findUnique({
      where: { licensePlate: input.licensePlate.toUpperCase().trim() },
    });
    if (existingPlate) {
      throw new BadRequestException('A vehicle with this registration plate already exists on the platform.');
    }

    return this.prisma.vehicle.create({
      data: {
        driverProfileId: driver.id,
        vehicleType: input.vehicleType as any,
        make: input.make,
        model: input.model,
        year: input.year,
        licensePlate: input.licensePlate.toUpperCase().trim(),
        capacity: input.capacity,
        isAirConditioned: input.isAirConditioned,
        hasEmergencyExit: input.hasEmergencyExit,
        hasFireExtinguisher: input.hasFireExtinguisher,
        hasFirstAidKit: input.hasFirstAidKit,
        insuranceExpiry: input.insuranceExpiry,
        revenueLicenseExpiry: input.revenueLicenseExpiry,
        verificationStatus: VerificationStatus.PENDING as any,
      },
    });
  }

  async updateCoverage(userId: string, input: UpdateCoverageInput) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found.');
    }

    // Remove existing coverage and update
    await this.prisma.$transaction([
      this.prisma.driverSchoolCoverage.deleteMany({
        where: { driverProfileId: driver.id },
      }),
      this.prisma.serviceArea.deleteMany({
        where: { driverProfileId: driver.id },
      }),
      // Create new school coverage
      this.prisma.driverSchoolCoverage.createMany({
        data: input.schoolIds.map((schoolId) => ({
          driverProfileId: driver.id,
          schoolId,
        })),
      }),
      // Create service area
      this.prisma.serviceArea.create({
        data: {
          driverProfileId: driver.id,
          district: input.serviceDistricts[0] || 'Colombo',
          city: input.operatingAreas[0] || 'Colombo',
          operatingAreas: input.operatingAreas,
          monthlyRateMinorUnits: input.monthlyRatePerChild,
        },
      }),
    ]);

    return { success: true, message: 'Coverage and service routes updated.' };
  }

  async uploadDriverDocument(
    userId: string,
    documentType: DriverDocumentType,
    fileMeta: { fileKey: string; fileName: string; fileSize: number; mimeType: string },
  ) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found.');
    }

    const doc = await this.prisma.driverDocument.create({
      data: {
        driverProfileId: driver.id,
        documentType,
        fileKey: fileMeta.fileKey,
        fileName: fileMeta.fileName,
        fileSize: fileMeta.fileSize,
        mimeType: fileMeta.mimeType,
        isVerified: false,
      },
    });

    // Check if driver has uploaded core documents and is ready for review
    const allDocs = await this.prisma.driverDocument.findMany({
      where: { driverProfileId: driver.id },
    });

    const hasNic = allDocs.some((d) => d.documentType === DriverDocumentType.NIC_FRONT);
    const hasLicense = allDocs.some((d) => d.documentType === DriverDocumentType.DRIVING_LICENSE_FRONT);

    if (hasNic && hasLicense && driver.verificationStatus === VerificationStatus.PENDING) {
      await this.prisma.notification.create({
        data: {
          userId,
          title: 'Documents Submitted for Verification',
          message: 'Your verification packet is under review by SchoolRide LK administrators. You will be notified once reviewed.',
          type: NotificationType.VERIFICATION_SUBMITTED,
        },
      });
    }

    return doc;
  }

  private parseOperatingAreas(operatingAreas: any): string[] {
    if (Array.isArray(operatingAreas)) return operatingAreas;
    if (typeof operatingAreas === 'string') {
      try {
        const parsed = JSON.parse(operatingAreas);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [operatingAreas];
      }
    }
    return [];
  }
}
