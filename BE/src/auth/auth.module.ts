import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { config } from '../common/config';

@Module({
  imports: [
    JwtModule.register({
      secret: config.SUPABASE_JWT_SECRET,
      signOptions: {
        expiresIn: '6h',
        algorithm: 'HS256',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}