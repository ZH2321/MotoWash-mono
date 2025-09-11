import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { config } from './config';

export interface AuthUser {
  id: string;
  lineUserId?: string;
  role: 'customer' | 'admin';
  displayName?: string;
}

export const Roles = Reflector.createDecorator<string[]>();

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requiredRoles = this.reflector.get(Roles, context.getHandler());

    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header:', authHeader);
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    console.log('Extracted token:', token.substring(0, 20) + '...');

    try {
      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: config.SUPABASE_JWT_SECRET,
      });

      console.log('Token payload:', payload);

      const user: AuthUser = {
        id: payload.sub,
        lineUserId: payload.lineUserId,
        role: payload.role,
        displayName: payload.displayName,
      };

      request.user = user;

      // Check role authorization if required
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        console.log('Role mismatch. Required:', requiredRoles, 'User role:', user.role);
        throw new ForbiddenException(`Required roles: ${requiredRoles.join(', ')}`);
      }

      return true;
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}