/*
 * provider_profile.js — Provider Details (Unit Manager View)
 * Fetches data from shared AppStore and URL search params.
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

  function loadProviderDetails() {
    var allProviders = AppStore.getTable("service_providers") || [];
    var allSkills = AppStore.getTable("skills") || [];
    var allProviderSkills = AppStore.getTable("provider_skills") || [];
    var allSectors = AppStore.getTable("sectors") || [];
    var allAssignments = AppStore.getTable("job_assignments") || [];
    var allBookings = AppStore.getTable("bookings") || [];
    var allTxns = AppStore.getTable("transactions") || [];

    providerData = allProviders.find((p) => p.service_provider_id === providerId);
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
    var sector = allSectors.find((s) => s.sector_id === providerData.home_sector_id);
    document.getElementById("info-sector").textContent = sector ? sector.sector_name : "N/A";

    // Skills
    var mySkillIds = allProviderSkills
      .filter((ps) => ps.service_provider_id === providerId)
      .map((ps) => ps.skill_id);
    var mySkills = allSkills.filter((s) => mySkillIds.indexOf(s.skill_id) !== -1);
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

    // Job History & Statistics
    var myAssignments = allAssignments.filter((a) => a.service_provider_id === providerId);
    var historyBody = document.getElementById("history-body");
    historyBody.innerHTML = "";
    
    var totalEarnings = 0;
    var completedCount = 0;
    var ratingSum = 0;
    var ratedCount = 0;

    myAssignments.sort((a,b) => new Date(b.assigned_at) - new Date(a.assigned_at));
    
    myAssignments.forEach((a) => {
      var booking = allBookings.find((b) => b.booking_id === a.booking_id);
      var txn = allTxns.find((t) => t.booking_id === a.booking_id && t.payment_status === "SUCCESS");
      
      if (a.status === "COMPLETED") completedCount++;
      if (typeof a.assignment_score === "number") {
        ratingSum += a.assignment_score;
        ratedCount++;
      }
      if (txn) totalEarnings += Number(txn.amount || 0);

      var tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(a.assigned_at).toLocaleDateString()}</td>
        <td><span style="font-weight:600">${a.booking_id}</span></td>
        <td><span class="pill ${a.status === "COMPLETED" ? "pill-green" : "pill-blue"}">${a.status}</span></td>
        <td><span class="stars">${buildStars(a.assignment_score)}</span></td>
        <td>${txn ? "₹" + Number(txn.amount).toLocaleString() : "-"}</td>
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

  AppStore.ready.then(() => {
    session = Auth.requireSession(["unit_manager"]);
    if (!session) return;
    
    providerId = getQueryParam("id");
    if (!providerId) {
      window.location.href = "providers.html";
      return;
    }

    loadProviderDetails();
  });

})();
