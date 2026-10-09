import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/core/config/redis/redis.constant';
import { RedisService } from 'src/core/config/redis/redis.service';

@Global()
@Module({
    imports: [ConfigModule],

    providers: [
        {
            provide: REDIS_CLIENT,

            inject: [ConfigService],

            useFactory: (configService: ConfigService) => {
                const redisUrl = configService.getOrThrow<string>('REDIS_URL');

                const redis = new Redis(redisUrl);

                redis.on('connect', () => {
                    console.log('Redis connected');
                });

                redis.on('error', (error) => {
                    console.error('Redis error:', error);
                });

                return redis;
            },
        },

        RedisService,
    ],

    exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule { }