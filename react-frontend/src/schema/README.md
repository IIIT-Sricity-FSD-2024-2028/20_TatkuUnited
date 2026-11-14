# Frontend schemas

These TypeScript interfaces mirror all 13 Mongoose entities in `back-end/src/schema`, including embedded addresses, carts, offers, refunds, service details, and matching weights. Import from `@/schema` or an individual `.schema.ts` file. Existing `@/models/api.models` document imports re-export these same types; request DTOs remain there.

```ts
import type { Booking, User, Notification } from "@/schema";
import type { PayloadAction } from "@reduxjs/toolkit";

interface BookingState {
  items: Booking[];
  selected: Booking | null;
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  items: [], selected: null, loading: false, error: null,
};

// Inside createSlice({ ..., reducers: { ... } }):
function bookingsLoaded(state: BookingState, action: PayloadAction<Booking[]>) {
  state.items = action.payload;
}
```

- `Booking` and `BookingDocument` (likewise other entities) are aliases for the same serialized response shape.
- IDs and dates are strings, keeping Redux state serializable. Money is in paise; slot times are minutes from midnight.
- `Reference<T>` is an ID string or a populated entity. Narrow with `typeof value === "string"` before reading populated fields. Endpoints that project only selected fields need their own `Pick` response types.
- Backend defaults are required response properties; nullable defaults use `null`. Use `Entity | null` for unloaded state, rather than casting an empty object to an entity.
- User passwords are excluded because the backend hides them from responses. Password inputs belong to request DTOs.
- Payment status belongs to `Order.paymentStatus`; `Payment` stores payment identifiers and refunds.
- These are compile-time schemas, not runtime validators or Mongoose models. They do not apply defaults or validate incoming JSON.

When changing backend schema fields or enums, update the corresponding frontend schema too.
