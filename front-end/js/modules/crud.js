/* =============================================================================
   TATKU UNITED — CRUD MODULE
   front-end/js/modules/crud.js
   Depends on: js/data/store.js, js/modules/auth.js
   NOTE: showToast() and showConfirmDialog() are defined in helpers.js which
         loads after this file, but these functions are only ever called from
         user interactions — by that time helpers.js is fully initialised.
   ============================================================================= */

window.CRUD = (() => {

  /* ── Active-job statuses used in cascade checks ── */
  const ACTIVE_JOB_STATUSES   = ["ASSIGNED", "IN_PROGRESS"];
  const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS"];

  /* =========================================================================
     INTERNAL HELPERS
     ========================================================================= */

  /** Generate a simple unique ID (timestamp + random suffix). */
  function _genId(prefix = "REC") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }

  /** Show a non-blocking block dialog (no confirm option — action is denied). */
  function _showBlockDialog(message) {
    /* Falls back gracefully if showConfirmDialog supports a "block" mode,
       otherwise uses a plain modal constructed inline. */
    if (typeof showConfirmDialog === "function") {
      showConfirmDialog({
        title:     "Action Not Allowed",
        message,
        confirmLabel: "OK",
        cancelLabel:  null,       /* no cancel — single button */
        onConfirm:    () => {},
      });
    } else {
      /* Minimal fallback — should never reach here in production */
      console.warn("[CRUD] showConfirmDialog not yet loaded:", message);
    }
  }

  /* =========================================================================
     CREATE
     ========================================================================= */
  /**
   * createRecord(tableName, newData)
   * Pushes newData into the named table and persists.
   * Returns the newly created record.
   */
  function createRecord(tableName, newData) {
    const table = AppStore.getTable(tableName);
    if (!Array.isArray(table)) {
      showToast(`Table "${tableName}" not found.`, "error");
      return null;
    }

    table.push(newData);
    AppStore.save();

    showToast("Record created successfully.", "success");
    return newData;
  }

  /* =========================================================================
     UPDATE
     ========================================================================= */
  /**
   * updateRecord(tableName, idField, id, updatedFields)
   * Finds the record by idField === id and merges updatedFields into it.
   * Returns the updated record, or null if not found.
   */
  function updateRecord(tableName, idField, id, updatedFields) {
    const table = AppStore.getTable(tableName);
    if (!Array.isArray(table)) {
      showToast(`Table "${tableName}" not found.`, "error");
      return null;
    }

    const index = table.findIndex(r => r[idField] === id);
    if (index === -1) {
      showToast("Record not found.", "error");
      return null;
    }

    Object.assign(table[index], updatedFields);
    AppStore.save();

    showToast("Record updated successfully.", "success");
    return table[index];
  }

  /* =========================================================================
     DELETE
     ========================================================================= */
  /**
   * deleteRecord(tableName, idField, id, onConfirm)
   * Shows a confirmation dialog; on user confirmation calls onConfirm()
   * then removes the record from the table and persists.
   * onConfirm is optional — use it for cascade deletes or extra logic.
   */
  function deleteRecord(tableName, idField, id, onConfirm) {
    showConfirmDialog({
      title:        "Confirm Delete",
      message:      "Are you sure you want to delete this record? This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel:  "Cancel",
      onConfirm: () => {
        const table = AppStore.getTable(tableName);
        if (!Array.isArray(table)) {
          showToast(`Table "${tableName}" not found.`, "error");
          return;
        }

        const index = table.findIndex(r => r[idField] === id);
        if (index === -1) {
          showToast("Record not found.", "error");
          return;
        }

        table.splice(index, 1);

        if (typeof onConfirm === "function") {
          onConfirm();
        }

        AppStore.save();
        showToast("Record deleted successfully.", "success");
      },
    });
  }

  /* =========================================================================
     PROVIDER DOCUMENT — RESUME UPSERT
     ========================================================================= */
  /**
   * upsertProviderResume(providerId, fileData)
   * If a resume already exists for this provider, replace it.
   * Otherwise, insert a new record. Always persists after the operation.
   * fileData should contain: { file_name, file_url, file_type, uploaded_at }
   */
  function upsertProviderResume(providerId, fileData) {
    const docs = AppStore.getTable("provider_documents");
    if (!Array.isArray(docs)) {
      showToast("provider_documents table not found.", "error");
      return null;
    }

    const existingIndex = docs.findIndex(
      d => d.service_provider_id === providerId && d.document_type === "resume"
    );

    const record = {
      service_provider_id: providerId,
      document_type:       "resume",
      file_name:           fileData.file_name,
      file_url:            fileData.file_url,
      file_type:           fileData.file_type,
      uploaded_at:         fileData.uploaded_at || new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      /* Preserve the existing doc_id */
      record.doc_id = docs[existingIndex].doc_id;
      Object.assign(docs[existingIndex], record);
      AppStore.save();
      showToast("Resume updated successfully.", "success");
      return docs[existingIndex];
    } else {
      record.doc_id = _genId("DOC");
      docs.push(record);
      AppStore.save();
      showToast("Resume uploaded successfully.", "success");
      return record;
    }
  }

  /* =========================================================================
     PROVIDER DOCUMENT — CERTIFICATE ADD
     ========================================================================= */
  /**
   * addProviderCertificate(providerId, fileData)
   * Always inserts a new certificate record (multiple certificates allowed).
   * fileData should contain: { file_name, file_url, file_type, uploaded_at }
   */
  function addProviderCertificate(providerId, fileData) {
    const docs = AppStore.getTable("provider_documents");
    if (!Array.isArray(docs)) {
      showToast("provider_documents table not found.", "error");
      return null;
    }

    const record = {
      doc_id:              _genId("DOC"),
      service_provider_id: providerId,
      document_type:       "certificate",
      file_name:           fileData.file_name,
      file_url:            fileData.file_url,
      file_type:           fileData.file_type,
      uploaded_at:         fileData.uploaded_at || new Date().toISOString(),
    };

    docs.push(record);
    AppStore.save();
    showToast("Certificate added successfully.", "success");
    return record;
  }

  /* =========================================================================
     CASCADE DELETE CHECKS
     ========================================================================= */

  /**
   * checkDeleteCollective(collectiveId)
   * Warns if there are units → providers → active job assignments under
   * this collective. Returns a warning string or null if safe.
   */
  function checkDeleteCollective(collectiveId) {
    const units     = AppStore.getTable("units")            || [];
    const providers = AppStore.getTable("service_providers") || [];
    const jobs      = AppStore.getTable("job_assignments")   || [];

    const childUnits = units.filter(u => u.collective_id === collectiveId);
    const unitIds    = childUnits.map(u => u.unit_id);

    const childProviders = providers.filter(p => unitIds.includes(p.unit_id));
    const providerIds    = childProviders.map(p => p.sp_id);

    const activeJobs = jobs.filter(
      j => providerIds.includes(j.service_provider_id) &&
           ACTIVE_JOB_STATUSES.includes(j.status)
    );

    if (activeJobs.length > 0) {
      return (
        `This collective has ${childUnits.length} unit(s) containing ` +
        `${childProviders.length} provider(s) with ${activeJobs.length} ` +
        `active job assignment(s) (ASSIGNED or IN_PROGRESS). ` +
        `Resolve all active jobs before deleting this collective.`
      );
    }
    return null;
  }

  /**
   * checkDeleteUnit(unitId)
   * Warns if there are providers → active job assignments under this unit.
   * Returns a warning string or null if safe.
   */
  function checkDeleteUnit(unitId) {
    const providers = AppStore.getTable("service_providers") || [];
    const jobs      = AppStore.getTable("job_assignments")   || [];

    const childProviders = providers.filter(p => p.unit_id === unitId);
    const providerIds    = childProviders.map(p => p.sp_id);

    const activeJobs = jobs.filter(
      j => providerIds.includes(j.service_provider_id) &&
           ACTIVE_JOB_STATUSES.includes(j.status)
    );

    if (activeJobs.length > 0) {
      return (
        `This unit has ${childProviders.length} provider(s) with ` +
        `${activeJobs.length} active job assignment(s) (ASSIGNED or IN_PROGRESS). ` +
        `Resolve all active jobs before deleting this unit.`
      );
    }
    return null;
  }

  /**
   * checkDeleteProvider(providerId)
   * BLOCKS deletion if there are active job assignments for this provider.
   * On a safe delete, also cascades to remove all provider_documents.
   * Returns a block message string or null if safe.
   */
  function checkDeleteProvider(providerId) {
    const jobs = AppStore.getTable("job_assignments") || [];

    const activeJobs = jobs.filter(
      j => j.service_provider_id === providerId &&
           ACTIVE_JOB_STATUSES.includes(j.status)
    );

    if (activeJobs.length > 0) {
      return (
        `This provider has ${activeJobs.length} active job assignment(s) ` +
        `(ASSIGNED or IN_PROGRESS). Deletion is not allowed until all ` +
        `active jobs are completed or cancelled.`
      );
    }

    /* Safe — cascade delete provider_documents */
    const docs = AppStore.getTable("provider_documents") || [];
    const remaining = docs.filter(d => d.service_provider_id !== providerId);
    /* Replace contents of the array in-place */
    docs.splice(0, docs.length, ...remaining);
    /* Caller is responsible for calling AppStore.save() after actual delete */

    return null;
  }

  /**
   * checkDeleteCategory(categoryId)
   * Warns if there are services linked to this category.
   * Returns a warning string or null if safe.
   */
  function checkDeleteCategory(categoryId) {
    const services = AppStore.getTable("services") || [];
    const linked   = services.filter(s => s.category_id === categoryId);

    if (linked.length > 0) {
      return (
        `This category has ${linked.length} service(s) linked to it. ` +
        `Reassign or delete those services before removing this category.`
      );
    }
    return null;
  }

  /**
   * checkDeleteCustomer(customerId)
   * BLOCKS deletion if the customer has any active bookings.
   * Returns a block message string or null if safe.
   */
  function checkDeleteCustomer(customerId) {
    const bookings = AppStore.getTable("bookings") || [];

    const activeBookings = bookings.filter(
      b => b.customer_id === customerId &&
           ACTIVE_BOOKING_STATUSES.includes(b.status)
    );

    if (activeBookings.length > 0) {
      return (
        `This customer has ${activeBookings.length} active booking(s) ` +
        `(PENDING, CONFIRMED, or IN_PROGRESS). Deletion is not allowed ` +
        `until all active bookings are resolved.`
      );
    }
    return null;
  }

  /* =========================================================================
     PUBLIC API
     ========================================================================= */
  return {
    createRecord,
    updateRecord,
    deleteRecord,
    upsertProviderResume,
    addProviderCertificate,
    checkDeleteCollective,
    checkDeleteUnit,
    checkDeleteProvider,
    checkDeleteCategory,
    checkDeleteCustomer,
  };

})();
