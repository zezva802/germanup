import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { ImportExercisesDto } from './dto/import-exercises.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('exercises/stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('exercises')
  getExercises(
    @Query('topic') topic?: string,
    @Query('type') type?: string,
    @Query('difficulty') difficulty?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getExercises({
      topic,
      type,
      difficulty,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Put('exercises/:id')
  updateExercise(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.adminService.updateExercise(id, dto);
  }

  @Delete('exercises/all')
  @HttpCode(HttpStatus.OK)
  deleteAll() {
    return this.adminService.deleteAll();
  }

  @Delete('exercises/:id')
  @HttpCode(HttpStatus.OK)
  deleteExercise(@Param('id') id: string) {
    return this.adminService.deleteExercise(id);
  }

  @Post('exercises/import')
  importExercises(@Body() dto: ImportExercisesDto) {
    return this.adminService.importExercises(dto);
  }
}
