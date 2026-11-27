const STORAGE_KEY = "gnc_studyflow_data_v1";

const DEFAULT_DATA = {
  users: [
    {
      studentId: "ADMIN-001",
      name: "GNC System Administrator",
      email: "admin@gnc.edu.ph",
      password: "admin123",
      role: "admin",
      status: "Approved"
    },
    {
      studentId: "2023-00101",
      name: "Juan Dela Cruz",
      email: "student@gnc.edu.ph",
      password: "123456",
      role: "student",
      status: "Approved"
    },
    {
      studentId: "2024-00218",
      name: "Maria Clara Santos",
      email: "maria.santos@gnc.edu.ph",
      password: "123456",
      role: "student",
      status: "Pending"
    }
  ],
  tasks: [
    {
      id: 1700000001,
      title: "Finalize Capstone Chapter 1 & IPO Framework",
      subject: "Capstone Project 1",
      deadline: "2026-11-30",
      priority: "High",
      status: "Ongoing"
    },
    {
      id: 1700000002,
      title: "Database Normalization Quiz Review",
      subject: "Information Management",
      deadline: "2026-12-02",
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

let appData = loadData();
let currentUser = null;

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// --- AUTHENTICATION & ADMIN VERIFICATION ---
function showAuthMessage(msg, type) {
  const box = document.getElementById("auth-message");
  box.textContent = msg;
  box.className = `auth-message ${type}`;
  box.classList.remove("hidden");
}

function hideAuthMessage() {
  document.getElementById("auth-message").classList.add("hidden");
}

function switchAuthTab(tab) {
  hideAuthMessage();
  const isLogin = tab === "login";
  document.getElementById("tab-login").classList.toggle("active", isLogin);
  document.getElementById("tab-register").classList.toggle("active", !isLogin);
  document.getElementById("login-form").classList.toggle("hidden", !isLogin);
  document.getElementById("register-form").classList.toggle("hidden", isLogin);
}

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  const user = appData.users.find(
    (u) => u.email.toLowerCase() === email && u.password === password
  );

  if (!user) {
    showAuthMessage("Invalid email or password.", "error");
    return;
  }

  // Admin Verification Gate
  if (user.status === "Pending") {
    showAuthMessage(
      "Account Pending Verification: Please wait for the GNC Administrator to approve your registration before logging in.",
      "warning"
    );
    return;
  }

  if (user.status === "Rejected") {
    showAuthMessage(
      "Access Denied: Your account verification was rejected by the Administrator.",
      "error"
    );
    return;
  }

  currentUser = user;
  enterApp();
});

document.getElementById("register-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const studentId = document.getElementById("reg-student-id").value.trim();
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;

  if (appData.users.some((u) => u.email.toLowerCase() === email)) {
    showAuthMessage("This email is already registered.", "error");
    return;
  }

  appData.users.push({
    studentId,
    name,
    email,
    password,
    role: "student",
    status: "Pending" // Requires Admin approval
  });
  saveData();

  this.reset();
  switchAuthTab("login");
  showAuthMessage(
    "Registration submitted! An Admin must verify and approve your account before you can sign in.",
    "success"
  );
});

function enterApp() {
  hideAuthMessage();
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("app-section").classList.remove("hidden");

  document.getElementById("user-display-name").textContent = currentUser.name;
  document.getElementById("user-display-email").textContent = currentUser.email;

  const isAdmin = currentUser.role === "admin";
  document.getElementById("role-badge").textContent = isAdmin
    ? "Admin Portal"
    : "Student Portal";
  document.getElementById("nav-admin").classList.toggle("hidden", !isAdmin);

  updatePendingBadge();
  renderAll();
  switchView(isAdmin ? "admin" : "dashboard");
}

function logout() {
  currentUser = null;
  document.getElementById("login-form").reset();
  document.getElementById("app-section").classList.add("hidden");
  document.getElementById("auth-section").classList.remove("hidden");
}

// --- NAVIGATION ---
function switchView(viewName) {
  document.querySelectorAll(".view-section").forEach((sec) => sec.classList.add("hidden"));
  document.getElementById(`view-${viewName}`).classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  const titles = {
    dashboard: "Dashboard Overview",
    tasks: "Academic Task Management",
    schedule: "Weekly Study Schedule",
    admin: "Admin Account Verification"
  };
  document.getElementById("page-title").textContent = titles[viewName] || "StudyFlow";
}

// --- ADMIN VERIFICATION ACTIONS ---
function updatePendingBadge() {
  const pendingCount = appData.users.filter((u) => u.status === "Pending").length;
  document.getElementById("pending-count-badge").textContent = pendingCount;
}

function renderAdminUsers() {
  const tbody = document.getElementById("admin-users-body");
  tbody.innerHTML = "";

  appData.users.forEach((user) => {
    const tr = document.createElement("tr");
    const isSelf = currentUser && user.email === currentUser.email;

    let actionButtons = `<span class="muted-text">Current Admin</span>`;
    if (!isSelf) {
      actionButtons = `
        ${
          user.status !== "Approved"
            ? `<button class="btn btn-primary btn-sm" onclick="verifyUser('${user.email}', 'Approved')">Approve</button>`
            : ""
        }
        ${
          user.status !== "Rejected"
            ? `<button class="btn btn-danger btn-sm" onclick="verifyUser('${user.email}', 'Rejected')">Reject</button>`
            : ""
        }
      `;
    }

    tr.innerHTML = `
      <td><strong>${user.studentId || "N/A"}</strong></td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.role.toUpperCase()}</td>
      <td><span class="pill pill-${user.status}">${user.status}</span></td>
      <td>${actionButtons}</td>
    `;
    tbody.appendChild(tr);
  });
}

function verifyUser(email, newStatus) {
  const target = appData.users.find((u) => u.email === email);
  if (!target) return;
  target.status = newStatus;
  saveData();
  updatePendingBadge();
  renderAdminUsers();
}

// --- DASHBOARD RENDERING ---
function renderDashboard() {
  const total = appData.tasks.length;
  const pending = appData.tasks.filter((t) => t.status === "Pending").length;
  const ongoing = appData.tasks.filter((t) => t.status === "Ongoing").length;
  const completed = appData.tasks.filter((t) => t.status === "Completed").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-ongoing").textContent = ongoing;
  document.getElementById("stat-completed").textContent = completed;

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  document.getElementById("progress-percent").textContent = `${percent}%`;
  document.getElementById("progress-fill").style.width = `${percent}%`;

  // Deadline Alert & Upcoming List
  const today = new Date().toISOString().split("T")[0];
  const activeTasks = appData.tasks
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const overdueCount = activeTasks.filter((t) => t.deadline < today).length;
  const alertBox = document.getElementById("deadline-alert");
  if (overdueCount > 0) {
    alertBox.textContent = `⚠️ Alert: You have ${overdueCount} overdue academic task(s) requiring immediate attention.`;
    alertBox.classList.remove("hidden");
  } else {
    alertBox.classList.add("hidden");
  }

  const upcomingList = document.getElementById("upcoming-deadlines-list");
  upcomingList.innerHTML = activeTasks.length
    ? activeTasks
        .slice(0, 5)
        .map(
          (t) =>
            `<li><span><strong>${t.title}</strong> (${t.subject})</span><span>${t.deadline}</span></li>`
        )
        .join("")
    : `<li><span class="muted-text">No pending deadlines. Great job!</span></li>`;

  const schedList = document.getElementById("dashboard-schedule-list");
  schedList.innerHTML = appData.schedules.length
    ? appData.schedules
        .slice(0, 5)
        .map(
          (s) =>
            `<li><span><strong>${s.day}</strong> — ${s.subject}</span><span>${s.time}</span></li>`
        )
        .join("")
    : `<li><span class="muted-text">No study routines planned yet.</span></li>`;
}

// --- TASK CRUD ---
document.getElementById("task-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const idVal = document.getElementById("task-id").value;
  const taskObj = {
    id: idVal ? Number(idVal) : Date.now(),
    title: document.getElementById("task-title").value.trim(),
    subject: document.getElementById("task-subject").value.trim(),
    deadline: document.getElementById("task-deadline").value,
    priority: document.getElementById("task-priority").value,
    status: document.getElementById("task-status").value
  };

  if (idVal) {
    const idx = appData.tasks.findIndex((t) => t.id === Number(idVal));
    if (idx !== -1) appData.tasks[idx] = taskObj;
  } else {
    appData.tasks.push(taskObj);
  }

  saveData();
  resetTaskForm();
  renderAll();
});

function editTask(id) {
  const task = appData.tasks.find((t) => t.id === id);
  if (!task) return;
  document.getElementById("task-id").value = task.id;
  document.getElementById("task-title").value = task.title;
  document.getElementById("task-subject").value = task.subject;
  document.getElementById("task-deadline").value = task.deadline;
  document.getElementById("task-priority").value = task.priority;
  document.getElementById("task-status").value = task.status;

  document.getElementById("task-form-title").textContent = "Edit Academic Task";
  document.getElementById("task-submit-btn").textContent = "Update Task";
  document.getElementById("task-cancel-btn").classList.remove("hidden");
}

function deleteTask(id) {
  appData.tasks = appData.tasks.filter((t) => t.id !== id);
  saveData();
  renderAll();
}

function resetTaskForm() {
  document.getElementById("task-form").reset();
  document.getElementById("task-id").value = "";
  document.getElementById("task-form-title").textContent = "Add New Academic Task";
  document.getElementById("task-submit-btn").textContent = "Save Task";
  document.getElementById("task-cancel-btn").classList.add("hidden");
}

function renderTasks() {
  const statusFilter = document.getElementById("filter-status").value;
  const priorityFilter = document.getElementById("filter-priority").value;
  const tbody = document.getElementById("task-table-body");

  const filtered = appData.tasks.filter((t) => {
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
    return matchStatus && matchPriority;
  });

  tbody.innerHTML = filtered.length
    ? filtered
        .map(
          (t) => `
      <tr>
        <td><strong>${t.title}</strong><br><small class="muted-text">${t.subject}</small></td>
        <td>${t.deadline}</td>
        <td><span class="pill pill-${t.priority}">${t.priority}</span></td>
        <td><span class="status-${t.status}">${t.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="editTask(${t.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTask(${t.id})">Delete</button>
        </td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="5" class="muted-text">No tasks match the selected filters.</td></tr>`;
}

// --- SCHEDULE PLANNER ---
document.getElementById("schedule-form").addEventListener("submit", function (e) {
  e.preventDefault();
  appData.schedules.push({
    id: Date.now(),
    day: document.getElementById("sched-day").value,
    time: document.getElementById("sched-time").value.trim(),
    subject: document.getElementById("sched-subject").value.trim()
  });
  saveData();
  this.reset();
  renderAll();
});

function deleteSchedule(id) {
  appData.schedules = appData.schedules.filter((s) => s.id !== id);
  saveData();
  renderAll();
}

function renderSchedule() {
  const grid = document.getElementById("schedule-grid");
  grid.innerHTML = appData.schedules.length
    ? appData.schedules
        .map(
          (s) => `
      <div class="schedule-item">
        <strong>${s.day}</strong>
        <p>${s.subject}</p>
        <small class="muted-text">${s.time}</small>
        <div style="margin-top: 0.6rem;">
          <button class="btn btn-danger btn-sm" onclick="deleteSchedule(${s.id})">Remove</button>
        </div>
      </div>`
        )
        .join("")
    : `<p class="muted-text">No study sessions scheduled yet.</p>`;
}

// --- EXPORT & MASTER RENDER ---
function exportJSON() {
  const blob = new Blob([JSON.stringify(appData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gnc-studyflow-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function renderAll() {
  renderDashboard();
  renderTasks();
  renderSchedule();
  if (currentUser && currentUser.role === "admin") {
    renderAdminUsers();
  }
}
