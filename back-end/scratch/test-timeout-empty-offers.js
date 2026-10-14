const BASE_URL = 'http://localhost:3000';

async function req(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, options);
  let body;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body };
}

async function testEmptyOffersSweep() {
  console.log('Testing: Offer-timeout job picks up paid awaiting_provider booking with empty offers array');

  // Customer login
  const custLogin = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testcust1@customer.com', password: 'TestPass123!' }),
  });
  const custToken = custLogin.body.access_token;
  const custId = custLogin.body.user.id;

  const services = await req('/services');
  const service = services.body[0];
  const userRes = await req(`/users/${custId}`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  const addressId = userRes.body.addresses[0].id;

  // Add a slot 2 days out to avoid conflict
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 2);
  const scheduledDate = targetDate.toISOString();

  await req(`/users/${custId}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
    body: JSON.stringify({
      service: service._id,
      scheduledDate,
      startTime: 540,
      endTime: 540 + service.duration,
      addressId,
    }),
  });

  const chk = await req('/orders/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
    body: JSON.stringify({}),
  });
  let orderId = chk.body.orderId;
  if (!orderId && typeof chk.body.message === 'string') {
    const match = chk.body.message.match(/order ([0-9a-fA-F]{24})/);
    if (match) orderId = match[1];
  }

  // Pay order
  await req('/payments/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
    body: JSON.stringify({ orderId, success: true }),
  });

  const bks = await req(`/bookings/order/${orderId}`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  const booking = bks.body[0];
  console.log('Created booking:', booking._id, 'Status:', booking.status);

  // Artificially reset offers to empty [] to simulate server dying between payment and matching
  await req(`/bookings/${booking._id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
    body: JSON.stringify({ offers: [], offerRound: 0 }),
  });

  const emptyBooking = await req(`/bookings/${booking._id}`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  console.log('Booking offers after reset to empty:', emptyBooking.body.offers.length);

  console.log('Waiting up to 35 seconds for background offer-timeout job (every 30s) to run...');
  const startTime = Date.now();
  let recovered = false;
  while (Date.now() - startTime < 40000) {
    await new Promise(r => setTimeout(r, 4000));
    const check = await req(`/bookings/${booking._id}`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    if (check.body.offers && check.body.offers.length > 0) {
      console.log('SUCCESS: Offer-timeout sweep picked up booking with empty offers!');
      console.log('Offers populated by job:', check.body.offers.length);
      console.log('Sample offer:', JSON.stringify(check.body.offers[0], null, 2));
      recovered = true;
      break;
    }
  }

  if (!recovered) {
    console.error('FAILED: Offer-timeout sweep did not populate offers in time.');
  }
}

testEmptyOffersSweep().catch(console.error);
