import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RidesGateway } from './rides.gateway';
import {
  StartRideSessionInput,
  BroadcastLocationInput,
  UpdatePassengerStatusInput,
  RideStatus,
  BookingStatus,
  PassengerPickupStatus,
  NotificationType,
} from '@schoolride/shared';

@Injectable()
export class RidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ridesGateway: RidesGateway,
  ) {}

  async startRideSession(userId: string, input: StartRideSessionInput) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!driver || driver.verificationStatus !== 'APPROVED') {
      throw new ForbiddenException('Only verified drivers can initiate ride sessions.');
    }

    // Verify vehicle belongs to driver
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
    });
    if (!vehicle || vehicle.driverProfileId !== driver.id) {
      throw new BadRequestException('Vehicle does not belong to your driver profile.');
    }

    // Check if there is already an in-progress ride
    const existingActiveRide = await this.prisma.rideSession.findFirst({
      where: {
        driverProfileId: driver.id,
        status: RideStatus.IN_PROGRESS,
      },
    });
    if (existingActiveRide) {
      throw new BadRequestException('You already have an active ride session in progress. Please complete it first.');
    }

    // Validate bookings belong to this driver and are active
    const bookings = await this.prisma.bookingRequest.findMany({
      where: {
        id: { in: input.bookingIds },
        driverProfileId: driver.id,
        status: { in: [BookingStatus.ACCEPTED, BookingStatus.ACTIVE] },
      },
      include: {
        child: true,
        parent: { include: { user: true } },
      },
    });

    if (bookings.length === 0) {
      throw new BadRequestException('None of the provided bookings are eligible for transport.');
    }

    // Create RideSession transactionally
    const ride = await this.prisma.$transaction(async (tx) => {
      const createdRide = await tx.rideSession.create({
        data: {
          driverProfileId: driver.id,
          vehicleId: vehicle.id,
          routeName: input.routeName,
          status: RideStatus.IN_PROGRESS,
          startedAt: new Date(),
          currentLatitude: input.initialLatitude,
          currentLongitude: input.initialLongitude,
          lastLocationUpdateAt: new Date(),
          passengers: {
            create: bookings.map((b) => ({
              bookingId: b.id,
              childId: b.childId,
              pickupStatus: PassengerPickupStatus.SCHEDULED,
            })),
          },
          locationUpdates: {
            create: {
              latitude: input.initialLatitude,
              longitude: input.initialLongitude,
              speed: 0,
              heading: 0,
            },
          },
        },
        include: {
          passengers: {
            include: {
              child: true,
            },
          },
        },
      });

      // Update bookings to ACTIVE status
      await tx.bookingRequest.updateMany({
        where: { id: { in: bookings.map((b) => b.id) } },
        data: { status: BookingStatus.ACTIVE },
      });

      // Notify parents that the school van route has started
      for (const booking of bookings) {
        await tx.notification.create({
          data: {
            userId: booking.parent.userId,
            title: 'School Van Route Started',
            message: `${driver.user.fullName} has started the school route for ${booking.child.firstName}. You can now view live tracking.`,
            type: NotificationType.RIDE_STARTED,
            dataJson: JSON.stringify({
              rideSessionId: createdRide.id,
              bookingId: booking.id,
            }),
          },
        });
      }

      return createdRide;
    });

    return ride;
  }

  async getActiveRideForUser(user: { id: string; role: string }) {
    if (user.role === 'DRIVER') {
      const driver = await this.prisma.driverProfile.findUnique({
        where: { userId: user.id },
      });
      if (!driver) return null;

      return this.prisma.rideSession.findFirst({
        where: {
          driverProfileId: driver.id,
          status: RideStatus.IN_PROGRESS,
        },
        include: {
          vehicle: true,
          passengers: {
            include: {
              child: { include: { school: true } },
              booking: { include: { parent: { include: { user: true } } } },
            },
          },
        },
      });
    }

    if (user.role === 'PARENT') {
      const parent = await this.prisma.parentProfile.findUnique({
        where: { userId: user.id },
      });
      if (!parent) return null;

      // Find an in-progress ride session that has one of the parent's bookings
      const passenger = await this.prisma.rideSessionPassenger.findFirst({
        where: {
          booking: { parentId: parent.id },
          rideSession: { status: RideStatus.IN_PROGRESS },
        },
        include: {
          rideSession: {
            include: {
              driverProfile: {
                include: { user: { select: { fullName: true, phone: true } } },
              },
              vehicle: true,
              passengers: {
                include: {
                  child: true,
                },
              },
            },
          },
        },
      });

      return passenger?.rideSession || null;
    }

    return null;
  }

  async getRideById(user: { id: string; role: string }, rideId: string) {
    const ride = await this.prisma.rideSession.findUnique({
      where: { id: rideId },
      include: {
        driverProfile: {
          include: { user: { select: { fullName: true, phone: true } } },
        },
        vehicle: true,
        passengers: {
          include: {
            child: { include: { school: true } },
            booking: { include: { parent: { include: { user: true } } } },
          },
        },
        locationUpdates: {
          take: 50,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride session not found.');
    }

    // Authorization check
    const isDriver = ride.driverProfile.userId === user.id;
    const isParent = ride.passengers.some((p) => p.booking.parent.userId === user.id);
    const isAdmin = user.role === 'ADMIN';

    if (!isDriver && !isParent && !isAdmin) {
      throw new ForbiddenException('Access denied. You do not have permission to view this ride session.');
    }

    return ride;
  }

  async recordLocationUpdate(userId: string, input: BroadcastLocationInput) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (!driver) {
      throw new ForbiddenException('Only drivers can broadcast telemetry.');
    }

    const ride = await this.prisma.rideSession.findUnique({
      where: { id: input.rideSessionId },
    });

    if (!ride || ride.driverProfileId !== driver.id) {
      throw new ForbiddenException('Ride session not found or you are not the driver.');
    }

    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot broadcast location for a ride that is not active.');
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.rideSession.update({
        where: { id: ride.id },
        data: {
          currentLatitude: input.latitude,
          currentLongitude: input.longitude,
          lastLocationUpdateAt: now,
        },
      }),
      this.prisma.rideLocationUpdate.create({
        data: {
          rideSessionId: ride.id,
          latitude: input.latitude,
          longitude: input.longitude,
          speed: input.speed || 0,
          heading: input.heading || 0,
          timestamp: now,
        },
      }),
    ]);

    // Broadcast to WebSocket subscribers
    this.ridesGateway.broadcastLocation(ride.id, {
      latitude: input.latitude,
      longitude: input.longitude,
      speed: input.speed,
      heading: input.heading,
      timestamp: now,
    });

    return { success: true, timestamp: now };
  }

  async updatePassengerStatus(
    userId: string,
    rideId: string,
    input: UpdatePassengerStatusInput,
  ) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (!driver) {
      throw new ForbiddenException('Only drivers can update passenger status.');
    }

    const ride = await this.prisma.rideSession.findUnique({
      where: { id: rideId },
    });
    if (!ride || ride.driverProfileId !== driver.id) {
      throw new ForbiddenException('Ride session not found or not owned by driver.');
    }

    const passenger = await this.prisma.rideSessionPassenger.findUnique({
      where: { id: input.rideSessionPassengerId },
      include: {
        child: true,
        booking: { include: { parent: true } },
      },
    });

    if (!passenger || passenger.rideSessionId !== rideId) {
      throw new NotFoundException('Passenger record not found in this ride session.');
    }

    const now = new Date();
    const isPickup = input.pickupStatus === PassengerPickupStatus.PICKED_UP;
    const isDropoff = input.pickupStatus === PassengerPickupStatus.DROPPED_OFF;

    const updated = await this.prisma.rideSessionPassenger.update({
      where: { id: passenger.id },
      data: {
        pickupStatus: input.pickupStatus,
        pickupTime: isPickup ? now : passenger.pickupTime,
        dropoffTime: isDropoff ? now : passenger.dropoffTime,
        notes: input.notes,
      },
    });

    // Notify parent
    let title = 'Passenger Status Update';
    let message = `Status updated for ${passenger.child.firstName}: ${input.pickupStatus}.`;
    let notifType = NotificationType.SYSTEM;

    if (isPickup) {
      title = 'Child Picked Up Safely';
      message = `${passenger.child.firstName} has been picked up by the school van.`;
      notifType = NotificationType.CHILD_PICKED_UP;
    } else if (isDropoff) {
      title = 'Child Dropped Off Safely';
      message = `${passenger.child.firstName} has arrived and safely dropped off at destination.`;
      notifType = NotificationType.CHILD_DROPPED_OFF;
    }

    await this.prisma.notification.create({
      data: {
        userId: passenger.booking.parent.userId,
        title,
        message,
        type: notifType,
        dataJson: JSON.stringify({
          rideSessionId: rideId,
          childId: passenger.childId,
          status: input.pickupStatus,
        }),
      },
    });

    // Broadcast update to subscribers
    this.ridesGateway.broadcastPassengerStatus(rideId, {
      passengerId: passenger.id,
      childId: passenger.childId,
      childName: `${passenger.child.firstName} ${passenger.child.lastName}`,
      pickupStatus: input.pickupStatus,
      timestamp: now,
    });

    return updated;
  }

  async completeRideSession(userId: string, rideId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (!driver) {
      throw new ForbiddenException('Only drivers can complete rides.');
    }

    const ride = await this.prisma.rideSession.findUnique({
      where: { id: rideId },
      include: {
        passengers: {
          include: {
            booking: { include: { parent: true } },
            child: true,
          },
        },
      },
    });

    if (!ride || ride.driverProfileId !== driver.id) {
      throw new ForbiddenException('Ride not found or not owned by driver.');
    }

    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new BadRequestException('Ride is not currently in progress.');
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.rideSession.update({
        where: { id: rideId },
        data: {
          status: RideStatus.COMPLETED,
          endedAt: now,
        },
      }),
      // Notify all parents that the route has concluded
      ...ride.passengers.map((p) =>
        this.prisma.notification.create({
          data: {
            userId: p.booking.parent.userId,
            title: 'School Ride Completed',
            message: `The school route has completed safely for ${p.child.firstName}.`,
            type: NotificationType.RIDE_COMPLETED,
            dataJson: JSON.stringify({ rideSessionId: rideId }),
          },
        }),
      ),
    ]);

    // Broadcast ride ended event to disconnect active listeners
    this.ridesGateway.broadcastRideEnded(rideId);

    return { success: true, message: 'Ride session completed successfully.' };
  }
}
