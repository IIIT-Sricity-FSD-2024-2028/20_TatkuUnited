import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import axios from 'axios';

// Run the real frontend modules in Node without requiring a browser/test framework.
const src = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    let url;
    if (specifier.startsWith('@/')) url = new URL(specifier.slice(2), src);
    else if (specifier.startsWith('.') && context.parentURL?.startsWith(src.href))
      url = new URL(specifier, context.parentURL);
    if (url) {
      const path = fileURLToPath(url);
      for (const suffix of ['', '.ts', '.tsx', '/index.ts']) {
        const candidate = path + suffix;
        if (/\.tsx?$/.test(candidate) && existsSync(candidate))
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(src.href) && /\.tsx?$/.test(url)) {
      const source = readFileSync(fileURLToPath(url), 'utf8').replaceAll('import.meta.env', '({})');
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
      }).outputText };
    }
    return next(url, context);
  },
});

const saved = new Map();
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
  getItem: (key) => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, String(value)),
  removeItem: (key) => saved.delete(key),
} });
let respond = () => ({ data: [], status: 200, statusText: 'OK', headers: {} });
axios.defaults.adapter = async (config) => ({ config, ...await respond(config) });
const { store } = await import('../src/store/index.ts');
const { AuthActions } = await import('../src/store/auth/auth-slice.ts');
const { fetchCustomerDetails } = await import('../src/store/customer/customer-slice.ts');
const { fetchRegionProviders } = await import('../src/store/manager/manager-slice.ts');
const { fetchCategories, createCategory } = await import('../src/store/category/category-slice.ts');
const { fetchRegions, createRegion } = await import('../src/store/region/region-slice.ts');
const { fetchProviderOffers } = await import('../src/store/provider/provider-slice.ts');
const { fetchCustomerBookings, confirmCompletion } = await import('../src/store/booking/booking-slice.ts');
const { fetchAllReviews, submitReview } = await import('../src/store/review/review-slice.ts');
const { fetchServices, fetchAvailableSlots } = await import('../src/store/service/service-slice.ts');
const { fetchSuperuserProfile, updateSuperuserProfile } = await import('../src/store/superuser/superuser-slice.ts');
const { simulatePayment } = await import('../src/services/payments.service.ts');
const { apiService } = await import('../src/common/services/apiService.ts');
const { apiService: legacyApiService } = await import('../src/services/apiService.ts');
const { readSession, persistSession } = await import('../src/common/services/sessionStorage.ts');
const session = { token: 'test-token', user: { id: 'user-1', name: 'Test', email: 'test@example.com', phone: '1234567890', role: 'customer', status: 'active' } };

test('login, profile edits and logout persist one Redux session without clearing unrelated storage', () => {
  saved.set('unrelated', 'keep');
  store.dispatch(AuthActions.login(session));
  assert.deepEqual(readSession(), session);
  store.dispatch(AuthActions.userUpdated({ name: 'Updated' }));
  assert.equal(readSession().user.name, 'Updated');
  store.dispatch(AuthActions.logout());
  assert.equal(readSession(), null);
  assert.equal(saved.get('unrelated'), 'keep');
});

test('malformed stored users are rejected and old _id sessions are migrated', () => {
  saved.set('token', 'test-token');
  for (const raw of ['undefined', 'null', '{}', '{broken']) {
    saved.set('user', raw);
    assert.equal(readSession(), null);
  }
  const { id, ...user } = session.user;
  saved.set('user', JSON.stringify({ ...user, _id: id }));
  assert.equal(readSession().user.id, id);
  persistSession(null);
});

test('both API entry points return raw backend data and use the current Redux token', async () => {
  assert.equal(apiService, legacyApiService);
  store.dispatch(AuthActions.login(session));
  const rows = [{ _id: 'category-1', name: 'Cleaning' }];
  respond = (config) => {
    assert.equal(config.headers.Authorization, 'Bearer test-token');
    return { data: rows };
  };
  let callback;
  assert.deepEqual(await apiService('get', '/categories', undefined, (data) => { callback = data; }), rows);
  assert.deepEqual(callback, rows);
  store.dispatch(AuthActions.logout());
  respond = (config) => {
    assert.equal(config.headers.Authorization, undefined);
    return { data: rows };
  };
  await legacyApiService('get', '/categories');
});

test('validation error arrays reach rejected Redux thunks as readable messages', async () => {
  respond = (config) => { throw new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null,
    { data: { message: ['Invalid email', 'Phone is required'] }, status: 400, headers: {}, config }); };
  const action = await store.dispatch(fetchCustomerDetails());
  assert.equal(action.meta.requestStatus, 'rejected');
  assert.equal(store.getState().customer.error, 'Invalid email; Phone is required');
});

test('late profile responses cannot restore data after logout', async () => {
  store.dispatch(AuthActions.login(session));
  let resolve;
  respond = () => new Promise((done) => { resolve = done; });
  const request = store.dispatch(fetchCustomerDetails());
  await new Promise((done) => setImmediate(done));
  store.dispatch(AuthActions.logout());
  resolve({ data: { _id: 'user-1', name: 'Old user' } });
  await request;
  assert.equal(store.getState().customer.profile, null);
});

test('region provider thunk uses the populated list in one request', async () => {
  let count = 0;
  const providers = [{ _id: 'provider-1', user: { _id: 'user-2', name: 'Provider' } }];
  respond = () => { count += 1; return { data: providers }; };
  const action = await store.dispatch(fetchRegionProviders('region-1'));
  assert.deepEqual(action.payload, providers);
  assert.equal(count, 1);
});

test('category slice fetches categories and creates a category', async () => {
  const categories = [{ _id: 'cat-1', name: 'Plumbing', description: 'Plumbing work', isActive: true }];
  respond = (config) => {
    if (config.method === 'get') return { data: categories };
    if (config.method === 'post') {
      const parsed = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      return { data: { _id: 'cat-2', ...parsed } };
    }
    return { data: {} };
  };
  const fetchAction = await store.dispatch(fetchCategories());
  assert.deepEqual(fetchAction.payload, categories);
  assert.deepEqual(store.getState().category.items, categories);

  const createAction = await store.dispatch(createCategory({ name: 'Electrical', description: 'Wiring', isActive: true }));
  assert.equal(createAction.payload._id, 'cat-2');
  assert.equal(store.getState().category.items.length, 2);
  assert.equal(store.getState().category.items[1].name, 'Electrical');
});

test('region slice fetches regions and creates a region', async () => {
  const regions = [{ _id: 'reg-1', name: 'South Zone', manager: 'mgr-1', isActive: true }];
  respond = (config) => {
    if (config.method === 'get') return { data: regions };
    if (config.method === 'post') {
      const parsed = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      return { data: { _id: 'reg-2', ...parsed } };
    }
    return { data: {} };
  };
  const fetchAction = await store.dispatch(fetchRegions());
  assert.deepEqual(fetchAction.payload, regions);
  assert.deepEqual(store.getState().region.items, regions);

  const createAction = await store.dispatch(createRegion({ name: 'North Zone', manager: 'mgr-2', isActive: true }));
  assert.equal(createAction.payload._id, 'reg-2');
  assert.equal(store.getState().region.items.length, 2);
  assert.equal(store.getState().region.items[1].name, 'North Zone');
});

test('provider offers thunk updates state.provider.offers in Redux', async () => {
  const offers = [{ _id: 'booking-1', status: 'awaiting_provider', service: 'service-1' }];
  respond = () => ({ data: offers });
  const action = await store.dispatch(fetchProviderOffers());
  assert.deepEqual(action.payload, offers);
  assert.deepEqual(store.getState().provider.offers, offers);
});

test('booking slice fetches customer bookings and updates state on completion confirmation', async () => {
  const bookings = [{ _id: 'b-1', status: 'completion_requested', service: 'svc-1' }];
  const confirmed = { _id: 'b-1', status: 'completed', service: 'svc-1' };
  respond = (config) => {
    if (config.url.includes('/confirm-completion')) return { data: confirmed };
    return { data: bookings };
  };
  const fetchAction = await store.dispatch(fetchCustomerBookings('cust-1'));
  assert.deepEqual(fetchAction.payload, bookings);
  assert.deepEqual(store.getState().booking.items, bookings);

  const confirmAction = await store.dispatch(confirmCompletion('b-1'));
  assert.equal(confirmAction.payload.status, 'completed');
  assert.equal(store.getState().booking.items[0].status, 'completed');
});

test('review slice fetches public reviews and submits a new review', async () => {
  const reviews = [{ _id: 'rev-1', rating: 5, review: 'Great work!' }];
  const newReview = { _id: 'rev-2', booking: 'b-1', provider: 'p-1', service: 's-1', rating: 4, review: 'Good' };
  respond = (config) => {
    if (config.method === 'post') return { data: newReview };
    return { data: reviews };
  };
  const fetchAction = await store.dispatch(fetchAllReviews());
  assert.deepEqual(fetchAction.payload, reviews);
  assert.deepEqual(store.getState().review.items, reviews);

  const submitAction = await store.dispatch(submitReview({
    booking: 'b-1',
    provider: 'p-1',
    service: 's-1',
    rating: 4,
    review: 'Good',
  }));
  assert.equal(submitAction.payload._id, 'rev-2');
  assert.equal(store.getState().review.items.length, 2);
  assert.equal(store.getState().review.items[0]._id, 'rev-2');
});

test('service slice fetches catalog and available slots', async () => {
  const services = [{ _id: 'svc-1', name: 'Home Deep Cleaning', price: 4999 }];
  const slotsResponse = {
    date: '2026-12-01',
    slots: [{ startTime: 540, endTime: 660, time: '09:00 AM', available: true }],
  };
  respond = (config) => {
    if (config.url.includes('/available-slots')) return { data: slotsResponse };
    return { data: services };
  };
  const fetchAction = await store.dispatch(fetchServices());
  assert.deepEqual(fetchAction.payload, services);
  assert.deepEqual(store.getState().service.items, services);

  const slotsAction = await store.dispatch(fetchAvailableSlots({
    serviceId: 'svc-1',
    params: { date: '2026-12-01' },
  }));
  assert.deepEqual(slotsAction.payload.slots, slotsResponse.slots);
  assert.deepEqual(store.getState().service.slots, slotsResponse.slots);
});

test('simulatePayment handles success scenario correctly', async () => {
  let capturedBody = null;
  respond = (config) => {
    capturedBody = JSON.parse(config.data);
    return {
      data: {
        success: true,
        orderId: capturedBody.orderId,
        paymentStatus: 'paid',
        paymentId: 'mock_pay_123',
        message: 'Payment received, finding a provider',
      },
    };
  };

  const result = await simulatePayment('order-success-123', true);
  assert.equal(capturedBody.orderId, 'order-success-123');
  assert.equal(capturedBody.success, true);
  assert.equal(result.success, true);
  assert.equal(result.paymentStatus, 'paid');
  assert.ok(result.paymentId);
});

test('simulatePayment handles failure scenario correctly without crashing', async () => {
  let capturedBody = null;
  respond = (config) => {
    capturedBody = JSON.parse(config.data);
    return {
      data: {
        success: false,
        orderId: capturedBody.orderId,
        paymentStatus: 'failed',
        message: 'Payment failed. You may retry your checkout from the cart.',
      },
    };
  };

  const result = await simulatePayment('order-fail-456', false);
  assert.equal(capturedBody.orderId, 'order-fail-456');
  assert.equal(capturedBody.success, false);
  assert.equal(result.success, false);
  assert.equal(result.paymentStatus, 'failed');
});

test('superuser slice fetches profile and updates both superuser.userInfo and auth.user', async () => {
  const adminSession = {
    token: 'admin-token',
    user: { id: 'admin-1', name: 'Super Admin', email: 'admin@example.com', phone: '9876543210', role: 'admin', status: 'active' },
  };
  const adminDoc = { _id: 'admin-1', name: 'Super Admin', email: 'admin@example.com', phone: '9876543210', role: 'admin', status: 'active' };
  const updatedDoc = { ...adminDoc, name: 'Updated Admin', phone: '9998887776' };

  store.dispatch(AuthActions.login(adminSession));
  respond = (config) => {
    if (config.method === 'get' && config.url === '/users/me') return { data: adminDoc };
    if (config.method === 'patch' && config.url === '/users/admin-1') return { data: updatedDoc };
    throw new Error(`Unexpected request: ${config.method} ${config.url}`);
  };

  await store.dispatch(fetchSuperuserProfile());
  assert.deepEqual(store.getState().superuser.userInfo, adminDoc);

  await store.dispatch(updateSuperuserProfile({ userId: 'admin-1', changes: { name: 'Updated Admin', phone: '9998887776' } }));
  assert.equal(store.getState().superuser.userInfo.name, 'Updated Admin');
  assert.equal(store.getState().superuser.userInfo.phone, '9998887776');
  assert.equal(store.getState().auth.user.name, 'Updated Admin');
  assert.equal(store.getState().auth.user.phone, '9998887776');

  store.dispatch(AuthActions.logout());
  assert.equal(store.getState().superuser.userInfo, null);
});
