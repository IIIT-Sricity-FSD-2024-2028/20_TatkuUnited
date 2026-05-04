const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  // Register
  const regRes = await request({
    hostname: 'localhost',
    port: 10000,
    path: '/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'test3@example.com', password: 'Password@123', fullName: 'Test', phone: '1234567890', role: 'customer' });
  console.log('Register response:', regRes.status, regRes.body);

  // Login
  const loginRes = await request({
    hostname: 'localhost',
    port: 10000,
    path: '/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'test3@example.com', password: 'Password@123', role: 'customer' });

  if (!loginRes.body.access_token) {
    console.error('Login failed', loginRes.body);
    return;
  }
  const token = loginRes.body.access_token;

  // Get services
  const svcRes = await request({
    hostname: 'localhost',
    port: 10000,
    path: '/services/available',
    method: 'GET'
  });
  const serviceId = svcRes.body[0].service_id;

  // Clear cart just in case
  await request({
    hostname: 'localhost',
    port: 10000,
    path: '/cart/items',
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'x-role': 'customer' }
  });

  // Add scheduled item
  console.log('Sending item to cart...');
  const addRes = await request({
    hostname: 'localhost',
    port: 10000,
    path: '/cart/items',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'x-role': 'customer' }
  }, {
    service_id: serviceId,
    quantity: 1,
    booking_type: 'SCHEDULED',
    scheduled_at: '2026-06-01T10:00:00.000Z'
  });
  
  console.log('Add response:', addRes.status, addRes.body);

  // Get cart
  const cartRes = await request({
    hostname: 'localhost',
    port: 10000,
    path: '/cart',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'x-role': 'customer' }
  });
  
  console.log('Cart items:');
  console.log(JSON.stringify(cartRes.body.items, null, 2));
}

run();
