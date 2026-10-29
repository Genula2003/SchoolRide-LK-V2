import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateComplaintInput,
  ResolveComplaintInput,
  ComplaintStatus,
  NotificationType,
} from '@schoolride/shared';

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async createComplaint(userId: string, input: CreateComplaintInput) {
    const complaint = await this.prisma.complaint.create({
      data: {
        createdByUserId: userId,
        bookingId: input.bookingId,
        targetUserId: input.targetUserId,
        category: input.category,
        title: input.title,
        description: input.description,
        status: ComplaintStatus.OPEN,
      },
    });

    // Notify user of receipt
    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Complaint Registered',
        message: `Your complaint regarding "${input.title}" has been submitted for moderation. Ticket #${complaint.id.slice(0, 8)}.`,
        type: NotificationType.COMPLAINT_UPDATE,
      },
    });

    return complaint;
  }

  async listMyComplaints(userId: string) {
    return this.prisma.complaint.findMany({
      where: { createdByUserId: userId },
      include: {
        booking: {
          include: {
            child: true,
            driverProfile: { include: { user: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAllComplaints(status?: string, category?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    return this.prisma.complaint.findMany({
      where,
      include: {
        createdByUser: {
          select: { id: true, fullName: true, email: true, phone: true, role: true },
        },
        targetUser: {
          select: { id: true, fullName: true, email: true, phone: true, role: true },
        },
        booking: {
          include: {
            child: true,
            driverProfile: { include: { user: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveComplaint(
    adminId: string,
    complaintId: string,
    input: ResolveComplaintInput,
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint record not found.');
    }

    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: input.status,
        adminNotes: input.adminNotes,
        resolvedAt: new Date(),
        resolvedByUserId: adminId,
      },
    });

    // Notify complainant
    await this.prisma.notification.create({
      data: {
        userId: complaint.createdByUserId,
        title: `Complaint Update: ${input.status}`,
        message: `Your complaint #${complaint.id.slice(0, 8)} status is now ${input.status}. Admin note: ${input.adminNotes}`,
        type: NotificationType.COMPLAINT_UPDATE,
      },
    });

    return updated;
  }
}
