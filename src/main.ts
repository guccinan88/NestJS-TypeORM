import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';

dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //cors
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  const config = new DocumentBuilder()
    .setTitle('Matrials Request')
    .setDescription('SAP新物料申請系統')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // const authGuard = app.get(AuthGuard);
  // app.useGlobalGuards(authGuard);
  app.use(cookieParser());
  await app.listen(5000);
}
bootstrap();
