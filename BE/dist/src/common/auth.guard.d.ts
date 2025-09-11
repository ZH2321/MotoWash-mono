import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
export interface AuthUser {
    id: string;
    lineUserId?: string;
    role: 'customer' | 'admin';
    displayName?: string;
}
export declare const Roles: import("@nestjs/core").ReflectableDecorator<string[], string[]>;
export declare class AuthGuard implements CanActivate {
    private jwtService;
    private reflector;
    constructor(jwtService: JwtService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
