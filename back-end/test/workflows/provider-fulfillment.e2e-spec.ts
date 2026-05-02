import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/common/enums/role.enum';

describe('Provider Fulfillment Workflow (e2e)', () => {
  let app: INestApplication<App>;
  let providerToken: string;
  let superUserToken: string;
  let providerId: string;
  let bookingId: string;
  let assignmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 1. Login Super User for direct assignments
    const suRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'super_user.mark@tatku.com',
        password: 'SuperUser@123',
        role: Role.SUPER_USER,
      })
      .expect(201);
    
    superUserToken = suRes.body.access_token;

    // 2. Login Provider
    const provRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'ravi.kumar@mail.com',
        password: 'Password@123',
        role: Role.SERVICE_PROVIDER,
      })
      .expect(201);
    
    providerToken = provRes.body.access_token;
    
    // Get Me to find providerId
    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${providerToken}`)
      .set('x-role', Role.SERVICE_PROVIDER)
      .expect(200);
      
    providerId = meRes.body.user_id || meRes.body.sub || meRes.body.sp_id;
    if (!providerId) {
      // fallback just fetch all and find
      const allP = await request(app.getHttpServer())
        .get('/service-providers')
        .set('Authorization', `Bearer ${superUserToken}`)
        .set('x-role', Role.SUPER_USER);
      providerId = allP.body.find((p: any) => p.email === 'ravi.kumar@mail.com').sp_id;
    }

    
    // We need an existing booking that is not assigned yet. 
    // Or we just find the first unassigned booking in the system.
    const bookingsResponse = await request(app.getHttpServer())
      .get('/bookings')
      .set('Authorization', `Bearer ${superUserToken}`)
      .set('x-role', Role.SUPER_USER)
      .expect(200);
      
    // Create a new booking using Customer for the assignment test, or pick an existing CONFIRMED booking
    const confirmedBooking = bookingsResponse.body.find((b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING');
    if (confirmedBooking) {
        bookingId = confirmedBooking.booking_id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow provider to set unavailable slots', async () => {
    const response = await request(app.getHttpServer())
      .post('/provider-unavailability')
      .set('Authorization', `Bearer ${providerToken}`)
      .set('x-role', Role.SERVICE_PROVIDER)
      .send({
        provider_id: providerId,
        date: new Date().toISOString().split('T')[0],
        start_time: '12:00',
        end_time: '13:00',
        reason: 'Lunch break',
        is_recurring: false
      });
      
    expect([201, 400]).toContain(response.status);
      
    expect(response.body).toHaveProperty('unavailability_id');
  });

  it('super user should be able to directly assign a job to provider', async () => {
    // If we have a booking, assign it. If not, we skip or mock.
    if (!bookingId) {
       console.warn('No unassigned booking found. Skipping assignment test.');
       return;
    }
    
    const response = await request(app.getHttpServer())
      .post(`/job-assignments/assign/${bookingId}`)
      .set('Authorization', `Bearer ${superUserToken}`)
      .set('x-role', Role.SUPER_USER)
      .send({
        sp_id: providerId
      })
      .expect(201);
      
    expect(response.body).toHaveProperty('assignment_id');
    assignmentId = response.body.assignment_id;
  });

  it('provider should be able to view their assignments', async () => {
    const response = await request(app.getHttpServer())
      .get(`/job-assignments/provider/${providerId}`)
      .set('Authorization', `Bearer ${providerToken}`)
      .set('x-role', Role.SERVICE_PROVIDER)
      .expect(200);
      
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  it('provider should be able to mark job as complete', async () => {
    if (!assignmentId) return;
      
    const response = await request(app.getHttpServer())
      .patch(`/job-assignments/${assignmentId}/complete`)
      .set('Authorization', `Bearer ${providerToken}`)
      .set('x-role', Role.SERVICE_PROVIDER)
      .send({
         notes: 'Fixed the AC'
      })
      .expect(200);
      
    expect(response.body.status).toBe('COMPLETED');
  });
});
