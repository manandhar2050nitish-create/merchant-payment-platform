import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { Role } from '../users/entities/role.entity.js';
import { Permission } from '../users/entities/permission.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { RiskAssessment } from '../risk-assesment/entities/riskAssesment.entity.js';
import { AuditLog } from '../audit/entities/audit.entity.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports:[
    PassportModule,
    TypeOrmModule.forFeature([User, Role, Permission, Application,RiskAssessment,AuditLog]),
    JwtModule.registerAsync({
      inject:[ConfigService],
      useFactory: (configService: ConfigService)=>({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m'
        }
      })
    })
],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports:[JwtStrategy]
})
export class AuthModule {}
