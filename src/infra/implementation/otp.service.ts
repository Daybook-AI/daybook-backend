import { Injectable } from "@nestjs/common";
import { randomInt } from "node:crypto";
import { RedisService } from "src/core/config/redis/redis.service";
import { IOtpService } from "src/infra/interface/otp-service.interface";

@Injectable()
export class OtpService implements IOtpService {
    private readonly OTP_TTL = 5 * 60;

    constructor(
        private readonly _redisService: RedisService,
    ) { }


    async generateOtp(email: string): Promise<string> {

        const otp = randomInt(100000, 1000000).toString();

        const key = `otp:${email.toLowerCase()}`;

        await this._redisService.set(
            key,
            otp,
            this.OTP_TTL,
        );

        return otp;
    }

    async verifyOtp(email: string, otp: string): Promise<boolean> {

        const key = `otp:${email.toLowerCase()}`;

        const storedOtp = await this._redisService.get(key);

        if (!storedOtp) {
            return false;
        }

        if (storedOtp !== otp) {
            return false;
        }

        await this._redisService.del(key);

        return true;
    }

}