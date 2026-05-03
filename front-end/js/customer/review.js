/* =============================================================================
   CUSTOMER REVIEW PAGE — review.js (API-backed)
   ============================================================================= */

async function updateCartBadge() {
  try {
    const cart = await Api.get("/cart", { silent: true });
    const items = (cart && cart.items) || [];
    const count = items.length;
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "grid" : "none";
    });
  } catch (_) {
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = "0";
      el.style.display = "none";
    });
  }
}

let currentRating = 4;
let currentBooking = null;
let currentAssignment = null;

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

async function hydrateExistingReview(bookingId) {
  if (!bookingId) return;
  try {
    const reviews = await Api.get("/reviews/booking/" + bookingId, { silent: true });
    if (reviews && reviews.length > 0) {
      const existing = reviews[0];
      const reviewBox = document.getElementById("review-text");
      if (reviewBox) {
        reviewBox.value = existing.review_text || existing.comment || "";
        updateCharCount();
      }
      applyRatingToUi(existing.rating);
    }
  } catch (_) {
    // No existing review — that's fine
  }
}

function setRating(val) {
  currentRating = val;
  document
    .querySelectorAll(".star")
    .forEach((s) =>
      s.classList.toggle("active", parseInt(s.dataset.val) <= val),
    );
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

async function submitReview() {
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

  const bookingId = sessionStorage.getItem("review_booking_id");
  if (!bookingId) {
    showToast("Booking information is missing. Please try again from your bookings.", "error");
    return;
  }

  if (!currentBooking || !currentAssignment) {
    showToast("Booking data is still loading. Please wait.", "info");
    return;
  }

  try {
    await Api.post("/reviews", {
      booking_id: bookingId,
      service_id: currentAssignment.service_id,
      sp_id: currentAssignment.sp_id,
      rating: currentRating,
      comment: reviewText,
    });

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
  } catch (err) {
    // Error toast already shown by Api interceptor
    console.error("[review] Submit failed:", err);
  }
}

(async () => {
  const session = Auth.requireSession(["customer"]);
  if (!session) return;

  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get("bookingId");

  if (bookingId) {
    try { sessionStorage.setItem("review_booking_id", bookingId); } catch (_) {}

    // Load booking details from API
    try {
      const booking = await Api.get("/bookings/" + bookingId);
      if (booking) {
        currentBooking = booking;
        
        // Find the most appropriate assignment to review (COMPLETED one)
        const assignments = booking.assignments || [];
        const completed = assignments.find(a => a.status === 'COMPLETED') || assignments[0];
        currentAssignment = completed;

        const providerName = completed ? completed.sp_name : "Tatku Provider";

        applyBookingContextUi(booking, providerName);
        await hydrateExistingReview(bookingId);
      }
    } catch (err) {
      console.error("[review] Failed to load booking:", err);
    }
  }

  updateCharCount();
  renderNeed();
  updateCartBadge();
})();
