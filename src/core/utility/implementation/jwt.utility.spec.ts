import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtType } from '../../interfaces/auth.interface';
import { JwtUtility } from './jwt.utility';

jest.mock('@nestjs/config', () => ({
    ConfigService: class ConfigService {},
}));
jest.mock('@nestjs/jwt', () => ({
    JwtService: class JwtService {},
}));

describe('JwtUtility', () => {
    const sign = jest.fn((payload: object, options: object) =>
        JSON.stringify({ payload, options }),
    );
    const verify = jest.fn();
    const jwtService = { sign, verify } as unknown as JwtService;
    const configService = {
        getOrThrow: (key: string) => ({
            JWT_ACCESS_SECRET: 'access-secret',
            JWT_ACCESS_EXPIRES_IN: '15m',
            JWT_REFRESH_SECRET: 'refresh-secret',
            JWT_REFRESH_EXPIRES_IN: '7d',
        })[key],
    } as unknown as ConfigService;
    const utility = new JwtUtility(jwtService, configService);

    beforeEach(() => {
        sign.mockClear();
        verify.mockReset();
    });

    it('signs refresh tokens with the claims and expiry used by refresh validation', () => {
        const { token, jti, expiresInSeconds } = utility.generateRefreshToken({
            userId: 42,
            email: 'user@example.com',
            role: 'user',
        });
        const signed = JSON.parse(token);

        expect(signed.payload).toMatchObject({
            sub: 42,
            email: 'user@example.com',
            role: 'user',
            type: JwtType.REFRESH,
            jti,
        });
        expect(signed.options).toEqual({
            secret: 'refresh-secret',
            expiresIn: 7 * 24 * 60 * 60,
        });
        expect(expiresInSeconds).toBe(7 * 24 * 60 * 60);
    });

    it('includes the session id and configured expiry in access tokens', () => {
        utility.generateAccessToken(
            { userId: 42, email: 'user@example.com', role: 'user' },
            'session-id',
        );

        expect(sign).toHaveBeenCalledWith(
            expect.objectContaining({ sub: 42, sid: 'session-id', type: JwtType.ACCESS }),
            { secret: 'access-secret', expiresIn: 15 * 60 },
        );
    });

    it('rejects a verified token with the wrong token type', () => {
        verify.mockReturnValue({ sub: 42, type: JwtType.ACCESS });

        expect(() => utility.verifyRefreshToken('wrong-type')).toThrow(
            'Invalid refresh token type',
        );
    });
});
