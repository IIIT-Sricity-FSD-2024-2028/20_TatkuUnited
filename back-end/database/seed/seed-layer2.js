const now = new Date();
const oid = (n) => new ObjectId("665f0000000000000000" + String(n).padStart(4, "0"));
const pt = (lng, lat) => ({ type: "Point", coordinates: [lng, lat] });

// Sanity check: users from the previous seed must exist
const needed = [2, 3, 4, 5, 6, 7].map(oid);
if (db.users.countDocuments({ _id: { $in: needed } }) !== needed.length) {
  throw new Error("Seed users (…0002 to …0007) not found. Run seed-users.js first.");
}

// ---------- IDs ----------
const mgrId = { michael: oid(1001), sarah: oid(1002) };
const regId = { south: oid(2001), east: oid(2002) };
const provId = [oid(3001), oid(3002), oid(3003), oid(3004)];

// ---------- MANAGERS ----------
db.managers.deleteMany({ _id: { $in: Object.values(mgrId) } });
db.managers.insertMany([
  { _id: mgrId.michael, user: oid(2), salary: 4500000, razorpayAccountId: null,
    experience: 5, location: pt(77.5946, 12.9716), status: "active" },
  { _id: mgrId.sarah, user: oid(3), salary: 4500000, razorpayAccountId: null,
    experience: 4, location: pt(77.6400, 12.9600), status: "active" },
].map((d) => ({ ...d, createdAt: now, updatedAt: now })));

// ---------- REGIONS ----------
db.regions.deleteMany({ _id: { $in: Object.values(regId) } });
db.regions.insertMany([
  { _id: regId.south, name: "Bengaluru South", manager: mgrId.michael,
    location: pt(77.5946, 12.9716), isActive: true },
  { _id: regId.east, name: "Bengaluru East", manager: mgrId.sarah,
    location: pt(77.6400, 12.9600), isActive: true },
].map((d) => ({ ...d, createdAt: now, updatedAt: now })));

// ---------- PROVIDERS ----------
// Offered services are taken from your existing active services
const serviceIds = db.services.find({ isActive: true }, { _id: 1 }).toArray().map((s) => s._id);
if (serviceIds.length === 0) print("WARNING: no active services found, offeredServices will be empty.");

const base = { workHourStart: 480, workHourEnd: 1200, workingDays: [1, 2, 3, 4, 5, 6],
  status: "approved", rating: 0, ratingCount: 0, razorpayAccountId: null,
  offeredServices: serviceIds };

db.providers.deleteMany({ _id: { $in: provId } });
db.providers.insertMany([
  { _id: provId[0], user: oid(4), experience: 6, location: pt(77.5900, 12.9700), region: regId.south },
  { _id: provId[1], user: oid(5), experience: 3, location: pt(77.5800, 12.9650), region: regId.south },
  { _id: provId[2], user: oid(6), experience: 4, location: pt(77.6350, 12.9580), region: regId.east },
  { _id: provId[3], user: oid(7), experience: 2, location: pt(77.6450, 12.9650), region: regId.east },
].map((d) => ({ ...base, ...d, createdAt: now, updatedAt: now })));

// ---------- PLATFORM SETTINGS (only if empty) ----------
if (db.platformsettings.countDocuments() === 0) {
  db.platformsettings.insertOne({
    platformFeePercent: 20, maxAssignmentDistanceKm: 10, slotIntervalMinutes: 30,
    firstSlotStart: 480, lastSlotStart: 1170, bookingWindowDays: 3,
    minLeadMinutes: 120, travelBufferMinutes: 30, offerTimeoutMinutes: 10,
    createdAt: now, updatedAt: now,
  });
}

print("Managers:", db.managers.countDocuments(), "| Regions:", db.regions.countDocuments(),
      "| Providers:", db.providers.countDocuments(), "| Settings:", db.platformsettings.countDocuments());