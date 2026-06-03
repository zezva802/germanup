import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async getTags(userId: string) {
    return this.prisma.tag.findMany({
      where: { ownerId: userId },
      include: { _count: { select: { words: true } } },
      orderBy: { name: 'asc' },
    });
  }

  /** Create a tag, idempotent on the per-owner unique name. */
  async createTag(userId: string, dto: CreateTagDto) {
    const name = dto.name.trim();
    return this.prisma.tag.upsert({
      where: { ownerId_name: { ownerId: userId, name } },
      create: { ownerId: userId, name },
      update: {},
    });
  }

  async deleteTag(userId: string, tagId: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) throw new NotFoundException('Tag not found');
    if (tag.ownerId !== userId) throw new ForbiddenException('You do not own this tag');
    await this.prisma.tag.delete({ where: { id: tagId } }); // cascades WordTag
    return { message: 'Deleted successfully' };
  }
}
