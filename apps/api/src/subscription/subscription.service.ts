import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly stripe: any;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.stripe = new (Stripe as unknown as new (key: string, config: Record<string, unknown>) => unknown)(
      config.get<string>('stripe.secretKey') ?? '',
      { apiVersion: '2026-04-22.dahlia' },
    );
  }

  async createCheckoutSession(userId: string, userEmail: string) {
    const frontendUrl = this.config.get<string>('frontend.url') ?? 'http://localhost:5000';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'GermanUp Pro' },
            unit_amount: 700,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/dashboard?upgraded=true`,
      cancel_url: `${frontendUrl}/pricing`,
      metadata: { userId },
    });

    return { url: session.url as string };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('stripe.webhookSecret') ?? '';

    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = (session.metadata as Record<string, string>)?.userId;
        if (!userId) break;

        await this.prisma.user.update({
          where: { id: userId },
          data: { plan: 'PRO' },
        });

        const sub = await this.stripe.subscriptions.retrieve(session.subscription as string);
        // current_period_end moved to items in newer Stripe API versions
        const periodEndUnix: number =
          sub.current_period_end ??
          sub.items?.data?.[0]?.current_period_end ??
          Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
        const currentPeriodEnd = new Date(periodEndUnix * 1000);

        await this.prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: session.customer as string,
            stripeSubId: session.subscription as string,
            status: 'active',
            currentPeriodEnd,
          },
          update: {
            stripeCustomerId: session.customer as string,
            stripeSubId: session.subscription as string,
            status: 'active',
            currentPeriodEnd,
          },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        if (sub.cancel_at_period_end) {
          await this.prisma.subscription.updateMany({
            where: { stripeSubId: sub.id as string },
            data: { status: 'cancelling' },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await this.prisma.subscription.updateMany({
          where: { stripeSubId: sub.id as string },
          data: { status: 'cancelled' },
        });
        const record = await this.prisma.subscription.findFirst({
          where: { stripeSubId: sub.id as string },
        });
        if (record) {
          await this.prisma.user.update({
            where: { id: record.userId },
            data: { plan: 'FREE' },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.warn(`Payment failed for customer ${invoice.customer as string}`);
        break;
      }
    }

    return { received: true };
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    return {
      plan: user?.plan ?? 'FREE',
      currentPeriodEnd: user?.subscription?.currentPeriodEnd ?? null,
      status: user?.subscription?.status ?? null,
    };
  }

  async createPortalSession(userId: string) {
    const frontendUrl = this.config.get<string>('frontend.url') ?? 'http://localhost:5000';

    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new BadRequestException('No active subscription found');

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${frontendUrl}/settings`,
    });

    return { url: portalSession.url as string };
  }
}
