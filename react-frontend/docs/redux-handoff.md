# Continuing the Redux implementation

Authentication now lives only in Redux. AuthContext has been removed from the app and its consumers.

## Contracts to use

- `src/schema` defines serialized API documents. Import `User`, `Booking`, `Service`, etc. here. IDs and dates are strings, money is in paise, and slot times are minutes from midnight. `*Document` names are compatibility aliases, not separate schemas.
- `src/models/api.models.ts` contains request DTOs and re-exports document types. Do not copy response interfaces into pages. A form/view model can use `Pick`, `Omit`, or an intersection with a canonical schema.
- `SessionUser` in `src/models/auth.models.ts` describes the small login response. It derives fields from `User` but uses `id`. A full user fetched with `getMe()` uses `_id` and includes addresses/cart. Do not store a login summary as a full `User`.
- `/auth/profile` returns JWT identity (`userId`, role, etc.), not a full user document. Use `getMe()` for editable profile data.
- References can be an ID or a populated object. Narrow them before reading fields: `typeof service.category === 'string' ? service.category : service.category._id`.
- The backend currently returns raw bodies, not `{ data: ... }` envelopes. Service functions return the document/array directly. Do not add another `.data` in thunks.

Backend Mongoose schemas and frontend JSON interfaces serve different purposes. Do not import Mongoose documents into Redux. Backend `entities` files already re-export the canonical backend schemas.

## Next steps

1. Start with `store/category/category-slice.ts`. Add `items: Category[]`, `requestId: string | null`, and `error: string | null` to its state.
2. Use the existing typed thunk helper and service function:

   ```ts
   import createAsyncThunkTyped from '../asyncThunk';
   import { getCategories } from '@/services/categories.service';

   export const fetchCategories = createAsyncThunkTyped(
     'category/fetchCategories',
     () => getCategories(),
   );
   ```

3. Follow `store/customer/customer-slice.ts`: store the request ID on pending; on fulfilled/rejected, ignore actions whose request ID is no longer current. Clear errors on pending and use `action.error.message` on rejection. Reset private data on `AuthActions.login` and `AuthActions.logout` so an old response cannot restore the previous user's data.
4. In the page, use `useDispatch<AppDispatch>()` and `useSelector((state: RootState) => state.category)`. Dispatch the thunk in an effect; replace that page's duplicate local fetch/state with the Redux state. Keep form inputs local.
5. For create/update/delete, call the existing service in a thunk, then update the stored item by `_id` or refresh the list. Use `.unwrap()` when a component needs to handle success/failure after dispatch.
6. Repeat for services, bookings, providers, and the other placeholder slices. Register any newly used reducer in `store/index.ts` (the existing review reducer is not registered yet). Authentication is fully migrated; domain slices are intentionally left for you to implement.

For auth, use `const { user, token, logout } = useAuth()`. The hook's `authDetails` is a memoized Redux-derived convenience for existing pages, not another store. After saving profile details, dispatch `AuthActions.userUpdated({ name, email, phone })`; update any full-profile slice separately with the returned document. Session persistence happens centrally in the store subscription. Do not write auth values to local/session storage from pages or reducers.

For new API calls, use `src/services` and the shared `common/services/apiService.ts`. The old `services/apiService.ts` is only a re-export. The client receives the token from Redux without importing the store. Some existing admin mutation/upload calls still use Axios directly; migrate these to services as you build their slices.

## Checks and handoff

From `react-frontend`:

```sh
node --test tests/data-flow.test.mjs
npm run build
```

The regression suite tests real store/service modules with a mocked Axios adapter; it does not require MongoDB or a running backend. It covers session persistence, malformed sessions, token removal, raw API responses, validation errors, ignoring late responses after logout, and one-request provider loading.

The full build is currently blocked by missing declarations in the installed `@base-ui/react` package and resulting implicit-any errors in UI callbacks. Dependency repair restored the executable shims but did not resolve those declarations. The npm lockfile also lacks the declared Embla carousel packages, so `npm ci` rejects it; neither lockfile was changed in this fix. Resolve the dependency installation/lockfile mismatch before treating the full build as verified. No live-backend/browser smoke test was performed.

Once dependencies build, smoke-test customer/provider/manager/admin login, refresh, profile save, logout, and login as another user without reloading. Headers should update immediately, and authenticated requests should carry only the current Redux token.
