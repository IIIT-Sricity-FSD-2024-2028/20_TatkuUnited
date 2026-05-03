import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/common/enums/role.enum';

describe('Revenue Ledger Workflow (e2e)', () => {
  let app: INestApplication<App>;
  let superUserToken: string;
  let providerToken: string;
  let providerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login Super User
    const suRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'super_user.mark@tatku.com', password: 'SuperUser@123', role: Role.SUPER_USER })
      .expect(201);
    superUserToken = suRes.body.access_token;

    // Login Provider
    const provRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ravi.kumar@mail.com', password: 'Password@123', role: Role.SERVICE_PROVIDER })
      .expect(201);
    providerToken = provRes.body.access_token;
    
    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${providerToken}`)
      .set('x-role', Role.SERVICE_PROVIDER);
      
    providerId = meRes.body.user_id || meRes.body.sub || meRes.body.sp_id;
    if (!providerId) {
      const allP = await request(app.getHttpServer())
        .get('/service-providers')
        .set('Authorization', `Bearer ${superUserToken}`)
        .set('x-role', Role.SUPER_USER);
      providerId = allP.body.find((p: any) => p.email === 'ravi.kumar@mail.com').sp_id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('super user should be able to view platform revenue summary', async () => {
    const response = await request(app.getHttpServer())
      .get('/revenue-ledger/summary/platform')
      .set('Authorization', `Bearer ${superUserToken}`)
      .set('x-role', Role.SUPER_USER)
      .expect(200);
      
    expect(response.body).toBeDefined();
    // Assuming summary has total earnings
  });

  it('provider should be able to view their revenue', async () => {
    const response = await request(app.getHttpServer())
      .get(`/revenue-ledger/provider/${providerId}`)
      .set('Authorization', `Bearer ${providerToken}`)
      .set('x-role', Role.SERVICE_PROVIDER)
      .expect(200);
      
    expect(response.body).toBeDefined();
  });

  it('unit manager should be able to view all their revenue ledger entries', async () => {
    const umRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'karan.m@unit.com', password: 'Password@123', role: Role.UNIT_MANAGER })
      .expect(201);
    const umToken = umRes.body.access_token;

    const response = await request(app.getHttpServer())
      .get('/revenue-ledger')
      .set('Authorization', `Bearer ${umToken}`)
      .set('x-role', Role.UNIT_MANAGER)
      .expect(200);
      
    expect(Array.isArray(response.body)).toBe(true);
  });
});
