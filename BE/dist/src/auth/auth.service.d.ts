import { JwtService } from '@nestjs/jwt';
export interface AuthResult {
    token: string;
    user: {
        id: string;
        lineUserId?: string;
        displayName: string;
        role: string;
    };
}
export declare class AuthService {
    private jwtService;
    private readonly supabase;
    private readonly JWKS;
    constructor(jwtService: JwtService);
    verifyLiffToken(idToken: string): Promise<AuthResult>;
    adminLogin(email: string, password: string): Promise<AuthResult>;
    private upsertUser;
    validateUser(userId: string): Promise<any>;
    validateAdmin(adminId: string): Promise<any>;
}
