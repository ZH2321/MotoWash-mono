import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { AuthService, AuthResult } from './auth.service';

class VerifyLiffTokenDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('liff/verify')
  @HttpCode(HttpStatus.OK)
  async verifyLiffToken(@Body() dto: VerifyLiffTokenDto): Promise<AuthResult> {
    return this.authService.verifyLiffToken(dto.idToken);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() dto: AdminLoginDto): Promise<AuthResult> {
    return this.authService.adminLogin(dto.email, dto.password);
  }
}