/* platform_settings.js */
document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('save-btn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', () => {
    const settings = {
      platformOnline:     document.getElementById('platform-online')?.checked,
      maintenanceMode:    document.getElementById('maintenance-mode')?.checked,
      accountSuspension:  document.getElementById('account-suspension')?.checked,
      ratingThreshold:    document.getElementById('rating-threshold')?.value,
      instantBooking:     document.getElementById('instant-booking')?.checked,
      maxAdvance:         document.getElementById('max-advance')?.value,
      minNotice:          document.getElementById('min-notice')?.value,
      cancelWindow:       document.getElementById('cancel-window')?.value,
      adminApproval:      document.getElementById('admin-approval')?.checked,
      docVerification:    document.getElementById('doc-verification')?.checked,
      notifBooking:       document.getElementById('notif-booking')?.checked,
      notifProvider:      document.getElementById('notif-provider')?.checked,
      notifReminders:     document.getElementById('notif-reminders')?.checked,
    };

    console.log('Settings saved:', settings);

    // Visual feedback
    const orig = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.background = '#16a34a';
    setTimeout(() => {
      saveBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Save Changes`;
      saveBtn.style.background = '';
    }, 2000);
  });
});
