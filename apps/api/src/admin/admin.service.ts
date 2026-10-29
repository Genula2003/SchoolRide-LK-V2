import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  VerificationStatus,
  AccountStatus,
  BookingStatus,
  RideStatus,
  NotificationType,
} from '@schoolride/shared';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Real database-backed operational metrics. No fake numbers.
   */
  async getPlatformOverview() {
    const [
      totalUsers,
      totalParents,
      totalDrivers,
      pendingVerifications,
      verifiedDrivers,
      suspendedDrivers,
      pendingBookings,
      activeBookings,
      completedBookings,
      activeRides,
      openComplaints,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'PARENT' } }),
      this.prisma.user.count({ where: { role: 'DRIVER' } }),
      this.prisma.driverProfile.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
      this.prisma.driverProfile.count({ where: { verificationStatus: VerificationStatus.APPROVED } }),
      this.prisma.driverProfile.count({ where: { verificationStatus: VerificationStatus.SUSPENDED } }),
      this.prisma.bookingRequest.count({ where: { status: BookingStatus.PENDING } }),
      this.prisma.bookingRequest.count({ where: { status: BookingStatus.ACTIVE } }),
      this.prisma.bookingRequest.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.rideSession.count({ where: { status: RideStatus.IN_PROGRESS } }),
      this.prisma.complaint.count({ where: { status: 'OPEN' } }),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: { select: { fullName: true, email: true, role: true } },
        },
      }),
    ]);

    return {
      metrics: {
        totalUsers,
        totalParents,
        totalDrivers,
        pendingVerifications,
        verifiedDrivers,
        suspendedDrivers,
        pendingBookings,
        activeBookings,
        completedBookings,
        activeRides,
        openComplaints,
      },
      recentActivity: recentAuditLogs,
    };
  }

  async getDriverVerificationQueue() {
    return this.prisma.driverProfile.findMany({
      where: {
        verificationStatus: { in: [VerificationStatus.PENDING, VerificationStatus.REJECTED] },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            district: true,
            city: true,
            createdAt: true,
          },
        },
        documents: true,
        vehicles: {
          include: { documents: true },
        },
        schoolCoverages: {
          include: { school: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveDriver(adminId: string, driverProfileId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
      include: { user: true, vehicles: true },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update Driver Profile
      const prof = await tx.driverProfile.update({
        where: { id: driverProfileId },
        data: {
          verificationStatus: VerificationStatus.APPROVED,
          verifiedAt: new Date(),
          rejectionReason: null,
        },
      });

      // 2. Activate user account if pending
      await tx.user.update({
        where: { id: driver.userId },
        data: { status: AccountStatus.ACTIVE },
      });

      // 3. Approve vehicles
      await tx.vehicle.updateMany({
        where: { driverProfileId },
        data: { verificationStatus: VerificationStatus.APPROVED },
      });

      // 4. Mark documents verified
      await tx.driverDocument.updateMany({
        where: { driverProfileId },
        data: { isVerified: true },
      });

      // 5. Notify Driver
      await tx.notification.create({
        data: {
          userId: driver.userId,
          title: 'Verification Approved!',
          message: 'Congratulations! Your school van driver verification has been approved. Your profile is now discoverable to parents.',
          type: NotificationType.VERIFICATION_APPROVED,
        },
      });

      // 6. Record Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          action: 'DRIVER_VERIFICATION_APPROVED',
          entityType: 'DriverProfile',
          entityId: driverProfileId,
          metadataJson: JSON.stringify({
            driverName: driver.user.fullName,
            driverEmail: driver.user.email,
          }),
        },
      });

      return prof;
    });

    return updated;
  }

  async rejectDriver(adminId: string, driverProfileId: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('A clear rejection reason must be provided (minimum 5 characters).');
    }

    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverProfileId },
      include: { user: true },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const prof = await tx.driverProfile.update({
        where: { id: driverProfileId },
        data: {
          verificationStatus: VerificationStatus.REJECTED,
          rejectionReason: reason,
        },
      });

      // Notify Driver with specific reason
      await tx.notification.create({
        data: {
          userId: driver.userId,
          title: 'Verification Update: Corrections Required',
          message: `Your driver verification submission could not be approved. Reason: ${reason}. Please update your documents and resubmit.`,
          type: NotificationType.VERIFICATION_REJECTED,
        },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          action: 'DRIVER_VERIFICATION_REJECTED',
          entityType: 'DriverProfile',
          entityId: driverProfileId,
          metadataJson: JSON.stringify({
            reason,
            driverName: driver.user.fullName,
          }),
        },
      });

      return prof;
    });

    return updated;
  }

  async listUsers(role?: string, status?: string, query?: string) {
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (query) {
      where.OR = [
        { fullName: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        district: true,
        city: true,
        createdAt: true,
        driverProfile: {
          select: { verificationStatus: true, ratingAverage: true },
        },
        parentProfile: {
          select: { _count: { select: { children: true, bookings: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateUserStatus(adminId: string, userId: string, status: AccountStatus, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { status },
      });

      // If suspended, revoke all active sessions
      if (status === AccountStatus.SUSPENDED || status === AccountStatus.DEACTIVATED) {
        await tx.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          action: `USER_STATUS_${status}`,
          entityType: 'User',
          entityId: userId,
          metadataJson: JSON.stringify({ reason }),
        },
      });

      return u;
    });

    return { id: updated.id, status: updated.status, message: `Account status updated to ${status}.` };
  }

  async getAuditLogs(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        include: {
          actorUser: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
