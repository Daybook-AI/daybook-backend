import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';
  const origins = (process.env.FRONTEND_ORIGINS ?? (isProduction ? '' : 'http://localhost:4200'))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error('Set FRONTEND_ORIGINS to the allowed frontend origin(s)');
  }

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const message = errors
          .flatMap((error) => Object.values(error.constraints ?? {}))
          .at(0);

        return new BadRequestException({
          message,
          error: 'Bad Request',
          statusCode: 400,
        });
      },
    })
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
