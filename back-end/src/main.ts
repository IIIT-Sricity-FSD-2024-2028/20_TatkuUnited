import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';
import { Role } from './common/enums/role.enum';
import { SpIdAliasInterceptor } from './common/interceptors/sp-id-alias.interceptor';
import helmet from 'helmet';
import { AppLoggerService } from './common/logger/logger.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: set standard HTTP headers via helmet
  app.use(helmet());

  // Allow any localhost port during development
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS blocked: ' + origin));
      }
    },
    credentials: true,
  });

  // Enable global validation so DTO decorators actually enforce constraints
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Add service_provider_id alias to all responses containing sp_id
  app.useGlobalInterceptors(new SpIdAliasInterceptor());

  // Resolve the Winston-based logger from DI and use it app-wide
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  // Global exception filter — consistent error responses + error file logging
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  const config = new DocumentBuilder()
    .setTitle('TatkuUnited API')
    .setDescription(
      'Service platform API',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste your JWT token (without the Bearer prefix)',
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
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const docsDir = path.join(process.cwd(), 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(
    path.join(docsDir, 'swagger.json'),
    JSON.stringify(document, null, 2),
  );

  const PORT = process.env.PORT || 10000;
  await app.listen(PORT);
  logger.log(`API running at http://localhost:${PORT}`, 'Bootstrap');
  logger.log(`Swagger docs at http://localhost:${PORT}/api-docs`, 'Bootstrap');
}
bootstrap();

