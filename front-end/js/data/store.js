(function () {
    "use strict";

    // ── Valid table names ────────────────────────────────────────────────────────
    const VALID_TABLES = [
        "collectives", "units", "sectors", "collective_managers", "unit_managers",
        "service_providers", "provider_documents", "provider_working_hours",
        "provider_unavailability", "skills", "provider_skills", "customers",
        "categories", "services", "service_skills", "service_faqs",
        "service_packages", "package_services", "bookings", "booking_services",
        "job_assignments", "transactions"
    ];

    // ── Prefix → table mapping ───────────────────────────────────────────────────
    const PREFIX_TABLE_MAP = {
        "COL": "collectives",
        "UNT": "units",
        "SEC": "sectors",
        "CM": "collective_managers",
        "UM": "unit_managers",
        "SP": "service_providers",
        "DOC": "provider_documents",
        "WH": "provider_working_hours",
        "UV": "provider_unavailability",
        "SKL": "skills",
        "CUS": "customers",
        "CAT": "categories",
        "SVC": "services",
        "FAQ": "service_faqs",
        "PKG": "service_packages",
        "BKG": "bookings",
        "JA": "job_assignments",
        "TXN": "transactions"
    };

    // ── Empty data scaffold (used on fetch failure) ──────────────────────────────
    const EMPTY_DATA = {
        collectives: [], units: [], sectors: [],
        collective_managers: [], unit_managers: [], service_providers: [],
        provider_documents: [], provider_working_hours: [],
        provider_unavailability: [], skills: [], provider_skills: [],
        customers: [], categories: [], services: [], service_skills: [],
        service_faqs: [], service_packages: [], package_services: [],
        bookings: [], booking_services: [], job_assignments: [],
        transactions: []
    };

    // ── Bootstrap AppStore on window ─────────────────────────────────────────────
    var AppStore = {};
    window.AppStore = AppStore;

    // ── AppStore.data ─────────────────────────────────────────────────────────────
    AppStore.data = null;

    // ── AppStore.save ─────────────────────────────────────────────────────────────
    AppStore.save = function () {
        try {
            sessionStorage.setItem("fsd_store", JSON.stringify(AppStore.data));
            sessionStorage.setItem("fsd_store_saved_at", new Date().toISOString());
        } catch (err) {
            console.error("[AppStore] save() failed:", err);
        }
    };

    // ── AppStore.restore ──────────────────────────────────────────────────────────
    AppStore.restore = function () {
        // Always try to load from the most-recent saved state in sessionStorage.
        // fsd_store is explicitly removed by Auth.logout(), so there is no risk
        // of bleeding stale cross-session data. The old fsd_session_alive guard
        // prevented this from working on pre-login pages (e.g. register).
        try {
            var raw = sessionStorage.getItem("fsd_store");
            if (raw) {
                AppStore.data = JSON.parse(raw);
                return true;
            }
        } catch (err) {
            console.error("[AppStore] restore() failed to parse localStorage:", err);
        }
        // Nothing in localStorage — signal that a fresh fetch is needed.
        return false;
    };

    // ── AppStore.getTable ─────────────────────────────────────────────────────────
    AppStore.getTable = function (name) {
        if (VALID_TABLES.indexOf(name) === -1) {
            console.error(
                "[AppStore] getTable(): \"" + name + "\" is not a valid table name. " +
                "Valid tables: " + VALID_TABLES.join(", ")
            );
            return undefined;
        }
        return AppStore.data[name];
    };

    // ── AppStore.nextId ───────────────────────────────────────────────────────────
    AppStore.nextId = function (prefix) {
        var tableName = PREFIX_TABLE_MAP[prefix];
        if (!tableName) {
            console.error(
                "[AppStore] nextId(): \"" + prefix + "\" is not a recognised prefix. " +
                "Valid prefixes: " + Object.keys(PREFIX_TABLE_MAP).join(", ")
            );
            return null;
        }

        var table = AppStore.data[tableName];
        var maxNum = 0;

        for (var i = 0; i < table.length; i++) {
            var row = table[i];
            // Find the id field — check common key names
            var idKeys = Object.keys(row).filter(function (k) {
                return k === "id" || k.endsWith("_id") || k === (tableName.replace(/_/g, "_") + "_id");
            });

            // Prefer a key literally named "id", fall back to the first *_id key
            var idVal = null;
            if (row.hasOwnProperty("id")) {
                idVal = row["id"];
            } else {
                for (var k = 0; k < idKeys.length; k++) {
                    if (row[idKeys[k]] !== undefined) {
                        idVal = row[idKeys[k]];
                        break;
                    }
                }
            }

            if (idVal === null || idVal === undefined) continue;
            idVal = String(idVal);

            if (idVal.indexOf(prefix) === 0) {
                var suffix = idVal.slice(prefix.length);
                var num = parseInt(suffix, 10);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        }

        var next = maxNum + 1;
        var padded = String(next);
        while (padded.length < 3) {
            padded = "0" + padded;
        }
        return prefix + padded;
    };

    // ── AppStore.ready + startup sequence ────────────────────────────────────────
    var _resolve;
    AppStore.ready = new Promise(function (resolve) {
        _resolve = resolve;
    });

    if (AppStore.restore()) {
        // Same session — data already loaded from sessionStorage
        _resolve();
    } else {
        // First startup or missing local data — fetch from mockData.json
        fetch("../../js/data/mockData.json")
            .then(function (r) {
                if (!r.ok) {
                    throw new Error("HTTP " + r.status + " " + r.statusText);
                }
                return r.json();
            })
            .then(function (raw) {
                AppStore.data = JSON.parse(JSON.stringify(raw));
                // Session logic is handled entirely by Auth.login() and requires no action here.
                // Persist the fresh state immediately
                AppStore.save();

                _resolve();
            })
            .catch(function (err) {
                console.error("[AppStore] Failed to load mockData.json:", err);
                AppStore.data = JSON.parse(JSON.stringify(EMPTY_DATA));
                _resolve();
            });
    }

    // ── Unified Session State (added for provider UI persistence) ──────────────
    window.initData = function () {
        return new Promise(function (resolve) {
            var expectedId = 'SP001';
            try {
                var sess = sessionStorage.getItem('fsd_session') || localStorage.getItem('fsd_session');
                if (sess) {
                    var p = JSON.parse(sess);
                    if (p.role === 'provider' && p.id) expectedId = p.id;
                }
            } catch (e) { }

            var existing = sessionStorage.getItem("fsd_ui_state");
            if (existing) {
                var parsedExisting = JSON.parse(existing);
                if (parsedExisting.provider && parsedExisting.provider.service_provider_id === expectedId) {
                    resolve();
                    return;
                }
            }
            AppStore.ready.then(function () {
                var providerId = expectedId;

                var jobs = [];
                var allJA = AppStore.getTable('job_assignments') || [];
                var allBK = AppStore.getTable('bookings') || [];
                var allCUS = AppStore.getTable('customers') || [];
                var allSVC = AppStore.getTable('services') || [];
                var allCAT = AppStore.getTable('categories') || [];
                var allBS = AppStore.getTable('booking_services') || [];

                var allSP = AppStore.getTable('service_providers') || [];
                var allWH = AppStore.getTable('provider_working_hours') || [];
                var allUV = AppStore.getTable('provider_unavailability') || [];

                var allSkills = AppStore.getTable('skills') || [];
                var allProviderSkills = AppStore.getTable('provider_skills') || [];

                var providerProfile = allSP.find(function (sp) { return sp.service_provider_id === providerId; }) || {};

                providerProfile.skills = [];
                var mySkills = allProviderSkills.filter(function (ps) { return ps.service_provider_id === providerId; });
                mySkills.forEach(function (ps) {
                    var skillObj = allSkills.find(s => s.skill_id === ps.skill_id);
                    if (skillObj) {
                        providerProfile.skills.push(skillObj.skill_name);
                    }
                });

                var providerWH = allWH.filter(function (wh) { return wh.service_provider_id === providerId && wh.is_working; });
                var workStart = providerWH.length > 0 ? providerWH[0].hour_start : '08:00';
                var workEnd = providerWH.length > 0 ? providerWH[0].hour_end : '18:00';

                var unavailMap = {};
                allUV.forEach(function (uv) {
                    if (uv.service_provider_id === providerId) {
                        if (!unavailMap[uv.date]) unavailMap[uv.date] = [];
                        unavailMap[uv.date].push({ from: uv.hour_start, to: uv.hour_end });
                    }
                });

                allJA.forEach(function (ja) {
                    if (ja.service_provider_id === providerId) {
                        var bkg = allBK.find(b => b.booking_id === ja.booking_id) || {};
                        var cus = allCUS.find(c => c.customer_id === bkg.customer_id) || {};

                        var bsList = allBS.filter(bs => bs.booking_id === bkg.booking_id);
                        var serviceName = 'General Service';
                        var catName = 'General';
                        if (bsList.length > 0) {
                            var svc = allSVC.find(s => s.service_id === bsList[0].service_id);
                            if (svc) {
                                serviceName = svc.service_name;
                                var cat = allCAT.find(c => c.category_id === svc.category_id);
                                if (cat) catName = cat.category_name;
                            }
                        }

                        var statusMap = {
                            "ASSIGNED": "assigned",
                            "IN_PROGRESS": "inprogress",
                            "COMPLETED": "completed",
                            "CANCELLED": "cancelled",
                            "PENDING": "pending"
                        };
                        var uiStatus = statusMap[ja.status] || "assigned";
                        var labelMap = { assigned: "Assigned", inprogress: "In Progress", completed: "Completed", pending: "Pending Confirmation", cancelled: "Cancelled" };

                        var totalPrice = 0;
                        if (bsList && bsList.length > 0) {
                            totalPrice = bsList.reduce(function (acc, bs) { return acc + (bs.price_at_booking || 0); }, 0);
                        }

                        jobs.push({
                            id: ja.assignment_id,
                            service: serviceName,
                            category: catName,
                            customer: cus.full_name || cus.name || 'Unknown User',
                            address: bkg.service_address || 'Unknown Address',
                            phone: cus.phone || '+91 0000000000',
                            date: ja.scheduled_date,
                            time: ja.hour_start + ' - ' + ja.hour_end,
                            startTime: ja.hour_start,
                            endTime: ja.hour_end,
                            status: uiStatus,
                            statusLabel: labelMap[uiStatus],
                            description: ja.notes || 'Complete service according to standards.',
                            price: totalPrice
                        });
                    }
                });

                jobs.sort(function (a, b) {
                    if (a.date !== b.date) return a.date > b.date ? 1 : -1;
                    return a.startTime > b.startTime ? 1 : -1;
                });

                var totalCompletedCount = jobs.filter(function (j) { return j.status === 'completed'; }).length;
                var totalCompletedSum = jobs.filter(function (j) { return j.status === 'completed'; }).reduce(function (acc, j) { return acc + (j.price || 0); }, 0);
                var totalPendingSum = jobs.filter(function (j) { return j.status === 'inprogress' || j.status === 'assigned' || j.status === 'pending'; }).reduce(function (acc, j) { return acc + (j.price || 0); }, 0);
                var avgTicket = totalCompletedCount > 0 ? Math.round(totalCompletedSum / totalCompletedCount) : 0;

                var state = {
                    provider: providerProfile,
                    workingHours: { start: workStart, end: workEnd },
                    jobs: jobs,
                    unavailability: unavailMap,
                    stats: [
                        { label: 'Completed Jobs', value: totalCompletedCount },
                        { label: 'Avg. Ticket', value: '₹' + avgTicket.toLocaleString('en-IN') },
                        { label: 'Pending Payout', value: '₹' + totalPendingSum.toLocaleString('en-IN') },
                        { label: 'Cancelled', value: jobs.filter(function (j) { return j.status === 'cancelled'; }).length }
                    ],
                    notifications: [
                        { id: 101, type: 'job', category: 'Jobs', unread: true, title: 'New Job Assigned', time: '2 hours ago', desc: 'You have been assigned a new service request. Please check your schedule.', actions: [{ label: 'View Job Details', cls: 'btn-primary-action', href: 'assigned-jobs.html' }, { label: 'Dismiss', cls: 'btn-dismiss', action: 'dismiss' }] },
                        { id: 102, type: 'payment', category: 'Payments', unread: true, title: 'Payment Processing', time: '5 hours ago', desc: 'Your latest payout has been initiated and will reflect shortly.', actions: [{ label: 'View Earnings', cls: 'btn-outline-action', href: 'earnings.html' }] },
                        { id: 103, type: 'account', category: 'Account', unread: false, title: 'Identity Verification Required', time: 'Yesterday', desc: 'Please upload the renewed document to avoid service interruption.', actions: [{ label: 'Update Profile', cls: 'btn-orange-action', href: 'profile.html' }] }
                    ]
                };

                sessionStorage.setItem('fsd_ui_state', JSON.stringify(state));
                resolve();
            });
        });
    };

    window.getData = function () {
        return JSON.parse(sessionStorage.getItem('fsd_ui_state'));
    };

    window.setData = function (data) {
        sessionStorage.setItem('fsd_ui_state', JSON.stringify(data));
    };

}());