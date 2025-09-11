import { AuthService, AuthResult } from './auth.service';
declare class VerifyLiffTokenDto {
    idToken: string;
}
declare class AdminLoginDto {
    email: string;
    password: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    verifyLiffToken(dto: VerifyLiffTokenDto): Promise<AuthResult>;
    adminLogin(dto: AdminLoginDto): Promise<AuthResult>;
}
export {};
