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
