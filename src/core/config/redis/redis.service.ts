import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/core/config/redis/redis.constant';

@Injectable()
export class RedisService {
    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
    ) { }

    async set(
        key: string,
        value: string,
        ttl?: number,
    ): Promise<string | null> {

        if (ttl) {
            return this.redis.set(
                key,
                value,
                'EX',
                ttl,
            );
        }

        return this.redis.set(key, value);
    }

    async get(
        key: string,
    ): Promise<string | null> {
        return this.redis.get(key);
    }

    async del(
        key: string,
    ): Promise<number> {
        return this.redis.del(key);
    }

    async rotateRefreshSession(
        currentJti: string,
        nextJti: string,
        userId: string,
        ttl: number,
    ): Promise<boolean> {
        const result = await this.redis.eval(
            "if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end; redis.call('DEL', KEYS[1]); redis.call('SET', KEYS[2], ARGV[1], 'EX', ARGV[2]); return 1",
            2,
            `refresh:${currentJti}`,
            `refresh:${nextJti}`,
            userId,
            ttl,
        );

        return Number(result) === 1;
    }

    async exists(
        key: string,
    ): Promise<number> {
        return this.redis.exists(key);
    }
}