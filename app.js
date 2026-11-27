const STORAGE_KEY = "studyflow_data_v1";
// Optional: set a non-empty string if you also want to require a secret code on registration
const REQUIRED_REG_CODE = ""; // e.g., "GNC-2026-ACCEPT"

const DEFAULT_SEED_DATA = {
  users: [
    {
      name: "Juan Dela Cruz",
      email: "student@gnc.edu.ph",
      password: "123456",
      role: "admin",
      status: "approved"
    }
  ],
  tasks: [
    {
      id: 1700000001,
      title: "Finalize Capstone Chapter 1 & IPO Framework",
      subject: "Capstone Project 1",
      deadline: "2026-11-24",
      priority: "High",
      status: "Ongoing"
    },
    {
      id: 1700000002,
      title: "Database Normalization Quiz Review",
      subject: "Information Management",
      deadline: "2026-11-26",
      priority: "Medium",
      status: "Pending"
    },
    {
      id: 1700000003,
      title: "Submit System Prototype Wireframes",
      subject: "Human-Computer Interaction",
      deadline: "2026-11-20",
      priority: "High",
      status: "Completed"
    }
  ],
  schedules: [
    {
      id: 2700000001,
      day: "Monday",
      time: "6:00 PM - 8:00 PM",
      subject: "Capstone System Development"
    },
    {
      id: 2700000002,
      day: "Wednesday",
      time: "4:00 PM - 6:00 PM",
      subject: "Information Management"
    },
    {
      id: 2700000003,
      day: "Saturday",
      time: "9:00 AM - 11:30 AM",
      subject: "Research & Documentation"
    }
  ]
};

function loadSystemData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return structuredClone(DEFAULT_SEED_DATA);
    }
  }
  return structuredClone(DEFAULT_SEED_DATA);
}

let db = loadSystemData();
let currentUser = null;

function saveSystemData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Switch between Login and Register tabs
function switchAuthTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("tab-login")?.classList.toggle("active", isLogin);
  document.getElementById("tab-register")?.classList.toggle("active", !isLogin);
  document.getElementById("login-form")?.classList.toggle("hidden", !isLogin);
  document.getElementById("register-form")?.classList.toggle("hidden", isLogin);
}

// Switch sidebar views
function switchView(viewName) {
  document.querySelectorAll(".view-section").forEach((sec) => sec.classList.add("hidden"));
  document.getElementById(`view-${viewName}`)?.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  const titles = {
    dashboard: "Dashboard Overview",
    tasks: "Task Management",
    schedule: "Study Schedule"
  };
  const pageTitle = document.getElementById("page-title");
  if (pageTitle && titles[viewName]) {
    pageTitle.textContent = titles[viewName];
  }

  if (viewName === "dashboard") {
    renderPendingRegistrations();
  }
}

function logout() {
  currentUser = null;
  document.getElementById("app-section")?.classList.add("hidden");
  document.getElementById("auth-section")?.classList.remove("hidden");
  switchAuthTab("login");
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "studyflow-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Handle Registration (Requires Acceptance)
document.getElementById("register-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;
  const code = document.getElementById("reg-invite-code")?.value.trim() || "";

  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  if (REQUIRED_REG_CODE && code !== REQUIRED_REG_CODE) {
    alert("Invalid registration security code. Registration rejected.");
    return;
  }

  const exists = db.users.some((u) => u.email.toLowerCase() === email);
  if (exists) {
    alert("An account with this email already exists or is pending approval.");
    return;
  }

  db.users.push({
    name,
    email,
    password,
    role: "student",
    status: "pending"
  });

  saveSystemData();
  e.target.reset();
  renderPendingRegistrations();
  switchAuthTab("login");
  alert("Registration submitted! Your account is pending acceptance before you can sign in.");
});

// Handle Login (Blocks Unaccepted Accounts)
document.getElementById("login-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  const user = db.users.find(
    (u) => u.email.toLowerCase() === email && u.password === password
  );

  if (!user) {
    alert("Invalid email or password.");
    return;
  }

  if (user.status !== "approved") {
    alert("Your account has not been accepted yet. Please wait for approval.");
    return;
  }

  currentUser = user;
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("app-section").classList.remove("hidden");
  document.getElementById("user-display-name").textContent = user.name;
  document.getElementById("user-display-email").textContent = user.email;
  renderPendingRegistrations();
});

// Accept a Pending Registration
function acceptRegistration(email) {
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return;

  user.status = "approved";
  saveSystemData();
  renderPendingRegistrations();
  alert(`Accepted account for ${user.name} (${user.email}).`);
}

// Reject / Remove a Pending Registration
function rejectRegistration(email) {
  const index = db.users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (index === -1) return;

  const removed = db.users[index];
  db.users.splice(index, 1);
  saveSystemData();
  renderPendingRegistrations();
  alert(`Rejected and removed registration for ${removed.email}.`);
}

// Render Pending Registrations List
function renderPendingRegistrations() {
  const list = document.getElementById("pending-registrations-list");
  const badge = document.getElementById("pending-count-badge");
  if (!list || !badge) return;

  const pendingUsers = db.users.filter((u) => u.status === "pending");
  badge.textContent = `${pendingUsers.length} Pending`;

  if (pendingUsers.length === 0) {
    list.innerHTML = `<li><span>No pending registrations to review.</span></li>`;
    return;
  }

  list.innerHTML = pendingUsers
    .map(
      (u) => `
      <li>
        <div>
          <strong>${escapeHTML(u.name)}</strong><br />
          <small>${escapeHTML(u.email)}</small>
        </div>
        <div class="action-group">
          <button class="btn btn-primary btn-sm" onclick="acceptRegistration('${escapeHTML(u.email)}')">Accept</button>
          <button class="btn btn-danger btn-sm" onclick="rejectRegistration('${escapeHTML(u.email)}')">Reject</button>
        </div>
      </li>
    `
    )
    .join("");
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

renderPendingRegistrations();