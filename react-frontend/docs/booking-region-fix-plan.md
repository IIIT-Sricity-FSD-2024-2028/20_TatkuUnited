# Booking, Provider Assignment & Region: Updated Fix Plan

## 1. Root causes (from the analysis)

1. New providers are created with `offeredServices: []`, `status: pending`, `region: null`, so they are invisible to managers and ineligible for matching.
2. The manager UI only has Approve / Suspend / Reinstate. There is no way to edit `offeredServices` or `region`, although `PATCH /providers/:id` already supports it.
3. Two competing definitions of "nearby": `Region` (manager views) vs `$geoNear` radius (slots, checkout, matching).
4. Workflow gaps: no start-time window, no one-time retry, disputes go to admins not regional managers, payout never executes.
5. Possible hidden issue: Leaflet coordinate order may be wrong when stored.

---

## 2. Design decisions

### 2.1 Region is the gate, distance is only a ranking
- A provider is eligible only if `provider.regionId === booking.regionId`.
- `$geoNear` only sorts and scores providers inside the region. It never decides who is in or out.
- If a cap is wanted, make it a per-region setting (`Region.maxRadiusKm`), not a global 10 km.

### 2.2 Where `regionId` lives

| Entity | Field | How it is set |
|---|---|---|
| Customer address | `regionId` | Derived server-side from lat/lng when the address is saved |
| Booking | `regionId` | Snapshot copied from the chosen address at checkout |
| Provider | `regionId` | Derived from service location at registration; overridable by manager/admin |
| Customer (user) | optional `defaultRegionId` | Convenience only, for browsing before an address is chosen |

- A customer can have addresses in different cities, so a single `user.region_id` would be wrong.
- Never accept `regionId` from the client. The frontend sends coordinates; the backend resolves the region.

### 2.3 Region boundaries
- Give each `Region` a boundary: a GeoJSON polygon, or center + radius.
- Resolve with point-in-region queries (`$geoIntersects` for polygons, `$geoWithin` / `$centerSphere` for radius).
- No match means "not serviceable", not "nearest anyway".
- Admins can draw polygons on a Leaflet map with a drawing plugin.
- One shared `RegionsService.resolveForLocation(lng, lat)` is used by address save, provider registration and checkout.

---

## 3. Phased plan

### Phase 0: Unblock testing (immediately)
For the 2 Chennai providers, set `regionId`, `status: approved` and `offeredServices` directly in the DB, so the rest of the flow can be tested while real fixes are built.

### Phase 1: Verify map coordinates (before anything else)
- Leaflet uses `[lat, lng]`. MongoDB GeoJSON needs `[lng, lat]`. Confirm the order on save.
- Stored shape must be `{ type: "Point", coordinates: [lng, lat] }`.
- Confirm a `2dsphere` index exists on every geo field (address, provider location, region boundary).
- Validate server-side: lat in -90..90, lng in -180..180, reject missing or `0,0`.
- Check older addresses (including the "Sri City" era) for missing or default coordinates.
- Quick test: open a saved Chennai provider and customer; coordinates read as `[lng, lat]` should be near 80.2°E, 13.0°N.

### Phase 2: Region boundaries and shared resolver
- Add boundary field to `Region` (polygon or center + radius, optional `maxRadiusKm`).
- Implement `RegionsService.resolveForLocation(lng, lat)`.
- Replace the "nearest active region" fallback in `OrdersService.checkout` with this resolver.
- Optional: admin screen to draw or edit region boundaries on a Leaflet map.

### Phase 3: Store `regionId` everywhere, then migrate
- Add `regionId` to addresses, providers and bookings.
- Resolve on every address save and in `AuthController.ensureProviderProfile`.
- If no region matches, leave `null` but list the provider/address as "unassigned" for admins so they are not invisible.
- One-off migration: backfill existing addresses and providers with the resolver. Failures go to the unassigned list; users with bad coordinates are prompted to re-pick on the map.

### Phase 4: One shared eligibility function
Create `findEligibleProviders({ regionId, serviceId, start, end, location })` and call it from `getAvailableSlots`, `checkout` and `offerBooking`.

It should:
- filter on `status === approved`, same region, service in `offeredServices`, working day and hours, and no overlapping booking;
- sort by distance from the customer's address.

### Phase 5: Matching rounds inside the region
- Keep batch-of-5 and widening rounds only if intentional, and never widen past the region boundary.
- Your ideal workflow says "all nearby providers", so decide: offer to everyone eligible at once (simpler), or keep batches.
- First accept wins (already working, transaction with `409` on conflict).

### Phase 6: Manager UI and backend permissions
- Add an "Edit services" dialog to `manage-providers.tsx`: multi-select grouped by category, pre-filled from `provider.offeredServices`, submitting to `PATCH /providers/:id`. Data is already in `state.manager`.
- Allow approve + assign services in one step.
- Tighten `PATCH /providers/:id`:
  - a manager can only edit providers in their own region;
  - only admins can change `regionId`;
  - validate service IDs exist and are active.
- Admin view for unassigned providers/addresses.

### Phase 7: Customer-side changes
- After the pin is dropped, show the resolved city/region immediately, or "Service not available here".
- Store `regionId` on the booking at checkout.
- Replace hardcoded `"Sri City"` in `CartPage.tsx` with the selected address city.

### Phase 8: Workflow gaps (steps 4 and 5)
- **Start window:** in `startJob`, reject if `now < scheduledStart - grace` (15 to 30 min, configurable).
- **Retry:** add `completionAttempts` to `Booking`. First `rejectCompletion` returns the booking to `in_progress` with the customer's reason. Second sets `DISPUTED`.
- **Dispute routing:** notify managers whose region matches `booking.regionId`, not only admins.
- **Payout:** on `confirmCompletion`, set `payoutStatus` and `payoutAt`. Use a scheduled job to release after `payoutHoldHours`. Real money movement needs a payment gateway and is a separate task.

---

## 4. Implementation order

1. Phase 0 (unblock testing)
2. Phase 1 (coordinate audit)
3. Phases 2 and 3 (resolver, `regionId` fields, migration)
4. Phases 4 and 5 (eligibility and matching)
5. Phases 6 and 7 (manager UI, customer UI, cart fix)
6. Phase 8 (start window, retry, dispute routing, payout)

---

## 5. Verification checklist

Re-run the Chennai scenario from scratch:

- [ ] Saved coordinates for a Chennai provider and customer land near 80.2°E, 13.0°N
- [ ] New provider registers and gets a `regionId` automatically
- [ ] Provider appears in the Chennai manager's list
- [ ] Manager assigns services and approves
- [ ] Customer more than 10 km away but in the same city sees slots
- [ ] Customer outside any region sees "Service not available here" at pin drop
- [ ] Provider from another region never receives the offer
- [ ] Booking stores `regionId` snapshot
- [ ] Accept: first provider wins, second gets `409`
- [ ] Start too early fails, start within window succeeds
- [ ] Complete, customer confirms, payout state updates, rating prompt appears
- [ ] Reject once returns to retry; reject twice creates a dispute visible to the regional manager
- [ ] Manager cannot edit providers from another region
