// Run after building: node --env-file=.env scratch/verify-booking-ui-flow.cjs
// Uses a fresh isolated database on the configured MongoDB host. No application data is changed.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const dbName = `booking_ui_verify_${randomUUID().slice(0, 8)}`;
const configuredUri = process.env.MONGODB_URI;
assert.ok(/^mongodb(?:\+srv)?:\/\/[^/]+\//.test(configuredUri), 'A MongoDB URI with database path is required');
process.env.MONGODB_URI = configuredUri.replace(/^(mongodb(?:\+srv)?:\/\/[^/]+\/)[^?]*/, '$1' + dbName);
process.env.MOCK_PAYMENTS = 'true';
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { getModelToken, getConnectionToken } = require('@nestjs/mongoose');
const { JwtService } = require('@nestjs/jwt');
const { Types } = require('mongoose');
const { AppModule } = require('../dist/app.module');
const { MatchingService } = require('../dist/matching/matching.service');

(async () => {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const connection = app.get(getConnectionToken());
  const model = name => app.get(getModelToken(name));
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const point = { type: 'Point', coordinates: [77.5946, 12.9716] };
    const users = {};
    for (const [index, role] of ['customer', 'provider', 'admin'].entries()) {
      users[role] = await model('User').create({ name: `Test ${role}`, email: `${role}@example.test`, phone: `900000000${index}`, password: 'fixture-only-no-login', role });
    }
    const jwt = app.get(JwtService);
    const tokens = Object.fromEntries(Object.entries(users).map(([role, user]) => [role, jwt.sign({ sub: user.id, role, status: 'active' })]));
    const region = await model('Region').create({ name: 'Verification', manager: new Types.ObjectId(), location: point });
    const service = await model('Service').create({ name: 'Verification service', category: new Types.ObjectId(), description: 'Test fixture', price: 10000, duration: 60 });
    const provider = await model('Provider').create({ user: users.provider._id, location: point, workHourStart: 0, workHourEnd: 1440, status: 'approved' });
    await model('PlatformSetting').create({ platformFeePercent: 20, maxAssignmentDistanceKm: 10, maxOfferRounds: 3 });
    await Promise.all(['Booking', 'Provider', 'Payment'].map(name => model(name).init()));
    async function request(method, path, role, body, expected, projection = data => data) {
      const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: `Bearer ${tokens[role]}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const raw = await res.text();
      let data; try { data = JSON.parse(raw); } catch { data = raw; }
      console.log(`${method} ${path} -> ${res.status}`, JSON.stringify(projection(data)));
      assert.equal(res.status, expected);
      return data;
    }
    async function fixture(status = 'confirmed', paymentStatus = 'paid') {
      const order = await model('Order').create({ customer: users.customer._id, address: { line: 'Test address', city: 'Bengaluru', location: point }, totalAmount: 10000, paymentStatus, expiresAt: new Date(Date.now() + 900000) });
      const payment = await model('Payment').create({ order: order._id, totalAmount: 10000, razorpayOrderId: `mock_order_${order.id}`, ...(paymentStatus === 'paid' ? { razorpayPaymentId: `mock_pay_${order.id}` } : {}) });
      order.payment = payment._id; await order.save();
      const booking = await model('Booking').create({ service: service._id, customer: users.customer._id, order: order._id, region: region._id, provider: status === 'awaiting_provider' ? null : provider._id, scheduledDate: new Date('2030-01-01T18:30:00Z'), startTime: 600, endTime: 660, blockStartTime: 570, price: 10000, platformFeePercent: 20, platformShare: 2000, providerShare: 8000, status });
      return { booking, order, payment };
    }
    const summary = b => ({ status: b.status, payoutStatus: b.payoutStatus, completionRejectedAt: b.completionRejectedAt });
    await request('GET', '/', null, null, 200);
    await request('GET', '/platform-settings', null, null, 200, rows => ({ offerBatchSize: rows[0].offerBatchSize, maxOfferRounds: rows[0].maxOfferRounds }));
    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const slots = await request('GET', `/services/${service.id}/available-slots?date=${tomorrow}&lat=12.9716&lng=77.5946`, null, null, 200);
    assert.equal(slots.slots.length, 0);
    await request('POST', '/orders/checkout', 'customer', {}, 400);
    const first = await fixture();
    const path = '/bookings/' + first.booking.id;
    await request('POST', path + '/start', 'provider', {}, 201, summary);
    await request('POST', path + '/request-completion', 'provider', {}, 200, summary);
    const denied = await request('POST', path + '/reject-completion', 'customer', {}, 200, summary);
    assert.equal(denied.status, 'disputed'); assert.ok(denied.completionRejectedAt);
    await request('POST', path + '/request-completion', 'provider', {}, 400);
    await request('POST', path + '/complete', 'provider', {}, 403);
    await request('PATCH', path, 'provider', { status: 'in_progress' }, 403);
    await request('POST', path + '/cancel', 'provider', { cancelledBy: 'admin' }, 400);
    await request('POST', path + '/confirm-completion', 'customer', {}, 400);
    await request('POST', path + '/complete', 'admin', {}, 201, summary);
    const happy = await fixture('completion_requested');
    await request('POST', '/bookings/' + happy.booking.id + '/confirm-completion', 'customer', {}, 200, summary);
    await request('POST', '/bookings/' + happy.booking.id + '/confirm-completion', 'customer', {}, 400);
    const failure = await fixture('awaiting_provider', 'created');
    await request('POST', '/payments/simulate', 'customer', { orderId: failure.order.id, success: false }, 201);
    assert.equal((await model('Booking').findById(failure.booking.id)).status, 'cancelled');
    await request('GET', '/orders/' + failure.order.id + '/details', 'customer', null, 200, order => ({ paymentStatus: order.paymentStatus }));
    const expired = await fixture('awaiting_provider', 'created');
    await model('Order').updateOne({ _id: expired.order._id }, { expiresAt: new Date(Date.now() - 1000) });
    const late = await request('POST', '/payments/simulate', 'customer', { orderId: expired.order.id, success: true }, 201);
    assert.equal(late.paymentStatus, 'refunded');
    const noProviders = await fixture('awaiting_provider');
    await app.get(MatchingService).offerBooking(noProviders.booking.id);
    const cancelled = await request('GET', '/bookings/' + noProviders.booking.id, 'customer', null, 200, b => ({ status: b.status, reason: b.cancelledReason, offerRound: b.offerRound, paymentStatus: b.order.paymentStatus }));
    assert.equal(cancelled.status, 'cancelled'); assert.equal(cancelled.order.paymentStatus, 'refunded');
    const refunded = await model('Payment').findById(noProviders.payment.id);
    assert.equal(refunded.refunds.reduce((total, refund) => total + refund.amount, 0), 10000);
    const partial = await fixture('awaiting_provider', 'partially_refunded');
    await app.get(MatchingService).sweepOfferTimeouts();
    const partialResult = await request('GET', '/bookings/' + partial.booking.id, 'customer', null, 200, b => ({ status: b.status, paymentStatus: b.order.paymentStatus }));
    assert.equal(partialResult.status, 'cancelled');
    console.log('PASS: completion confirmation, bounded denial, role guards, payment failure, no-provider cancellation and full refund.');
  } finally {
    // Only the randomly named database created by this run is removed.
    assert.equal(connection.name, dbName);
    try {
      await Promise.all(Object.values(connection.models).map(model => model.deleteMany({})));
      console.log('Removed all fixtures from isolated database:', dbName);
    }
    finally { await app.close(); }
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
