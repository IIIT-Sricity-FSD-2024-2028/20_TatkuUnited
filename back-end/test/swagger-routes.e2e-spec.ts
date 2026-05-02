import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Role } from './../src/common/enums/role.enum';
import * as fs from 'fs';
import * as path from 'path';

const swaggerPath = path.join(__dirname, '../docs/swagger.json');
const swaggerDoc = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));

describe('Swagger Routes Validation (e2e)', () => {
  let app: INestApplication<App>;
  let superToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'super_user.mark@tatku.com',
        password: 'SuperUser@123',
        role: Role.SUPER_USER,
      })
      .expect(201);
    
    superToken = response.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  const paths = Object.keys(swaggerDoc.paths);

  for (const routePath of paths) {
    const methods = Object.keys(swaggerDoc.paths[routePath]);

    describe(routePath, () => {
      for (const method of methods) {
        it(`${method.toUpperCase()} should not return 404`, async () => {
          // Replace path parameters like {id} with a dummy uuid
          let testPath = routePath.replace(/\{[^\}]+\}/g, '123e4567-e89b-12d3-a456-426614174000');
          
          let req = request(app.getHttpServer())[method](testPath);
          
          // Attach token and x-role if it's protected (we just attach to all for simplicity)
          req = req.set('Authorization', `Bearer ${superToken}`).set('x-role', Role.SUPER_USER);

          // For POST/PATCH/PUT, we might need a body to avoid 400, but 400 is fine (means route exists)
          if (['post', 'patch', 'put'].includes(method)) {
            req = req.send({});
          }

          const response = await req;
          
          // As long as the route exists, it shouldn't return 404 (Not Found).
          // 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Server Error) are acceptable
          // as they indicate the route was hit but failed validation/processing.
          // Note: Some GET endpoints might legitimately return 404 if the resource isn't found.
          // But a generic endpoint without path params shouldn't return 404.
          // If the path had params, we sent a dummy UUID. The controller might return 404 for "Resource not found",
          // which is also fine. What we really want to avoid is the Express router 404 (Cannot GET /path).
          
          // To distinguish Express 404 from NestJS controller 404, we can look at the error message or just
          // accept 404 but log it, or we know that NestJS returns {"statusCode":404,"message":"Cannot GET /path","error":"Not Found"}
          // if the route doesn't exist.
          if (response.status === 404) {
            if (response.body && response.body.message && response.body.message.startsWith('Cannot ')) {
              throw new Error(`Route ${method.toUpperCase()} ${testPath} is missing!`);
            }
          }
          
          expect(response.status).toBeDefined();
        });
      }
    });
  }
});
