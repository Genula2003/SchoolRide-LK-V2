import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  UpdateParentProfileInput,
  CreateChildInput,
  UpdateChildInput,
  BookingStatus,
} from '@schoolride/shared';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            district: true,
            city: true,
          },
        },
        children: {
          where: { isActive: true },
          include: { school: true },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found.');
    }

    return parent;
  }

  async updateProfile(userId: string, input: UpdateParentProfileInput) {
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found.');
    }

    const updated = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          fullName: input.fullName,
          phone: input.phone,
          district: input.district,
          city: input.city,
        },
      }),
      this.prisma.parentProfile.update({
        where: { userId },
        data: {
          address: input.address,
          city: input.city,
          district: input.district,
          emergencyContactName: input.emergencyContactName,
          emergencyContactPhone: input.emergencyContactPhone,
        },
      }),
    ]);

    return updated[1];
  }

  async getChildren(userId: string) {
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found.');
    }

    return this.prisma.child.findMany({
      where: {
        parentId: parent.id,
        isActive: true,
      },
      include: {
        school: true,
        bookings: {
          where: {
            status: {
              in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.ACTIVE],
            },
          },
          include: {
            driverProfile: {
              include: { user: { select: { fullName: true, phone: true } } },
            },
            vehicle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createChild(userId: string, input: CreateChildInput) {
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found.');
    }

    // Verify school exists
    const school = await this.prisma.school.findUnique({
      where: { id: input.schoolId },
    });
    if (!school) {
      throw new NotFoundException('Selected school not found in reference data.');
    }

    return this.prisma.child.create({
      data: {
        parentId: parent.id,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        schoolId: input.schoolId,
        grade: input.grade,
        pickupAddress: input.pickupAddress,
        pickupLatitude: input.pickupLatitude,
        pickupLongitude: input.pickupLongitude,
        dropoffAddress: input.dropoffAddress,
        dropoffLatitude: input.dropoffLatitude,
        dropoffLongitude: input.dropoffLongitude,
        specialNotes: input.specialNotes,
      },
      include: {
        school: true,
      },
    });
  }

  async updateChild(userId: string, childId: string, input: UpdateChildInput) {
    const child = await this.findChildAndVerifyOwnership(userId, childId);

    if (input.schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: input.schoolId },
      });
      if (!school) {
        throw new NotFoundException('Selected school not found.');
      }
    }

    return this.prisma.child.update({
      where: { id: child.id },
      data: {
        ...input,
      },
      include: {
        school: true,
      },
    });
  }

  async deleteChild(userId: string, childId: string) {
    const child = await this.findChildAndVerifyOwnership(userId, childId);

    // Check for active or pending bookings
    const activeBooking = await this.prisma.bookingRequest.findFirst({
      where: {
        childId: child.id,
        status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.ACTIVE] },
      },
    });

    if (activeBooking) {
      throw new BadRequestException(
        'Cannot remove child with an active or pending transportation booking. Please cancel active bookings first.',
      );
    }

    // Soft delete child profile
    await this.prisma.child.update({
      where: { id: child.id },
      data: { isActive: false },
    });

    return { success: true, message: 'Child profile removed successfully.' };
  }

  private async findChildAndVerifyOwnership(userId: string, childId: string) {
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found.');
    }

    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child || !child.isActive) {
      throw new NotFoundException('Child not found.');
    }

    if (child.parentId !== parent.id) {
      throw new ForbiddenException('Access denied. You do not have permission to manage this child.');
    }

    return child;
  }
}
