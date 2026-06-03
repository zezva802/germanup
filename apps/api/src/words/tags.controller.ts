import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Get()
  getTags(@CurrentUser() user: AuthUser) {
    return this.tagsService.getTags(user.id);
  }

  @Post()
  createTag(@CurrentUser() user: AuthUser, @Body() dto: CreateTagDto) {
    return this.tagsService.createTag(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteTag(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tagsService.deleteTag(user.id, id);
  }
}
