import {
    createParamDecorator,
    ExecutionContext,
} from '@nestjs/common';
import type { IJwtPayload, JwtPayloadToSign } from 'src/core/interfaces/auth.interface';

export const CurrentUser = createParamDecorator(
    (data: keyof JwtPayloadToSign | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<{
            user: IJwtPayload;
        }>();

        return data ? request.user?.[data] : request.user;
    },
);