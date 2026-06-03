import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportPreviewDto } from './dto/import-preview.dto';
import { ImportCommitDto } from './dto/import-commit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

@UseGuards(JwtAuthGuard)
@Controller('words/import')
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  preview(@CurrentUser() user: AuthUser, @Body() dto: ImportPreviewDto) {
    return this.importService.preview(user.id, user.plan, dto);
  }

  @Post('commit')
  @HttpCode(HttpStatus.OK)
  commit(@CurrentUser() user: AuthUser, @Body() dto: ImportCommitDto) {
    return this.importService.commit(user.id, dto);
  }
}
