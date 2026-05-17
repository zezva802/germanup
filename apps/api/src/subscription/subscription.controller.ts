import {
  Controller,
  Post,
  Get,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

@Controller('subscription')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(@CurrentUser() user: AuthUser) {
    return this.subscriptionService.createCheckoutSession(user.id, user.email);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.subscriptionService.handleWebhook(req.rawBody!, sig);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  getStatus(@CurrentUser() user: AuthUser) {
    return this.subscriptionService.getStatus(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal')
  @HttpCode(HttpStatus.OK)
  createPortal(@CurrentUser() user: AuthUser) {
    return this.subscriptionService.createPortalSession(user.id);
  }
}
