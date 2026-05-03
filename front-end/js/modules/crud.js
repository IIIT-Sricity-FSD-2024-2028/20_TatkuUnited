/* =============================================================================
   TATKU UNITED — CRUD MODULE — API-backed
   front-end/js/modules/crud.js
   ============================================================================= */

window.CRUD = (() => {

  const ACTIVE_JOB_STATUSES   = ["ASSIGNED", "IN_PROGRESS"];
  const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS"];

  function _genId(prefix = "REC") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }

  function _showBlockDialog(message) {
    if (typeof showConfirmDialog === "function") {
      showConfirmDialog({ title: "Action Not Allowed", message, confirmLabel: "OK", cancelLabel: null, onConfirm: () => {} });
    }
  }

  /* =========================================================================
     CREATE — POST to API
     ========================================================================= */
  async function createRecord(tableName, newData) {
    try {
      const result = await Api.post("/" + tableName, newData);
      showToast("Record created successfully.", "success");
      return result;
    } catch (err) {
      showToast(`Failed to create record in "${tableName}".`, "error");
      return null;
    }
  }

  /* =========================================================================
     UPDATE — PATCH to API
     ========================================================================= */
  async function updateRecord(tableName, idField, id, updatedFields) {
    try {
      const result = await Api.patch("/" + tableName + "/" + id, updatedFields);
      showToast("Record updated successfully.", "success");
      return result;
    } catch (err) {
      showToast("Failed to update record.", "error");
      return null;
    }
  }

  /* =========================================================================
     DELETE — DELETE via API
     ========================================================================= */
  function deleteRecord(tableName, idField, id, onConfirm) {
    showConfirmDialog({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this record? This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        try {
          await Api.del("/" + tableName + "/" + id);
          if (typeof onConfirm === "function") onConfirm();
          showToast("Record deleted successfully.", "success");
        } catch (err) {
          showToast("Failed to delete record.", "error");
        }
      },
    });
  }

  /* =========================================================================
     PROVIDER DOCUMENT — RESUME UPSERT
     ========================================================================= */
  async function upsertProviderResume(providerId, fileData) {
    try {
      const result = await Api.post("/provider-documents/" + providerId + "/resume", fileData);
      showToast("Resume uploaded successfully.", "success");
      return result;
    } catch (err) {
      showToast("Failed to upload resume.", "error");
      return null;
    }
  }

  /* =========================================================================
     PROVIDER DOCUMENT — CERTIFICATE ADD
     ========================================================================= */
  async function addProviderCertificate(providerId, fileData) {
    try {
      const result = await Api.post("/provider-documents/" + providerId + "/certificate", fileData);
      showToast("Certificate added successfully.", "success");
      return result;
    } catch (err) {
      showToast("Failed to add certificate.", "error");
      return null;
    }
  }

  /* =========================================================================
     CASCADE DELETE CHECKS — via API
     ========================================================================= */

  async function checkDeleteCollective(collectiveId) {
    let units=[], providers=[], jobs=[];
    units  = await Api.get("/units");
    providers  = await Api.get("/service-providers");
    jobs  = await Api.get("/job-assignments");

    const childUnits = units.filter(u => u.collective_id === collectiveId);
    const unitIds = childUnits.map(u => u.unit_id);
    const childProviders = providers.filter(p => unitIds.includes(p.unit_id));
    const providerIds = childProviders.map(p => p.service_provider_id);
    const activeJobs = jobs.filter(j => providerIds.includes(j.service_provider_id) && ACTIVE_JOB_STATUSES.includes(j.status));

    if (activeJobs.length > 0) {
      return `This collective has ${childUnits.length} unit(s) containing ${childProviders.length} provider(s) with ${activeJobs.length} active job assignment(s). Resolve all active jobs before deleting.`;
    }
    return null;
  }

  async function checkDeleteUnit(unitId) {
    let providers=[], jobs=[];
    providers  = await Api.get("/service-providers");
    jobs  = await Api.get("/job-assignments");

    const childProviders = providers.filter(p => p.unit_id === unitId);
    const providerIds = childProviders.map(p => p.service_provider_id);
    const activeJobs = jobs.filter(j => providerIds.includes(j.service_provider_id) && ACTIVE_JOB_STATUSES.includes(j.status));

    if (activeJobs.length > 0) {
      return `This unit has ${childProviders.length} provider(s) with ${activeJobs.length} active job assignment(s). Resolve all active jobs before deleting.`;
    }
    return null;
  }

  async function checkDeleteProvider(providerId) {
    let jobs=[];
    jobs  = await Api.get("/job-assignments");
    const activeJobs = jobs.filter(j => j.service_provider_id === providerId && ACTIVE_JOB_STATUSES.includes(j.status));

    if (activeJobs.length > 0) {
      return `This provider has ${activeJobs.length} active job assignment(s). Deletion is not allowed until all active jobs are completed or cancelled.`;
    }
    return null;
  }

  async function checkDeleteCategory(categoryId) {
    let services=[];
    services  = await Api.get("/services");
    const linked = services.filter(s => s.category_id === categoryId);

    if (linked.length > 0) {
      return `This category has ${linked.length} service(s) linked to it. Reassign or delete those services before removing this category.`;
    }
    return null;
  }

  async function checkDeleteCustomer(customerId) {
    let bookings=[];
    bookings  = await Api.get("/bookings");
    const activeBookings = bookings.filter(b => b.customer_id === customerId && ACTIVE_BOOKING_STATUSES.includes(b.status));

    if (activeBookings.length > 0) {
      return `This customer has ${activeBookings.length} active booking(s). Deletion is not allowed until all active bookings are resolved.`;
    }
    return null;
  }

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
