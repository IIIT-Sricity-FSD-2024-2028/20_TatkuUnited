const now = new Date();
const oid = (n) => new ObjectId("665f0000000000000000" + String(n).padStart(4, "0"));

// ---------- CATEGORIES (ids 4001-4004) ----------
const cat = { cleaning: oid(4001), plumbing: oid(4002), electrical: oid(4003), appliance: oid(4004) };

db.categories.deleteMany({ _id: { $in: Object.values(cat) } });
db.categories.insertMany([
  { _id: cat.cleaning,   name: "Cleaning",         description: "Home and bathroom cleaning services",  imageUrl: "https://example.com/images/cleaning.jpg",   isActive: true },
  { _id: cat.plumbing,   name: "Plumbing",         description: "Tap, pipe and leakage repair",         imageUrl: "https://example.com/images/plumbing.jpg",   isActive: true },
  { _id: cat.electrical, name: "Electrical",       description: "Wiring, fan and switchboard repair",   imageUrl: "https://example.com/images/electrical.jpg", isActive: true },
  { _id: cat.appliance,  name: "Appliance Repair", description: "AC and washing machine service",       imageUrl: "https://example.com/images/appliance.jpg",  isActive: true },
].map((d) => ({ ...d, createdAt: now, updatedAt: now })));

// ---------- SERVICES (ids 5001-5008) ----------
// price in paise, duration in minutes
const svc = (n, name, category, description, rupees, duration, covered, notCovered) => ({
  _id: oid(n),
  name,
  category,
  description,
  price: rupees * 100,
  duration,
  reviewCount: 0,
  rating: 0,
  isActive: true,
  imageUrls: [`https://example.com/images/service-${n}.jpg`],
  whatIsCovered: covered,
  whatIsNotCovered: notCovered,
  howItWorks: [
    { title: "Book a slot",       desc: "Pick a date and time that suits you." },
    { title: "Provider arrives",  desc: "A verified professional reaches your address on time." },
    { title: "Service completed", desc: "Work is done and you pay securely online." },
  ],
  faq: [
    { question: "Do I need to arrange any tools?",   answer: "No, the provider brings all required tools." },
    { question: "Can I reschedule or cancel?",       answer: "Yes, before the provider is on the way." },
  ],
});

const services = [
  svc(5001, "Home Deep Cleaning",      cat.cleaning,   "Full home deep cleaning including floors and kitchen.", 1499, 180,
      ["Floor scrubbing", "Kitchen cleaning", "Dusting"], ["Wall painting", "Pest control"]),
  svc(5002, "Bathroom Cleaning",       cat.cleaning,   "Thorough cleaning of one bathroom.", 499, 60,
      ["Tiles and floor", "Toilet and sink"], ["Plumbing repairs"]),
  svc(5003, "Tap Repair",              cat.plumbing,   "Repair or replacement of a leaking tap.", 299, 45,
      ["Tap inspection", "Washer replacement"], ["New tap cost"]),
  svc(5004, "Pipe Leak Fix",           cat.plumbing,   "Detect and fix a minor pipe leak.", 599, 60,
      ["Leak detection", "Minor joint sealing"], ["Wall breaking", "Major pipe replacement"]),
  svc(5005, "Fan Repair",              cat.electrical, "Ceiling or table fan repair.", 349, 45,
      ["Fan inspection", "Capacitor and regulator check"], ["New fan cost"]),
  svc(5006, "Switchboard Repair",      cat.electrical, "Repair of a faulty switch or socket.", 399, 45,
      ["Switch inspection", "Socket replacement labour"], ["Rewiring"]),
  svc(5007, "AC Service",              cat.appliance,  "Split AC cleaning and basic service.", 699, 60,
      ["Filter cleaning", "Indoor unit wash", "Gas pressure check"], ["Gas refilling", "Spare parts"]),
  svc(5008, "Washing Machine Repair",  cat.appliance,  "Diagnosis and repair of a washing machine.", 549, 60,
      ["Diagnosis", "Minor repairs"], ["Spare parts", "Motor replacement"]),
];

db.services.deleteMany({ _id: { $in: services.map((s) => s._id) } });
db.services.insertMany(services.map((s) => ({ ...s, createdAt: now, updatedAt: now })));

print("Categories:", db.categories.countDocuments(), "| Services:", db.services.countDocuments());