import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { Role } from './common/enums/role.enum';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Service Platform API')
    .setDescription('UrbanCo-style on-demand service platform')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste JWT access token from /auth/login',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-role',
        description: `Role header required by RolesGuard. Allowed values: ${Object.values(Role).join(', ')}`,
      },
      'x-role',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Auto-export swagger.json for docs/
  fs.writeFileSync('./docs/swagger.json', JSON.stringify(document, null, 2));

  const PORT = process.env.PORT || 10000;
  await app.listen(PORT);
  console.log(`API running at http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api`);
}
bootstrap();
