const $ = id => document.getElementById(id);

const translations = {
  en: {
    heroTitle: "From Kisan to Mandi — Simple, Fast & Transparent",
    heroText: "KisanLink helps farmers find the right procurement slot, avoid overloaded centres, track their queue and follow payment status.",
    regTitle: "New Kisan Registration & Profile",
    profileTitle: "Farmer Profile & Land Revenue Record"
  },
  hi: {
    heroTitle: "किसान से मंडी तक — आसान, तेज़ और पारदर्शी",
    heroText: "KisanLink किसानों को सही खरीद स्लॉट खोजने, भीड़भाड़ वाले केंद्रों से बचने, कतार और भुगतान की स्थिति ट्रैक करने में मदद करता है।",
    regTitle: "नया किसान पंजीकरण एवं प्रोफाइल",
    profileTitle: "किसान प्रोफाइल एवं भूमि रिकॉर्ड"
  }
};

const mandis = [
  {name:"Jaipur Central Procurement Centre", district:"Jaipur", capacity:91, total:"10,000 Q", available:"900 Q", queue:42, wait:"65 min", status:"High Load"},
  {name:"Kota Government Mandi", district:"Kota", capacity:64, total:"12,000 Q", available:"4,320 Q", queue:18, wait:"25 min", status:"Normal"},
  {name:"Ajmer Procurement Centre", district:"Ajmer", capacity:87, total:"9,000 Q", available:"1,170 Q", queue:31, wait:"48 min", status:"Moderate"},
  {name:"Alwar Grain Centre", district:"Alwar", capacity:59, total:"11,500 Q", available:"4,715 Q", queue:12, wait:"19 min", status:"Normal"},
  {name:"Mandi B — Tonk Road", district:"Jaipur", capacity:68, total:"8,500 Q", available:"2,720 Q", queue:8, wait:"40 min", status:"Normal"},
  {name:"Mandi C — Durgapura", district:"Jaipur", capacity:81, total:"11,000 Q", available:"2,090 Q", queue:4, wait:"20 min", status:"Recommended"}
];

const slots = [
  ["09:00 AM","20","20","0","12","Full"],
  ["09:30 AM","20","17","3","9","Limited"],
  ["10:00 AM","20","12","8","7","Available"],
  ["10:30 AM","20","5","15","4","Available"],
  ["11:00 AM","20","4","16","2","Available"]
];

const queueData = [
  ["KSL-042","Ramlal","Wheat","42 Q","10:30 AM","#7","Waiting"],
  ["KSL-043","Suresh","Paddy","35 Q","10:30 AM","#8","Waiting"],
  ["KSL-044","Mohan","Mustard","28 Q","11:00 AM","#9","Waiting"],
  ["KSL-045","Gopal","Wheat","50 Q","11:00 AM","#10","In Process"],
  ["KSL-046","Ravi","Bajra","22 Q","11:30 AM","#11","Waiting"]
];

let queuePosition = 7;
let language = "en";

const DUMMY_USERS = {
  kisan: {
    role: "kisan",
    name: "Ramlal Ji",
    fatherName: "Shri Hariram Sharma",
    title: "Kisan • Jaipur District",
    phone: "9876543210",
    id: "KSL-KISAN-042",
    otp: "1234",
    aadhaar: "XXXX-XXXX-8921",
    rawAadhaar: "482910398921",
    gender: "Male / पुरुष",
    category: "OBC / अन्य पिछड़ा वर्ग",
    state: "Rajasthan / राजस्थान",
    district: "Jaipur / जयपुर",
    tehsil: "Amber / आमेर",
    village: "Rampura / रामपुरा",
    khasra: "142/3, 145/1",
    area: "8.5 Bigha (2.12 Ha)",
    ownership: "Self-Owned (स्वयं की भूमि)",
    crop: "Wheat / गेहूं (शरबती)",
    season: "Rabi 2026 (रबी 2026)",
    quantity: "42 Quintals",
    mandi: "Jaipur Central Procurement Centre",
    bankName: "State Bank of India (SBI)",
    accHolder: "Ramlal Sharma",
    accNum: "••••••••4820",
    ifsc: "SBIN0001234",
    dbtStatus: "Active & Verified ✓",
    initials: "RS",
    badge: "🌾 Kisan",
    targetView: "farmer",
    welcome: "नमस्ते, रामलाल जी 🙏"
  },
  officer: {
    role: "officer",
    name: "Insp. Rajesh Sharma",
    title: "Jaipur Central Mandi",
    id: "OFFICER-JPR-102",
    password: "officer@123",
    mandi: "Jaipur Central Procurement Centre",
    initials: "RS",
    badge: "🏭 Mandi Officer",
    targetView: "officer",
    welcome: "Good morning, Officer Rajesh Sharma 👋"
  },
  government: {
    role: "government",
    name: "Dr. Sunita Verma",
    title: "Joint Director (Agri)",
    email: "gov.sunita@agri.rajasthan.gov.in",
    password: "govadmin@2026",
    pin: "8820",
    initials: "SV",
    badge: "🇮🇳 Gov Official",
    targetView: "government",
    welcome: "Welcome, Director Sunita Verma 👋"
  }
};

let currentUser = null;
let activeLoginRole = "kisan";
let pendingRedirect = null;

function showView(view) {
  // Strict role-based routing guard
  if (currentUser) {
    if (currentUser.role === "kisan" && (view === "officer" || view === "government")) {
      showToast("Access Restricted: Only Kisan operations are permitted in this session.", true);
      view = "farmer";
    } else if (currentUser.role === "officer" && (view === "farmer" || view === "government")) {
      showToast("Access Restricted: Only Mandi Officer operations are permitted in this session.", true);
      view = "officer";
    } else if (currentUser.role === "government" && (view === "farmer" || view === "officer")) {
      showToast("Access Restricted: Only Government Command operations are permitted in this session.", true);
      view = "government";
    } else if (view === "login") {
      showToast(`Already signed in as ${currentUser.name}. Sign out to switch roles.`);
      view = currentUser.targetView;
    }
  } else {
    if (view === "farmer" || view === "officer" || view === "government") {
      const roleMap = { farmer: "kisan", officer: "officer", government: "government" };
      showLogin(roleMap[view]);
      return;
    }
  }

  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const target = $(view);
  if (target) target.classList.add("active");
  window.scrollTo({top:0, behavior:"smooth"});
  updateNavHighlight();

  if (view === "farmer") {
    farmerTab("overview");
    renderMandis();
    renderFarmerProfile();
  }
  if (view === "officer") {
    renderSlots();
    renderQueueTable();
  }
  if (view === "government") {
    renderCharts();
  }
}

function scrollToSection(id) {
  const el = $(id);
  if (el) el.scrollIntoView({behavior:"smooth"});
}

function farmerTab(tab, button) {
  document.querySelectorAll(".farmer-tab").forEach(x => x.classList.add("hidden"));
  const selected = $(`farmer-${tab}`);
  if (selected) selected.classList.remove("hidden");

  document.querySelectorAll("#farmer .side-link").forEach(x => x.classList.remove("active"));

  if (button) {
    button.classList.add("active");
  } else {
    const links = document.querySelectorAll("#farmer .side-link");
    const map = {overview:0, booking:1, queue:2, payment:3, mandis:4, profile:5};
    if (map[tab] !== undefined && links[map[tab]]) {
      links[map[tab]].classList.add("active");
    }
  }

  if (tab === "mandis") renderMandis();
  if (tab === "profile") renderFarmerProfile();
}

function openBooking() {
  navigateToPortal("farmer", "booking");
}

function findBestSlot() {
  const selectedMandi = $("mandi").value;
  const quantity = Number($("quantity").value) || 1;
  const crop = $("crop").value;
  const isFull = selectedMandi.includes("High Load");
  const preferred = mandis.find(m => selectedMandi.includes(m.name.split(" ")[0])) || mandis[0];
  const recommended = isFull || preferred.capacity >= 88 ? mandis[5] : preferred;

  $("recommendationContent").innerHTML = `
    <div class="smart-result">
      <span class="badge success">✓ ${isFull ? "ALTERNATIVE CENTRE FOUND" : "BEST MATCH FOUND"}</span>
      <h2>${recommended.name}</h2>
      <p class="result-note">${recommended.district} • ${crop} • ${quantity} Quintal</p>
      <div class="result-metrics">
        <div class="metric"><span>Recommended Slot</span><b>10:30 – 11:00 AM</b></div>
        <div class="metric"><span>Expected Queue</span><b>${recommended.queue} farmers</b></div>
        <div class="metric"><span>Available Capacity</span><b>${100-recommended.capacity}%</b></div>
      </div>
      <div class="why"><b>Why KisanLink recommends this</b><ul>
        <li>Lower expected waiting time</li>
        <li>Sufficient warehouse capacity for your produce</li>
        <li>Lower queue load than overloaded centres</li>
      </ul></div>
      <button class="btn btn-primary full" onclick="confirmSlot()">Confirm Recommended Slot →</button>
    </div>`;

  showToast(isFull
    ? "Selected centre is full — alternative mandi recommended."
    : "Best slot found using capacity + queue demo logic.");

  if (isFull || preferred.capacity >= 88) {
    $("alternatives").classList.remove("hidden");
    $("alternatives").innerHTML = `
      <div class="panel-head">
        <div><h3>Alternative Procurement Centres</h3><small>Better options when your preferred centre is overloaded</small></div>
      </div>
      <div class="alternative-grid">
        ${mandis.slice(4,6).map((m,i)=>`
          <div class="alt-card ${i===1?"recommended":""}">
            ${i===1?'<span class="badge success">Recommended</span>':''}
            <h4>${m.name}</h4>
            <p>📍 ${m.district} • ${m.available} available</p>
            <p>🎫 Queue: ${m.queue} • ⏱ ${m.wait}</p>
            <button class="btn btn-small btn-secondary" onclick="chooseAlternative('${m.name}')">View Slot</button>
          </div>`).join("")}
      </div>`;
  }
}

function chooseAlternative(name) {
  $("mandi").value = name;
  findBestSlot();
}

function confirmSlot() {
  $("bookingId").textContent =
    "KSL-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random()*9000);
  $("bookingModal").classList.remove("hidden");
  showToast("Slot successfully booked ✓");
}

function updateQueue() {
  if (queuePosition > 1) queuePosition--;
  const wait = Math.max(10, queuePosition * 5);

  $("queueNumber").textContent = "#" + queuePosition;
  $("queueKpi").textContent = "#" + queuePosition;
  $("queueWait").textContent = "~" + wait + " min estimated";
  $("queueProgress").style.width = Math.max(35, 100 - queuePosition*5) + "%";
  $("queueProgressText").textContent = Math.max(35, 100 - queuePosition*5) + "%";

  showToast(queuePosition === 1
    ? "You are next in line! 🎉"
    : `Queue updated — you are now #${queuePosition}.`);
}

function renderMandis() {
  const container = $("mandiCards");
  if (!container) return;

  const q = ($("mandiSearch")?.value || "").toLowerCase();

  const filtered = mandis.filter(m =>
    (m.name + " " + m.district).toLowerCase().includes(q)
  );

  container.innerHTML = filtered.map(m => `
    <article class="mandi-card">
      <span class="status ${m.capacity>88?"danger":m.capacity>80?"warning":"success"}">${m.status}</span>
      <h3>${m.name}</h3>
      <p>📍 ${m.district}</p>
      <div class="mandi-cap"><span>Warehouse utilization</span><b>${m.capacity}%</b></div>
      <div class="progress"><i style="width:${m.capacity}%"></i></div>
      <div class="mandi-meta">
        <div><span>Available</span><b>${m.available}</b></div>
        <div><span>Queue</span><b>${m.queue} farmers</b></div>
        <div><span>Wait</span><b>${m.wait}</b></div>
        <div><span>Total</span><b>${m.total}</b></div>
      </div>
    </article>`).join("");

  if (!filtered.length) {
    container.innerHTML = `<div class="panel"><h3>No centre found</h3><p>Try another mandi or district.</p></div>`;
  }
}

function filterMandis() {
  renderMandis();
}

function renderSlots() {
  const table = $("slotTable");
  if (!table) return;

  table.innerHTML = slots.map(s => `
    <tr>
      <td><b>${s[0]}</b></td>
      <td>${s[1]}</td><td>${s[2]}</td><td>${s[3]}</td><td>${s[4]}</td>
      <td><span class="status ${s[5]==="Full"?"danger":s[5]==="Limited"?"warning":"success"}">${s[5]}</span></td>
      <td><button class="text-btn" onclick="showToast('Viewing farmers for ${s[0]}')">View</button></td>
    </tr>`).join("");
}

function renderQueueTable(data = queueData) {
  const table = $("queueTable");
  if (!table) return;

  table.innerHTML = data.map(r => `
    <tr>
      <td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td>
      <td>${r[4]}</td><td>${r[5]}</td>
      <td><span class="status ${r[6]==="In Process"?"warning":"success"}">${r[6]}</span></td>
      <td><button class="btn btn-small btn-secondary" onclick="manageFarmer('${r[1]}','${r[0]}')">${r[6]==="Waiting"?"Call":"Complete"}</button></td>
    </tr>`).join("");
}

function filterQueue(value) {
  renderQueueTable(
    queueData.filter(r => r.join(" ").toLowerCase().includes(value.toLowerCase()))
  );
}

function manageFarmer(name, token) {
  showToast(`${token} • ${name}: status updated ✓`);
}

function renderCharts() {
  const chart = $("barChart");
  if (!chart) return;

  const values = [48,63,55,72,68,82,91];
  chart.innerHTML = values.map((v,i)=>`
    <div class="bar" style="height:${v*1.65}px">
      <b>${v}k</b>
      <small>${["9 Sep","10","11","12","13","14","15 Sep"][i]}</small>
    </div>`).join("");
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  localStorage.setItem("kisanlink-theme", dark ? "dark" : "light");

  document.querySelectorAll("#themeBtn").forEach(b => {
    b.textContent = dark ? "☀️" : "🌙";
  });
}

function toggleLanguage() {
  language = language === "en" ? "hi" : "en";

  $("langBtn").textContent = language === "en" ? "हिंदी" : "English";

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (translations[language][key]) {
      el.textContent = translations[language][key];
    }
  });

  document.body.classList.toggle("hindi", language === "hi");

  showToast(
    language === "hi"
      ? "भाषा हिंदी में बदल दी गई ✓"
      : "Language changed to English ✓"
  );
}

function showToast(message, warn = false) {
  const container = $("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast" + (warn ? " warn" : "");
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function closeModal(id) {
  const modal = $(id);
  if (modal) modal.classList.add("hidden");
}

function showDetails(title, body) {
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = body;
  $("detailsModal").classList.remove("hidden");
}

window.addEventListener("click", e => {
  if (e.target.classList.contains("modal-backdrop")) {
    e.target.classList.add("hidden");
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-backdrop")
      .forEach(m => m.classList.add("hidden"));
  }
});

function initAuth() {
  const saved = localStorage.getItem("kisanlink-user");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
    } catch (e) {
      currentUser = null;
    }
  }
  updateAuthUI();
}

function updateAuthUI() {
  // 1. Dynamic Role-Isolated Navigation Bar
  const nav = $("mainNav");
  if (nav) {
    if (!currentUser) {
      nav.innerHTML = `
        <a href="#" data-view="home" onclick="showView('home')">Home</a>
        <a href="#how" onclick="scrollToSection('how')">How It Works</a>
        <a href="#problem" onclick="scrollToSection('problem')">Mandis</a>
        <a href="#" data-view="login" class="nav-login-link" onclick="showLogin('kisan')">Sign In</a>
        <a href="#" class="nav-signup-link" onclick="showSignup()">🌾 Kisan Signup</a>
      `;
    } else if (currentUser.role === "kisan") {
      nav.innerHTML = `
        <a href="#" data-view="home" onclick="showView('home')">Home</a>
        <a href="#" data-view="farmer" onclick="showView('farmer'); farmerTab('overview')">🌾 Kisan Dashboard</a>
        <a href="#" onclick="showView('farmer'); farmerTab('booking')">📅 My Slot</a>
        <a href="#" onclick="showView('farmer'); farmerTab('queue')">🎫 Queue Status</a>
        <a href="#" onclick="showView('farmer'); farmerTab('payment')">₹ Payment</a>
        <a href="#" onclick="showView('farmer'); farmerTab('profile')">👤 My Profile</a>
      `;
    } else if (currentUser.role === "officer") {
      nav.innerHTML = `
        <a href="#" data-view="home" onclick="showView('home')">Home</a>
        <a href="#" data-view="officer" onclick="showView('officer')">🏭 Mandi Operations</a>
        <a href="#" onclick="showView('officer'); scrollToSection('officerSlots')">📅 Slot Allocation</a>
        <a href="#" onclick="showView('officer'); scrollToSection('officerQueue')">🎫 Queue Tracker</a>
      `;
    } else if (currentUser.role === "government") {
      nav.innerHTML = `
        <a href="#" data-view="home" onclick="showView('home')">Home</a>
        <a href="#" data-view="government" onclick="showView('government')">🏛️ Command Dashboard</a>
        <a href="#" onclick="showView('government'); scrollToSection('govAnalytics')">📊 Analytics</a>
        <a href="#" onclick="showView('government'); scrollToSection('govMandis')">📍 Mandi Performance</a>
      `;
    }
  }

  // 2. Header Authentication Controls
  const container = $("authHeaderContainer");
  if (container) {
    if (currentUser) {
      const avatarHtml = (currentUser.role === "kisan")
        ? `<img src="assets/happy-farmer-namaste.jpg" class="header-avatar-img" alt="Kisan">`
        : `<span>${currentUser.initials}</span>`;

      container.innerHTML = `
        <div class="user-profile-header">
          <button class="profile-btn" onclick="navigateToPortal(currentUser.targetView)" title="Open ${currentUser.badge} Dashboard">
            ${avatarHtml}
            <div class="profile-text-wrap">
              <b>${currentUser.name}</b>
              <small>${currentUser.badge}</small>
            </div>
          </button>
          <button class="icon-btn logout-header-btn" onclick="logout()" title="Logout / लॉग आउट" aria-label="Logout">🚪</button>
        </div>`;
    } else {
      container.innerHTML = `
        <button class="btn btn-login-top" onclick="showLogin('kisan')">
          <span>🔑</span> <b>Sign In</b>
        </button>
        <button class="btn btn-signup-top" onclick="showSignup()">
          <span>🌾</span> <b>Kisan Register</b>
        </button>`;
    }
  }

  // 3. Update dynamic user info in sidebars
  if (currentUser) {
    if (currentUser.role === "kisan") {
      const nameEl = $("farmerSideName");
      if (nameEl) nameEl.textContent = currentUser.name;
    } else if (currentUser.role === "officer") {
      const nameEl = $("officerSideName");
      if (nameEl) nameEl.textContent = currentUser.name;
    } else if (currentUser.role === "government") {
      const nameEl = $("govSideName");
      if (nameEl) nameEl.textContent = currentUser.name;
    }
  }

  renderFarmerProfile();
  updateNavHighlight();
}

function updateNavHighlight() {
  const activeViewEl = document.querySelector(".view.active");
  const activeId = activeViewEl ? activeViewEl.id : "home";
  document.querySelectorAll("#mainNav a").forEach(a => {
    if (a.dataset.view === activeId) {
      a.classList.add("nav-active");
    } else {
      a.classList.remove("nav-active");
    }
  });
}

function showLogin(role = "kisan", redirectAfter = null) {
  pendingRedirect = redirectAfter;
  showView("login");
  switchLoginRole(role);
}

function switchLoginRole(role) {
  activeLoginRole = role;
  ["kisan", "officer", "government"].forEach(r => {
    const tabBtn = $(`tabBtn-${r}`);
    const card = $(`loginCard-${r}`);
    if (tabBtn) {
      if (r === role) tabBtn.classList.add("active");
      else tabBtn.classList.remove("active");
    }
    if (card) {
      if (r === role) card.classList.remove("hidden");
      else card.classList.add("hidden");
    }
  });
}

function fillDummyCreds(role) {
  if (role === "kisan") {
    if ($("kisanPhone")) $("kisanPhone").value = DUMMY_USERS.kisan.phone;
    if ($("kisanOtp")) $("kisanOtp").value = DUMMY_USERS.kisan.otp;
  } else if (role === "officer") {
    if ($("officerId")) $("officerId").value = DUMMY_USERS.officer.id;
    if ($("officerPassword")) $("officerPassword").value = DUMMY_USERS.officer.password;
    if ($("officerMandi")) $("officerMandi").value = DUMMY_USERS.officer.mandi;
  } else if (role === "government") {
    if ($("govEmail")) $("govEmail").value = DUMMY_USERS.government.email;
    if ($("govPassword")) $("govPassword").value = DUMMY_USERS.government.password;
    if ($("govPin")) $("govPin").value = DUMMY_USERS.government.pin;
  }
  showToast(`Sample ${role} credentials loaded ✓`);
}

function sendDummyOTP() {
  const btn = $("sendOtpBtn");
  if (btn) {
    btn.textContent = "Sending...";
    setTimeout(() => {
      btn.textContent = "OTP Sent (1234)";
      if ($("kisanOtp")) $("kisanOtp").value = "1234";
      showToast("Demo OTP [1234] delivered to registered mobile ✓");
    }, 500);
  }
}

function quickDummyLogin(role) {
  const dummy = DUMMY_USERS[role];
  if (!dummy) return;
  fillDummyCreds(role);
  showToast(`⚡ Logging in as ${dummy.name}...`);
  setTimeout(() => {
    loginSuccess(dummy);
  }, 350);
}

function handleManualLogin(role, event) {
  if (event) event.preventDefault();
  const dummy = DUMMY_USERS[role];
  const submitBtn = $(`submitBtn-${role}`);
  const originalHtml = submitBtn ? submitBtn.innerHTML : "";

  if (submitBtn) {
    submitBtn.innerHTML = `<span>Signing in...</span>`;
    submitBtn.disabled = true;
  }

  setTimeout(() => {
    if (submitBtn) {
      submitBtn.innerHTML = originalHtml;
      submitBtn.disabled = false;
    }

    let userToLogin = { ...dummy };

    if (role === "kisan") {
      const phone = $("kisanPhone") ? $("kisanPhone").value.trim() : "";
      const otp = $("kisanOtp") ? $("kisanOtp").value.trim() : "";
      if (!phone || phone.length < 10) {
        showToast("Please enter a valid 10-digit mobile number", true);
        return;
      }
      if (!otp) {
        showToast("Please enter OTP (Demo: 1234)", true);
        return;
      }
      if (phone !== dummy.phone) {
        userToLogin.name = `Kisan (${phone.slice(-4)})`;
        userToLogin.phone = phone;
      }
    } else if (role === "officer") {
      const id = $("officerId") ? $("officerId").value.trim() : "";
      const pass = $("officerPassword") ? $("officerPassword").value : "";
      const mandi = $("officerMandi") ? $("officerMandi").value : "";
      if (!id || !pass) {
        showToast("Please enter Officer ID and Password", true);
        return;
      }
      userToLogin.mandi = mandi;
    } else if (role === "government") {
      const email = $("govEmail") ? $("govEmail").value.trim() : "";
      const pass = $("govPassword") ? $("govPassword").value : "";
      const pin = $("govPin") ? $("govPin").value.trim() : "";
      if (!email || !pass || !pin) {
        showToast("Please fill all government authentication fields", true);
        return;
      }
    }

    loginSuccess(userToLogin);
  }, 500);
}

function loginSuccess(userObj) {
  currentUser = userObj;
  localStorage.setItem("kisanlink-user", JSON.stringify(currentUser));
  updateAuthUI();
  showToast(`Welcome, ${userObj.name}! Signed in as ${userObj.badge} ✓`);

  if (pendingRedirect) {
    if (typeof pendingRedirect === "string") {
      showView(pendingRedirect);
    } else if (typeof pendingRedirect === "object") {
      showView(pendingRedirect.portal);
      if (pendingRedirect.subtab === "booking") {
        farmerTab("booking");
      }
    }
    pendingRedirect = null;
  } else {
    showView(userObj.targetView);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("kisanlink-user");
  updateAuthUI();
  showView("home");
  showToast("Signed out successfully. Switched to guest mode ✓");
}

function navigateToPortal(portal, subtab = null) {
  const portalRoles = {
    farmer: "kisan",
    officer: "officer",
    government: "government"
  };
  const requiredRole = portalRoles[portal];

  if (currentUser) {
    if (currentUser.role === requiredRole) {
      showView(portal);
      if (subtab === "booking") {
        farmerTab("booking");
      }
    } else {
      showToast(`Access Restricted: You are signed in as ${currentUser.badge}. Sign out to access other roles.`, true);
      showView(currentUser.targetView);
    }
  } else {
    const roleNames = { kisan: "Kisan", officer: "Mandi Officer", government: "Government Office" };
    showToast(`Please sign in to access the ${roleNames[requiredRole]} portal.`, true);
    showLogin(requiredRole, { portal, subtab });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("kisanlink-theme") === "dark") {
    document.body.classList.add("dark");
  }

  const dark = document.body.classList.contains("dark");
  document.querySelectorAll("#themeBtn").forEach(b => {
    b.textContent = dark ? "☀️" : "🌙";
  });

  initAuth();
  renderMandis();
  renderSlots();
  renderQueueTable();
  renderCharts();
});


/* ==========================================================================
   KISAN SIGNUP & PROFILE MANAGEMENT FUNCTIONS
   ========================================================================== */

function switchAuthMode(mode) {
  const signinBtn = $("authModeBtn-signin");
  const signupBtn = $("authModeBtn-signup");
  const signinSec = $("authSection-signin");
  const signupSec = $("authSection-signup");

  if (mode === "signin") {
    if (signinBtn) signinBtn.classList.add("active");
    if (signupBtn) signupBtn.classList.remove("active");
    if (signinSec) signinSec.classList.remove("hidden");
    if (signupSec) signupSec.classList.add("hidden");
  } else {
    if (signupBtn) signupBtn.classList.add("active");
    if (signinBtn) signinBtn.classList.remove("active");
    if (signupSec) signupSec.classList.remove("hidden");
    if (signinSec) signinSec.classList.add("hidden");
  }
}

function showSignup() {
  if (currentUser) {
    showToast(`Already logged in as ${currentUser.name}. Sign out to register a new account.`);
    showView(currentUser.targetView);
    return;
  }
  showView("login");
  switchAuthMode("signup");
  window.scrollTo({ top: 120, behavior: "smooth" });
}

function formatAadhaar(input) {
  let val = input.value.replace(/\D/g, "").slice(0, 12);
  let parts = [];
  for (let i = 0; i < val.length; i += 4) {
    parts.push(val.substring(i, i + 4));
  }
  input.value = parts.join("-");
}

function sendSignupOTP() {
  const btn = $("signupOtpBtn");
  const phone = $("kisanRegPhone") ? $("kisanRegPhone").value.trim() : "";
  if (!phone || phone.length < 10) {
    showToast("Please enter a 10-digit mobile number first", true);
    return;
  }
  if (btn) btn.textContent = "Sending...";
  setTimeout(() => {
    if (btn) btn.textContent = "OTP Sent (1234)";
    if ($("kisanRegOtp")) $("kisanRegOtp").value = "1234";
    showToast(`Demo OTP [1234] delivered to ${phone} ✓`);
  }, 400);
}

function fillDemoRegistration() {
  if ($("kisanRegName")) $("kisanRegName").value = "Ramlal Sharma (रामलाल शर्मा)";
  if ($("kisanRegFather")) $("kisanRegFather").value = "Shri Hariram Sharma (हरिराम शर्मा)";
  if ($("kisanRegPhone")) $("kisanRegPhone").value = "9876543210";
  if ($("kisanRegOtp")) $("kisanRegOtp").value = "1234";
  if ($("kisanRegAadhaar")) $("kisanRegAadhaar").value = "4829-1039-8921";
  if ($("kisanRegCategory")) $("kisanRegCategory").value = "OBC";
  if ($("kisanRegDistrict")) $("kisanRegDistrict").value = "Jaipur";
  if ($("kisanRegTehsil")) $("kisanRegTehsil").value = "Amber (आमेर)";
  if ($("kisanRegVillage")) $("kisanRegVillage").value = "Rampura (रामपुरा)";
  if ($("kisanRegKhasra")) $("kisanRegKhasra").value = "142/3, 145/1";
  if ($("kisanRegArea")) $("kisanRegArea").value = "8.5";
  if ($("kisanRegOwnership")) $("kisanRegOwnership").value = "Self-Owned";
  if ($("kisanRegCrop")) $("kisanRegCrop").value = "Wheat";
  if ($("kisanRegSeason")) $("kisanRegSeason").value = "Rabi 2026";
  if ($("kisanRegQuantity")) $("kisanRegQuantity").value = "42";
  if ($("kisanRegBank")) $("kisanRegBank").value = "State Bank of India (SBI)";
  if ($("kisanRegAccHolder")) $("kisanRegAccHolder").value = "Ramlal Sharma";
  if ($("kisanRegAccNum")) $("kisanRegAccNum").value = "38491029482";
  if ($("kisanRegIfsc")) $("kisanRegIfsc").value = "SBIN0001234";
  if ($("kisanRegMandi")) $("kisanRegMandi").value = "Jaipur Central Procurement Centre";
  showToast("Sample verified farmer details loaded into registration form ✓");
}

function handleKisanRegistration(event) {
  if (event) event.preventDefault();

  const name = $("kisanRegName") ? $("kisanRegName").value.trim() : "";
  const father = $("kisanRegFather") ? $("kisanRegFather").value.trim() : "";
  const phone = $("kisanRegPhone") ? $("kisanRegPhone").value.trim() : "";
  const aadhaar = $("kisanRegAadhaar") ? $("kisanRegAadhaar").value.trim() : "";
  const category = $("kisanRegCategory") ? $("kisanRegCategory").value : "OBC";
  const district = $("kisanRegDistrict") ? $("kisanRegDistrict").value : "Jaipur";
  const tehsil = $("kisanRegTehsil") ? $("kisanRegTehsil").value.trim() : "";
  const village = $("kisanRegVillage") ? $("kisanRegVillage").value.trim() : "";
  const khasra = $("kisanRegKhasra") ? $("kisanRegKhasra").value.trim() : "";
  const area = $("kisanRegArea") ? $("kisanRegArea").value.trim() : "5.0";
  const ownership = $("kisanRegOwnership") ? $("kisanRegOwnership").value : "Self-Owned";
  const crop = $("kisanRegCrop") ? $("kisanRegCrop").value : "Wheat";
  const season = $("kisanRegSeason") ? $("kisanRegSeason").value : "Rabi 2026";
  const quantity = $("kisanRegQuantity") ? $("kisanRegQuantity").value.trim() : "40";
  const bank = $("kisanRegBank") ? $("kisanRegBank").value : "State Bank of India (SBI)";
  const accHolder = $("kisanRegAccHolder") ? $("kisanRegAccHolder").value.trim() : name;
  const accNum = $("kisanRegAccNum") ? $("kisanRegAccNum").value.trim() : "38491029482";
  const ifsc = $("kisanRegIfsc") ? $("kisanRegIfsc").value.trim() : "SBIN0001234";
  const mandi = $("kisanRegMandi") ? $("kisanRegMandi").value : "Jaipur Central Procurement Centre";

  if (!name || !phone || phone.length < 10) {
    showToast("Please enter complete Name and valid 10-digit Phone", true);
    return;
  }

  const submitBtn = $("kisanRegSubmitBtn");
  if (submitBtn) {
    submitBtn.innerHTML = "<span>Creating Verified Kisan Account...</span>";
    submitBtn.disabled = true;
  }

  setTimeout(() => {
    if (submitBtn) {
      submitBtn.innerHTML = "<span>📝 Complete Registration & Get Kisan ID</span> <span>→</span>";
      submitBtn.disabled = false;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newKisanId = `KSL-KISAN-${randomSuffix}`;
    const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "KS";
    const maskedAadhaar = aadhaar ? `XXXX-XXXX-${aadhaar.slice(-4)}` : "XXXX-XXXX-8921";
    const maskedAcc = accNum ? `••••••••${accNum.slice(-4)}` : "••••••••4820";

    const registeredFarmer = {
      role: "kisan",
      name: name,
      fatherName: father || "Shri Hariram Sharma",
      title: `Kisan • ${district} District`,
      phone: phone,
      id: newKisanId,
      otp: "1234",
      aadhaar: maskedAadhaar,
      category: category,
      district: district,
      tehsil: tehsil || "Amber",
      village: village || "Rampura",
      khasra: khasra || "142/3",
      area: `${area} Bigha`,
      ownership: ownership,
      crop: `${crop} / ${crop === "Wheat" ? "गेहूं" : crop}`,
      season: season,
      quantity: `${quantity} Quintals`,
      bankName: bank,
      accHolder: accHolder,
      accNum: maskedAcc,
      ifsc: ifsc,
      mandi: mandi,
      initials: initials,
      badge: "🌾 Kisan",
      targetView: "farmer",
      welcome: `नमस्ते, ${name} 🙏`
    };

    // Pre-populate slot booking form with registered crop & quantity
    if ($("crop")) $("crop").value = `${crop} / ${crop === "Wheat" ? "गेहूं" : crop}`;
    if ($("quantity")) $("quantity").value = quantity;
    if ($("mandi")) $("mandi").value = mandi;

    loginSuccess(registeredFarmer);
    showToast(`🎉 Registration Complete! Assigned Kisan ID: ${newKisanId}`);
  }, 600);
}

function renderFarmerProfile() {
  const profile = (currentUser && currentUser.role === "kisan") ? currentUser : DUMMY_USERS.kisan;

  if ($("profileHeadName")) $("profileHeadName").textContent = `${profile.name} • किसान प्रोफाइल`;
  if ($("profileNameDisplay")) $("profileNameDisplay").textContent = profile.name;
  if ($("profileKisanId")) $("profileKisanId").textContent = profile.id;
  if ($("profilePhone")) $("profilePhone").textContent = profile.phone;
  if ($("profileAadhaar")) $("profileAadhaar").textContent = profile.aadhaar || "XXXX-XXXX-8921";
  if ($("profileCategory")) $("profileCategory").textContent = profile.category || "OBC";
  if ($("profileLocation")) $("profileLocation").textContent = `Rajasthan • ${profile.district || "Jaipur"}`;
  if ($("profileVillage")) $("profileVillage").textContent = `${profile.tehsil || "Amber"} • ${profile.village || "Rampura"}`;
  if ($("profileKhasra")) $("profileKhasra").textContent = profile.khasra || "142/3, 145/1";
  if ($("profileArea")) $("profileArea").textContent = profile.area || "8.5 Bigha";
  if ($("profileOwnership")) $("profileOwnership").textContent = profile.ownership || "Self-Owned (स्वयं की)";
  if ($("profileCrop")) $("profileCrop").textContent = profile.crop || "Wheat / गेहूं";
  if ($("profileSeason")) $("profileSeason").textContent = profile.season || "Rabi 2026";
  if ($("profileQuantity")) $("profileQuantity").textContent = profile.quantity || "42 Quintals";
  if ($("profileBankName")) $("profileBankName").textContent = profile.bankName || "State Bank of India (SBI)";
  if ($("profileAccHolder")) $("profileAccHolder").textContent = profile.accHolder || profile.name;
  if ($("profileAccNum")) $("profileAccNum").textContent = profile.accNum || "••••••••4820";
  if ($("profileIfsc")) $("profileIfsc").textContent = profile.ifsc || "SBIN0001234";
  if ($("profileMandi")) $("profileMandi").textContent = profile.mandi || "Jaipur Central Procurement Centre";
}
