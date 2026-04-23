/* =============================================
   SERVICE DISCOVERY PAGE — service_discovery.js
   ============================================= */

(function () {
  "use strict";

  function formatPrice(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, "-");
  }

  function buildCategoryUrl(categoryId) {
    return "category_page.html?categoryId=" + encodeURIComponent(categoryId);
  }

  function formatDuration(minutes) {
    var mins = Number(minutes) || 0;
    if (mins >= 60) {
      var hrs = Math.floor(mins / 60);
      var rem = mins % 60;
      return rem ? hrs + " hr " + rem + " mins" : hrs + " hrs";
    }
    return mins + " mins";
  }

  function getServiceStats(data) {
    var assignmentByBooking = new Map(
      (data.job_assignments || []).map(function (a) {
        return [a.booking_id, a];
      }),
    );

    var stats = new Map();
    (data.booking_services || []).forEach(function (bs) {
      var bucket = stats.get(bs.service_id) || { bookingCount: 0, ratings: [] };
      bucket.bookingCount += Number(bs.quantity) || 1;
      var assignment = assignmentByBooking.get(bs.booking_id);
      if (assignment && typeof assignment.assignment_score === "number") {
        bucket.ratings.push(assignment.assignment_score);
      }
      stats.set(bs.service_id, bucket);
    });

    return stats;
  }

  function renderCategoryPills(categoriesRow, categories) {
    var html = [];
    var chunkSize = 6;

    for (var i = 0; i < (categories || []).length; i += chunkSize) {
      var rowCategories = categories.slice(i, i + chunkSize);
      var rowHtml = rowCategories
        .map(function (category) {
          return (
            '<a class="category-pill" href="' +
            buildCategoryUrl(category.category_id) +
            '">' +
            "<span>" +
            category.category_name +
            "</span>" +
            "</a>"
          );
        })
        .join("");

      html.push('<div class="categories-row-group">' + rowHtml + "</div>");
    }

    categoriesRow.innerHTML = html.join("");
  }

  function getServiceMetrics(service, statsByService) {
    var stats = statsByService.get(service.service_id) || {
      bookingCount: 0,
      ratings: [],
    };
    var hasRating = stats.ratings.length > 0;
    var rating = hasRating
      ? stats.ratings.reduce(function (a, b) {
          return a + b;
        }, 0) / stats.ratings.length
      : null;

    return {
      rating: rating,
      hasRating: hasRating,
      bookingCount: stats.bookingCount || 0,
    };
  }

  function sortServices(services, sortBy, statsByService) {
    var sorted = services.slice();

    sorted.sort(function (a, b) {
      var aMetrics = getServiceMetrics(a, statsByService);
      var bMetrics = getServiceMetrics(b, statsByService);
      var aRatingForSort = aMetrics.hasRating ? aMetrics.rating : -1;
      var bRatingForSort = bMetrics.hasRating ? bMetrics.rating : -1;

      if (sortBy === "price-low") {
        return (a.base_price || 0) - (b.base_price || 0);
      }
      if (sortBy === "price-high") {
        return (b.base_price || 0) - (a.base_price || 0);
      }
      if (sortBy === "most-booked") {
        if (bMetrics.bookingCount !== aMetrics.bookingCount) {
          return bMetrics.bookingCount - aMetrics.bookingCount;
        }
        if (bRatingForSort !== aRatingForSort) {
          return bRatingForSort - aRatingForSort;
        }
        return a.service_name.localeCompare(b.service_name);
      }

      if (bRatingForSort !== aRatingForSort) {
        return bRatingForSort - aRatingForSort;
      }
      if (bMetrics.bookingCount !== aMetrics.bookingCount) {
        return bMetrics.bookingCount - aMetrics.bookingCount;
      }
      return a.service_name.localeCompare(b.service_name);
    });

    return sorted;
  }

  function renderServiceCards(
    servicesGrid,
    services,
    categoriesById,
    statsByService,
  ) {
    var html = services.map(function (service) {
      var category = categoriesById.get(service.category_id);
      var categoryName = category ? category.category_name : "General";
      var categoryClass = slugify(categoryName).split("-")[0] || "general";
      var metrics = getServiceMetrics(service, statsByService);
      var ratingText = metrics.hasRating ? metrics.rating.toFixed(1) : "N/A";

      var isUnavailable = service.is_available === false;
      var unavailableClass = isUnavailable ? " unavailable" : "";
      var unavailableBadge = isUnavailable
        ? '<div class="service-unavailable-badge">Unavailable</div>'
        : "";
      var bookBtnDisabled = isUnavailable
        ? ' style="background:#94a3b8;cursor:not-allowed;pointer-events:none"'
        : "";

      return (
        '<a href="service_page.html?serviceId=' +
        encodeURIComponent(service.service_id) +
        '" class="service-card' +
        unavailableClass +
        '" data-cat="' +
        service.category_id +
        '">' +
        '<div class="card-img" style="position:relative">' +
        unavailableBadge +
        '<div class="card-badge ' +
        categoryClass +
        '">' +
        categoryName.toUpperCase() +
        "</div>" +
        '<img src="' +
        service.image_url +
        '" alt="' +
        service.service_name +
        '" />' +
        "</div>" +
        '<div class="card-body">' +
        '<div class="card-title-row">' +
        "<h3>" +
        service.service_name +
        "</h3>" +
        '<span class="card-rating">' +
        '<svg viewBox="0 0 20 20" fill="#f5a623"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>' +
        ratingText +
        "</span>" +
        "</div>" +
        '<p class="card-desc">' +
        service.description +
        "</p>" +
        '<div class="card-footer">' +
        "<div>" +
        '<span class="price-label">Starting from</span>' +
        '<span class="price">' +
        formatPrice(service.base_price) +
        "</span>" +
        "</div>" +
        '<button class="btn-book" onclick="event.preventDefault()"' +
        bookBtnDisabled +
        ">" +
        (isUnavailable ? "Unavailable" : "Add to Cart") +
        "</button>" +
        "</div>" +
        "</div>" +
        "</a>"
      );
    });

    servicesGrid.innerHTML = html.join("");
  }

  function initHamburger() {
    var hamburger = document.getElementById("hamburger");
    var mobileMenu = document.getElementById("mobileMenu");

    if (hamburger && mobileMenu) {
      hamburger.addEventListener("click", function () {
        var open = mobileMenu.classList.toggle("open");
        hamburger.classList.toggle("open", open);
        hamburger.setAttribute("aria-expanded", String(open));
      });
    }
  }

  function initServiceControls(
    servicesGrid,
    services,
    categoriesById,
    statsByService,
  ) {
    var noResults = document.getElementById("noResults");
    var searchInput = document.getElementById("searchInput");
    var serviceSort = document.getElementById("serviceSort");

    function renderVisibleServices() {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      var sortBy = serviceSort ? serviceSort.value : "top-rated";

      var filtered = services.filter(function (service) {
        if (!query) {
          return true;
        }

        var category = categoriesById.get(service.category_id);
        var categoryName = category ? category.category_name : "";
        return (
          service.service_name.toLowerCase().indexOf(query) >= 0 ||
          service.description.toLowerCase().indexOf(query) >= 0 ||
          categoryName.toLowerCase().indexOf(query) >= 0
        );
      });

      filtered = sortServices(filtered, sortBy, statsByService);
      renderServiceCards(
        servicesGrid,
        filtered,
        categoriesById,
        statsByService,
      );
      initBookButtons();

      if (noResults) {
        noResults.style.display = filtered.length === 0 ? "" : "none";
      }
    }

    if (searchInput) {
      searchInput.addEventListener("input", renderVisibleServices);
    }

    if (serviceSort) {
      serviceSort.addEventListener("change", renderVisibleServices);
    }

    renderVisibleServices();
  }

  function initBookButtons() {
    document.querySelectorAll(".btn-book").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        var session =
          typeof Auth !== "undefined" ? Auth.getCurrentUser() : null;
        if (session && session.role === "customer") {
          var card = btn.closest(".service-card");
          var svcName = card ? card.querySelector("h3").textContent : "";
          var price = card ? card.querySelector(".price").textContent : "";
          window.location.href =
            "../customer/schedule.html?service=" +
            encodeURIComponent(svcName) +
            "&price=" +
            encodeURIComponent(price);
          return;
        }
        var next = encodeURIComponent(
          window.location.pathname +
            window.location.search +
            window.location.hash,
        );
        window.location.href =
          "/front-end/html/auth_pages/login.html?next=" + next;
      });
    });
  }

  function initAuthNav() {
    if (typeof AppStore !== "undefined" && typeof Auth !== "undefined") {
      AppStore.ready.then(function () {
        var session = Auth.getCurrentUser();
        if (session && session.role === "customer") {
          var navAuth = document.querySelector(".nav-auth");
          if (navAuth) {
            navAuth.innerHTML =
              '<a href="../customer/cart.html" class="cart-btn" title="Cart"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg></a>' +
              '<a href="../customer/home.html" class="user-avatar-btn" title="Dashboard"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></a>';
          }
          var navLinks = document.querySelector(".nav-links");
          if (navLinks) {
            navLinks.innerHTML =
              '<li><a href="../customer/home.html">Home</a></li>' +
              '<li><a href="service_discovery.html" class="active">Services</a></li>' +
              '<li><a href="../customer/bookings.html">Bookings</a></li>';
          }
          var mobileMenu = document.querySelector("#mobileMenu ul");
          if (mobileMenu) {
            mobileMenu.innerHTML =
              '<li><a href="../customer/home.html" style="color:var(--primary); font-weight:600;">Dashboard</a></li>' +
              '<li><a href="service_discovery.html">Services</a></li>' +
              '<li><a href="../customer/cart.html">Cart</a></li>';
          }
        }
      });
    }
  }

  function initWhyCardsReveal() {
    var whyCards = document.querySelectorAll(".why-card");
    if (!("IntersectionObserver" in window)) {
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    whyCards.forEach(function (card, i) {
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";
      card.style.transition =
        "opacity 0.4s ease " +
        i * 0.1 +
        "s, transform 0.4s ease " +
        i * 0.1 +
        "s";
      observer.observe(card);
    });
  }

  async function initDynamicContent() {
    var categoriesRow = document.getElementById("categoriesRow");
    var servicesGrid = document.getElementById("servicesGrid");
    var sectionSub = document.querySelector(".section-sub");

    if (!categoriesRow || !servicesGrid) {
      return;
    }

    if (typeof AppStore !== "undefined" && AppStore.ready) {
      await AppStore.ready;
    }

    var data =
      typeof AppStore !== "undefined" && AppStore.data ? AppStore.data : null;

    if (!data) {
      throw new Error("Service discovery data is unavailable. AppStore is not initialized.");
    }

    var categories = (data.categories || []).filter(function (category) {
      return category.is_available;
    });
    var categoriesById = new Map(
      categories.map(function (category) {
        return [category.category_id, category];
      }),
    );

    var services = (data.services || []).filter(function (service) {
      return service.is_available && categoriesById.has(service.category_id);
    });

    var statsByService = getServiceStats(data);
    services.sort(function (a, b) {
      var aStats = statsByService.get(a.service_id) || {
        ratings: [],
        bookingCount: 0,
      };
      var bStats = statsByService.get(b.service_id) || {
        ratings: [],
        bookingCount: 0,
      };
      var aRating = aStats.ratings.length
        ? aStats.ratings.reduce(function (x, y) {
            return x + y;
          }, 0) / aStats.ratings.length
        : 0;
      var bRating = bStats.ratings.length
        ? bStats.ratings.reduce(function (x, y) {
            return x + y;
          }, 0) / bStats.ratings.length
        : 0;

      if (bRating !== aRating) {
        return bRating - aRating;
      }
      return (bStats.bookingCount || 0) - (aStats.bookingCount || 0);
    });

    renderCategoryPills(categoriesRow, categories);

    if (sectionSub) {
      sectionSub.textContent =
        "Showing " + services.length + " available services";
    }

    initServiceControls(servicesGrid, services, categoriesById, statsByService);
  }

  initHamburger();
  initWhyCardsReveal();
  initAuthNav();
  initDynamicContent().catch(function (error) {
    console.error(error);
  });
})();
