import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportExercisesDto } from './dto/import-exercises.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { Difficulty, ExType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getExercises(filters: {
    topic?: string;
    type?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
  }) {
    const { topic, type, difficulty, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(topic ? { topic } : {}),
      ...(type ? { type: type as ExType } : {}),
      ...(difficulty ? { difficulty: difficulty as Difficulty } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ topic: 'asc' }, { difficulty: 'asc' }],
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getStats() {
    const rows = await this.prisma.exercise.groupBy({
      by: ['topic', 'difficulty'],
      _count: { _all: true },
    });

    const byTopic: Record<string, { EASY: number; MEDIUM: number; HARD: number; total: number }> = {};
    for (const r of rows) {
      if (!byTopic[r.topic]) byTopic[r.topic] = { EASY: 0, MEDIUM: 0, HARD: 0, total: 0 };
      byTopic[r.topic][r.difficulty] += r._count._all;
      byTopic[r.topic].total += r._count._all;
    }

    const total = await this.prisma.exercise.count();
    return { total, byTopic };
  }

  async updateExercise(id: string, dto: UpdateExerciseDto) {
    return this.prisma.exercise.update({
      where: { id },
      data: {
        ...(dto.topic !== undefined && { topic: dto.topic }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.type !== undefined && { type: dto.type as ExType }),
        ...(dto.question !== undefined && { question: dto.question }),
        ...(dto.answer !== undefined && { answer: dto.answer }),
        ...(dto.explanation !== undefined && { explanation: dto.explanation }),
        ...(dto.difficulty !== undefined && { difficulty: dto.difficulty as Difficulty }),
        ...(dto.options !== undefined && { options: dto.options ?? undefined }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl ?? null }),
      },
    });
  }

  async deleteExercise(id: string) {
    await this.prisma.exercise.delete({ where: { id } });
    return { success: true };
  }

  async deleteAll() {
    const { count } = await this.prisma.exercise.deleteMany({});
    return { deleted: count };
  }

  async importExercises(dto: ImportExercisesDto) {
    const created = await this.prisma.exercise.createMany({
      data: dto.exercises.map((e) => ({
        topic: e.topic,
        level: e.level,
        type: e.type as ExType,
        question: e.question,
        answer: e.answer,
        explanation: e.explanation,
        difficulty: e.difficulty as Difficulty,
        options: e.options ?? undefined,
        imageUrl: e.imageUrl ?? null,
      })),
      skipDuplicates: true,
    });
    return { imported: created.count };
  }
}
