/*
 * provider_profile.js — Provider Details (Unit Manager View) — API-backed
 */

(function () {
  "use strict";

  var providerId = null;
  var providerData = null;
  var session = null;

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function getInitials(name) {
    return (
      String(name || "")
        .split(" ")
        .map((w) => w[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase() || "SP"
    );
  }

  function avatarColor(name) {
    var palette = ["#3b82f6", "#0d9488", "#7c3aed", "#d97706", "#dc2626", "#16a34a"];
    return palette[String(name || "A").charCodeAt(0) % palette.length];
  }

  function buildStars(rating) {
    var out = "";
    var r = typeof rating === "number" ? Math.floor(rating) : 0;
    for (var i = 1; i <= 5; i++) out += i <= r ? "★" : "☆";
    return out;
  }

  async function loadProviderDetails() {
    // Fetch provider
    try {
      providerData = await Api.get("/service-providers/" + providerId, { silent: true });
    } catch (_) {}

    if (!providerData) {
      document.querySelector(".content").innerHTML = "<h3>Provider not found.</h3>";
      return;
    }

    // Hero & Basic Info
    document.getElementById("hero-name").textContent = providerData.name;
    document.getElementById("info-name").textContent = providerData.name;
    document.getElementById("hero-id").textContent = "ID: " + providerData.service_provider_id;
    document.getElementById("info-phone").textContent = providerData.phone || "N/A";
    document.getElementById("info-email").textContent = providerData.email || "N/A";
    document.getElementById("info-address").textContent = providerData.address || "N/A";
    document.getElementById("info-dob").textContent = providerData.dob ? new Date(providerData.dob).toLocaleDateString() : "N/A";
    document.getElementById("info-joined").textContent = providerData.created_at ? new Date(providerData.created_at).toLocaleDateString() : "N/A";
    
    var status = !providerData.is_active ? "Unavailable" : "Active";
    var statusEl = document.getElementById("hero-status");
    statusEl.textContent = status;
    statusEl.className = "status-pill " + status.toLowerCase();

    var ratingVal = typeof providerData.rating === "number" ? providerData.rating : 0;
    document.getElementById("hero-rating").textContent = ratingVal.toFixed(1);
    document.getElementById("hero-stars").textContent = buildStars(ratingVal);

    var avatar = document.getElementById("hero-avatar");
    avatar.style.background = avatarColor(providerData.name);
    avatar.textContent = getInitials(providerData.name);

    // Sector
    var sectorEl = document.getElementById("info-sector");
    if (sectorEl) sectorEl.textContent = providerData.sector_name || "N/A";

    // Skills — fetch from API
    var mySkills = [];
    try {
      var allSkills = await Api.get("/skills", { silent: true }) || [];
      var providerSkills = await Api.get("/provider-skills/" + providerId, { silent: true }) || [];
      var mySkillIds = providerSkills.map((ps) => ps.skill_id);
      mySkills = allSkills.filter((s) => mySkillIds.indexOf(s.skill_id) !== -1);
    } catch (_) {}

    var skillContainer = document.getElementById("skills-list");
    skillContainer.innerHTML = "";
    mySkills.forEach((s) => {
      var item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div class="list-info">
          <span class="list-primary">${s.skill_name}</span>
          <span class="list-secondary">Verified Specialist</span>
        </div>
        <span class="pill pill-blue">Specialty</span>
      `;
      skillContainer.appendChild(item);
    });
    if (!mySkills.length) skillContainer.innerHTML = '<span class="list-secondary">No skills listed.</span>';

    // Job History — fetch from API
    var myAssignments = [];
    try {
      myAssignments = await Api.get("/job-assignments/provider/" + providerId, { silent: true }) || [];
    } catch (_) {}

    // Revenue ledger for this provider
    var ledger = [];
    try {
      ledger = await Api.get("/revenue-ledger/provider/" + providerId, { silent: true }) || [];
    } catch (_) {}

    var historyBody = document.getElementById("history-body");
    historyBody.innerHTML = "";
    
    var totalEarnings = ledger.reduce((sum, r) => sum + (r.provider_amount || r.amount || 0), 0);
    var completedCount = 0;
    var ratingSum = 0;
    var ratedCount = 0;

    myAssignments.sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));
    
    myAssignments.forEach((a) => {
      if (a.status === "COMPLETED") completedCount++;
      if (typeof a.assignment_score === "number") {
        ratingSum += a.assignment_score;
        ratedCount++;
      }

      var tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(a.assigned_at).toLocaleDateString()}</td>
        <td><span style="font-weight:600">${a.booking_id}</span></td>
        <td><span class="pill ${a.status === "COMPLETED" ? "pill-green" : "pill-blue"}">${a.status}</span></td>
        <td><span class="stars">${buildStars(a.assignment_score)}</span></td>
        <td>${totalEarnings > 0 ? "₹" + Math.round(totalEarnings / myAssignments.length).toLocaleString() : "-"}</td>
      `;
      historyBody.appendChild(tr);
    });

    if (!myAssignments.length) {
      historyBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-secondary)">No job history found.</td></tr>';
    }

    // Stats
    document.getElementById("stat-total-jobs").textContent = myAssignments.length;
    var compRate = myAssignments.length ? Math.round((completedCount / myAssignments.length) * 100) : 0;
    document.getElementById("stat-completion").textContent = compRate + "%";
    document.getElementById("stat-ratings-count").textContent = ratedCount;
    document.getElementById("stat-revenue").textContent = "₹" + totalEarnings.toLocaleString();

    // Performance bar
    var perfPct = myAssignments.length ? Math.min(100, Math.round((ratingSum / (ratedCount || 1)) * 20)) : 80;
    document.getElementById("info-perf-bar").style.width = perfPct + "%";
  }

  (async () => {
    session = Auth.requireSession(["unit_manager"]);
    if (!session) return;
    
    providerId = getQueryParam("id");
    if (!providerId) {
      window.location.href = "providers.html";
      return;
    }

    await loadProviderDetails();
  })();

})();
