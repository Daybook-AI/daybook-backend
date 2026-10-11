import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from 'src/modules/auth/auth.module';
import { PrismaModule } from 'src/core/config/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from 'src/core/config/redis/redis.module';
import { JournalModule } from 'src/modules/journal/journal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    RedisModule,

    AuthModule,

    JournalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
