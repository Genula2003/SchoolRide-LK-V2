import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async listSchools(district?: string, query?: string) {
    const where: any = { isActive: true };

    if (district) {
      where.district = { equals: district };
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { city: { contains: query } },
        { address: { contains: query } },
      ];
    }

    return this.prisma.school.findMany({
      where,
      orderBy: [{ district: 'asc' }, { name: 'asc' }],
    });
  }

  async getSchoolById(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        driverCoverages: {
          include: {
            driverProfile: {
              include: {
                user: { select: { fullName: true, phone: true } },
                vehicles: { where: { verificationStatus: 'APPROVED' } },
              },
            },
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found.');
    }

    return school;
  }

  async createSchool(data: {
    name: string;
    district: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    contactNumber?: string;
  }) {
    const existing = await this.prisma.school.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictException('A school with this name already exists.');
    }

    return this.prisma.school.create({
      data: {
        ...data,
        isActive: true,
      },
    });
  }

  async updateSchool(id: string, data: Partial<{
    name: string;
    district: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    contactNumber?: string;
    isActive?: boolean;
  }>) {
    const existing = await this.prisma.school.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('School not found.');
    }

    return this.prisma.school.update({
      where: { id },
      data,
    });
  }
}
