import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Cấu hình dùng chung cho main.ts và test e2e. */
export function configureApp(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') ?? 'http://localhost:3000',
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });
}
