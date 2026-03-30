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
            localStorage.setItem("fsd_store", JSON.stringify(AppStore.data));
            localStorage.setItem("fsd_store_saved_at", new Date().toISOString());
        } catch (err) {
            console.error("[AppStore] save() failed:", err);
        }
    };

    // ── AppStore.restore ──────────────────────────────────────────────────────────
    AppStore.restore = function () {
        // Always try to load from the most-recent saved state in localStorage.
        // fsd_store is explicitly removed by Auth.logout(), so there is no risk
        // of bleeding stale cross-session data. The old fsd_session_alive guard
        // prevented this from working on pre-login pages (e.g. register).
        try {
            var raw = localStorage.getItem("fsd_store");
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
        // Same session — data already loaded from localStorage
        _resolve();
    } else {
        // New session — fetch from mockData.json
        fetch("../../js/data/mockData.json")
            .then(function (r) {
                if (!r.ok) {
                    throw new Error("HTTP " + r.status + " " + r.statusText);
                }
                return r.json();
            })
            .then(function (raw) {
                AppStore.data = JSON.parse(JSON.stringify(raw));
                // NOTE: fsd_session_alive is set ONLY by Auth.login(), not here.
                _resolve();
            })
            .catch(function (err) {
                console.error("[AppStore] Failed to load mockData.json:", err);
                AppStore.data = JSON.parse(JSON.stringify(EMPTY_DATA));
                _resolve();
            });
    }

}());