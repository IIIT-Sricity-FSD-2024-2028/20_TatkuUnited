import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Service Platform API')
    .setDescription('UrbanCo-style on-demand service platform')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-role' }, 'x-role')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Auto-export swagger.json for docs/
  fs.writeFileSync('./docs/swagger.json', JSON.stringify(document, null, 2));

  await app.listen(3000);
  console.log('API running at http://localhost:3000');
  console.log('Swagger docs at http://localhost:3000/api');
}
bootstrap();
