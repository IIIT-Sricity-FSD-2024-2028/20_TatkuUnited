/* =============================================
   SERVICE PAGE — service_page.js
   ============================================= */

(function () {
  "use strict";

  var MOCK_DATA_PATH = "../../js/data/mockData.json";

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

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

  function initHamburger() {
    var hamburger = document.getElementById("hamburger");
    var mobileMenu = document.getElementById("mobileMenu");

    if (hamburger && mobileMenu) {
      hamburger.addEventListener("click", function () {
        var open = mobileMenu.classList.toggle("open");
        hamburger.classList.toggle("open", open);
      });
    }
  }

  function handleBook(btn) {
    var orig = btn.textContent;
    btn.textContent = "Booked!";
    btn.style.background = "#15803d";
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = orig;
      btn.style.background = "";
      btn.disabled = false;
    }, 2000);
  }

  function initBookButtons() {
    var btnBookNow = document.getElementById("btnBookNow");
    if (btnBookNow) {
      btnBookNow.addEventListener("click", function () {
        handleBook(btnBookNow);
      });
    }

    document
      .querySelectorAll(".sticky-bar .btn-book-now")
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          handleBook(btn);
        });
      });
  }

  function renderStars(stars) {
    var rounded = Math.max(1, Math.min(5, Math.round(stars || 0)));
    var html = [];
    for (var i = 1; i <= 5; i += 1) {
      html.push(
        '<svg viewBox="0 0 20 20" fill="' +
          (i <= rounded ? "#f5a623" : "#e5e7eb") +
          '">' +
          '<path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />' +
          "</svg>",
      );
    }
    return html.join("");
  }

  function createFallbackFaqs(service) {
    return [
      {
        question: "What is included in " + service.service_name + "?",
        answer: service.description,
      },
      {
        question: "How long will this service take?",
        answer:
          "Usually around " +
          formatDuration(service.estimated_duration_min) +
          ", depending on onsite conditions.",
      },
      {
        question: "Can I reschedule the booking?",
        answer:
          "Yes, you can reschedule from your bookings page before provider dispatch.",
      },
    ];
  }

  function renderFaqList(faqList, faqs) {
    faqList.innerHTML = faqs
      .map(function (faq) {
        return (
          '<div class="faq-item">' +
          '<button class="faq-q" aria-expanded="false">' +
          "<span>" +
          faq.question +
          "</span>" +
          '<svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<path d="M6 9l6 6 6-6" />' +
          "</svg>" +
          "</button>" +
          '<div class="faq-a"><p>' +
          faq.answer +
          "</p></div>" +
          "</div>"
        );
      })
      .join("");
  }

  function initFaqAccordion() {
    var faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(function (item) {
      var btn = item.querySelector(".faq-q");
      if (!btn) {
        return;
      }

      btn.addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        faqItems.forEach(function (fi) {
          fi.classList.remove("open");
          var q = fi.querySelector(".faq-q");
          if (q) {
            q.setAttribute("aria-expanded", "false");
          }
        });

        if (!isOpen) {
          item.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  function buildReviewData(data, serviceId) {
    var bookingServices = (data.booking_services || []).filter(function (item) {
      return item.service_id === serviceId;
    });
    var bookingIds = new Set(
      bookingServices.map(function (item) {
        return item.booking_id;
      }),
    );
    var bookingById = new Map(
      (data.bookings || []).map(function (booking) {
        return [booking.booking_id, booking];
      }),
    );
    var assignmentByBooking = new Map(
      (data.job_assignments || []).map(function (assignment) {
        return [assignment.booking_id, assignment];
      }),
    );
    var customerById = new Map(
      (data.customers || []).map(function (customer) {
        return [customer.customer_id, customer];
      }),
    );

    var reviews = [];
    bookingIds.forEach(function (bookingId) {
      var booking = bookingById.get(bookingId);
      if (!booking || booking.status !== "COMPLETED") {
        return;
      }

      var assignment = assignmentByBooking.get(bookingId);
      var customer = customerById.get(booking.customer_id);
      var score =
        assignment && typeof assignment.assignment_score === "number"
          ? assignment.assignment_score
          : (customer && customer.rating) || 4.5;
      var rounded = Math.max(1, Math.min(5, Math.round(score)));
      var reviewerName = customer ? customer.full_name : "Tatku Customer";
      var dateLabel = new Date(booking.scheduled_at).toLocaleDateString(
        "en-IN",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      );

      reviews.push({
        id: bookingId,
        stars: rounded,
        score: score,
        date: booking.scheduled_at,
        name: reviewerName,
        meta: dateLabel + " • Completed booking",
        initials: reviewerName.charAt(0).toUpperCase(),
        text: "Smooth experience overall. The provider arrived on time and completed the service with good quality standards.",
      });
    });

    if (!reviews.length) {
      reviews = [
        {
          id: "fallback-1",
          stars: 5,
          score: 4.8,
          date: "2026-01-01T10:00:00Z",
          name: "Tatku User",
          meta: "Recent booking • Verified customer",
          initials: "T",
          text: "Good quality service and professional behavior. Booking and execution were both seamless.",
        },
      ];
    }

    return reviews;
  }

  function renderReviewCards(reviewList, reviews) {
    reviewList.innerHTML = reviews
      .map(function (review) {
        return (
          '<div class="review-card" data-stars="' +
          review.stars +
          '" data-date="' +
          review.date +
          '">' +
          '<div class="review-header">' +
          '<div class="reviewer-avatar">' +
          review.initials +
          "</div>" +
          "<div>" +
          '<div class="reviewer-name">' +
          review.name +
          "</div>" +
          '<div class="reviewer-meta">' +
          review.meta +
          "</div>" +
          "</div>" +
          '<div class="review-tag positive">+' +
          review.stars +
          "</div>" +
          "</div>" +
          '<div class="review-stars">' +
          renderStars(review.stars) +
          "</div>" +
          "<p>" +
          review.text +
          "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function updateReviewSummary(reviews) {
    var average =
      reviews.reduce(function (sum, r) {
        return sum + r.score;
      }, 0) / reviews.length;
    var total = reviews.length;
    var counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach(function (review) {
      counts[review.stars] += 1;
    });

    var overallNum = document.querySelector(".overall-num");
    var overallCount = document.querySelector(".overall-count");
    if (overallNum) {
      overallNum.textContent = average.toFixed(2);
    }
    if (overallCount) {
      overallCount.textContent = total + " reviews";
    }

    document.querySelectorAll(".rating-bar-row").forEach(function (row) {
      var label = Number(
        (row.querySelector(".rb-label") || {}).textContent || 0,
      );
      var count = counts[label] || 0;
      var pct = total ? (count / total) * 100 : 0;
      var fill = row.querySelector(".rb-fill");
      var countNode = row.querySelector(".rb-count");
      if (fill) {
        fill.style.width = pct + "%";
      }
      if (countNode) {
        countNode.textContent = String(count);
      }
    });
  }

  function applyReviewFilters() {
    var activeStarFilter = document.querySelector(".star-filter.active");
    var stars = activeStarFilter
      ? parseInt(activeStarFilter.dataset.stars, 10)
      : 0;

    document.querySelectorAll(".review-card").forEach(function (card) {
      var cardStars = parseInt(card.dataset.stars, 10);
      card.style.display = stars === 0 || cardStars === stars ? "" : "none";
    });
  }

  function initReviewFilters() {
    var filterTabs = document.querySelectorAll(".filter-tab");
    var reviewList = document.getElementById("reviewList");

    filterTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        filterTabs.forEach(function (t) {
          t.classList.remove("active");
        });
        tab.classList.add("active");

        if (!reviewList) {
          return;
        }

        var cards = Array.prototype.slice.call(
          reviewList.querySelectorAll(".review-card"),
        );
        var sortKey = tab.dataset.filter;

        if (sortKey === "oldest") {
          cards.sort(function (a, b) {
            return new Date(a.dataset.date) - new Date(b.dataset.date);
          });
        } else if (sortKey === "detailed") {
          cards.sort(function (a, b) {
            return b.textContent.length - a.textContent.length;
          });
        } else {
          cards.sort(function (a, b) {
            return new Date(b.dataset.date) - new Date(a.dataset.date);
          });
        }

        cards.forEach(function (card) {
          reviewList.appendChild(card);
        });
        applyReviewFilters();
      });
    });

    var starFilters = document.querySelectorAll(".star-filter");
    starFilters.forEach(function (starFilter) {
      starFilter.addEventListener("click", function () {
        starFilters.forEach(function (f) {
          f.classList.remove("active");
        });
        starFilter.classList.add("active");
        applyReviewFilters();
      });
    });

    applyReviewFilters();
  }

  function initStickyBar() {
    var stickyBar = document.getElementById("stickyBar");
    var heroBtn = document.getElementById("btnBookNow");

    if (!stickyBar || !heroBtn || !("IntersectionObserver" in window)) {
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (window.innerWidth <= 900) {
            stickyBar.style.display = entry.isIntersecting ? "none" : "block";
          }
        });
      },
      { threshold: 0 },
    );

    observer.observe(heroBtn);
  }

  function initRatingBarAnimation() {
    var ratingBars = document.querySelectorAll(".rb-fill");
    if (!("IntersectionObserver" in window)) {
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var targetWidth =
              entry.target.getAttribute("data-target-width") || "0%";
            entry.target.style.width = targetWidth;
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 },
    );

    ratingBars.forEach(function (bar) {
      var targetWidth = bar.style.width || "0%";
      bar.setAttribute("data-target-width", targetWidth);
      bar.style.width = "0%";
      observer.observe(bar);
    });
  }

  function initStepReveal() {
    var stepItems = document.querySelectorAll(".step-item");
    if (!("IntersectionObserver" in window)) {
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateX(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    stepItems.forEach(function (item, i) {
      item.style.opacity = "0";
      item.style.transform = "translateX(-16px)";
      item.style.transition =
        "opacity 0.4s ease " +
        i * 0.1 +
        "s, transform 0.4s ease " +
        i * 0.1 +
        "s";
      observer.observe(item);
    });
  }

  function buildSteps(service) {
    return [
      {
        title: "Initial Assessment:",
        text:
          "Provider performs a quick pre-check to understand requirements for " +
          service.service_name +
          ".",
      },
      {
        title: "Focused Service Execution:",
        text: service.description,
      },
      {
        title: "Final Quality Check:",
        text: "A final walkthrough is done to ensure quality and completion before closing the task.",
      },
    ];
  }

  function getServiceContent(data, serviceId) {
    return (data.service_content || []).find(function (item) {
      return item.service_id === serviceId;
    });
  }

  function buildFallbackCoverage(service) {
    return {
      what_is_covered: [
        "Core execution of " + service.service_name,
        "Professional handling by trained provider",
        "Service quality validation before closure",
        "Usage guidance where applicable",
        "Work area basic cleanup",
      ],
      what_is_not_covered: [
        "Major part replacement unless explicitly added",
        "Civil work or structural modifications",
        "Damage existing prior to service",
        "Third-party product warranty claims",
        "Tasks outside selected service scope",
      ],
    };
  }

  function buildCoverageIcon(type) {
    if (type === "yes") {
      return (
        '<span class="cov-icon yes">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
        '<path d="M20 6L9 17l-5-5" />' +
        "</svg>" +
        "</span>"
      );
    }

    return (
      '<span class="cov-icon no">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
      '<path d="M18 6L6 18M6 6l12 12" />' +
      "</svg>" +
      "</span>"
    );
  }

  function renderCoverageLists(coveredList, notCoveredList, coverage) {
    if (coveredList) {
      coveredList.innerHTML = (coverage.what_is_covered || [])
        .map(function (item) {
          return "<li>" + buildCoverageIcon("yes") + item + "</li>";
        })
        .join("");
    }

    if (notCoveredList) {
      notCoveredList.innerHTML = (coverage.what_is_not_covered || [])
        .map(function (item) {
          return "<li>" + buildCoverageIcon("no") + item + "</li>";
        })
        .join("");
    }
  }

  function renderSteps(stepContainer, steps) {
    stepContainer.innerHTML = steps
      .map(function (step, index) {
        return (
          '<div class="step-item">' +
          '<div class="step-num">' +
          (index + 1) +
          "</div>" +
          '<div class="step-body">' +
          "<h3>" +
          step.title +
          "</h3>" +
          "<p>" +
          step.text +
          "</p>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  async function initDynamicContent() {
    var response = await fetch(MOCK_DATA_PATH);
    if (!response.ok) {
      throw new Error("Unable to load mock data");
    }

    var data = await response.json();
    var availableServices = (data.services || []).filter(function (service) {
      return service.is_available;
    });

    if (!availableServices.length) {
      return;
    }

    var serviceId =
      getQueryParam("serviceId") || availableServices[0].service_id;
    var service =
      availableServices.find(function (item) {
        return item.service_id === serviceId;
      }) || availableServices[0];

    var faqs = (data.service_faqs || [])
      .filter(function (faq) {
        return faq.service_id === service.service_id;
      })
      .sort(function (a, b) {
        return (a.display_order || 999) - (b.display_order || 999);
      });

    var serviceContent = getServiceContent(data, service.service_id) || {};
    var reviews = buildReviewData(data, service.service_id);
    var avgRating =
      reviews.reduce(function (sum, review) {
        return sum + review.score;
      }, 0) / reviews.length;

    document.title = service.service_name + " – Tatku United";

    var svcTitle = document.querySelector(".svc-title");
    var svcMetaRating = document.querySelector(".svc-meta strong");
    var svcMetaReviews = document.querySelector(".svc-reviews");
    var svcBullets = document.querySelector(".svc-bullets");
    var svcPrice = document.querySelector(".svc-price");
    var svcDuration = document.querySelector(".svc-duration");
    var heroImage = document.querySelector(".svc-hero-img-wrap img");
    var stickyPrice = document.querySelector(".sticky-price");
    var stickyDuration = document.querySelector(".sticky-duration");
    var faqList = document.getElementById("faqList");
    var reviewList = document.getElementById("reviewList");
    var stepContainer = document.querySelector(".steps-list");
    var damageCopy = document.querySelector(".damage-left p");
    var coveredList = document.querySelector(".coverage-card.covered ul");
    var notCoveredList = document.querySelector(
      ".coverage-card.not-covered ul",
    );

    if (svcTitle) {
      svcTitle.textContent = service.service_name;
    }
    if (svcMetaRating) {
      svcMetaRating.textContent = avgRating.toFixed(2);
    }
    if (svcMetaReviews) {
      svcMetaReviews.textContent = "(" + reviews.length + " reviews)";
    }
    if (svcBullets) {
      svcBullets.innerHTML = [
        "<li>" + service.description + "</li>",
        "<li>Estimated duration: " +
          formatDuration(service.estimated_duration_min) +
          ".</li>",
        "<li>Transparent pricing with trained professionals and quality checks.</li>",
      ].join("");
    }
    if (svcPrice) {
      svcPrice.textContent = formatPrice(service.base_price);
    }
    if (svcDuration) {
      var icon = svcDuration.querySelector("svg");
      svcDuration.textContent =
        " " + formatDuration(service.estimated_duration_min);
      if (icon) {
        svcDuration.prepend(icon);
      }
    }
    if (heroImage) {
      heroImage.src = service.image_url;
      heroImage.alt = service.service_name;
    }
    if (stickyPrice) {
      stickyPrice.textContent = formatPrice(service.base_price);
    }
    if (stickyDuration) {
      stickyDuration.textContent = formatDuration(
        service.estimated_duration_min,
      );
    }
    if (stepContainer) {
      var steps = (serviceContent.how_it_works || []).map(function (step) {
        return {
          title: step.step_title + ":",
          text: step.step_description,
        };
      });

      renderSteps(stepContainer, steps.length ? steps : buildSteps(service));
    }

    var fallbackCoverage = buildFallbackCoverage(service);
    renderCoverageLists(coveredList, notCoveredList, {
      what_is_covered: (serviceContent.what_is_covered || []).length
        ? serviceContent.what_is_covered
        : fallbackCoverage.what_is_covered,
      what_is_not_covered: (serviceContent.what_is_not_covered || []).length
        ? serviceContent.what_is_not_covered
        : fallbackCoverage.what_is_not_covered,
    });

    if (damageCopy) {
      damageCopy.textContent =
        "Up to " +
        formatPrice(service.base_price * 8) +
        " cover if any damage happens during the job";
    }

    if (faqList) {
      renderFaqList(faqList, faqs.length ? faqs : createFallbackFaqs(service));
    }
    if (reviewList) {
      renderReviewCards(reviewList, reviews);
    }
    updateReviewSummary(reviews);

    initBookButtons();
    initFaqAccordion();
    initReviewFilters();
    initStickyBar();
    initRatingBarAnimation();
    initStepReveal();
  }

  initHamburger();
  initDynamicContent().catch(function (error) {
    console.error(error);
  });
})();
