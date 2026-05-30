import { NestFactory } from '@nestjs/core';
import { AppModule } from 'c:/Users/SURYA/Downloads/files/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3001);
  console.log(`🚀 Server running on http://localhost:${process.env.PORT || 3001}`);
}
bootstrap();
