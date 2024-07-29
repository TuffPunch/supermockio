import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { exit } from 'process';

async function bootstrap() {
  if (!process.env['MONGO_PASSWORD'] || !process.env['MONGO_USER'] || !process.env['MONGO_HOST'] || !process.env['MONGO_DATABASE']) {
    console.error("You need to set the required environment variables");
    console.error(`- MONGO_USER
- MONGO_HOST
- MONGO_PASSWORD
- MONGO_DATABASE
- AI_GENERATION_ENABLED`);
    exit(1)
    
  }
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
