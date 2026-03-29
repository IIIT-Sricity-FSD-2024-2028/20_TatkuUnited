/* =============================================
   SERVICE DISCOVERY PAGE — service_discovery.js
   ============================================= */

(function () {
  "use strict";

  var MOCK_DATA_PATH = "../../js/data/mockData.json";

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
    var html = [
      '<button class="category-pill active" data-cat="all"><span>All</span></button>',
    ];

    categories.forEach(function (category) {
      html.push(
        '<button class="category-pill" data-cat="' +
          category.category_id +
          '">' +
          "<span>" +
          category.category_name +
          "</span>" +
          "</button>",
      );
    });

    categoriesRow.innerHTML = html.join("");
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
      var stats = statsByService.get(service.service_id) || {
        bookingCount: 0,
        ratings: [],
      };
      var rating = stats.ratings.length
        ? stats.ratings.reduce(function (a, b) {
            return a + b;
          }, 0) / stats.ratings.length
        : 4.6;

      return (
        '<a href="service_page.html?serviceId=' +
        encodeURIComponent(service.service_id) +
        '" class="service-card" data-cat="' +
        service.category_id +
        '">' +
        '<div class="card-img">' +
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
        rating.toFixed(1) +
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
        '<button class="btn-book" onclick="event.preventDefault()">Add to Cart</button>' +
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

  function initFiltersAndSearch() {
    var categoryPills = document.querySelectorAll(".category-pill");
    var serviceCards = document.querySelectorAll(".service-card");
    var noResults = document.getElementById("noResults");
    var searchInput = document.getElementById("searchInput");

    function runFilter() {
      var activePill = document.querySelector(".category-pill.active");
      var category = activePill ? activePill.dataset.cat : "all";
      var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      var visible = 0;

      serviceCards.forEach(function (card) {
        var title = (card.querySelector("h3") || {}).textContent || "";
        var desc = (card.querySelector(".card-desc") || {}).textContent || "";
        var cat = card.dataset.cat || "";

        var categoryMatch = category === "all" || cat === category;
        var searchMatch =
          !query ||
          title.toLowerCase().indexOf(query) >= 0 ||
          desc.toLowerCase().indexOf(query) >= 0;
        var show = categoryMatch && searchMatch;

        card.style.display = show ? "" : "none";
        if (show) {
          visible += 1;
        }
      });

      if (noResults) {
        noResults.style.display = visible === 0 ? "" : "none";
      }
    }

    categoryPills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        categoryPills.forEach(function (p) {
          p.classList.remove("active");
        });
        pill.classList.add("active");
        runFilter();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", runFilter);
    }

    runFilter();
  }

  function initBookButtons() {
    document.querySelectorAll(".btn-book").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var orig = btn.textContent;
        btn.textContent = "Booked!";
        btn.style.background = "#15803d";
        setTimeout(function () {
          btn.textContent = orig;
          btn.style.background = "";
        }, 1500);
      });
    });
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

    var response = await fetch(MOCK_DATA_PATH);
    if (!response.ok) {
      throw new Error("Unable to load mock data");
    }

    var data = await response.json();
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
    renderServiceCards(
      servicesGrid,
      services.slice(0, 8),
      categoriesById,
      statsByService,
    );

    if (sectionSub) {
      sectionSub.textContent =
        "Showing " +
        Math.min(8, services.length) +
        " services from live mock data";
    }

    initFiltersAndSearch();
    initBookButtons();
  }

  initHamburger();
  initWhyCardsReveal();
  initDynamicContent().catch(function (error) {
    console.error(error);
  });
})();
