function saveSection(section) {
  showToast(section === 'personal' ? 'Personal info saved!' : 'Professional details saved!');
}

function removeTag(btn) {
  btn.closest('.skill-tag').remove();
}

function addTag(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const input = document.getElementById('tag-input');
    const val = input.value.trim().replace(/,$/, '');
    if (!val) return;
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `${val} <button onclick="removeTag(this)">×</button>`;
    document.getElementById('tags-field').insertBefore(tag, input);
    input.value = '';
  }
}

function showPasswordModal() {
  document.getElementById('pwd-modal').classList.add('open');
}
function closePwdModalBtn() {
  document.getElementById('pwd-modal').classList.remove('open');
}
function closePwdModal(e) {
  if (e.target === document.getElementById('pwd-modal')) closePwdModalBtn();
}

function toggle2FA(checkbox) {
  showToast(checkbox.checked ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.');
}

function confirmDeactivate() {
  if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
    showToast('Account deactivation request submitted.');
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
