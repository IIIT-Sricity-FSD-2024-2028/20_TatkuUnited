const now = new Date();
const oid = (n) => new ObjectId("665f0000000000000000" + String(n).padStart(4, "0"));
const MIN = 60000, DAY = 86400000, IST = 330 * MIN;

const S = db.platformsettings.findOne();
if (!S) throw new Error("No platformsettings document found.");
const check = (cond, msg) => { if (!cond) throw new Error("Validation failed: " + msg); };

// Dates are midnight IST, shifted off Sundays (providers don't work Sundays)
const ist = new Date(now.getTime() + IST);
const todayMs = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST;
const workDay = (off) => { let o = off; while (new Date(todayMs + o * DAY + IST).getUTCDay() === 0) o++; return o; };

// customer id no -> cart items [serviceNo, dayOffset, startMinute]
const carts = {
  10: [[5003, 2, 600], [5005, 2, 660]],   // Robert: Tap Repair 10:00, Fan Repair 11:00 (same day)
  11: [[5007, 4, 840]],                    // Sophia: AC Service 14:00
};

for (const [cNo, items] of Object.entries(carts)) {
  const user = db.users.findOne({ _id: oid(Number(cNo)) });
  check(user && user.addresses.length, `customer ${cNo} (run seed-users.js)`);

  const cartItems = items.map(([sNo, off, start]) => {
    const s = db.services.findOne({ _id: oid(sNo) });
    check(s, `service ${sNo} (run seed-catalog.js)`);
    const o = workDay(off), date = new Date(todayMs + o * DAY), end = start + s.duration;
    check(start % S.slotIntervalMinutes === 0 && start >= S.firstSlotStart && start <= S.lastSlotStart, `cart start ${start} is not a valid slot`);
    check(date.getTime() + start * MIN - now.getTime() >= S.minLeadMinutes * MIN, "cart item violates minLeadMinutes");
    check(o <= S.bookingWindowDays, "cart item outside bookingWindowDays");
    return { service: s._id, scheduledDate: date, startTime: start, endTime: end };
  });

  // Items on the same day must not overlap (checkout assigns providers later)
  for (let i = 0; i < cartItems.length; i++) for (let j = i + 1; j < cartItems.length; j++)
    check(!(cartItems[i].scheduledDate.getTime() === cartItems[j].scheduledDate.getTime() &&
            cartItems[i].startTime < cartItems[j].endTime && cartItems[j].startTime < cartItems[i].endTime), "cart items overlap");

  db.users.updateOne({ _id: user._id },
    { $set: { "cart.address": user.addresses[0].id, "cart.items": cartItems, updatedAt: now } });
}

// ---------- Geo indexes (safe to re-run) ----------
db.users.createIndex({ "addresses.location": "2dsphere" });
db.providers.createIndex({ location: "2dsphere" });
db.managers.createIndex({ location: "2dsphere" });
db.regions.createIndex({ location: "2dsphere" });

print("Carts seeded:");
printjson(db.users.find({ "cart.items.0": { $exists: true } }, { name: 1, cart: 1 }).toArray());