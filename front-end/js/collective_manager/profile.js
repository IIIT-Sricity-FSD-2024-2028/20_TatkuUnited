// ── Collective Manager Profile JS — API-backed ──
let _session = null, _cm = null, _collective = null, _myUnits = [];

(async () => {
  _session = Auth.requireSession(["collective_manager"]); if (!_session) return;
  const cmId = _session.id, collectiveId = _session.collectiveId;

  let allCMs=[], allCollectives=[], allUnits=[], allProviders=[], allSectors=[];
  allCMs  = await Api.get("/collective-managers");
  allCollectives  = await Api.get("/collectives");
  allUnits  = await Api.get("/units");
  allProviders  = await Api.get("/service-providers");
  allSectors  = await Api.get("/sectors");

  _cm = allCMs.find(c => c.cm_id === cmId) || null;
  _collective = allCollectives.find(c => c.collective_id === collectiveId) || null;
  _myUnits = allUnits.filter(u => u.collective_id === collectiveId);

  hydrateHero(_cm, _collective, _myUnits, allProviders);
  hydratePersonalCard(_cm);
  hydrateCollectiveCard(_collective, allSectors);
  renderUnits(_myUnits, u => getUnitProviderCount(u, allProviders));
  renderActivities(_collective, _myUnits);
})();

function getInitials(name) { if (!name) return "CM"; const p = name.trim().split(" ").filter(Boolean); if (p.length>=2) return (p[0][0]+p[p.length-1][0]).toUpperCase(); return p[0].slice(0,2).toUpperCase(); }
function getUnitProviderCount(unit, allProviders) { return allProviders.filter(p => p.unit_id === unit.unit_id).length; }

function hydrateHero(cm, collective, units, allProviders) {
  const name = cm ? cm.name : "Collective Manager", email = cm ? cm.email : "", pfp = cm ? cm.pfp_url : null;
  const initials = getInitials(name); const unitIds = units.map(u => u.unit_id);
  const provCount = allProviders.filter(p => unitIds.includes(p.unit_id)).length;
  document.getElementById("hero-name").textContent = name;
  document.getElementById("hero-email").textContent = email;
  const av = document.getElementById("profile-avatar");
  if (pfp) av.innerHTML = `<img src="${pfp}" alt="${name}" />`; else av.textContent = initials;
  const topbarAv = document.getElementById("topbar-avatar");
  if (topbarAv) { if (pfp) topbarAv.innerHTML = `<img src="${pfp}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`; else topbarAv.textContent = initials; }
  const unitsEl = document.getElementById("stat-units"); if (unitsEl) unitsEl.textContent = units.length;
  const provEl = document.getElementById("stat-providers"); if (provEl) provEl.textContent = provCount;
}

function hydratePersonalCard(cm) { if (!cm) return; setVal("full-name",cm.name); setVal("email",cm.email); setVal("phone",String(cm.phone||"").replace(/\D/g,"").slice(-10)); const dobEl=document.getElementById("dob"); if(dobEl) dobEl.value=cm.dob||""; document.getElementById("hero-name").textContent=cm.name; document.getElementById("hero-email").textContent=cm.email; }
function hydrateCollectiveCard(collective, allSectors) { 
  if (!collective) return; 
  setVal("collective-name",collective.collective_name); 
  setVal("collective-id",collective.collective_id); 
  const sectorIds=collective.sector_ids||[]; 
  const regionSelect=document.getElementById("region"); 
  if(regionSelect) { 
    regionSelect.innerHTML=""; 
    const collectiveSectors=allSectors.filter(s=>sectorIds.includes(s.sector_id)); 
    if(collectiveSectors.length>0) { 
      const regionName=collectiveSectors[0].region; 
      const defaultOpt=document.createElement("option"); 
      defaultOpt.text=`Region: ${regionName}`; 
      defaultOpt.value=""; 
      regionSelect.appendChild(defaultOpt); 
      collectiveSectors.forEach(s=>{ 
        const opt=document.createElement("option"); 
        opt.text=s.sector_name; 
        opt.value=s.sector_id; 
        opt.disabled=true; 
        regionSelect.appendChild(opt); 
      }); 
    } else { 
      const opt=document.createElement("option"); 
      opt.text="No sectors assigned"; 
      regionSelect.appendChild(opt); 
    } 
  } 
}
function setVal(id,val) { const el=document.getElementById(id); if(el) el.value=val||""; }

function renderUnits(units, countFn) {
  const el = document.getElementById("unit-list"); if (!el) return;
  if (!units.length) { el.innerHTML = '<p style="color:var(--muted);font-size:.875rem;padding:.5rem 0">No units assigned to this collective.</p>'; return; }
  el.innerHTML = units.map(u => {
    const active=u.is_active; const count=countFn(u);
    return `<div class="unit-item"><div class="unit-item-left"><div class="unit-dot ${active?'green':'amber'}"></div><div><div class="unit-name">${u.unit_name}</div><div class="unit-sub">${count} provider${count!==1?'s':''}</div></div></div><span class="unit-badge ${active?'':'amber'}">${active?'Active':'Inactive'}</span></div>`;
  }).join("");
}

function renderActivities(collective, units) {
  const el = document.getElementById("activity-list"); if (!el) return;
  const events = [];
  if (collective) events.push({title:"Collective created",desc:`${collective.collective_name} was registered on the platform`,time:formatDate(collective.created_at),color:"green"});
  units.slice(0,4).forEach(u => events.push({title:"Unit assigned",desc:`${u.unit_name} is part of your collective`,time:formatDate(u.created_at),color:u.is_active?"":"amber"}));
  if (!events.length) { el.innerHTML = '<p style="color:var(--muted);font-size:.875rem;padding:.5rem 0">No recent activity.</p>'; return; }
  el.innerHTML = events.map(a => `<div class="act-item"><div class="act-dot ${a.color}"></div><div class="act-body"><div class="act-title">${a.title}</div><div class="act-desc">${a.desc}</div><div class="act-time">${a.time}</div></div></div>`).join("");
}

function formatDate(isoStr) { if (!isoStr) return ""; try { return new Date(isoStr).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}); } catch(_){ return isoStr; } }

function syncName() { const v=document.getElementById("full-name").value.trim(); const fb=_cm&&_cm.name?_cm.name:"Collective Manager"; document.getElementById("hero-name").textContent=v||fb; const av=document.getElementById("profile-avatar"); if(!av.querySelector("img")) av.textContent=getInitials(v||fb); const ta=document.getElementById("topbar-avatar"); if(ta&&!ta.querySelector("img")) ta.textContent=getInitials(v||fb); }
function syncEmail() { const v=document.getElementById("email").value.trim(); const fb=_cm&&_cm.email?_cm.email:""; document.getElementById("hero-email").textContent=v||fb; }

async function saveSection(section) {
  if (section === "personal") {
    if (!_cm) { showToast("Profile not loaded."); return; }
    const name=(document.getElementById("full-name").value||"").trim();
    const email=(document.getElementById("email").value||"").trim();
    const rawPhone=(document.getElementById("phone").value||"").trim();
    const dob=(document.getElementById("dob").value||"").trim();
    if (!name) { showToast("Name cannot be empty."); return; }
    if (rawPhone && !/^\d{10}$/.test(rawPhone)) { showToast("Phone must be exactly 10 digits."); return; }
    try {
      await Api.patch("/collective-managers/"+_session.id, {name,email,phone:rawPhone,dob});
      _cm.name=name; _cm.email=email; _cm.phone=rawPhone; _cm.dob=dob;
      document.getElementById("hero-name").textContent=name;
      document.getElementById("hero-email").textContent=email;
      showToast("Personal information saved ✓");
    } catch(e) { showToast("Failed to save profile."); }
    return;
  }
  if (section === "collective") {
    if (!_collective) { showToast("Collective not loaded."); return; }
    const cName=(document.getElementById("collective-name").value||"").trim();
    if (!cName) { showToast("Collective name cannot be empty."); return; }
    try {
      await Api.patch("/collectives/"+_collective.collective_id, {collective_name:cName});
      _collective.collective_name=cName;
      showToast("Collective details saved ✓");
    } catch(e) { showToast("Failed to save collective."); }
    return;
  }
  showToast("Changes saved!");
}

function openPwdModal() { document.getElementById("pwd-modal").classList.add("open"); }
function closePwdModal(e) { if (e.target===document.getElementById("pwd-modal")) closePwdModalBtn(); }
function closePwdModalBtn() { document.getElementById("pwd-modal").classList.remove("open"); ["pwd-current","pwd-new","pwd-confirm"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; }); }
function handlePasswordChange() { const c=document.getElementById("pwd-current")?.value,n=document.getElementById("pwd-new")?.value,cf=document.getElementById("pwd-confirm")?.value; if(!c||!n||!cf){showToast("Please fill in all password fields.");return;} if(n!==cf){showToast("New passwords do not match.");return;} if(n.length<8){showToast("New password must be at least 8 characters.");return;} const res=Auth.changePassword(c,n); if(res.success){showToast("Password updated successfully!");closePwdModalBtn();}else{showToast({invalid_current_password:"Current password is incorrect.",not_logged_in:"Session expired."}[res.error]||"Failed to update password.");} }
function updateAvatar(input) { if(!input.files||!input.files[0])return; const file=input.files[0]; if(!file.type.startsWith("image/")){showToast("Please choose a valid image file.");return;} if(file.size>2*1024*1024){showToast("Profile photo must be under 2 MB.");return;} const reader=new FileReader(); reader.onload=(e)=>{const imageData=e.target.result;const res=Auth.updateProfilePicture(imageData);if(!res.success){showToast("Unable to update profile photo.");return;}if(_cm)_cm.pfp_url=imageData;document.getElementById("profile-avatar").innerHTML=`<img src="${imageData}" alt="avatar" />`;const ta=document.getElementById("topbar-avatar");if(ta)ta.innerHTML=`<img src="${imageData}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;showToast("Profile photo updated ✓");}; reader.readAsDataURL(file); }
function confirmDelete() { if(confirm("Are you sure you want to deactivate your account? This cannot be undone.")) showToast("Account deactivation requested."); }

let toastTimer;
function showToast(msg) { const toast=document.getElementById("toast"); toast.textContent=msg; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),3000); }
