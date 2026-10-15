import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from 'src/modules/auth/auth.module';
import { PrismaModule } from 'src/core/config/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from 'src/core/config/redis/redis.module';
import { JournalModule } from 'src/modules/journal/journal.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { Request } from 'express';
import { EntryAnalysisModule } from 'src/modules/entry-analysis/entry-analysis.module';

@Module({
  imports: [
    // LoggerModule.forRoot({
    //   pinoHttp: {
    //     level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

    //     customProps: (req) => {
    //       const request = req as Request;

    //       if (process.env.NODE_ENV === 'production') {
    //         return {};
    //       }

    //       return {
    //         reqBody: request.body,
    //       };
    //     },

    //     serializers: {
    //       req: (req) => ({
    //         method: req.method,
    //         url: req.url,
    //       }),
    //       res: (res) => ({
    //         statusCode: res.statusCode,
    //       }),
    //     },
    //   },
    // }),

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 100
        }
      ]
    }),


    PrismaModule,
    RedisModule,

    AuthModule,

    JournalModule,

    EntryAnalysisModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    AppService
  ],
})
export class AppModule { }
