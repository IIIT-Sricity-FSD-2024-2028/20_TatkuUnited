import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppLoggerService } from './common/logger/app-logger.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Attach Winston logger as application logger
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  // Security Headers via Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  // Trust reverse proxy (e.g. Nginx, Cloudflare) for accurate client IP in rate limiting & logging
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.set('trust proxy', 1);

  // Global Exception Filter for normalized responses and error logging
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Global Performance & Slow Request Logging Interceptor
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // Global Validation Pipe with strict whitelisting
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: true, // reject requests containing non-whitelisted properties
      transform: true, // auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS Configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tatku United - Digital Services Marketplace API')
    .setDescription(
      'Complete RESTful API documentation for Tatku United: an on-demand digital & home services scheduling and fulfillment platform. Includes all domain resources: Users, Providers, Managers, Regions, Categories, Services, Orders, Bookings, Payments, Reviews, Unavailability, and Platform Settings.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Provide JWT access token for authenticated operations',
        in: 'header',
      },
      'bearer-token',
    )
    .addTag('System', 'Health checks and root welcome endpoint')
    .addTag('Users', 'User accounts, customer records, and identity management')
    .addTag('Providers', 'Service providers, catalog offerings, working days, and location tracking')
    .addTag('Managers', 'Regional managers overseeing service provider collectives')
    .addTag('Regions', 'Operational territories, area centroids, and manager assignments')
    .addTag('Categories', 'Service category taxonomy and catalog groupings')
    .addTag('Services', 'Service catalog offerings, durations, pricing in paise, and FAQs')
    .addTag('Orders', 'Multi-item customer checkout orders and 15-minute expiration timers')
    .addTag('Bookings', 'Service booking schedules, time slot grids, and provider assignments')
    .addTag('Payments', 'Razorpay payment transactions, webhooks, and refund lifecycles')
    .addTag('Reviews', 'Verified customer ratings and textual feedback for completed bookings')
    .addTag('Unavailability', 'Provider calendar blackout periods and unavailable time intervals')
    .addTag('Platform Settings', 'Global system parameters, commission splits, and scheduling rules')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Serve Swagger UI at both /docs and /api/docs
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Tatku United API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Tatku United API Docs',
  });

  // Export OpenAPI spec as swagger.json for offline access and client generation
  try {
    const docsDir = path.resolve(__dirname, '..', 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(docsDir, 'swagger.json'),
      JSON.stringify(document, null, 2),
      'utf8',
    );
    logger.log('Swagger JSON successfully written to docs/swagger.json', 'Swagger');
  } catch (err) {
    logger.warn(`Could not write swagger.json: ${(err as Error).message}`, 'Swagger');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application successfully started on port ${port}`, 'Bootstrap');
  logger.log(`Swagger UI available at http://localhost:${port}/docs and http://localhost:${port}/api/docs`, 'Bootstrap');
}

void bootstrap();
