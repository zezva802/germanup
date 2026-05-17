import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user?: { email?: string } }>();
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) throw new ForbiddenException('Admin access not configured');
    if (req.user?.email !== adminEmail) throw new ForbiddenException('Admin only');
    return true;
  }
}
