document.addEventListener("DOMContentLoaded", async function () {
  const statusEl = document.createElement("div");
  statusEl.style.cssText = "position:fixed; top:10px; right:10px; padding:10px; background:#fef3c7; border:1px solid #f59e0b; border-radius:4px; font-size:12px; z-index:9999; display:none; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); font-weight: 500;";
  document.body.appendChild(statusEl);

  function showStatus(msg, isError = false) {
    statusEl.innerHTML = msg;
    statusEl.style.display = "block";
    statusEl.style.background = isError ? "#fee2e2" : "#fef3c7";
    statusEl.style.borderColor = isError ? "#ef4444" : "#f59e0b";
    statusEl.style.color = isError ? "#991b1b" : "#92400e";
    if (!isError) setTimeout(() => statusEl.style.display = "none", 5000);
  }

  try {
    const session = Auth.requireSession(["super_user", "collective_manager", "unit_manager"]);
    if (!session) return;

    const token = Auth.getToken();
    const role = session.role;

    showStatus("<span>🔄</span> Loading live financial data...");

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "x-role": role
    };

    const fetchData = async (url) => {
      try {
        const res = await fetch(url, { headers });
        if (res.status === 403) return null;
        if (!res.ok) return null;
        return await res.json();
      } catch (err) {
        return null;
      }
    };

    // Parallel fetch
    const [
      scopedRevenue,
      categoriesData,
      servicesData,
      providersData
    ] = await Promise.all([
      fetchData(`http://localhost:10000/revenue-ledger/my`),
      fetchData("http://localhost:10000/categories"),
      fetchData("http://localhost:10000/services"),
      fetchData("http://localhost:10000/service-providers")
    ]);

    const ledgerEntries = (scopedRevenue && scopedRevenue.rows) || [];
    const categories = categoriesData || [];
    const services = servicesData || [];
    const providers = providersData || [];

    const debugInfo = `<span style="opacity: 0.7; font-size: 10px; display: block; margin-top: 4px;">CM ID: ${session.id.substring(0,8)} | Records: ${ledgerEntries.length}</span>`;

    if (ledgerEntries.length === 0) {
      showStatus(`No transactions found. ${debugInfo}`);
    } else {
      showStatus(`✅ Data Synchronized. ${debugInfo}`);
    }

    // Maps
    const categoryMap = new Map(categories.map(c => [c.category_id, c.category_name]));
    const serviceMap = new Map(services.map(s => [s.service_id, s]));
    
    let currentPeriod = "All Time";
    const periodSelect = document.getElementById("periodSelect");
    if (periodSelect) {
      currentPeriod = periodSelect.value || "All Time";
      periodSelect.addEventListener("change", (e) => {
        currentPeriod = e.target.value;
        updateUI();
      });
    }

    let lineChart, barChart, donutChart;

    function updateUI() {
      const filteredLedger = filterDataByPeriod(ledgerEntries, currentPeriod);
      updateStats(filteredLedger, providers);
      updateTable(filteredLedger, categoryMap, serviceMap);
      updateCharts(filteredLedger, categoryMap, serviceMap);
    }

    function filterDataByPeriod(data, period) {
      if (period === "All Time") return data;
      const now = new Date();
      let startDate = new Date(now);
      switch (period) {
        case "This Week":
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          startDate.setDate(diff);
          break;
        case "This Month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "This Quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case "This Year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      startDate.setHours(0, 0, 0, 0);
      return data.filter(item => new Date(item.created_at) >= startDate);
    }

    function updateStats(ledger, allProviders) {
      // CM Share
      const cmEarnings = ledger.reduce((sum, item) => sum + (item.cm_amount || 0), 0);
      
      // Gross Revenue (Total of all splits)
      const grossRevenue = ledger.reduce((sum, item) => {
        return sum + (item.provider_amount || 0) + (item.um_amount || 0) + (item.cm_amount || 0) + (item.platform_amount || 0);
      }, 0);

      const bookingCount = new Set(ledger.map(item => item.booking_id)).size;
      const activeProviders = allProviders.filter(p => p.is_active).length;

      const elRev = document.getElementById("stat-revenue");
      const elBkg = document.getElementById("stat-bookings");
      const elAov = document.getElementById("stat-aov");
      const elPrv = document.getElementById("stat-providers");

      if (elRev) {
        // Show both Gross and CM Share
        elRev.innerHTML = `<div style="font-size: 1.5rem">₹${grossRevenue.toLocaleString()}</div>
                           <div style="font-size: 0.75rem; color: #10b981; font-weight: 500;">Your Share: ₹${cmEarnings.toFixed(2)}</div>`;
      }
      if (elBkg) elBkg.textContent = bookingCount.toLocaleString();
      if (elAov) {
        const avg = bookingCount > 0 ? (grossRevenue / bookingCount).toFixed(2) : "0";
        elAov.textContent = `₹${parseFloat(avg).toLocaleString()}`;
      }
      if (elPrv) elPrv.textContent = activeProviders.toLocaleString();
    }

    function updateTable(ledger, catMap, svcMap) {
      const tableBody = document.getElementById("revTableBody");
      if (!tableBody) return;
      tableBody.innerHTML = "";

      if (ledger.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding: 40px; color: var(--text-secondary)'>No transaction data found for this period</td></tr>";
        return;
      }

      const catStats = {};
      ledger.forEach(item => {
        const service = svcMap.get(item.service_id);
        const catId = service ? service.category_id : "Unknown";
        const catName = catMap.get(catId) || "Other";
        const totalLine = (item.provider_amount || 0) + (item.um_amount || 0) + (item.cm_amount || 0) + (item.platform_amount || 0);

        if (!catStats[catName]) {
          catStats[catName] = { bookings: new Set(), revenue: 0 };
        }
        catStats[catName].bookings.add(item.booking_id);
        catStats[catName].revenue += totalLine;
      });

      Object.entries(catStats).sort((a,b) => b[1].revenue - a[1].revenue).forEach(([name, stats]) => {
        const bookingCount = stats.bookings.size;
        const avg = bookingCount > 0 ? (stats.revenue / bookingCount).toFixed(2) : "0.00";
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${name}</strong></td>
          <td>${bookingCount}</td>
          <td>₹${stats.revenue.toLocaleString()}</td>
          <td>₹${parseFloat(avg).toLocaleString()}</td>
        `;
        tableBody.appendChild(tr);
      });
    }

    function updateCharts(ledger, catMap, svcMap) {
      const hasData = ledger.length > 0;

      // 1. Revenue Trends (Line)
      const revenueByDate = {};
      ledger.forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const total = (item.provider_amount || 0) + (item.um_amount || 0) + (item.cm_amount || 0) + (item.platform_amount || 0);
        revenueByDate[date] = (revenueByDate[date] || 0) + total;
      });
      
      const lineLabels = Object.keys(revenueByDate);
      const lineData = lineLabels.map(label => revenueByDate[label]);

      if (lineChart) lineChart.destroy();
      const lineCtx = document.getElementById("lineChart");
      if (lineCtx) {
        lineChart = new Chart(lineCtx, {
          type: 'line',
          data: {
            labels: lineLabels.length > 0 ? lineLabels : ["No Data"],
            datasets: [{
              label: 'Gross Revenue (₹)',
              data: lineData.length > 0 ? lineData : [0],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: '#3b82f6'
            }]
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
              y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
              x: { grid: { display: false } }
            }
          }
        });
      }

      // 2. Bookings (Bar)
      const bookingsByDate = {};
      ledger.forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        if (!bookingsByDate[date]) bookingsByDate[date] = new Set();
        bookingsByDate[date].add(item.booking_id);
      });

      const barLabels = Object.keys(bookingsByDate);
      const barData = barLabels.map(label => bookingsByDate[label].size);

      if (barChart) barChart.destroy();
      const barCtx = document.getElementById("barChart");
      if (barCtx) {
        barChart = new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: barLabels.length > 0 ? barLabels : ["No Data"],
            datasets: [{
              label: 'Bookings',
              data: barData.length > 0 ? barData : [0],
              backgroundColor: '#10b981',
              borderRadius: 4
            }]
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
              y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
              x: { grid: { display: false } }
            }
          }
        });
      }

      // 3. Category Split (Donut)
      const revenueByCat = {};
      ledger.forEach(item => {
        const service = svcMap.get(item.service_id);
        const catId = service ? service.category_id : "Unknown";
        const catName = catMap.get(catId) || "Other";
        const total = (item.provider_amount || 0) + (item.um_amount || 0) + (item.cm_amount || 0) + (item.platform_amount || 0);
        revenueByCat[catName] = (revenueByCat[catName] || 0) + total;
      });

      const donutLabels = Object.keys(revenueByCat);
      const donutData = donutLabels.map(label => revenueByCat[label]);
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

      if (donutChart) donutChart.destroy();
      const donutCtx = document.getElementById("donutChart");
      const legendWrap = document.getElementById("donutLegend");

      if (donutCtx) {
        // Fix dimensions for donut chart to prevent "cursed" compression
        donutCtx.parentElement.style.height = "220px";
        donutCtx.parentElement.style.position = "relative";
        
        donutChart = new Chart(donutCtx, {
          type: 'doughnut',
          data: {
            labels: donutLabels.length > 0 ? donutLabels : ["No Data"],
            datasets: [{
              data: donutData.length > 0 ? donutData : [1],
              backgroundColor: hasData ? colors : ['#f3f4f6'],
              borderWidth: 0,
              cutout: '70%'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        });
      }

      if (legendWrap) {
        legendWrap.innerHTML = "";
        if (hasData) {
          donutLabels.forEach((label, i) => {
            const item = document.createElement("div");
            item.className = "legend-item";
            item.innerHTML = `
              <span class="legend-dot" style="background: ${colors[i % colors.length]}"></span>
              <span class="legend-label" style="flex: 1">${label}</span>
              <span class="legend-value" style="font-weight: 600;">₹${revenueByCat[label].toLocaleString()}</span>
            `;
            legendWrap.appendChild(item);
          });
        }
      }
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        Auth.requestLogout();
      });
    }

    // Initial render
    updateUI();

    // Auto-refresh every 30 seconds to capture new bookings/completions
    setInterval(async () => {
      const freshRevenue = await fetchData(`http://localhost:10000/revenue-ledger/my`);
      if (freshRevenue && freshRevenue.rows) {
        // Only update if data changed
        if (freshRevenue.rows.length !== ledgerEntries.length) {
          console.log("New data detected, updating dashboard...");
          ledgerEntries.length = 0;
          ledgerEntries.push(...freshRevenue.rows);
          updateUI();
          showStatus("🔄 Dashboard updated with new transactions.");
        }
      }
    }, 30000);

  } catch (error) {
    showStatus(`Critical Error: ${error.message}`, true);
  }
});
