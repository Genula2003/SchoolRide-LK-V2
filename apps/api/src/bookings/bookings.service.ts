import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateBookingRequestInput,
  UpdateBookingStatusInput,
  BookingStatus,
  UserRole,
  VerificationStatus,
  NotificationType,
} from '@schoolride/shared';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBooking(userId: string, input: CreateBookingRequestInput) {
    // 1. Verify parent profile
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId },
    });
    if (!parent) {
      throw new ForbiddenException('Only registered parents can submit booking requests.');
    }

    // 2. Verify child ownership
    const child = await this.prisma.child.findUnique({
      where: { id: input.childId },
    });
    if (!child || !child.isActive || child.parentId !== parent.id) {
      throw new ForbiddenException('Child not found or does not belong to your account.');
    }

    // 3. Verify driver exists and is approved
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: input.driverProfileId },
      include: { user: true },
    });
    if (!driver || driver.verificationStatus !== VerificationStatus.APPROVED) {
      throw new BadRequestException('Driver is not verified or currently unavailable for new bookings.');
    }

    // 4. Verify vehicle belongs to driver and is approved
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
    });
    if (!vehicle || vehicle.driverProfileId !== driver.id || vehicle.verificationStatus !== VerificationStatus.APPROVED) {
      throw new BadRequestException('The selected vehicle is not verified for school transportation.');
    }

    // 5. Prevent duplicate pending/active booking for the same child with the same driver
    const existing = await this.prisma.bookingRequest.findFirst({
      where: {
        childId: child.id,
        driverProfileId: driver.id,
        status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.ACTIVE] },
      },
    });
    if (existing) {
      throw new BadRequestException('A booking request is already pending or active for this child with this driver.');
    }

    // 6. Create booking transactionally with status history, notification, and audit log
    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.bookingRequest.create({
        data: {
          parentId: parent.id,
          childId: child.id,
          driverProfileId: driver.id,
          vehicleId: vehicle.id,
          pickupAddress: input.pickupAddress,
          pickupLatitude: input.pickupLatitude,
          pickupLongitude: input.pickupLongitude,
          dropoffAddress: input.dropoffAddress,
          dropoffLatitude: input.dropoffLatitude,
          dropoffLongitude: input.dropoffLongitude,
          pickupTimeMorning: input.pickupTimeMorning,
          dropoffTimeAfternoon: input.dropoffTimeAfternoon,
          startDate: input.startDate,
          monthlyFeeMinorUnits: input.monthlyFeeMinorUnits,
          status: BookingStatus.PENDING,
          notes: input.notes,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: created.id,
          fromStatus: BookingStatus.PENDING,
          toStatus: BookingStatus.PENDING,
          changedByUserId: userId,
          reason: 'Initial booking request submitted by parent.',
        },
      });

      // Notify Driver
      await tx.notification.create({
        data: {
          userId: driver.userId,
          title: 'New School Transport Request',
          message: `You received a new transport request for ${child.firstName} ${child.lastName}.`,
          type: NotificationType.BOOKING_REQUEST,
          dataJson: JSON.stringify({ bookingId: created.id, childName: `${child.firstName} ${child.lastName}` }),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: 'BOOKING_CREATED',
          entityType: 'BookingRequest',
          entityId: created.id,
          metadataJson: JSON.stringify({
            childId: child.id,
            driverProfileId: driver.id,
            monthlyFeeMinorUnits: input.monthlyFeeMinorUnits,
          }),
        },
      });

      return created;
    });

    return booking;
  }

  async listMyBookings(user: { id: string; role: string }) {
    if (user.role === UserRole.PARENT) {
      const parent = await this.prisma.parentProfile.findUnique({
        where: { userId: user.id },
      });
      if (!parent) return [];

      return this.prisma.bookingRequest.findMany({
        where: { parentId: parent.id },
        include: {
          child: { include: { school: true } },
          driverProfile: {
            include: {
              user: { select: { fullName: true, phone: true } },
            },
          },
          vehicle: true,
          review: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === UserRole.DRIVER) {
      const driver = await this.prisma.driverProfile.findUnique({
        where: { userId: user.id },
      });
      if (!driver) return [];

      return this.prisma.bookingRequest.findMany({
        where: { driverProfileId: driver.id },
        include: {
          child: { include: { school: true } },
          parent: {
            include: {
              user: { select: { fullName: true, phone: true } },
            },
          },
          vehicle: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === UserRole.ADMIN) {
      return this.prisma.bookingRequest.findMany({
        include: {
          child: { include: { school: true } },
          parent: {
            include: { user: { select: { fullName: true, phone: true } } },
          },
          driverProfile: {
            include: { user: { select: { fullName: true, phone: true } } },
          },
          vehicle: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }

    return [];
  }

  async getBookingDetails(user: { id: string; role: string }, bookingId: string) {
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        child: { include: { school: true } },
        parent: {
          include: {
            user: { select: { fullName: true, phone: true, email: true } },
          },
        },
        driverProfile: {
          include: {
            user: { select: { fullName: true, phone: true, email: true } },
          },
        },
        vehicle: true,
        review: true,
        statusHistory: {
          include: {
            changedByUser: { select: { fullName: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking request not found.');
    }

    // IDOR Authorization check
    if (user.role === UserRole.PARENT && booking.parent.userId !== user.id) {
      throw new ForbiddenException('Access denied. You do not own this booking.');
    }
    if (user.role === UserRole.DRIVER && booking.driverProfile.userId !== user.id) {
      throw new ForbiddenException('Access denied. You are not the driver assigned to this booking.');
    }

    return booking;
  }

  /**
   * Enforces the state machine transitions:
   * PENDING -> ACCEPTED (Driver)
   * PENDING -> REJECTED (Driver)
   * PENDING -> CANCELLED (Parent)
   * ACCEPTED -> ACTIVE (Driver / System)
   * ACCEPTED -> CANCELLED (Driver or Parent)
   * ACTIVE -> COMPLETED (Driver)
   */
  async updateBookingStatus(
    user: { id: string; role: string },
    bookingId: string,
    input: UpdateBookingStatusInput,
  ) {
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        parent: { include: { user: true } },
        driverProfile: { include: { user: true } },
        child: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking request not found.');
    }

    const currentStatus = booking.status as BookingStatus;
    const targetStatus = input.targetStatus;
    const isParent = booking.parent.userId === user.id;
    const isDriver = booking.driverProfile.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isParent && !isDriver && !isAdmin) {
      throw new ForbiddenException('You do not have permission to modify this booking.');
    }

    // STATE MACHINE TRANSITION VALIDATION
    if (currentStatus === targetStatus) {
      return booking; // No-op idempotent
    }

    if (currentStatus === BookingStatus.COMPLETED || currentStatus === BookingStatus.REJECTED || currentStatus === BookingStatus.CANCELLED) {
      throw new BadRequestException(`Cannot change status of a booking that is already ${currentStatus}.`);
    }

    // Parent permissions
    if (isParent && !isAdmin) {
      if (targetStatus === BookingStatus.CANCELLED) {
        if (currentStatus !== BookingStatus.PENDING && currentStatus !== BookingStatus.ACCEPTED) {
          throw new BadRequestException('Parents can only cancel pending or accepted bookings before the active ride.');
        }
      } else {
        throw new ForbiddenException('Parents can only cancel their booking requests.');
      }
    }

    // Driver permissions
    if (isDriver && !isAdmin) {
      if (currentStatus === BookingStatus.PENDING) {
        if (targetStatus !== BookingStatus.ACCEPTED && targetStatus !== BookingStatus.REJECTED) {
          throw new BadRequestException('From PENDING state, driver may only ACCEPT or REJECT.');
        }
      } else if (currentStatus === BookingStatus.ACCEPTED) {
        if (targetStatus !== BookingStatus.ACTIVE && targetStatus !== BookingStatus.CANCELLED) {
          throw new BadRequestException('From ACCEPTED state, driver may only activate or cancel.');
        }
      } else if (currentStatus === BookingStatus.ACTIVE) {
        if (targetStatus !== BookingStatus.COMPLETED) {
          throw new BadRequestException('From ACTIVE state, driver may only complete the ride.');
        }
      }
    }

    // Perform state transition transactionally
    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.bookingRequest.update({
        where: { id: bookingId },
        data: { status: targetStatus },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          changedByUserId: user.id,
          reason: input.reason || `Status transitioned to ${targetStatus}`,
        },
      });

      // Dispatch appropriate notification
      const notifyUserId = isParent ? booking.driverProfile.userId : booking.parent.userId;
      let notifTitle = `Booking Status: ${targetStatus}`;
      let notifMessage = `Booking for ${booking.child.firstName} changed to ${targetStatus}.`;
      let notifType: NotificationType = NotificationType.SYSTEM;

      if (targetStatus === BookingStatus.ACCEPTED) {
        notifTitle = 'Booking Request Accepted!';
        notifMessage = `${booking.driverProfile.user.fullName} accepted your school transport request for ${booking.child.firstName}.`;
        notifType = NotificationType.BOOKING_ACCEPTED;
      } else if (targetStatus === BookingStatus.REJECTED) {
        notifTitle = 'Booking Request Rejected';
        notifMessage = `Your request for ${booking.child.firstName} was not accepted by the driver. ${input.reason ? `Reason: ${input.reason}` : ''}`;
        notifType = NotificationType.BOOKING_REJECTED;
      } else if (targetStatus === BookingStatus.CANCELLED) {
        notifTitle = 'Booking Cancelled';
        notifMessage = `Transportation booking for ${booking.child.firstName} has been cancelled.`;
        notifType = NotificationType.BOOKING_CANCELLED;
      } else if (targetStatus === BookingStatus.ACTIVE) {
        notifTitle = 'School Transport Active';
        notifMessage = `Transportation service for ${booking.child.firstName} is now active.`;
        notifType = NotificationType.RIDE_STARTED;
      }

      await tx.notification.create({
        data: {
          userId: notifyUserId,
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          dataJson: JSON.stringify({ bookingId }),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'BOOKING_STATUS_CHANGED',
          entityType: 'BookingRequest',
          entityId: bookingId,
          metadataJson: JSON.stringify({
            fromStatus: currentStatus,
            toStatus: targetStatus,
            reason: input.reason,
          }),
        },
      });

      return res;
    });

    return updated;
  }
}
