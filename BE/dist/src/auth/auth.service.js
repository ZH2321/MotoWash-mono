"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const jose_1 = require("jose");
const supabase_1 = require("../db/supabase");
const config_1 = require("../common/config");
const errors_1 = require("../common/errors");
let AuthService = class AuthService {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.JWKS = (0, jose_1.createRemoteJWKSet)(new URL('https://api.line.me/oauth2/v2.1/certs'));
        this.supabase = supabase_1.supabaseService;
    }
    async verifyLiffToken(idToken) {
        try {
            const { payload } = await (0, jose_1.jwtVerify)(idToken, this.JWKS, {
                issuer: 'https://access.line.me',
                audience: config_1.config.LIFF_AUDIENCE,
            });
            const linePayload = payload;
            const user = await this.upsertUser({
                lineUserId: linePayload.sub,
                displayName: linePayload.name,
                pictureUrl: linePayload.picture,
            });
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
        }
        catch (error) {
            console.error('LIFF token verification failed:', error);
            throw new errors_1.UnauthorizedError('Invalid LINE ID token');
        }
    }
    async adminLogin(email, password) {
        const { data: admin, error } = await this.supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .eq('is_active', true)
            .single();
        if (error) {
            console.error('adminLogin: supabase query error:', error);
            throw new errors_1.UnauthorizedError('Invalid credentials');
        }
        if (!admin) {
            console.warn('adminLogin: no admin user found or not active for email:', email);
            throw new errors_1.UnauthorizedError('Invalid credentials');
        }
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
            console.warn('adminLogin: invalid password for email:', email);
            throw new errors_1.UnauthorizedError('Invalid credentials');
        }
        await this.supabase
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', admin.id);
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
    async upsertUser(userData) {
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
    async validateUser(userId) {
        const { data: user, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (error || !user) {
            throw new errors_1.NotFoundError('User', userId);
        }
        return user;
    }
    async validateAdmin(adminId) {
        const { data: admin, error } = await this.supabase
            .from('admin_users')
            .select('*')
            .eq('id', adminId)
            .eq('is_active', true)
            .single();
        if (error || !admin) {
            throw new errors_1.NotFoundError('Admin', adminId);
        }
        return admin;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map