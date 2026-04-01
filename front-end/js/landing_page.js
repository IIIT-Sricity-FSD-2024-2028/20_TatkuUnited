/* ── MAINTENANCE MODE ── */
function getPlatformSettings() {
  if (window.AppStore && typeof AppStore.getPlatformSettings === "function") {
    return AppStore.getPlatformSettings();
  }
  return null;
}

function setMaintenanceLinkState(active) {
  const blockers = [
    "a[href*='auth_pages/register.html']",
    "a[href*='service_pages/service_discovery.html']",
    "a[href*='service_pages/service_page.html']",
  ];

  if (!active) return;

  const message =
    "Maintenance mode is active. New registrations and bookings are temporarily unavailable.";

  document.querySelectorAll(blockers.join(",")).forEach((el) => {
    el.classList.add("maintenance-disabled-link");
    el.setAttribute("aria-disabled", "true");
    el.setAttribute("title", message);
    el.addEventListener("click", (evt) => {
      evt.preventDefault();
    });
  });
}

function renderMaintenanceBanner() {
  const settings = getPlatformSettings();
  const active = !!(settings && settings.maintenanceMode);
  const fromQuery =
    new URLSearchParams(window.location.search).get("maintenance") === "1";

  if (!active && !fromQuery) return;

  const existing = document.getElementById("maintenance-banner");
  if (existing) return;

  const banner = document.createElement("div");
  banner.id = "maintenance-banner";
  banner.className = "maintenance-banner";
  banner.innerHTML = `
    <div class="maintenance-banner-title">Scheduled Maintenance In Progress</div>
    <div class="maintenance-banner-text">The platform is temporarily unavailable for new bookings and account creation. Super User admins can still sign in to resume operations.</div>
  `;

  document.body.prepend(banner);
  document.body.classList.add("maintenance-mode");

  const applyMaintenanceOffset = () => {
    const h = banner.offsetHeight || 0;
    document.documentElement.style.setProperty(
      "--maintenance-offset",
      `${h}px`,
    );
  };

  applyMaintenanceOffset();
  window.addEventListener("resize", applyMaintenanceOffset);

  setMaintenanceLinkState(true);
}

function renderDynamicServices() {
  const servicesGrid = document.getElementById("servicesGrid");
  if (!servicesGrid) return;

  const allServices = AppStore.getTable("services") || [];
  const allCategories = AppStore.getTable("categories") || [];
  const allAssignments = AppStore.getTable("job_assignments") || [];
  const allBookingServices = AppStore.getTable("booking_services") || [];

  // Compute live real-time stats (just like service_discovery.js)
  const assignmentByBooking = new Map(allAssignments.map(a => [a.booking_id, a]));
  const statsByService = new Map();
  
  allBookingServices.forEach(bs => {
    let bucket = statsByService.get(bs.service_id);
    if (!bucket) {
      bucket = { bookingCount: 0, ratings: [] };
      statsByService.set(bs.service_id, bucket);
    }
    bucket.bookingCount += Number(bs.quantity) || 1;
    
    // Check if the assignment has a score
    const assignment = assignmentByBooking.get(bs.booking_id);
    if (assignment && typeof assignment.assignment_score === "number") {
      bucket.ratings.push(assignment.assignment_score);
    }
  });

  const availableServices = allServices.filter(s => s.is_available);

  // Sort dynamically by computed average rating & booking counts
  availableServices.sort((a, b) => {
    const aStats = statsByService.get(a.service_id) || { ratings: [], bookingCount: 0 };
    const bStats = statsByService.get(b.service_id) || { ratings: [], bookingCount: 0 };

    const aRating = aStats.ratings.length ? aStats.ratings.reduce((x, y) => x + y, 0) / aStats.ratings.length : (a.average_rating || 0);
    const bRating = bStats.ratings.length ? bStats.ratings.reduce((x, y) => x + y, 0) / bStats.ratings.length : (b.average_rating || 0);

    if (Math.abs(bRating - aRating) > 0.01) return bRating - aRating;
    return (bStats.bookingCount || 0) - (aStats.bookingCount || 0);
  });

  const catIcons = {
    "CAT001": "🧹",
    "CAT002": "🔧",
    "CAT003": "⚡",
    "CAT004": "🪚",
    "CAT005": "❄️",
    "CAT006": "🦟"
  };

  const top6 = availableServices.slice(0, 6);

  servicesGrid.innerHTML = top6.map((svc, i) => {
    const icon = catIcons[svc.category_id] || "⭐";
    
    // Final dynamic rating calculation for display
    const stats = statsByService.get(svc.service_id) || { ratings: [], bookingCount: 0 };
    const computedRating = stats.ratings.length ? stats.ratings.reduce((x, y) => x + y, 0) / stats.ratings.length : (svc.average_rating || 4.8);
    
    const rating = computedRating.toFixed(1);
    
    // Combining real bookings + mock base ratings for total count
    const reviews = stats.ratings.length + (svc.rating_count || 0);
    const reviewsText = reviews > 1000 ? (reviews / 1000).toFixed(1) + 'k reviews' : reviews + ' review' + (reviews === 1 ? '' : 's');

    return `
        <a
          href="service_pages/service_page.html?serviceId=${encodeURIComponent(svc.service_id)}"
          class="service-card reveal reveal-delay-${(i % 3) + 1}"
        >
          <div class="service-icon-wrap">${icon}</div>
          <div class="service-name">${svc.service_name}</div>
          <div class="service-rating">
            <span class="star">★</span> ${rating}
            <span style="color: var(--silver)">(${reviewsText})</span>
          </div>
          <div class="service-price">From ₹${svc.base_price}</div>
        </a>
    `;
  }).join("");

  // Re-observe new cards for scroll reveal & events
  document.querySelectorAll("#servicesGrid .service-card").forEach((card) => {
    if (typeof observer !== "undefined") observer.observe(card);

    // Cursor hover
    card.addEventListener("mouseenter", () => {
      if (typeof ring !== "undefined") {
        ring.style.transform = "translate(-50%,-50%) scale(1.6)";
        ring.style.opacity = "0.3";
      }
      card.style.transition = "box-shadow 0.3s, border-color 0.3s";
    });
    card.addEventListener("mouseleave", () => {
      if (typeof ring !== "undefined") {
        ring.style.transform = "translate(-50%,-50%) scale(1)";
        ring.style.opacity = "0.5";
      }
      card.style.transform = "";
      card.style.transition = "all 0.4s cubic-bezier(0.34,1.56,0.64,1)";
    });

    // 3D Tilt
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotX = (-y / rect.height) * 12;
      const rotY = (x / rect.width) * 12;
      card.style.transform = `translateY(-12px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
    });
  });
}

AppStore.ready.then(() => {
  renderMaintenanceBanner();
  renderDynamicServices();
});

/* ── CURSOR ── */
const cursor = document.getElementById("cursor");
const ring = document.getElementById("cursorRing");
let mx = 0,
  my = 0,
  rx = 0,
  ry = 0;
document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
});
const animCursor = () => {
  cursor.style.left = mx + "px";
  cursor.style.top = my + "px";
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + "px";
  ring.style.top = ry + "px";
  requestAnimationFrame(animCursor);
};
animCursor();
document
  .querySelectorAll("a, button, .service-card, .testi-card")
  .forEach((el) => {
    el.addEventListener("mouseenter", () => {
      ring.style.transform = "translate(-50%,-50%) scale(1.6)";
      ring.style.opacity = "0.3";
    });
    el.addEventListener("mouseleave", () => {
      ring.style.transform = "translate(-50%,-50%) scale(1)";
      ring.style.opacity = "0.5";
    });
  });

/* ── NAVBAR ── */
const navbar = document.getElementById("navbar");
const progressBar = document.getElementById("progressBar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 30) navbar.classList.add("scrolled");
  else navbar.classList.remove("scrolled");
  const pct =
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  progressBar.style.width = pct + "%";
});

/* ── SCROLL REVEAL ── */
const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
);
reveals.forEach((r) => observer.observe(r));

/* ── COUNTER ── */
const counters = document.querySelectorAll("[data-count]");
const suffixes = { 10000: "k+", 500: "+", 98: "%", 6: "" };
const counterObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count);
      const suffix = suffixes[target] || "";
      let start = 0;
      const duration = 1600;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = Math.floor(eased * target);
        el.textContent =
          (target >= 1000 ? (val / 1000).toFixed(1) : val) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else
          el.textContent =
            (target >= 1000 ? (target / 1000).toFixed(0) : target) + suffix;
      };
      requestAnimationFrame(step);
      counterObs.unobserve(el);
    });
  },
  { threshold: 0.5 },
);
counters.forEach((c) => counterObs.observe(c));

/* ── PARTICLES ── */
const canvas = document.getElementById("particles-canvas");
const ctx = canvas.getContext("2d");
let W,
  H,
  particles = [];
const resize = () => {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
};
resize();
window.addEventListener("resize", resize);
for (let i = 0; i < 40; i++) {
  particles.push({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    alpha: Math.random() * 0.6 + 0.1,
  });
}
const animParticles = () => {
  ctx.clearRect(0, 0, W, H);
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H;
    if (p.y > H) p.y = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(37, 99, 235, ${ p.alpha })`;
    ctx.fill();
  });
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x,
        dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(37, 99, 235, ${ 0.08 * (1 - dist / 120) })`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(animParticles);
};
animParticles();

/* ── HERO CARD 3D PARALLAX ── */
const heroStack = document.getElementById("hero3dStack");
document.addEventListener("mousemove", (e) => {
  if (!heroStack) return;
  const xPct = (e.clientX / window.innerWidth - 0.5) * 2;
  const yPct = (e.clientY / window.innerHeight - 0.5) * 2;
  heroStack.style.transform = `rotateY(${- 6 + xPct * 8}deg) rotateX(${ 4 + yPct * -4 }deg)`;
  heroStack.style.transition = "transform 0.1s ease";
});

/* ── SERVICE CARDS 3D TILT ── */
// Handled dynamically in renderDynamicServices()

/* ── TESTI CARDS 3D TILT ── */
document.querySelectorAll(".testi-card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = (-y / rect.height) * 8;
    const rotY = (x / rect.width) * 8;
    card.style.transform = `translateY(-10px) rotateX(${ rotX }deg) rotateY(${ rotY }deg)`;
    card.style.transition = "box-shadow 0.1s, border-color 0.1s";
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
    card.style.transition = "all 0.4s cubic-bezier(0.34,1.56,0.64,1)";
  });
});

/* ── FLOW CARD 3D TILT ── */
const flowCard = document.querySelector(".flow-card");
if (flowCard) {
  flowCard.addEventListener("mousemove", (e) => {
    const rect = flowCard.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = (-y / rect.height) * 6;
    const rotY = (x / rect.width) * 6;
    flowCard.style.transform = `rotateX(${ rotX }deg) rotateY(${ rotY }deg) translateZ(8px)`;
    flowCard.style.transition = "none";
  });
  flowCard.addEventListener("mouseleave", () => {
    flowCard.style.transform = "";
    flowCard.style.transition =
      "transform 0.6s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s";
  });
}
