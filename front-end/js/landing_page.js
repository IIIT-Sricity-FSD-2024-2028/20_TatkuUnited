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

function compactNumber(value) {
  const n = Math.max(0, Number(value) || 0);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(Math.round(n));
}

function parseScheduledDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const safeTime = (timeStr || "00:00").slice(0, 5);
  const dt = new Date(`${dateStr}T${safeTime}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function computeLandingMetrics() {
  const bookings = AppStore.getTable("bookings") || [];
  const customers = AppStore.getTable("customers") || [];
  const providers = AppStore.getTable("service_providers") || [];
  const categories = AppStore.getTable("categories") || [];
  const assignments = AppStore.getTable("job_assignments") || [];
  const bookingServices = AppStore.getTable("booking_services") || [];
  const services = AppStore.getTable("services") || [];

  const householdsServed =
    new Set(bookings.map((b) => b.customer_id).filter(Boolean)).size ||
    customers.filter((c) => c.is_active !== false).length;

  const activeProviders = providers.filter((p) => p.is_active !== false).length;
  const activeCategories = categories.filter((c) => c.is_active !== false).length;

  const scoredAssignments = assignments
    .map((a) => Number(a.assignment_score))
    .filter((score) => Number.isFinite(score));

  const overallRating = scoredAssignments.length
    ? scoredAssignments.reduce((sum, score) => sum + score, 0) /
      scoredAssignments.length
    : null;

  const satisfactionRate =
    typeof overallRating === "number"
      ? Math.max(0, Math.min(100, Math.round((overallRating / 5) * 100)))
      : null;

  const now = new Date();
  const upcoming = assignments
    .filter((a) => String(a.status || "").toUpperCase() === "ASSIGNED")
    .map((a) => ({
      row: a,
      when: parseScheduledDateTime(a.scheduled_date, a.hour_start),
    }))
    .filter((x) => x.when && x.when >= now)
    .sort((a, b) => a.when - b.when)[0];

  let upcomingBookingSubtitle = null;
  if (upcoming) {
    const bookingId = upcoming.row.booking_id;
    const bs = bookingServices.find((r) => r.booking_id === bookingId);
    const service = bs
      ? services.find((s) => s.service_id === bs.service_id)
      : null;

    const serviceName = service ? service.service_name : "Service";
    const dateLabel = upcoming.when.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const timeLabel = upcoming.when.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    upcomingBookingSubtitle = `${serviceName} • ${dateLabel}, ${timeLabel}`;
  }

  return {
    householdsServed,
    activeProviders,
    satisfactionRate,
    activeCategories,
    overallRating,
    starCount:
      typeof overallRating === "number"
        ? Math.max(1, Math.min(5, Math.round(overallRating)))
        : 0,
    currentYear: new Date().getFullYear(),
    upcomingBookingSubtitle,
  };
}

function getLandingContent() {
  const defaults = {
    meta: {
      pageTitle: "Tatku United - Reliable Home Services",
      brandName: "Tatku United",
      brandTagline:
        "Connecting you with trusted home service professionals.",
    },
    nav: {
      links: [
        { label: "Home", href: "#hero" },
        { label: "Services", href: "#services" },
        { label: "How It Works", href: "#how" },
        { label: "About", href: "#smarter" },
      ],
      loginLabel: "Login",
      getStartedLabel: "Get Started",
    },
    hero: {
      badge: "Home Services Platform",
      titlePrefix: "Reliable Home",
      titleAccent: "Delivered On Time",
      description:
        "Book trusted professionals for repairs, cleaning, and maintenance in just a few clicks. Quality service, guaranteed.",
      primaryCtaLabel: "Explore Services",
      secondaryCtaLabel: "How It Works",
      trustItems: [
        "Trusted by 10,000+ households",
        "Verified professionals",
        "Affordable and reliable",
      ],
      miniCards: [
        { icon: "🔧", text: "Expert Technician" },
        { icon: "⭐", text: "4.9 Rating" },
      ],
      floatingBadge: "✓ Service Confirmed",
      bookingCard: {
        title: "Service Booked",
        subtitle: "AC Repair • Tomorrow, 10 AM",
        rows: [
          { label: "Technician assigned", status: "✓ Confirmed" },
          { label: "Quality guaranteed", status: "✓ Insured" },
          { label: "Transparent pricing", status: "→ No hidden fees" },
        ],
      },
      ratingPill: {
        stars: "★★★★★",
        score: "4.9",
        label: "Customer rating",
      },
    },
    services: {
      label: "Our Services",
      title: "Popular Services",
      description:
        "Browse from a wide range of home services delivered by verified professionals.",
    },
    howItWorks: {
      label: "Simple Process",
      title: "How It Works",
      description: "Getting your home serviced is as easy as 1-2-3.",
      steps: [
        {
          stepNumber: "Step 01",
          icon: "🔍",
          title: "Browse Services",
          description:
            "Find the service you need from our curated list of trusted providers.",
        },
        {
          stepNumber: "Step 02",
          icon: "📅",
          title: "Book a Time Slot",
          description:
            "Choose a convenient date and time that works best for you.",
        },
        {
          stepNumber: "Step 03",
          icon: "✅",
          title: "Service Delivered",
          description:
            "A verified professional arrives and completes the job on time.",
        },
      ],
    },
    smarterWay: {
      flowLabel: "Our Collective System",
      flowSteps: [
        {
          icon: "👤",
          title: "Customer Request",
          subtitle: "You book a service",
        },
        {
          icon: "🤖",
          title: "Smart Assignment",
          subtitle: "System matches the best provider",
        },
        {
          icon: "🏠",
          title: "Service Delivered",
          subtitle: "Reliable, on-time completion",
        },
      ],
      rightLabel: "Why We're Different",
      title: "A Smarter Way to Deliver Services",
      description:
        "Unlike traditional platforms, Tatku United automatically assigns service providers from trusted collectives, ensuring reliable scheduling and fair work distribution.",
      features: [
        "Automated provider matching for faster service",
        "Fair workload distribution across professionals",
        "Quality guaranteed through collective accountability",
      ],
    },
    stats: [
      { value: 10000, label: "Households Served", suffix: "k+" },
      { value: 500, label: "Verified Professionals", suffix: "+" },
      { value: 98, label: "Satisfaction Rate %", suffix: "%" },
      { value: 6, label: "Service Categories", suffix: "" },
    ],
    testimonials: {
      label: "Testimonials",
      title: "What Our Customers Say",
      items: [
        {
          stars: 5,
          text:
            "Very smooth booking experience and the technician arrived exactly on time. We will definitely use again.",
          name: "Sarah Johnson",
          role: "AC Repair Customer",
          avatar: "SJ",
        },
        {
          stars: 5,
          text:
            "Excellent plumbing service. The professional was knowledgeable and fixed the issue quickly. Great value.",
          name: "Michael Chen",
          role: "Plumbing Customer",
          avatar: "MC",
        },
        {
          stars: 5,
          text:
            "I love how easy it is to book services. The cleaning team was thorough and my apartment has never looked better.",
          name: "Priya Sharma",
          role: "Home Cleaning Customer",
          avatar: "PS",
        },
      ],
    },
    cta: {
      title: "Book Your First Service Today",
      description:
        "Join thousands of happy customers who trust Tatku United for reliable, affordable home services.",
      buttonLabel: "Get Started",
    },
    footer: {
      servicesTitle: "Services",
      companyTitle: "Company",
      companyLinks: [
        { label: "Terms of Service", href: "legal/terms-of-service.html" },
        { label: "Privacy Policy", href: "legal/privacy-policy.html" },
      ],
      bottomLeft: "© 2026 Tatku United. All rights reserved.",
      bottomRight: "Made with ♥ for homeowners",
    },
  };

  const data =
    window.AppStore && AppStore.data && AppStore.data.landing_page_content
      ? AppStore.data.landing_page_content
      : {};

  return {
    ...defaults,
    ...data,
  };
}

function renderLandingContent() {
  const content = getLandingContent();
  const metrics = computeLandingMetrics();

  document.title = content.meta?.pageTitle || document.title;

  const navLogo = document.querySelector("#navbar .nav-logo");
  if (navLogo) {
    navLogo.innerHTML = `<div class="nav-logo-icon">TU</div>${content.meta?.brandName || "Tatku United"}`;
  }

  const navLinks = document.querySelector("#navbar .nav-links");
  if (navLinks && Array.isArray(content.nav?.links)) {
    navLinks.innerHTML = content.nav.links
      .map((link) => `<li><a href="${link.href}">${link.label}</a></li>`)
      .join("");
  }

  const loginBtn = document.querySelector("#navbar .btn-ghost");
  const getStartedBtn = document.querySelector("#navbar .btn-primary");
  if (loginBtn) loginBtn.textContent = content.nav?.loginLabel || "Login";
  if (getStartedBtn)
    getStartedBtn.textContent = content.nav?.getStartedLabel || "Get Started";

  const heroBadge = document.querySelector("#hero .hero-badge");
  const heroTitle = document.querySelector("#hero .hero-title");
  const heroDesc = document.querySelector("#hero .hero-desc");
  if (heroBadge) heroBadge.textContent = content.hero?.badge || "";
  if (heroTitle) {
    heroTitle.innerHTML = `${content.hero?.titlePrefix || ""}<br />Services, <span class="accent">${content.hero?.titleAccent || ""}</span>`;
  }
  if (heroDesc) heroDesc.textContent = content.hero?.description || "";

  const heroPrimaryBtn = document.querySelector("#hero .btn-hero");
  const heroSecondaryBtn = document.querySelector("#hero .btn-hero-ghost");
  if (heroPrimaryBtn && heroPrimaryBtn.childNodes.length > 1) {
    heroPrimaryBtn.lastChild.textContent = ` ${content.hero?.primaryCtaLabel || "Explore Services"}`;
  }
  if (heroSecondaryBtn && heroSecondaryBtn.childNodes.length > 1) {
    heroSecondaryBtn.firstChild.textContent = `${content.hero?.secondaryCtaLabel || "How It Works"} `;
  }

  const trustWrap = document.querySelector("#hero .hero-trust");
  const dynamicTrustItems = [
    `Trusted by ${compactNumber(metrics.householdsServed)} households`,
    `${metrics.activeProviders} active professionals`,
    typeof metrics.satisfactionRate === "number"
      ? `${metrics.satisfactionRate}% satisfaction score`
      : "N/A satisfaction score",
  ];
  if (trustWrap) {
    trustWrap.innerHTML = dynamicTrustItems
      .map((item) => `<div class="trust-item">${item}</div>`)
      .join("");
  }

  const miniCards = document.querySelectorAll("#hero .hero-mini-card");
  if (Array.isArray(content.hero?.miniCards)) {
    miniCards.forEach((card, i) => {
      const item = content.hero.miniCards[i];
      if (!item) return;
      const dynamicText =
        i === 1
          ? `${typeof metrics.overallRating === "number" ? metrics.overallRating.toFixed(1) : "N/A"} Rating`
          : item.text || "";
      card.innerHTML = `<div class="mini-icon">${item.icon || ""}</div>${dynamicText}`;
    });
  }

  const floatingBadge = document.querySelector("#hero .floating-badge");
  if (floatingBadge)
    floatingBadge.textContent = content.hero?.floatingBadge || floatingBadge.textContent;

  const bookingTitle = document.querySelector("#hero .booking-title");
  const bookingSub = document.querySelector("#hero .booking-sub");
  if (bookingTitle)
    bookingTitle.textContent = content.hero?.bookingCard?.title || bookingTitle.textContent;
  if (bookingSub)
    bookingSub.textContent =
      metrics.upcomingBookingSubtitle ||
      content.hero?.bookingCard?.subtitle ||
      bookingSub.textContent;

  const bookingRows = document.querySelectorAll("#hero .booking-row");
  if (Array.isArray(content.hero?.bookingCard?.rows)) {
    bookingRows.forEach((row, i) => {
      const rowData = content.hero.bookingCard.rows[i];
      if (!rowData) return;
      const label = row.querySelector(".booking-label");
      const status = row.querySelector(".status-badge");
      if (label) label.textContent = rowData.label || "";
      if (status) status.textContent = rowData.status || "";
    });
  }

  const ratingStars = document.querySelector("#hero .rating-stars");
  const ratingPillScore = document.querySelector("#hero .rating-pill span:nth-child(2)");
  const ratingPillLabel = document.querySelector("#hero .rating-pill span:nth-child(3)");
  if (ratingStars) {
    ratingStars.textContent = metrics.starCount > 0 ? "★".repeat(metrics.starCount) : "N/A";
  }
  if (ratingPillScore)
    ratingPillScore.textContent =
      typeof metrics.overallRating === "number"
        ? metrics.overallRating.toFixed(1)
        : "N/A";
  if (ratingPillLabel)
    ratingPillLabel.textContent = content.hero?.ratingPill?.label || "Customer rating";

  const servicesHeader = document.querySelector("#services .section-header");
  if (servicesHeader) {
    const label = servicesHeader.querySelector(".section-label");
    const title = servicesHeader.querySelector(".section-title");
    const desc = servicesHeader.querySelector(".section-desc");
    if (label) label.textContent = content.services?.label || "";
    if (title) title.textContent = content.services?.title || "";
    if (desc) desc.textContent = content.services?.description || "";
  }

  const howHeader = document.querySelector("#how .section-header");
  if (howHeader) {
    const label = howHeader.querySelector(".section-label");
    const title = howHeader.querySelector(".section-title");
    const desc = howHeader.querySelector(".section-desc");
    if (label) label.textContent = content.howItWorks?.label || "";
    if (title) title.textContent = content.howItWorks?.title || "";
    if (desc) desc.textContent = content.howItWorks?.description || "";
  }

  const stepsRow = document.querySelector("#how .steps-row");
  if (stepsRow && Array.isArray(content.howItWorks?.steps)) {
    stepsRow.innerHTML = content.howItWorks.steps
      .map(
        (step, i) => `
        <div class="step-card reveal reveal-delay-${(i % 3) + 1}">
          <div class="step-num">Step ${String(i + 1).padStart(2, "0")}</div>
          <div class="step-icon">${step.icon || ""}</div>
          <div class="step-title">${step.title || ""}</div>
          <p class="step-desc">${step.description || ""}</p>
        </div>
      `,
      )
      .join("");
  }

  const flowCard = document.querySelector("#smarter .flow-card");
  if (flowCard) {
    const flowLabel = flowCard.querySelector(".flow-label");
    if (flowLabel)
      flowLabel.textContent = content.smarterWay?.flowLabel || flowLabel.textContent;
    if (Array.isArray(content.smarterWay?.flowSteps)) {
      const flowSteps = flowCard.querySelectorAll(".flow-step");
      flowSteps.forEach((stepEl, i) => {
        const step = content.smarterWay.flowSteps[i];
        if (!step) return;
        const icon = stepEl.querySelector(".flow-step-icon");
        const title = stepEl.querySelector(".flow-step-text");
        const sub = stepEl.querySelector(".flow-step-sub");
        if (icon) icon.textContent = step.icon || "";
        if (title) title.textContent = step.title || "";
        if (sub) sub.textContent = step.subtitle || "";
      });
    }
  }

  const smarterRight = document.querySelector("#smarter .smarter-right");
  if (smarterRight) {
    const label = smarterRight.querySelector(".section-label");
    const title = smarterRight.querySelector(".section-title");
    const desc = smarterRight.querySelector("p");
    const featuresWrap = smarterRight.querySelector(".smarter-features");
    if (label) label.textContent = content.smarterWay?.rightLabel || label.textContent;
    if (title) title.textContent = content.smarterWay?.title || title.textContent;
    if (desc)
      desc.textContent = content.smarterWay?.description || desc.textContent;
    if (featuresWrap && Array.isArray(content.smarterWay?.features)) {
      featuresWrap.innerHTML = content.smarterWay.features
        .map(
          (feature) => `
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text">${feature}</div>
          </div>
        `,
        )
        .join("");
    }
  }

  const statsRow = document.querySelector(".stats-row");
  const dynamicStats = [
    {
      value: metrics.householdsServed,
      label: "Households Served",
      suffix: metrics.householdsServed >= 1000 ? "k+" : "+",
    },
    {
      value: metrics.activeProviders,
      label: "Active Professionals",
      suffix: "+",
    },
    {
      value: metrics.satisfactionRate,
      label: "Satisfaction Rate",
      suffix: "%",
    },
    {
      value: metrics.activeCategories,
      label: "Service Categories",
      suffix: "",
    },
  ];
  if (statsRow) {
    statsRow.innerHTML = dynamicStats
      .map(
        (stat, i) => `
        <div class="stat-item reveal reveal-delay-${Math.min(i + 1, 4)}">
          <span class="stat-num" data-count="${Number(stat.value) || 0}" data-suffix="${stat.suffix || ""}">0</span>
          <div class="stat-label">${stat.label || ""}</div>
        </div>
      `,
      )
      .join("");
  }

  const testimonialHeader = document.querySelector("#testimonials .section-header");
  if (testimonialHeader) {
    const label = testimonialHeader.querySelector(".section-label");
    const title = testimonialHeader.querySelector(".section-title");
    if (label) label.textContent = content.testimonials?.label || label.textContent;
    if (title) title.textContent = content.testimonials?.title || title.textContent;
  }

  const testiGrid = document.querySelector("#testimonials .testi-grid");
  if (testiGrid && Array.isArray(content.testimonials?.items)) {
    testiGrid.innerHTML = content.testimonials.items
      .map(
        (item, i) => `
        <div class="testi-card reveal reveal-delay-${(i % 3) + 1}">
          <div class="testi-stars">${"★".repeat(Number(item.stars) || 5)}</div>
          <p class="testi-text">"${item.text || ""}"</p>
          <div class="testi-author">
            <div class="testi-avatar">${item.avatar || ""}</div>
            <div>
              <div class="testi-name">${item.name || ""}</div>
              <div class="testi-role">${item.role || ""}</div>
            </div>
          </div>
        </div>
      `,
      )
      .join("");
  }

  const ctaTitle = document.querySelector("#cta .cta-title");
  const ctaDesc = document.querySelector("#cta .cta-desc");
  const ctaBtn = document.querySelector("#cta .btn-cta");
  if (ctaTitle) ctaTitle.textContent = content.cta?.title || ctaTitle.textContent;
  if (ctaDesc)
    ctaDesc.textContent = content.cta?.description || ctaDesc.textContent;
  if (ctaBtn && ctaBtn.firstChild) {
    ctaBtn.firstChild.textContent = `${content.cta?.buttonLabel || "Get Started"} `;
  }

  const footerBrand = document.querySelector("footer .footer-brand .nav-logo");
  const footerTagline = document.querySelector("footer .footer-tagline");
  if (footerBrand) {
    footerBrand.innerHTML = `<div class="nav-logo-icon">TU</div>${content.meta?.brandName || "Tatku United"}`;
  }
  if (footerTagline)
    footerTagline.textContent =
      content.meta?.brandTagline || footerTagline.textContent;

  const footerCols = document.querySelectorAll("footer .footer-grid > div");
  const servicesCol = footerCols[1];
  const companyCol = footerCols[2];

  if (servicesCol) {
    const title = servicesCol.querySelector(".footer-col-title");
    const links = servicesCol.querySelector(".footer-links");
    if (title)
      title.textContent = content.footer?.servicesTitle || "Services";
    if (links) {
      const categories = (AppStore.getTable("categories") || [])
        .filter((cat) => cat.is_active)
        .slice(0, 4);
      links.innerHTML = categories
        .map(
          (cat) =>
            `<li><a href="service_pages/category_page.html?categoryId=${encodeURIComponent(cat.category_id)}">${cat.category_name}</a></li>`,
        )
        .join("");
    }
  }

  if (companyCol) {
    const title = companyCol.querySelector(".footer-col-title");
    const links = companyCol.querySelector(".footer-links");
    if (title)
      title.textContent = content.footer?.companyTitle || "Company";
    if (links && Array.isArray(content.footer?.companyLinks)) {
      links.innerHTML = content.footer.companyLinks
        .map((link) => `<li><a href="${link.href}">${link.label}</a></li>`)
        .join("");
    }
  }

  const footerBottom = document.querySelectorAll("footer .footer-bottom span");
  const dynamicBottomLeft = (content.footer?.bottomLeft || "")
    .replace(/\b20\d{2}\b/, String(metrics.currentYear));
  if (footerBottom[0])
    footerBottom[0].textContent =
      dynamicBottomLeft || footerBottom[0].textContent;
  if (footerBottom[1])
    footerBottom[1].textContent =
      content.footer?.bottomRight || footerBottom[1].textContent;

  observeReveals();
  observeCounters();
  bindTestimonialTilt();
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

    const aRating = aStats.ratings.length
      ? aStats.ratings.reduce((x, y) => x + y, 0) / aStats.ratings.length
      : -1;
    const bRating = bStats.ratings.length
      ? bStats.ratings.reduce((x, y) => x + y, 0) / bStats.ratings.length
      : -1;

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
    const hasRating = stats.ratings.length > 0;
    const computedRating = hasRating
      ? stats.ratings.reduce((x, y) => x + y, 0) / stats.ratings.length
      : null;
    const rating = hasRating ? computedRating.toFixed(1) : 'N/A';
    const reviewsText = hasRating
      ? stats.ratings.length + ' review' + (stats.ratings.length === 1 ? '' : 's')
      : 'N/A';

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
  renderLandingContent();
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
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
);

function observeReveals() {
  document.querySelectorAll(".reveal").forEach((r) => observer.observe(r));
}

observeReveals();

/* ── COUNTER ── */
const counterObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || "";
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

function observeCounters() {
  document.querySelectorAll("[data-count]").forEach((c) => counterObs.observe(c));
}

observeCounters();

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
function bindTestimonialTilt() {
  document.querySelectorAll(".testi-card").forEach((card) => {
    if (card.dataset.tiltBound === "1") return;
    card.dataset.tiltBound = "1";

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotX = (-y / rect.height) * 8;
      const rotY = (x / rect.width) * 8;
      card.style.transform = `translateY(-10px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      card.style.transition = "box-shadow 0.1s, border-color 0.1s";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.transition = "all 0.4s cubic-bezier(0.34,1.56,0.64,1)";
    });
  });
}

bindTestimonialTilt();

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
