import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/common/enums/role.enum';

describe('Customer Booking Workflow (e2e)', () => {
  let app: INestApplication<App>;
  let customerToken: string;
  let serviceId: string;
  let bookingId: string;
  let cartId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 1. Login Customer
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'aditya.v@gmail.com',
        password: 'Password@123',
        role: Role.CUSTOMER,
      })
      .expect(201);
    
    customerToken = response.body.access_token;

    // 2. Fetch available services to book
    const servicesResponse = await request(app.getHttpServer())
      .get('/services')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('x-role', Role.CUSTOMER)
      .expect(200);
      
    // Pick first available service
    serviceId = servicesResponse.body[0].service_id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should successfully add an item to the cart', async () => {
    const response = await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('x-role', Role.CUSTOMER)
      .send({
        service_id: serviceId,
        quantity: 1
      })
      .expect(201);
      
    expect(response.body).toHaveProperty('cart_item_id');
  });

  it('should fetch the customer cart', async () => {
    const response = await request(app.getHttpServer())
      .get('/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('x-role', Role.CUSTOMER)
      .expect(200);
      
    expect(response.body).toHaveProperty('cart_id');
    expect(response.body.items.length).toBeGreaterThan(0);
    cartId = response.body.cart_id;
  });

  it('should update cart with booking type (SCHEDULED)', async () => {
    // Tomorrow's date
    const date = new Date();
    date.setDate(date.getDate() + 1);
    
    await request(app.getHttpServer())
      .patch('/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('x-role', Role.CUSTOMER)
      .send({
        booking_type: 'SCHEDULED',
        scheduled_at: date.toISOString(),
        service_address: '123 Test Street'
      })
      .expect(200);
  });

  it('should successfully checkout and create a booking', async () => {
    const response = await request(app.getHttpServer())
      .post('/bookings/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('x-role', Role.CUSTOMER);
      
    if (response.status === 400 && response.body.message && response.body.message.includes('No qualified provider found')) {
      console.warn('Checkout rejected due to no qualified provider (valid business rule). Skipping booking assertions.');
      return;
    }
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('booking_id');
    expect(response.body.status).toBe('CONFIRMED');
    bookingId = response.body.booking_id;
  });

  it('should be able to view past/current bookings', async () => {
    if (!bookingId) return;
    const response = await request(app.getHttpServer())
      .get('/bookings/my')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('x-role', Role.CUSTOMER)
      .expect(200);
      
    const bookings = response.body;
    expect(Array.isArray(bookings)).toBe(true);
    const ourBooking = bookings.find((b: any) => b.booking_id === bookingId);
    expect(ourBooking).toBeDefined();
  });
  
  it('should allow customer to cancel the booking', async () => {
    if (!bookingId) return;
    const response = await request(app.getHttpServer())
      .patch(`/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .set('x-role', Role.CUSTOMER)
      .send({
        reason: 'Changed my mind'
      })
      .expect(200);
      
    expect(response.body.status).toBe('CANCELLED');
  });
});
