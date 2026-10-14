const HASH = "$2b$10$vLm/SvybLDBJDeqcAIVJ.e5maui80NpaHv3QkA/VTYJtLDGQXp2bi";
const now = new Date();
const id = (n) => new ObjectId("665f0000000000000000" + String(n).padStart(4, "0"));

// [idNo, name, role, gender, phone, optional address]
const rows = [
  [1,  "John",    "admin",    "male",   "9100000001"],
  [2,  "Michael", "manager",  "male",   "9100000002"],
  [3,  "Sarah",   "manager",  "female", "9100000003"],
  [4,  "David",   "provider", "male",   "9100000004"],
  [5,  "James",   "provider", "male",   "9100000005"],
  [6,  "Emma",    "provider", "female", "9100000006"],
  [7,  "Daniel",  "provider", "male",   "9100000007"],
  [8,  "Olivia",  "customer", "female", "9100000008", { line: "12 Main Road",    city: "Bengaluru", coords: [77.5946, 12.9716] }],
  [9,  "Emily",   "customer", "female", "9100000009", { line: "45 Park Street",  city: "Bengaluru", coords: [77.6101, 12.9352] }],
  [10, "Robert",  "customer", "male",   "9100000010", { line: "78 Lake View",    city: "Bengaluru", coords: [77.5700, 12.9900] }],
  [11, "Sophia",  "customer", "female", "9100000011", { line: "9 Church Road",   city: "Bengaluru", coords: [77.6400, 12.9600] }],
];

const users = rows.map(([n, name, role, gender, phone, a]) => {
  const addrId = a ? `addr-${n}-home` : null;
  return {
    _id: id(n),
    name,
    email: `${name.toLowerCase()}@${role}.com`,
    password: HASH,
    gender,
    phone,
    role,
    status: "active",
    cart: { address: addrId, items: [] },
    addresses: a ? [{
      id: addrId, label: "Home", line: a.line, city: a.city,
      location: { type: "Point", coordinates: a.coords },
    }] : [],
    createdAt: now,
    updatedAt: now,
  };
});

db.users.deleteMany({ email: { $regex: /@(admin|manager|provider|customer)\.com$/ } });
db.users.insertMany(users);

print("Seeded users:", db.users.countDocuments({ email: { $regex: /\.com$/ } }));