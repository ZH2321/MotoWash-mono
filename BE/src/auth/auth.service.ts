import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { supabaseService } from '../db/supabase';
import { config } from '../common/config';
import { UnauthorizedError, NotFoundError } from '../common/errors';

interface LineJWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  auth_time: number;
  nonce?: string;
  amr: string[];
  name: string;
  picture: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    lineUserId?: string;
    displayName: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;
  private readonly JWKS = createRemoteJWKSet(new URL('https://api.line.me/oauth2/v2.1/certs'));

  constructor(private jwtService: JwtService) {
    this.supabase = supabaseService;
  }

  async verifyLiffToken(idToken: string): Promise<AuthResult> {
    try {
      // Verify LINE ID token
      const { payload } = await jwtVerify(idToken, this.JWKS, {
        issuer: 'https://access.line.me',
        audience: config.LIFF_AUDIENCE,
      });

      const linePayload = payload as unknown as LineJWTPayload;

      // Get or create user
      const user = await this.upsertUser({
        lineUserId: linePayload.sub,
        displayName: linePayload.name,
        pictureUrl: linePayload.picture,
      });

      // Generate app JWT
      const token = this.jwtService.sign({
        sub: user.id,
        lineUserId: user.line_user_id,
        role: 'customer',
        displayName: user.display_name,
      });

      return {
        token,
        user: {
          id: user.id,
          lineUserId: user.line_user_id,
          displayName: user.display_name,
          role: 'customer',
        },
      };
    } catch (error) {
      console.error('LIFF token verification failed:', error);
      throw new UnauthorizedError('Invalid LINE ID token');
    }
  }

  async adminLogin(email: string, password: string): Promise<AuthResult> {
    // Get admin user
    const { data: admin, error } = await this.supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) {
      // surface the Supabase error to server logs for debugging
      console.error('adminLogin: supabase query error:', error);
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!admin) {
      console.warn('adminLogin: no admin user found or not active for email:', email);
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      console.warn('adminLogin: invalid password for email:', email);
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    await this.supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Generate app JWT
    const token = this.jwtService.sign({
      sub: admin.id,
      role: 'admin',
      email: admin.email,
      displayName: admin.name,
    });

    return {
      token,
      user: {
        id: admin.id,
        displayName: admin.name,
        role: 'admin',
      },
    };
  }

  private async upsertUser(userData: {
    lineUserId: string;
    displayName: string;
    pictureUrl?: string;
  }): Promise<any> {
    const { data, error } = await this.supabase
      .from('users')
      .upsert({
        line_user_id: userData.lineUserId,
        display_name: userData.displayName,
      }, {
        onConflict: 'line_user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('User upsert failed:', error);
      throw new Error('Failed to create/update user');
    }

    return data;
  }

  async validateUser(userId: string): Promise<any> {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User', userId);
    }

    return user;
  }

  async validateAdmin(adminId: string): Promise<any> {
    const { data: admin, error } = await this.supabase
      .from('admin_users')
      .select('*')
      .eq('id', adminId)
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      throw new NotFoundError('Admin', adminId);
    }

    return admin;
  }
}