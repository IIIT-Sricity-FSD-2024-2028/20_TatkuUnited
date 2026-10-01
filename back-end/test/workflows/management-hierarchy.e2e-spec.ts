import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/common/enums/role.enum';

describe('Management Hierarchy Workflow (e2e)', () => {
  let app: INestApplication<App>;
  let superUserToken: string;
  let cmToken: string;
  let umToken: string;

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

    // Login Collective Manager
    const cmRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'suresh@collective.com', password: 'Password@123', role: Role.COLLECTIVE_MANAGER })
      .expect(201);
    cmToken = cmRes.body.access_token;

    // Login Unit Manager
    const umRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'karan.m@unit.com', password: 'Password@123', role: Role.UNIT_MANAGER })
      .expect(201);
    umToken = umRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('super user should be able to update platform settings', async () => {
    await request(app.getHttpServer())
      .put('/platform-settings/MAX_BOOKING_INTERVAL_DAYS')
      .set('Authorization', `Bearer ${superUserToken}`)
      .set('x-role', Role.SUPER_USER)
      .send({ value: '30' })
      .expect(200);
  });

  it('collective manager should be able to view their units', async () => {
    // Collectives and units
    const response = await request(app.getHttpServer())
      .get('/units')
      .set('Authorization', `Bearer ${cmToken}`)
      .set('x-role', Role.COLLECTIVE_MANAGER)
      .expect(200);
      
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('collective manager should be able to view their providers', async () => {
    const response = await request(app.getHttpServer())
      .get('/service-providers')
      .set('Authorization', `Bearer ${cmToken}`)
      .set('x-role', Role.COLLECTIVE_MANAGER)
      .expect(200);
      
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('unit manager should be able to view their providers', async () => {
    const response = await request(app.getHttpServer())
      .get('/service-providers')
      .set('Authorization', `Bearer ${umToken}`)
      .set('x-role', Role.UNIT_MANAGER)
      .expect(200);
      
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('unit manager should be able to view their transactions', async () => {
    const response = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${umToken}`)
      .set('x-role', Role.UNIT_MANAGER)
      .expect(200);
      
    expect(Array.isArray(response.body)).toBe(true);
  });
});
