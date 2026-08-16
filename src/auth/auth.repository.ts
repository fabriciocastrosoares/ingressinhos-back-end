import { Injectable } from '@nestjs/common';
import { PrismaService } from '../Prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(userId: number, token: string) {
    return this.prisma.session.create({
      data: {
        userId,
        token,
      },
    });
  }

  async deleteSession(token: string) {
    return this.prisma.session.deleteMany({
      where: {
        token,
      },
    });
  }

  async findSessionByToken(token: string) {
    return this.prisma.session.findUnique({
      where: {
        token,
      },
    });
  }
}
