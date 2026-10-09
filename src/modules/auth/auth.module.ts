import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from 'src/core/guards/access-token.guard';
import { UserRepository } from 'src/core/repositories/implementation/user.repository';
import { USER_REPOSITORY } from 'src/core/tokens/repository.token';
import { AUTH_SERVICE, EMAIL_SERVICE, OTP_SERVICE } from 'src/core/tokens/service.token';
import { ACCESS_TOKEN_UTILITY, HASH_UTILITY, REFRESH_TOKEN_UTILITY, RESEND_UTILITY } from 'src/core/tokens/utility.token';
import { ResendUtility } from 'src/core/utility/implementation/email.utility';
import { HashUtility } from 'src/core/utility/implementation/hash.utility';
import { JwtUtility } from 'src/core/utility/implementation/jwt.utility';
import { EmailService } from 'src/infra/implementation/email.service';
import { OtpService } from 'src/infra/implementation/otp.service';
import { AuthController } from 'src/modules/auth/controllers/auth.controller';
import { AuthService } from 'src/modules/auth/services/implementation/auth.service.ts.service';

@Module({
    imports: [JwtModule],
    controllers: [AuthController],
    providers: [
        AuthService,
        EmailService,
        OtpService,

        UserRepository,

        HashUtility,
        JwtUtility,
        ResendUtility,

        {
            provide: APP_GUARD,
            useClass: AccessTokenGuard,
        },

        {
            provide: USER_REPOSITORY,
            useExisting: UserRepository,
        },

        {
            provide: AUTH_SERVICE,
            useExisting: AuthService,
        },
        {
            provide: EMAIL_SERVICE,
            useExisting: EmailService
        },
        {
            provide: OTP_SERVICE,
            useExisting: OtpService
        },

        {
            provide: HASH_UTILITY,
            useExisting: HashUtility
        },
        {
            provide: ACCESS_TOKEN_UTILITY,
            useExisting: JwtUtility,
        },
        {
            provide: REFRESH_TOKEN_UTILITY,
            useExisting: JwtUtility
        },
        {
            provide: RESEND_UTILITY,
            useExisting: ResendUtility
        }
    ],
    exports: []
})
export class AuthModule { }
