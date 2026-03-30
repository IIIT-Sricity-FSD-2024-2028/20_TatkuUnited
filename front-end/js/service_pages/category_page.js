/* =============================================
   CATEGORY PAGE — category_page.js
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

  function formatDuration(minutes) {
    var mins = Number(minutes) || 0;
    if (mins >= 60) {
      var hrs = Math.floor(mins / 60);
      var rem = mins % 60;
      return rem ? hrs + " hr " + rem + " mins" : hrs + " hrs";
    }
    return mins + " mins";
  }

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
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

  function calcCategoryStats(data, servicesInCategory) {
    var serviceIds = new Set(
      servicesInCategory.map(function (service) {
        return service.service_id;
      }),
    );
    var bookingIds = new Set();

    (data.booking_services || []).forEach(function (item) {
      if (serviceIds.has(item.service_id)) {
        bookingIds.add(item.booking_id);
      }
    });

    var scoreByBooking = new Map(
      (data.job_assignments || []).map(function (assignment) {
        return [assignment.booking_id, assignment.assignment_score];
      }),
    );

    var ratings = [];
    bookingIds.forEach(function (bookingId) {
      var score = scoreByBooking.get(bookingId);
      if (typeof score === "number") {
        ratings.push(score);
      }
    });

    var avgRating = ratings.length
      ? ratings.reduce(function (a, b) {
          return a + b;
        }, 0) / ratings.length
      : 4.6;

    return {
      avgRating: avgRating,
      bookingsCount: bookingIds.size,
    };
  }

  function renderSubServices(grid, services, selectedServiceId) {
    var limited = services.slice(0, 4);
    grid.innerHTML = limited
      .map(function (service, index) {
        var active = selectedServiceId
          ? service.service_id === selectedServiceId
          : index === 0;
        return (
          '<button class="sub-service-card' +
          (active ? " active" : "") +
          '" data-service="' +
          service.service_id +
          '">' +
          '<div class="sub-service-img">' +
          '<img src="' +
          service.image_url +
          '" alt="' +
          service.service_name +
          '" />' +
          "</div>" +
          "<span>" +
          service.service_name +
          "</span>" +
          "</button>"
        );
      })
      .join("");
  }

  function createBulletPoints(service, faqsByService) {
    var faqs = faqsByService.get(service.service_id) || [];
    var bullets = [];

    bullets.push(service.description);
    if (faqs[0]) {
      bullets.push("Includes: " + faqs[0].answer);
    }
    bullets.push(
      "Expected turnaround: approximately " +
        formatDuration(service.estimated_duration_min) +
        ".",
    );
    return bullets.slice(0, 3);
  }

  function renderExploreList(exploreMain, services, faqsByService, data) {
    var assignmentByBooking = new Map(
      (data.job_assignments || []).map(function (a) {
        return [a.booking_id, a];
      }),
    );

    var statsPerService = new Map();
    (data.booking_services || []).forEach(function (bs) {
      var bucket = statsPerService.get(bs.service_id) || { ratings: [] };
      var assignment = assignmentByBooking.get(bs.booking_id);
      if (assignment && typeof assignment.assignment_score === "number") {
        bucket.ratings.push(assignment.assignment_score);
      }
      statsPerService.set(bs.service_id, bucket);
    });

    var heading = '<h2 class="section-heading">Explore services</h2>';
    var items = services
      .map(function (service) {
        var stats = statsPerService.get(service.service_id) || { ratings: [] };
        var serviceRating = stats.ratings.length
          ? stats.ratings.reduce(function (a, b) {
              return a + b;
            }, 0) / stats.ratings.length
          : 4.6;
        var serviceRatingFloor = Math.floor(serviceRating);

        var bullets = createBulletPoints(service, faqsByService);
        return (
          '<div class="explore-item" id="service-' +
          service.service_id +
          '" data-rating="' +
          serviceRatingFloor +
          '">' +
          '<div class="explore-item-info">' +
          '<div class="item-title-row"><h3>' +
          service.service_name +
          "</h3></div>" +
          '<div class="item-meta">' +
          '<span class="star-icon sm">' +
          '<svg viewBox="0 0 20 20" fill="#f5a623"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>' +
          "</span>" +
          '<span class="item-rating">' +
          serviceRating.toFixed(1) +
          "</span>" +
          '<span class="item-reviews">(' +
          stats.ratings.length +
          " reviews)</span>" +
          "</div>" +
          '<div class="item-price-row">' +
          '<span class="item-price">' +
          formatPrice(service.base_price) +
          "</span>" +
          '<span class="item-duration">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>' +
          "</svg>" +
          formatDuration(service.estimated_duration_min) +
          "</span>" +
          "</div>" +
          '<ul class="item-bullets">' +
          bullets
            .map(function (bullet) {
              return "<li>" + bullet + "</li>";
            })
            .join("") +
          "</ul>" +
          '<a href="service_page.html?serviceId=' +
          encodeURIComponent(service.service_id) +
          '" class="item-view-details">View details</a>' +
          "</div>" +
          '<div class="explore-item-cta">' +
          '<div class="item-img-box"><img src="' +
          service.image_url +
          '" alt="' +
          service.service_name +
          '" /></div>' +
          '<button class="btn-book-item">Add to Cart</button>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    exploreMain.innerHTML = heading + items;
  }

  function initSubServiceSelection() {
    var subCards = document.querySelectorAll(".sub-service-card");
    subCards.forEach(function (card) {
      card.addEventListener("click", function () {
        subCards.forEach(function (c) {
          c.classList.remove("active");
        });
        card.classList.add("active");

        var target = document.getElementById("service-" + card.dataset.service);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function initBookButtons() {
    document.querySelectorAll(".btn-book-item").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        var session = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
        if (session && session.role === 'customer') {
           var item = btn.closest('.explore-item');
           var svcName = item ? item.querySelector('h3').textContent : '';
           var price = item ? item.querySelector('.item-price').textContent : '';
           window.location.href = '../customer/schedule.html?service=' + encodeURIComponent(svcName) + '&price=' + encodeURIComponent(price);
           return;
        }
        var orig = btn.textContent;
        btn.textContent = "Booked!";
        btn.style.background = "#15803d";
        btn.disabled = true;
        setTimeout(function () {
          btn.textContent = orig;
          btn.style.background = "";
          btn.disabled = false;
        }, 1800);
      });
    });
  }

  function initAuthNav() {
    if (typeof AppStore !== 'undefined' && typeof Auth !== 'undefined') {
      AppStore.ready.then(function() {
        var session = Auth.getCurrentUser();
        if (session && session.role === 'customer') {
          var navAuth = document.querySelector('.nav-auth');
          if (navAuth) {
            navAuth.innerHTML = 
              '<a href="../customer/cart.html" style="margin-right: 20px; text-decoration: none; color: #1e293b; font-weight: 500; display:flex; align-items:center; gap:6px;"><svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>Cart</a>' +
              '<a href="../customer/home.html" style="background: var(--primary, #1e3a8a); color: #fff; padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: 500; text-decoration: none; display:flex; align-items:center; gap:8px;"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Dashboard</a>';
          }
          var navLinks = document.querySelector('.nav-links');
          if (navLinks) {
            navLinks.innerHTML = 
              '<li><a href="../customer/home.html">Home</a></li>' +
              '<li><a href="service_discovery.html">Services</a></li>' +
              '<li><a href="../customer/bookings.html">Bookings</a></li>';
          }
          var mobileMenu = document.querySelector('#mobileMenu ul');
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

  function initRatingFilter() {
    var ratingFilterBtns = document.querySelectorAll(".rating-filter-btn");
    var exploreItems = document.querySelectorAll(".explore-item");
    var selectedRating = "all";

    function applyFilter() {
      var visibleCount = 0;
      exploreItems.forEach(function (item) {
        var itemRating = parseInt(item.dataset.rating || "0", 10);
        var show =
          selectedRating === "all" ||
          itemRating >= parseInt(selectedRating, 10);
        item.style.display = show ? "" : "none";
        if (show) {
          visibleCount += 1;
        }
      });
    }

    ratingFilterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        ratingFilterBtns.forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        selectedRating = btn.dataset.rating;
        applyFilter();
      });
    });
  }

  function initExploreReveal() {
    var exploreItems = document.querySelectorAll(".explore-item");
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
      { threshold: 0.1 },
    );

    exploreItems.forEach(function (item, i) {
      item.style.opacity = "0";
      item.style.transform = "translateY(18px)";
      item.style.transition =
        "opacity 0.4s ease " +
        i * 0.08 +
        "s, transform 0.4s ease " +
        i * 0.08 +
        "s";
      observer.observe(item);
    });
  }

  async function initDynamicContent() {
    var response = await fetch(MOCK_DATA_PATH);
    if (!response.ok) {
      throw new Error("Unable to load mock data");
    }

    var data = await response.json();
    var categories = (data.categories || []).filter(function (category) {
      return category.is_available;
    });
    var categoryById = new Map(
      categories.map(function (category) {
        return [category.category_id, category];
      }),
    );

    var selectedCategoryId =
      getQueryParam("categoryId") ||
      (categories[0] && categories[0].category_id);
    if (!categoryById.has(selectedCategoryId) && categories[0]) {
      selectedCategoryId = categories[0].category_id;
    }

    var servicesInCategory = (data.services || []).filter(function (service) {
      return service.is_available && service.category_id === selectedCategoryId;
    });

    if (!servicesInCategory.length) {
      return;
    }

    var selectedServiceId =
      getQueryParam("serviceId") || servicesInCategory[0].service_id;
    var category = categoryById.get(selectedCategoryId);
    var stats = calcCategoryStats(data, servicesInCategory);
    var faqsByService = new Map();

    (data.service_faqs || []).forEach(function (faq) {
      var list = faqsByService.get(faq.service_id) || [];
      list.push(faq);
      faqsByService.set(faq.service_id, list);
    });

    faqsByService.forEach(function (list) {
      list.sort(function (a, b) {
        return (a.display_order || 999) - (b.display_order || 999);
      });
    });

    document.title = category.category_name + " – Tatku United";

    var catTitle = document.querySelector(".cat-title");
    var catRating = document.querySelector(".cat-rating");
    var catBookings = document.querySelector(".cat-bookings");
    var heroImage = document.querySelector(".cat-hero-img-wrap img");
    var subServicesGrid = document.getElementById("subServicesGrid");
    var exploreMain = document.querySelector(".explore-main");

    if (catTitle) {
      catTitle.textContent = category.category_name;
    }
    if (catRating) {
      catRating.textContent = stats.avgRating.toFixed(2);
    }
    if (catBookings) {
      catBookings.textContent = "(" + stats.bookingsCount + " bookings)";
    }
    if (heroImage) {
      heroImage.src = category.image_url;
      heroImage.alt = category.category_name;
    }

    if (subServicesGrid) {
      renderSubServices(subServicesGrid, servicesInCategory, selectedServiceId);
    }
    if (exploreMain) {
      renderExploreList(exploreMain, servicesInCategory, faqsByService, data);
    }

    initSubServiceSelection();
    initBookButtons();
    initRatingFilter();
    initExploreReveal();
  }

  initHamburger();
  initAuthNav();
  initDynamicContent().catch(function (error) {
    console.error(error);
  });
})();
