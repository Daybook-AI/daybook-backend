import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from 'src/core/decorators/public.decorator';
import { ErrorMessagesEnum } from 'src/core/enums/errors.enum';
import { ACCESS_TOKEN_UTILITY } from 'src/core/tokens/utility.token';
import { RedisService } from 'src/core/config/redis/redis.service';

import type { Request } from 'express';
import type { IJwtPayload } from 'src/core/interfaces/auth.interface';
import type { IAccessTokenUtility } from 'src/core/utility/interface/jwt-utility.interface';
import { AppConstants } from 'src/core/common/constants';

interface AuthenticatedRequest extends Request {
    user: IJwtPayload;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
    constructor(
        private readonly _reflector: Reflector,

        @Inject(ACCESS_TOKEN_UTILITY)
        private readonly _accessTokenUtility: IAccessTokenUtility,
        private readonly _redisService: RedisService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this._reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

        const token = request.cookies?.[AppConstants.accessTokenName];

        if (!token) {
            throw new UnauthorizedException(
                ErrorMessagesEnum.AccessTokenMissing,
            );
        }

        let payload: IJwtPayload;
        try {
            payload = this._accessTokenUtility.verifyAccessToken(token);
        } catch {
            throw new UnauthorizedException(
                ErrorMessagesEnum.InvalidAccessToken,
            );
        }

        if (!payload.sub || !payload.sid) {
            throw new UnauthorizedException(ErrorMessagesEnum.InvalidAccessToken);
        }

        const sessionUserId = await this._redisService.get(`refresh:${payload.sid}`);
        if (!sessionUserId || Number(sessionUserId) !== Number(payload.sub)) {
            throw new UnauthorizedException(ErrorMessagesEnum.InvalidAccessToken);
        }

        request.user = payload;
        return true;
    }
}