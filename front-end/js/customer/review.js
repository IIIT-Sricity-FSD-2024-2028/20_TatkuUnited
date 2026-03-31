function getCustomerSessionId() {
  const session = Auth.getSession();
  return session && session.role === "customer" ? session.id : null;
}
function getCart() {
  const customerId = getCustomerSessionId();
  if (!customerId || !window.CustomerState) return [];
  return CustomerState.getCart(customerId);
}
function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "grid" : "none";
  });
}

let currentRating = 4;

function setRating(val) {
  currentRating = val;
  document
    .querySelectorAll(".star")
    .forEach((s) =>
      s.classList.toggle("active", parseInt(s.dataset.val) <= val),
    );
}

function updateServiceRatingsFromReviews() {
  const allReviews = AppStore.getTable("reviews") || [];
  const allServices = AppStore.getTable("services") || [];

  const reviewsByService = {};
  allReviews.forEach((review) => {
    if (!reviewsByService[review.service_id]) {
      reviewsByService[review.service_id] = [];
    }
    reviewsByService[review.service_id].push(review.rating);
  });

  allServices.forEach((service) => {
    if (
      reviewsByService[service.service_id] &&
      reviewsByService[service.service_id].length > 0
    ) {
      const ratings = reviewsByService[service.service_id];
      const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      service.rating = Math.round(average * 100) / 100;
      service.rating_count = ratings.length;
    }
  });

  AppStore.save();
}
function updateCharCount() {
  document.getElementById("char-count").textContent =
    `${document.getElementById("review-text").value.length} / 500 characters`;
}
function previewPhotos(input) {
  const slots = ["slot-1", "slot-2", "slot-3"];
  Array.from(input.files)
    .slice(0, 3)
    .forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const s = document.getElementById(slots[i]);
        if (s) s.innerHTML = `<img src="${e.target.result}" alt="preview"/>`;
      };
      reader.readAsDataURL(file);
    });
}

const suggestions = [
  {
    name: "Oven Deep Clean",
    bg: "#fef3c7",
    icon: `<svg viewBox="0 0 24 24" style="stroke:#d97706"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 8h.01M12 8h.01M17 8h.01"/></svg>`,
  },
  {
    name: "Fridge Sanitizing",
    bg: "#fef3c7",
    icon: `<svg viewBox="0 0 24 24" style="stroke:#f59e0b"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M10 6v2M10 14v4"/></svg>`,
  },
  {
    name: "Full Kitchen",
    bg: "#eff6ff",
    icon: `<svg viewBox="0 0 24 24" style="stroke:#3b82f6"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
  },
];

function renderNeed() {
  document.getElementById("need-grid").innerHTML = suggestions
    .map(
      (s) => `
    <div class="need-card" onclick="window.location='schedule.html?service=${encodeURIComponent(s.name)}'">
      <div class="need-card-icon" style="background:${s.bg}">${s.icon}</div>
      <span class="need-card-name">${s.name}</span>
    </div>
  `,
    )
    .join("");
}
function renderSuccessSuggestions() {
  document.getElementById("success-suggestions").innerHTML = suggestions
    .map(
      (s) => `
    <div class="sugg-card" onclick="window.location='schedule.html?service=${encodeURIComponent(s.name)}'">
      <div class="sugg-icon" style="background:${s.bg}">${s.icon}</div>
      <span class="sugg-name">${s.name}</span>
    </div>
  `,
    )
    .join("");
}

function submitReview() {
  const session = Auth.getSession();
  if (!session) {
    showToast("You must be logged in to submit a review.", "error");
    return;
  }

  const reviewText = document.getElementById("review-text").value.trim();
  if (!reviewText) {
    showToast("Please write a review before submitting.", "error");
    return;
  }

  const serviceId = sessionStorage.getItem("review_service_id");
  const bookingId = sessionStorage.getItem("review_booking_id");

  if (!serviceId) {
    showToast(
      "Service information is missing. Please try again from your bookings.",
      "error",
    );
    return;
  }

  const reviewRecord = {
    review_id: AppStore.nextId("REV"),
    customer_id: session.id,
    service_id: serviceId,
    booking_id: bookingId || null,
    rating: currentRating,
    review_text: reviewText,
    photos: [],
    created_at: new Date().toISOString(),
  };

  CRUD.createRecord("reviews", reviewRecord);
  updateServiceRatingsFromReviews();

  document.getElementById("success-stars").innerHTML =
    `<span style="color:var(--orange)">${"★".repeat(currentRating)}</span><span style="color:#d1d5db">${"☆".repeat(5 - currentRating)}</span>`;
  renderSuccessSuggestions();

  const main = document.getElementById("main-review");
  const footer = document.getElementById("review-footer");
  main.style.opacity = "0";
  main.style.transform = "translateY(-12px)";
  footer.style.display = "none";
  setTimeout(() => {
    main.style.display = "none";
    document.getElementById("success-overlay").style.display = "flex";
    window.scrollTo(0, 0);
  }, 300);
}

AppStore.ready.then(() => {
  const session = Auth.requireSession(["customer"]);
  if (!session) return;

  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get("bookingId");

  if (bookingId) {
    // Load booking details
    const allBookings = AppStore.getTable("bookings") || [];
    const booking = allBookings.find(
      (b) => b.booking_id === bookingId && b.customer_id === session.id,
    );

    if (booking) {
      // Update page with booking details
      document.querySelector(".service-header-name").textContent =
        booking.service_name || "Home Service";
      document.querySelector(".date-value").textContent = new Date(
        booking.scheduled_at,
      ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      // Find service to get ID
      const allServices = AppStore.getTable("services") || [];
      const service = allServices.find(
        (s) => s.service_name === booking.service_name,
      );
      if (service) {
        sessionStorage.setItem("review_service_id", service.service_id);
      }
      sessionStorage.setItem("review_booking_id", bookingId);
    }
  }

  renderNeed();
  updateCartBadge();
});
