async function testAcceptFromAlice() {
  const baseURL = 'http://localhost:3000';
  const aliceLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'prov_alice_test@provider.com', password: 'TestPassword123!' }),
  });
  const aliceToken = (await aliceLogin.json()).access_token;

  // 1. Get Alice's offer
  const offersRes = await fetch(`${baseURL}/bookings/provider-offers/me`, {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  const offers = await offersRes.json();
  console.log(`Offers available for Alice: ${offers.length}`);
  if (offers.length === 0) return;

  const bookingId = offers[0]._id;
  console.log(`Alice accepting booking: ${bookingId}`);

  // 2. Accept
  const acceptRes = await fetch(`${baseURL}/bookings/${bookingId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  console.log('Alice accept HTTP Status:', acceptRes.status);
  const accepted = await acceptRes.json();
  console.log('Accepted booking status:', accepted.status, 'Assigned provider ID:', accepted.provider?._id || accepted.provider);

  // 3. Bob attempts to accept the already-taken job
  const bobLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'prov_bob_test@provider.com', password: 'TestPassword123!' }),
  });
  const bobToken = (await bobLogin.json()).access_token;

  const bobAcceptRes = await fetch(`${baseURL}/bookings/${bookingId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  console.log('Bob accept (already taken) HTTP Status:', bobAcceptRes.status);
  const bobBody = await bobAcceptRes.json();
  console.log('Bob response body:', bobBody);
}

testAcceptFromAlice();
