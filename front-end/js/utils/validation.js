/* =============================================================================
   TATKU UNITED — VALIDATION UTILITY
   front-end/js/utils/validation.js
   No external dependencies — pure functions only.
   ============================================================================= */

window.Validators = (() => {
  /* ─── Internal helpers ─── */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^(?!([0-9])\1{9})\d{10}$/;
  const NAME_RE = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;

  function _isValidEmail(val) {
    return EMAIL_RE.test((val || "").trim());
  }

  function _isValidPhone(val) {
    return PHONE_RE.test((val || "").trim());
  }

  function _isValidName(val) {
    return NAME_RE.test((val || "").trim());
  }

  function _ok() {
    return { valid: true };
  }
  function _fail(error) {
    return { valid: false, error };
  }

  /* ===========================================================================
       validateLogin({ email, password })
       =========================================================================== */
  function validateLogin({ email, password } = {}) {
    if (!(email || "").trim()) return _fail("Email is required.");
    if (!_isValidEmail(email))
      return _fail("Please enter a valid email address.");
    if (!(password || "").trim()) return _fail("Password is required.");
    return _ok();
  }

  /* ===========================================================================
       validateScheduledAt(scheduledAt)
       - Must be in the future
       - Must be no more than 7 calendar days from now
       =========================================================================== */
  function validateScheduledAt(scheduledAt) {
    if (!scheduledAt) return _fail("Scheduled date/time is required.");
    const selected = new Date(scheduledAt);
    if (isNaN(selected)) return _fail("Invalid date/time format.");

    const now = new Date();
    const rules =
      window.AppStore && typeof AppStore.getBookingRules === "function"
        ? AppStore.getBookingRules()
        : {
            minNoticeMinutes: 60,
            maxAdvanceMinutes: 7 * 24 * 60,
            minNoticeLabel: "1 hour",
            maxAdvanceLabel: "7 days",
          };

    const minAllowed = new Date(
      now.getTime() + rules.minNoticeMinutes * 60 * 1000,
    );
    const maxAllowed = new Date(
      now.getTime() + rules.maxAdvanceMinutes * 60 * 1000,
    );

    if (selected < minAllowed)
      return _fail(
        "Scheduled time must be at least " +
          rules.minNoticeLabel +
          " from now.",
      );
    if (selected > maxAllowed)
      return _fail(
        "Scheduled time must be within " + rules.maxAdvanceLabel + " from now.",
      );
    return _ok();
  }

  /* ===========================================================================
       validateBooking({ booking_type, scheduled_at, service_address,
                         sector_id, customer_id })
       =========================================================================== */
  function validateBooking({
    booking_type,
    scheduled_at,
    service_address,
    sector_id,
    customer_id,
  } = {}) {
    if (!(service_address || "").trim())
      return _fail("Service address is required.");
    if ((service_address || "").trim().length < 10)
      return _fail("Service address must be at least 10 characters.");
    if (!(sector_id || "").toString().trim())
      return _fail("Sector is required.");
    if (!(customer_id || "").toString().trim())
      return _fail("Customer is required.");

    if (booking_type === "SCHEDULED") {
      return validateScheduledAt(scheduled_at);
    }
    /* INSTANT: no date validation needed */
    return _ok();
  }

  /* ===========================================================================
       validateProvider({ name, phone, email, dob, address, gender,
                          unit_id, home_sector_id })
       NOTE: No "experience" field.
       =========================================================================== */
  function validateProvider({
    name,
    phone,
    email,
    dob,
    address,
    gender,
    unit_id,
    home_sector_id,
  } = {}) {
    if (!(name || "").trim()) return _fail("Name is required.");
    if ((name || "").trim().length < 2)
      return _fail("Name must be at least 2 characters.");
    if (!_isValidName(name))
      return _fail("Name can contain letters and spaces only.");

    if (!_isValidPhone(phone))
      return _fail(
        "Phone must be a valid 10-digit number (digits only, not all same digit).",
      );

    if (!_isValidEmail(email))
      return _fail("Please enter a valid email address.");

    if (!(dob || "").trim()) return _fail("Date of birth is required.");

    const dobDate = new Date(dob);
    if (isNaN(dobDate)) return _fail("Invalid date of birth.");
    if (dobDate >= new Date())
      return _fail("Date of birth must be in the past.");

    const ageDiff = Date.now() - dobDate.getTime();
    const age = Math.floor(ageDiff / (1000 * 60 * 60 * 24 * 365.25));
    if (age < 18) return _fail("Provider must be at least 18 years old.");

    if (!(address || "").trim()) return _fail("Address is required.");
    if ((address || "").trim().length < 5)
      return _fail("Address must be at least 5 characters.");

    if (!["Male", "Female", "Other"].includes(gender))
      return _fail("Gender must be Male, Female, or Other.");

    if (!(unit_id || "").toString().trim()) return _fail("Unit is required.");

    if (!(home_sector_id || "").toString().trim())
      return _fail("Home sector is required.");

    return _ok();
  }

  /* ===========================================================================
       validateService({ service_name, base_price, estimated_duration_min,
                         category_id })
       =========================================================================== */
  function validateService({
    service_name,
    base_price,
    estimated_duration_min,
    category_id,
  } = {}) {
    if (!(service_name || "").trim()) return _fail("Service name is required.");
    if ((service_name || "").trim().length < 3)
      return _fail("Service name must be at least 3 characters.");

    const price = parseFloat(base_price);
    if (isNaN(price) || price <= 0)
      return _fail("Base price must be a positive number.");

    const duration = parseInt(estimated_duration_min, 10);
    if (isNaN(duration) || duration <= 0 || !Number.isInteger(duration))
      return _fail(
        "Estimated duration must be a positive whole number (minutes).",
      );

    if (!(category_id || "").toString().trim())
      return _fail("Category is required.");

    return _ok();
  }

  /* ===========================================================================
       validatePackage({ package_name, price, package_type })
       =========================================================================== */
  function validatePackage({ package_name, price, package_type } = {}) {
    if (!(package_name || "").trim()) return _fail("Package name is required.");
    if ((package_name || "").trim().length < 3)
      return _fail("Package name must be at least 3 characters.");

    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) return _fail("Price must be a positive number.");

    if (!["STANDARD", "CUSTOM", "PREMIUM"].includes(package_type))
      return _fail("Package type must be STANDARD, CUSTOM, or PREMIUM.");

    return _ok();
  }

  /* ===========================================================================
       validateUserProfile({ name, phone, email })
       =========================================================================== */
  function validateUserProfile({ name, phone, email } = {}) {
    if (!(name || "").trim()) return _fail("Name is required.");
    if ((name || "").trim().length < 2)
      return _fail("Name must be at least 2 characters.");
    if (!_isValidName(name))
      return _fail("Name can contain letters and spaces only.");

    if (!_isValidPhone(phone))
      return _fail(
        "Phone must be a valid 10-digit number (digits only, not all same digit).",
      );

    if (!_isValidEmail(email))
      return _fail("Please enter a valid email address.");

    return _ok();
  }

  /* ===========================================================================
       validateUnit({ unit_name, collective_id })
       =========================================================================== */
  function validateUnit({ unit_name, collective_id } = {}) {
    if (!(unit_name || "").trim()) return _fail("Unit name is required.");
    if ((unit_name || "").trim().length < 3)
      return _fail("Unit name must be at least 3 characters.");

    if (!(collective_id || "").toString().trim())
      return _fail("Collective is required.");

    return _ok();
  }

  /* ===========================================================================
       validateCategory({ category_name })
       =========================================================================== */
  function validateCategory({ category_name } = {}) {
    if (!(category_name || "").trim())
      return _fail("Category name is required.");
    if ((category_name || "").trim().length < 2)
      return _fail("Category name must be at least 2 characters.");

    return _ok();
  }

  /* ─── Public API ─── */
  return {
    validateLogin,
    validateScheduledAt,
    validateBooking,
    validateProvider,
    validateService,
    validatePackage,
    validateUserProfile,
    validateUnit,
    validateCategory,
  };
})();
