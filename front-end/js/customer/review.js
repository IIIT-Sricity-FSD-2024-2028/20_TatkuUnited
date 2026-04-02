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

function applyRatingToUi(value) {
  const safe = Math.max(1, Math.min(5, Number(value) || 4));
  setRating(safe);
}

function applyBookingContextUi(booking, providerName) {
  const serviceName = (booking && booking.service_name) || "Home Service";
  const dateText = booking
    ? new Date(booking.scheduled_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";
  const displayProvider = providerName || "Tatku Provider";

  document
    .querySelectorAll(".service-header-name, .success-service-name")
    .forEach((el) => {
      el.textContent = serviceName;
    });
  document.querySelectorAll(".date-value").forEach((el) => {
    el.textContent = dateText;
  });
  document
    .querySelectorAll(
      ".service-header-provider strong, .success-service-provider strong",
    )
    .forEach((el) => {
      el.textContent = displayProvider;
    });
}

function hydrateExistingReview(session, bookingId) {
  if (!bookingId) return;
  const reviews = AppStore.getTable("reviews") || [];
  const existing = reviews.find(
    (r) => r.booking_id === bookingId && r.customer_id === session.id,
  );
  if (!existing) return;

  const reviewBox = document.getElementById("review-text");
  if (reviewBox) {
    reviewBox.value = existing.review_text || "";
    updateCharCount();
  }
  applyRatingToUi(existing.rating);
}

function setRating(val) {
  currentRating = val;
  document
    .querySelectorAll(".star")
    .forEach((s) =>
      s.classList.toggle("active", parseInt(s.dataset.val) <= val),
    );
}

function getReviewContext(session, serviceIdFromStorage, bookingIdFromStorage) {
  const bookingId = bookingIdFromStorage || null;
  let serviceId = serviceIdFromStorage || null;
  let providerId = null;

  if (!bookingId) {
    return { bookingId, serviceId, providerId };
  }

  const bookings = AppStore.getTable("bookings") || [];
  const assignments = AppStore.getTable("job_assignments") || [];
  const booking = bookings.find(
    (b) => b.booking_id === bookingId && b.customer_id === session.id,
  );

  if (!booking) {
    return { bookingId: null, serviceId, providerId: null };
  }

  if (!serviceId) {
    const bookingServices = AppStore.getTable("booking_services") || [];
    const services = AppStore.getTable("services") || [];

    const bookingService = bookingServices.find(
      (bs) => bs.booking_id === booking.booking_id,
    );

    if (bookingService && bookingService.service_id) {
      serviceId = bookingService.service_id;
    } else if (booking.service_name) {
      const service = services.find(
        (s) => s.service_name === booking.service_name,
      );
      if (service) {
        serviceId = service.service_id;
      }
    }
  }

  providerId = booking.provider_id || null;

  const latestAssignment = assignments
    .filter((a) => a.booking_id === booking.booking_id)
    .sort((a, b) => {
      const at = new Date(
        a.updated_at || a.assigned_at || a.created_at || 0,
      ).getTime();
      const bt = new Date(
        b.updated_at || b.assigned_at || b.created_at || 0,
      ).getTime();
      return bt - at;
    })[0];

  if (!providerId && latestAssignment) {
    providerId = latestAssignment.service_provider_id || null;
  }

  return {
    bookingId: booking.booking_id,
    serviceId: serviceId || null,
    providerId,
  };
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
  const context = getReviewContext(session, serviceId, bookingId);

  if (!context.serviceId) {
    showToast(
      "Service information is missing. Please try again from your bookings.",
      "error",
    );
    return;
  }

  const reviews = AppStore.getTable("reviews") || [];
  const existingReview = reviews.find(
    (r) =>
      r.customer_id === session.id &&
      context.bookingId &&
      r.booking_id === context.bookingId,
  );

  const nowIso = new Date().toISOString();

  if (existingReview) {
    existingReview.service_id = context.serviceId;
    existingReview.provider_id = context.providerId;
    existingReview.rating = currentRating;
    existingReview.review_text = reviewText;
    existingReview.photos = [];
    existingReview.updated_at = nowIso;
    AppStore.save();
  } else {
    const reviewRecord = {
      review_id: AppStore.nextId("REV"),
      customer_id: session.id,
      service_id: context.serviceId,
      provider_id: context.providerId,
      booking_id: context.bookingId,
      rating: currentRating,
      review_text: reviewText,
      photos: [],
      created_at: nowIso,
      updated_at: nowIso,
    };

    CRUD.createRecord("reviews", reviewRecord);
  }

  if (typeof AppStore.recomputeRatingsFromReviews === "function") {
    AppStore.recomputeRatingsFromReviews();
  }

  // Force provider pages to rebuild fresh profile/state from AppStore.
  localStorage.removeItem("fsd_ui_state");

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
  const requestedServiceId = params.get("serviceId");

  if (requestedServiceId) {
    sessionStorage.setItem("review_service_id", requestedServiceId);
  }

  if (bookingId) {
    // Load booking details
    const allBookings = AppStore.getTable("bookings") || [];
    const allAssignments = AppStore.getTable("job_assignments") || [];
    const allProviders = AppStore.getTable("service_providers") || [];
    const booking = allBookings.find(
      (b) => b.booking_id === bookingId && b.customer_id === session.id,
    );

    if (booking) {
      const latestAssignment = allAssignments
        .filter((a) => a.booking_id === booking.booking_id)
        .sort((a, b) => {
          const at = new Date(
            a.updated_at || a.assigned_at || a.created_at || 0,
          ).getTime();
          const bt = new Date(
            b.updated_at || b.assigned_at || b.created_at || 0,
          ).getTime();
          return bt - at;
        })[0];

      const providerId =
        booking.provider_id ||
        (latestAssignment && latestAssignment.service_provider_id) ||
        null;
      const provider = providerId
        ? allProviders.find((p) => p.service_provider_id === providerId)
        : null;
      applyBookingContextUi(booking, provider ? provider.name : null);

      // Find service to get ID
      const allServices = AppStore.getTable("services") || [];
      const service = allServices.find(
        (s) => s.service_name === booking.service_name,
      );
      if (service) {
        sessionStorage.setItem("review_service_id", service.service_id);
      }
      sessionStorage.setItem("review_booking_id", bookingId);
      hydrateExistingReview(session, bookingId);
    }
  }

  updateCharCount();

  renderNeed();
  updateCartBadge();
});
