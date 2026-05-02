import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Role } from './../src/common/enums/role.enum';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function login(email: string, password: string, role: Role) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password, role })
      .expect(201);

    return response.body.access_token as string;
  }

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('rejects mismatched x-role header and JWT role', async () => {
    const token = await login(
      'aditya.v@gmail.com',
      'Password@123',
      Role.CUSTOMER,
    );

    await request(app.getHttpServer())
      .get('/cart')
      .set('Authorization', `Bearer ${token}`)
      .set('x-role', Role.SUPER_USER)
      .expect(403);
  });

  it('prevents a unit manager from reading another unit', async () => {
    const superToken = await login(
      'super_user.mark@tatku.com',
      'SuperUser@123',
      Role.SUPER_USER,
    );
    const umToken = await login(
      'karan.m@unit.com',
      'Password@123',
      Role.UNIT_MANAGER,
    );

    const unitsResponse = await request(app.getHttpServer())
      .get('/units')
      .set('Authorization', `Bearer ${superToken}`)
      .set('x-role', Role.SUPER_USER)
      .expect(200);

    const otherUnit = unitsResponse.body.find(
      (unit: { unit_name: string }) =>
        unit.unit_name === 'Plumbing & Sanitary Services',
    );

    await request(app.getHttpServer())
      .get(`/units/${otherUnit.unit_id}`)
      .set('Authorization', `Bearer ${umToken}`)
      .set('x-role', Role.UNIT_MANAGER)
      .expect(403);
  });

  it('prevents a collective manager from reading a different collective', async () => {
    const superToken = await login(
      'super_user.mark@tatku.com',
      'SuperUser@123',
      Role.SUPER_USER,
    );
    const cmToken = await login(
      'suresh@collective.com',
      'Password@123',
      Role.COLLECTIVE_MANAGER,
    );

    const createResponse = await request(app.getHttpServer())
      .post('/collectives')
      .set('Authorization', `Bearer ${superToken}`)
      .set('x-role', Role.SUPER_USER)
      .send({
        collective_name: 'South Chennai Collective',
        is_active: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/collectives/${createResponse.body.collective_id}`)
      .set('Authorization', `Bearer ${cmToken}`)
      .set('x-role', Role.COLLECTIVE_MANAGER)
      .expect(403);
  });

  it('prevents a unit manager from reading a provider in another unit', async () => {
    const superToken = await login(
      'super_user.mark@tatku.com',
      'SuperUser@123',
      Role.SUPER_USER,
    );
    const umToken = await login(
      'karan.m@unit.com',
      'Password@123',
      Role.UNIT_MANAGER,
    );

    const providersResponse = await request(app.getHttpServer())
      .get('/service-providers')
      .set('Authorization', `Bearer ${superToken}`)
      .set('x-role', Role.SUPER_USER)
      .expect(200);

    const otherProvider = providersResponse.body.find(
      (provider: { email: string }) =>
        provider.email === 'manoj.selvam@mail.com',
    );

    await request(app.getHttpServer())
      .get(`/service-providers/${otherProvider.sp_id}`)
      .set('Authorization', `Bearer ${umToken}`)
      .set('x-role', Role.UNIT_MANAGER)
      .expect(403);
  });

  it('enforces global validation in e2e app instances', async () => {
    const providerToken = await login(
      'ravi.kumar@mail.com',
      'Password@123',
      Role.SERVICE_PROVIDER,
    );

    await request(app.getHttpServer())
      .post('/provider-unavailability')
      .set('Authorization', `Bearer ${providerToken}`)
      .set('x-role', Role.SERVICE_PROVIDER)
      .send({
        provider_id: 'not-a-uuid',
        start_time: '08:00',
        end_time: '12:00',
      })
      .expect(400);
  });

  it('rejects invalid scheduled_at values for cart metadata', async () => {
    const customerToken = await login(
      'aditya.v@gmail.com',
      'Password@123',
      Role.CUSTOMER,
    );

    await request(app.getHttpServer())
      .patch('/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('x-role', Role.CUSTOMER)
      .send({
        booking_type: 'SCHEDULED',
        scheduled_at: 'tomorrow evening',
      })
      .expect(400);
  });

  it('rejects invalid provider working hours format', async () => {
    const superToken = await login(
      'super_user.mark@tatku.com',
      'SuperUser@123',
      Role.SUPER_USER,
    );
    const providerToken = await login(
      'ravi.kumar@mail.com',
      'Password@123',
      Role.SERVICE_PROVIDER,
    );

    const providersResponse = await request(app.getHttpServer())
      .get('/service-providers')
      .set('Authorization', `Bearer ${superToken}`)
      .set('x-role', Role.SUPER_USER)
      .expect(200);

    const provider = providersResponse.body.find(
      (row: { email: string }) => row.email === 'ravi.kumar@mail.com',
    );

    await request(app.getHttpServer())
      .patch(`/service-providers/working-hours/${provider.sp_id}`)
      .set('Authorization', `Bearer ${providerToken}`)
      .set('x-role', Role.SERVICE_PROVIDER)
      .send({
        hour_start: '8am',
        hour_end: '18:00',
      })
      .expect(400);
  });
});
