const now = new Date();
const oid = (n) => new ObjectId("665f0000000000000000" + String(n).padStart(4, "0"));
const MIN = 60000, DAY = 86400000, IST = 330 * MIN;

// ---------- Settings (read from your DB) ----------
const S = db.platformsettings.findOne();
if (!S) throw new Error("No platformsettings document found.");
const FEE = S.platformFeePercent, BUF = S.travelBufferMinutes, OFFER = S.offerTimeoutMinutes;

// ---------- Date helpers (all dates are midnight IST) ----------
const ist = new Date(now.getTime() + IST);
const todayMs = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST;
const dayMs = (off) => todayMs + off * DAY;
const isSunday = (ms) => new Date(ms + IST).getUTCDay() === 0;
const wd = (off) => { let o = off; while (isSunday(dayMs(o))) o += off < 0 ? -1 : 1; return o; }; // providers are off on Sundays
const at = (off, minute) => new Date(dayMs(off) + minute * MIN);

const km = ([lng1, lat1], [lng2, lat2]) => {
  const r = (d) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};
const check = (cond, msg) => { if (!cond) throw new Error("Validation failed: " + msg); };

// ---------- Load referenced data ----------
const users = {}, svc = {}, prov = {};
[8, 9, 10, 11].forEach((n) => { users[n] = db.users.findOne({ _id: oid(n) }); check(users[n] && users[n].addresses.length, `customer ${n} (run seed-users.js)`); });
[5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008].forEach((n) => { svc[n] = db.services.findOne({ _id: oid(n) }); check(svc[n], `service ${n} (run seed-catalog.js)`); });
[3001, 3002, 3003, 3004].forEach((n) => { prov[n] = db.providers.findOne({ _id: oid(n) }); check(prov[n] && prov[n].region, `provider ${n} with region (run seed-layer2.js)`); });

// ---------- Scenarios ----------
// at: [dayOffset, minuteOfDay] when the order was placed. day = offset of the service date. start = minutes from midnight.
// Today is offset 0. Negative = past, positive = future.
const scenarios = [
  { n: 1, cust: 8, at: [-8, 1080], items: [
    { svc: 5001, prov: 3001, day: -6, start: 540, status: "completed", paid: true, review: [5, "Spotless home, very professional."] } ] },
  { n: 2, cust: 9, at: [-7, 1020], items: [
    { svc: 5007, prov: 3003, day: -5, start: 600, status: "completed", paid: true, review: [5, "AC works great now."] },
    { svc: 5008, prov: 3003, day: -5, start: 780, status: "completed", paid: true, review: [4, "Machine fixed, took a little long."] } ] },
  { n: 3, cust: 10, at: [-5, 600], items: [
    { svc: 5004, prov: 3002, day: -4, start: 660, status: "completed", paid: true, review: [4, "Leak fixed quickly."] } ] },
  { n: 4, cust: 11, at: [-3, 1140], items: [
    { svc: 5002, prov: 3004, day: -2, start: 570, status: "completed", paid: true, review: [3, "Good cleaning but arrived late."] } ] },
  { n: 5, cust: 9, at: [-3, 900], items: [
    { svc: 5007, prov: 3003, day: -2, start: 720, status: "completed", paid: true, review: [4, "Good service."] } ] },
  { n: 6, cust: 8, at: [-2, 1080], items: [   // completed yesterday, payout pending, no review yet
    { svc: 5005, prov: 3001, day: -1, start: 840, status: "completed", paid: false } ] },
  { n: 7, cust: 10, at: [-2, 960], items: [
    { svc: 5003, prov: 3002, day: -1, start: 600, status: "completed", paid: false, review: [5, "Quick and polite."] } ] },
  { n: 8, cust: 11, at: [-1, 660], items: [   // fully cancelled and refunded
    { svc: 5008, prov: 3004, day: 2, start: 660, status: "cancelled", cancelledBy: "customer", reason: "Change of plans", cancelAt: [-1, 1020] } ] },
  { n: 9, cust: 8, at: [-1, 600], items: [    // partially refunded
    { svc: 5002, prov: 3001, day: 1, start: 600, status: "confirmed" },
    { svc: 5006, prov: 3002, day: 1, start: 780, status: "cancelled", cancelledBy: "customer", reason: "Fixed it myself", cancelAt: [-1, 1200] } ] },
  { n: 10, cust: 10, at: [-1, 840], items: [
    { svc: 5001, prov: 3002, day: 3, start: 540, status: "confirmed" } ] },
  { n: 11, cust: 11, at: [-1, 900], items: [
    { svc: 5004, prov: 3003, day: 1, start: 900, status: "confirmed" } ] },
  { n: 12, cust: 9, live: true, items: [      // placed just now, Emma declined, offered to Daniel
    { svc: 5006, prov: 3004, day: 5, start: 1020, status: "awaiting_provider", declined: [3003] } ] },
];

const unavail = [
  { n: 1, prov: 3001, day: 2, start: 720, end: 840, reason: "Personal errand" },
  { n: 2, prov: 3002, day: 6, start: 540, end: 780, reason: "Doctor appointment" },
];

// ---------- Build documents ----------
const orders = [], payments = [], bookings = [], reviews = [], unavDocs = [];
let bk = 6000, rv = 9000;

for (const sc of scenarios) {
  const cust = users[sc.cust], addr = cust.addresses[0];
  const createdAt = sc.live ? new Date(now.getTime() - 5 * MIN) : at(sc.at[0], sc.at[1]);
  const paidAt = new Date(createdAt.getTime() + 3 * MIN);       // paid inside the 15 min order window
  const createdDay = Math.floor((createdAt.getTime() + IST) / DAY) * DAY - IST;
  const orderId = oid(7000 + sc.n), payId = oid(8000 + sc.n);
  let total = 0, cancelledCount = 0, updatedAt = paidAt;
  const refunds = [];

  for (const it of sc.items) {
    const s = svc[it.svc], p = prov[it.prov];
    const tag = `order ${sc.n} / service ${it.svc} / provider ${it.prov}`;
    const date = new Date(dayMs(wd(it.day)));
    const end = it.start + s.duration;
    const blockStart = it.start - BUF;

    // --- timing and assignment rules ---
    check(p.status === "approved", tag + ": provider not approved");
    check(p.offeredServices.some((x) => x.equals(s._id)), tag + ": provider does not offer this service");
    check(p.workingDays.includes(new Date(date.getTime() + IST).getUTCDay()), tag + ": provider not working that day");
    check(it.start % S.slotIntervalMinutes === 0 && it.start >= S.firstSlotStart && it.start <= S.lastSlotStart, tag + ": start not a valid slot");
    check(blockStart >= p.workHourStart && end <= p.workHourEnd, tag + ": block/end outside provider work hours");
    check(km(addr.location.coordinates, p.location.coordinates) <= S.maxAssignmentDistanceKm, tag + ": provider too far");
    check(date.getTime() + it.start * MIN - createdAt.getTime() >= S.minLeadMinutes * MIN, tag + ": violates minLeadMinutes");
    check((date.getTime() - createdDay) / DAY <= S.bookingWindowDays, tag + ": outside bookingWindowDays");

    const platformShare = Math.round((s.price * FEE) / 100);
    const providerShare = s.price - platformShare;
    total += s.price;

    const b = {
      _id: oid(++bk), service: s._id, provider: p._id, customer: cust._id, order: orderId, region: p.region,
      scheduledDate: date, startTime: it.start, endTime: end, blockStartTime: blockStart,
      status: it.status, cancelledBy: null, cancelledReason: null, offerExpiresAt: null,
      declinedBy: (it.declined || []).map(oid),
      price: s.price, platformFeePercent: FEE, platformShare, providerShare,
      payoutStatus: "pending", payoutAt: null,
      createdAt: paidAt, updatedAt: new Date(paidAt.getTime() + 4 * MIN),   // confirmed ~4 min after payment
    };

    if (it.status === "completed") {
      b.updatedAt = new Date(date.getTime() + end * MIN);                    // finished at endTime
      if (it.paid) { b.payoutStatus = "paid"; b.payoutAt = new Date(date.getTime() + DAY + 600 * MIN); } // next day 10:00 IST
      if (it.review) {
        const rAt = new Date(date.getTime() + (end + 120) * MIN);
        check(rAt <= now, tag + ": review would be in the future");
        reviews.push({ _id: oid(++rv), booking: b._id, rating: it.review[0], review: it.review[1],
          provider: p._id, service: s._id, createdAt: rAt, updatedAt: rAt });
      }
    } else if (it.status === "cancelled") {
      const cAt = at(it.cancelAt[0], it.cancelAt[1]);
      b.cancelledBy = it.cancelledBy; b.cancelledReason = it.reason; b.updatedAt = cAt;
      cancelledCount++;
      refunds.push({ booking: b._id, amount: s.price, razorpayRefundId: `rfnd_SEED${String(b._id).slice(-4)}`, status: "processed", createdAt: cAt });
      if (cAt > updatedAt) updatedAt = cAt;
    } else if (it.status === "awaiting_provider") {
      b.offerExpiresAt = new Date(paidAt.getTime() + OFFER * MIN);
      b.updatedAt = paidAt;
    }
    bookings.push(b);
  }

  const paymentStatus = cancelledCount === 0 ? "paid" : cancelledCount === sc.items.length ? "refunded" : "partially_refunded";
  const pad = String(sc.n).padStart(4, "0");
  orders.push({
    _id: orderId, customer: cust._id,
    address: { line: addr.line, city: addr.city, location: addr.location },
    totalAmount: total, payment: payId, paymentStatus,
    expiresAt: new Date(createdAt.getTime() + 15 * MIN), createdAt, updatedAt,
  });
  payments.push({
    _id: payId, order: orderId, totalAmount: total, currency: "INR",
    razorpayOrderId: `order_SEED${pad}`, razorpayPaymentId: `pay_SEED${pad}`,
    razorpaySignature: String(sc.n).padStart(64, "a"),    // placeholder, not a real signature
    refunds, createdAt, updatedAt,
  });
}

for (const u of unavail) {
  const date = new Date(dayMs(wd(u.day)));
  const p = prov[u.prov];
  check(u.start >= p.workHourStart && u.end <= p.workHourEnd, `unavailability ${u.n} outside work hours`);
  unavDocs.push({ _id: oid(9500 + u.n), provider: p._id, date, startTime: u.start, endTime: u.end, reason: u.reason, createdAt: now, updatedAt: now });
}

// ---------- Overlap checks (booking blocks include the travel buffer) ----------
const ourIds = bookings.map((b) => b._id);
const busy = [
  ...bookings.filter((b) => b.status !== "cancelled").map((b) => ({ k: b.provider + "|" + b.scheduledDate.getTime(), s: b.blockStartTime, e: b.endTime, l: "booking " + b._id })),
  ...unavDocs.map((u) => ({ k: u.provider + "|" + u.date.getTime(), s: u.startTime, e: u.endTime, l: "unavailability " + u._id })),
];
for (let i = 0; i < busy.length; i++) for (let j = i + 1; j < busy.length; j++)
  check(!(busy[i].k === busy[j].k && busy[i].s < busy[j].e && busy[j].s < busy[i].e), `overlap: ${busy[i].l} vs ${busy[j].l}`);
for (const b of bookings.filter((x) => x.status !== "cancelled"))
  check(db.bookings.countDocuments({ _id: { $nin: ourIds }, provider: b.provider, scheduledDate: b.scheduledDate, status: { $ne: "cancelled" },
    blockStartTime: { $lt: b.endTime }, endTime: { $gt: b.blockStartTime } }) === 0, `booking ${b._id} clashes with an existing booking in your DB`);

// ---------- Write (re-runnable) ----------
db.orders.deleteMany({ _id: { $in: orders.map((d) => d._id) } });
db.payments.deleteMany({ _id: { $in: payments.map((d) => d._id) } });
db.bookings.deleteMany({ _id: { $in: ourIds } });
db.reviews.deleteMany({ booking: { $in: ourIds } });
db.unavailabilities.deleteMany({ _id: { $in: unavDocs.map((d) => d._id) } });

db.orders.insertMany(orders);
db.payments.insertMany(payments);
db.bookings.insertMany(bookings);
db.reviews.insertMany(reviews);
db.unavailabilities.insertMany(unavDocs);

// ---------- Recalculate ratings from ALL reviews (services + providers) ----------
const svcIds = Object.values(svc).map((s) => s._id), provIds = Object.values(prov).map((p) => p._id);
db.services.updateMany({ _id: { $in: svcIds } }, { $set: { rating: 0, reviewCount: 0 } });
db.providers.updateMany({ _id: { $in: provIds } }, { $set: { rating: 0, ratingCount: 0 } });
const r1 = (x) => Math.round(x * 10) / 10;
db.reviews.aggregate([{ $match: { service: { $in: svcIds } } }, { $group: { _id: "$service", avg: { $avg: "$rating" }, n: { $sum: 1 } } }])
  .forEach((r) => db.services.updateOne({ _id: r._id }, { $set: { rating: r1(r.avg), reviewCount: r.n, updatedAt: now } }));
db.reviews.aggregate([{ $match: { provider: { $in: provIds } } }, { $group: { _id: "$provider", avg: { $avg: "$rating" }, n: { $sum: 1 } } }])
  .forEach((r) => db.providers.updateOne({ _id: r._id }, { $set: { rating: r1(r.avg), ratingCount: r.n, updatedAt: now } }));

// ---------- Summary ----------
print("Orders:", orders.length, "| Payments:", payments.length, "| Bookings:", bookings.length,
      "| Reviews:", reviews.length, "| Unavailabilities:", unavDocs.length);
print("Revenue split by booking status (paise):");
printjson(db.bookings.aggregate([{ $match: { _id: { $in: ourIds } } },
  { $group: { _id: "$status", bookings: { $sum: 1 }, price: { $sum: "$price" }, platform: { $sum: "$platformShare" }, provider: { $sum: "$providerShare" } } }]).toArray());
print("Service ratings:");
printjson(db.services.find({ _id: { $in: svcIds } }, { name: 1, rating: 1, reviewCount: 1 }).toArray());
print("Provider ratings:");
printjson(db.providers.find({ _id: { $in: provIds } }, { rating: 1, ratingCount: 1 }).toArray());