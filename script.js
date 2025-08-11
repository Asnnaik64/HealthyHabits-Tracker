
class HealthyHabitsTracker {
  constructor() {
    this.habits =
      JSON.parse(localStorage.getItem("healthyhabits_habits")) || [];
    this.completions =
      JSON.parse(localStorage.getItem("healthyhabits_completions")) || {};
    this.moodHistory =
      JSON.parse(localStorage.getItem("healthyhabits_moods")) || [];
    this.reminders =
      JSON.parse(localStorage.getItem("healthyhabits_reminders")) || {};
    this.currentTab = "dashboard";
    this.charts = {};

    // Authentication properties
    this.currentUser =
      JSON.parse(localStorage.getItem("healthyhabits_user")) || null;
    this.users = JSON.parse(localStorage.getItem("healthyhabits_users")) || [];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupAuthEventListeners();
    this.setupThemeToggle();
    this.updateTodayDate();
    this.loadTodayMood();
    this.setupReminders();
    this.requestNotificationPermission();
    this.renderAll();
    this.checkAuthStatus(); 

    // Initialize with dashboard tab
    this.switchTab("dashboard");

    console.log("HealthyHabits Tracker initialized successfully!");
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll(".nav-link[data-tab]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = e.target.getAttribute("data-tab");
        this.switchTab(tab);
      });
    });

    // Add habit form
    document.getElementById("addHabitForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.addHabit();
    });

    // Edit habit form
    document.getElementById("editHabitForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.updateHabit();
    });

    // Category filter
    document
      .querySelectorAll('input[name="categoryFilter"]')
      .forEach((radio) => {
        radio.addEventListener("change", (e) => {
          this.filterHabits(e.target.value);
        });
      });

    // Mood selector
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setMood(parseInt(e.target.getAttribute("data-mood")));
      });
    });

    // Summary modal tabs
    document.querySelectorAll("#summaryTabs .nav-link").forEach((tab) => {
      tab.addEventListener("shown.bs.tab", (e) => {
        const target = e.target.getAttribute("href");
        if (target === "#dailySummary") {
          this.renderDailySummary();
        } else if (target === "#weeklySummary") {
          this.renderWeeklySummary();
        }
      });
    });
  }

  setupAuthEventListeners() {
    // Login form
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.login();
    });

    // Register form
    document.getElementById("registerForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.register();
    });

    // Logout button
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      this.logout();
    });

    // Password toggle buttons
    document
      .getElementById("toggleLoginPassword")
      .addEventListener("click", () => {
        this.togglePasswordVisibility("loginPassword", "toggleLoginPassword");
      });

    document
      .getElementById("toggleRegisterPassword")
      .addEventListener("click", () => {
        this.togglePasswordVisibility(
          "registerPassword",
          "toggleRegisterPassword"
        );
      });

    document
      .getElementById("toggleConfirmPassword")
      .addEventListener("click", () => {
        this.togglePasswordVisibility(
          "confirmPassword",
          "toggleConfirmPassword"
        );
      });

    // Password strength indicator
    document
      .getElementById("registerPassword")
      .addEventListener("input", (e) => {
        this.checkPasswordStrength(
          e.target.value,
          "passwordStrength",
          "registerPassword"
        );
      });

    // Forgot password link
    document
      .getElementById("forgotPasswordLink")
      .addEventListener("click", (e) => {
        e.preventDefault();
        this.showForgotPassword();
      });

    // Profile and settings links
    document.getElementById("profileLink").addEventListener("click", (e) => {
      e.preventDefault();
      this.showProfile();
    });

    document.getElementById("settingsLink").addEventListener("click", (e) => {
      e.preventDefault();
      this.showSettings();
    });
  }

  // Authentication Methods
  checkAuthStatus() {
    if (this.currentUser) {
      this.showUserMenu();
    } else {
      this.showAuthButtons();
    }
  }

  showUserMenu() {
    const authButtons = document.getElementById("authButtons");
    const userMenu = document.getElementById("userMenu");
    const userName = document.getElementById("userName");

    if (authButtons) authButtons.style.display = "none";
    if (userMenu) userMenu.style.display = "flex";
    if (userName && this.currentUser) {
      userName.textContent = this.currentUser.firstName;
    }
  }

  showAuthButtons() {
    const authButtons = document.getElementById("authButtons");
    const userMenu = document.getElementById("userMenu");

    if (authButtons) authButtons.style.display = "flex";
    if (userMenu) userMenu.style.display = "none";
  }

  login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe").checked;
    const submitBtn = document.querySelector(
      "#loginForm button[type='submit']"
    );

    // Clear previous validation
    this.clearValidation("loginEmail");
    this.clearValidation("loginPassword");

    if (!email || !password) {
      this.showAlert("danger", "Please fill in all fields");
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");
    submitBtn.innerHTML =
      '<i class="bi bi-arrow-clockwise me-2"></i>Logging in...';

    // Simulate API call delay
    setTimeout(() => {
      const user = this.users.find((u) => u.email === email);

      if (!user) {
        this.showFieldError(
          "loginEmail",
          "User not found. Please register first."
        );
        this.resetLoginButton(submitBtn);
        return;
      }

      if (user.password !== password) {
        this.showFieldError("loginPassword", "Invalid password");
        this.resetLoginButton(submitBtn);
        return;
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      const userIndex = this.users.findIndex((u) => u.id === user.id);
      this.users[userIndex] = user;
      localStorage.setItem("healthyhabits_users", JSON.stringify(this.users));

      // Login successful
      this.currentUser = user;
      localStorage.setItem("healthyhabits_user", JSON.stringify(user));

      if (rememberMe) {
        localStorage.setItem("healthyhabits_rememberMe", "true");
      }

      this.showUserMenu();
      this.showToast("Welcome back, " + user.firstName + "!");

      // Close modal
      const loginModal = bootstrap.Modal.getInstance(
        document.getElementById("loginModal")
      );
      loginModal.hide();

      // Clear form
      document.getElementById("loginForm").reset();
      this.resetLoginButton(submitBtn);
    }, 1000);
  }

  register() {
    const firstName = document.getElementById("registerFirstName").value.trim();
    const lastName = document.getElementById("registerLastName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const agreeTerms = document.getElementById("agreeTerms").checked;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      this.showAlert("danger", "Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      this.showAlert("danger", "Password must be at least 8 characters long");
      return;
    }

    // Check for special character requirement
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      this.showAlert(
        "danger",
        "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
      );
      return;
    }

    if (password !== confirmPassword) {
      this.showAlert("danger", "Passwords do not match");
      return;
    }

    if (!agreeTerms) {
      this.showAlert(
        "danger",
        "Please agree to the Terms of Service and Privacy Policy"
      );
      return;
    }

    // Check if user already exists
    if (this.users.find((u) => u.email === email)) {
      this.showAlert("danger", "User with this email already exists");
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      password,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    this.users.push(newUser);
    localStorage.setItem("healthyhabits_users", JSON.stringify(this.users));

    // Auto-login after registration
    this.currentUser = newUser;
    localStorage.setItem("healthyhabits_user", JSON.stringify(newUser));

    this.showUserMenu();
    this.showToast("Account created successfully! Welcome, " + firstName + "!");

    // Close modal
    const registerModal = bootstrap.Modal.getInstance(
      document.getElementById("registerModal")
    );
    registerModal.hide();

    // Clear form
    document.getElementById("registerForm").reset();
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem("healthyhabits_user");
    localStorage.removeItem("healthyhabits_rememberMe");

    this.showAuthButtons();
    this.showToast("You have been logged out successfully");

    // Clear any existing modals
    const modals = document.querySelectorAll(".modal.show");
    modals.forEach((modal) => {
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    });
  }

  togglePasswordVisibility(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    const icon = button.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.className = "bi bi-eye-slash";
    } else {
      input.type = "password";
      icon.className = "bi bi-eye";
    }
  }

  showProfile() {
    // Create profile modal content
    const profileContent = `
      <div class="modal fade" id="profileModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-person-circle me-2"></i>User Profile
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-4 text-center">
                  <div class="profile-avatar mb-3">
                    <i class="bi bi-person-circle" style="font-size: 4rem; color: var(--bs-primary);"></i>
                  </div>
                  <h5>${this.currentUser.firstName} ${
      this.currentUser.lastName
    }</h5>
                  <p class="text-muted">${this.currentUser.email}</p>
                  <div class="badge bg-success">Active User</div>
                </div>
                <div class="col-md-8">
                  <div class="profile-stats mb-4">
                    <h6 class="mb-3">Account Statistics</h6>
                    <div class="row">
                      <div class="col-6">
                        <div class="stat-card text-center p-3 border rounded">
                          <h4 class="text-primary mb-1">${
                            this.habits ? this.habits.length : 0
                          }</h4>
                          <small class="text-muted">Total Habits</small>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="stat-card text-center p-3 border rounded">
                          <h4 class="text-success mb-1">${this.calculateTotalPoints()}</h4>
                          <small class="text-muted">Total Points</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="profile-details">
                    <h6 class="mb-3">Account Details</h6>
                    <div class="row mb-2">
                      <div class="col-4"><strong>First Name:</strong></div>
                      <div class="col-8">${this.currentUser.firstName}</div>
                    </div>
                    <div class="row mb-2">
                      <div class="col-4"><strong>Last Name:</strong></div>
                      <div class="col-8">${this.currentUser.lastName}</div>
                    </div>
                    <div class="row mb-2">
                      <div class="col-4"><strong>Email:</strong></div>
                      <div class="col-8">${this.currentUser.email}</div>
                    </div>
                    <div class="row mb-2">
                      <div class="col-4"><strong>Member Since:</strong></div>
                      <div class="col-8">${
                        this.currentUser.createdAt
                          ? new Date(
                              this.currentUser.createdAt
                            ).toLocaleDateString()
                          : "-"
                      }</div>
                    </div>
                    <div class="row mb-2">
                      <div class="col-4"><strong>Last Login:</strong></div>
                      <div class="col-8">${
                        this.currentUser.lastLogin
                          ? new Date(
                              this.currentUser.lastLogin
                            ).toLocaleString()
                          : "-"
                      }</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" onclick="window.tracker.editProfile()">
                <i class="bi bi-pencil me-1"></i>Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById("profileModal");
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", profileContent);

    // Show the modal
    const profileModal = new bootstrap.Modal(
      document.getElementById("profileModal")
    );
    profileModal.show();
  }

  showSettings() {
    // Create settings modal content
    const settingsContent = `
      <div class="modal fade" id="settingsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-gear me-2"></i>Settings
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6 class="mb-3"><i class="bi bi-palette me-2"></i>Appearance</h6>
                  <div class="mb-3">
                    <label class="form-label">Theme</label>
                    <select class="form-select" id="themeSelect">
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </div>
                  
                  <h6 class="mb-3 mt-4"><i class="bi bi-bell me-2"></i>Notifications</h6>
                  <div class="mb-3">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="enableNotifications" checked>
                      <label class="form-check-label" for="enableNotifications">
                        Enable Notifications
                      </label>
                    </div>
                  </div>
                  <div class="mb-3">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="dailyReminders" checked>
                      <label class="form-check-label" for="dailyReminders">
                        Daily Habit Reminders
                      </label>
                    </div>
                  </div>
                  <div class="mb-3">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="weeklyReports">
                      <label class="form-check-label" for="weeklyReports">
                        Weekly Progress Reports
                      </label>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <h6 class="mb-3"><i class="bi bi-shield-check me-2"></i>Privacy & Security</h6>
                  <div class="mb-3">
                    <button class="btn btn-outline-primary btn-sm" onclick="window.tracker.changePassword()">
                      <i class="bi bi-key me-1"></i>Change Password
                    </button>
                  </div>
                  <div class="mb-3">
                    <button class="btn btn-outline-info btn-sm" onclick="window.tracker.exportUserData()">
                      <i class="bi bi-download me-1"></i>Export Data
                    </button>
                  </div>
                  
                  <h6 class="mb-3 mt-4"><i class="bi bi-data me-2"></i>Data Management</h6>
                  <div class="mb-3">
                    <button class="btn btn-outline-warning btn-sm" onclick="window.tracker.clearAllData()">
                      <i class="bi bi-trash me-1"></i>Clear All Data
                    </button>
                  </div>
                  
                  <h6 class="mb-3 mt-4"><i class="bi bi-info-circle me-2"></i>About</h6>
                  <div class="mb-3">
                    <p class="text-muted small">
                      <strong>HealthyHabits Tracker</strong><br>
                      Version: 1.0.0<br>
                      A comprehensive habit tracking application to help you build healthy routines and achieve your wellness goals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="window.tracker.saveSettings()">
                <i class="bi bi-check me-1"></i>Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById("settingsModal");
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", settingsContent);

    // Load current settings
    this.loadSettings();

    // Show the modal
    const settingsModal = new bootstrap.Modal(
      document.getElementById("settingsModal")
    );
    settingsModal.show();
  }

  loadSettings() {
    const themeSelect = document.getElementById("themeSelect");
    const enableNotifications = document.getElementById("enableNotifications");
    const dailyReminders = document.getElementById("dailyReminders");
    const weeklyReports = document.getElementById("weeklyReports");

    if (themeSelect) {
      const currentTheme =
        localStorage.getItem("healthyhabits_theme") || "light";
      themeSelect.value = currentTheme;
    }

    if (enableNotifications) {
      enableNotifications.checked =
        localStorage.getItem("healthyhabits_notifications") !== "false";
    }

    if (dailyReminders) {
      dailyReminders.checked =
        localStorage.getItem("healthyhabits_dailyReminders") !== "false";
    }

    if (weeklyReports) {
      weeklyReports.checked =
        localStorage.getItem("healthyhabits_weeklyReports") === "true";
    }
  }

  saveSettings() {
    const themeSelect = document.getElementById("themeSelect");
    const enableNotifications = document.getElementById("enableNotifications");
    const dailyReminders = document.getElementById("dailyReminders");
    const weeklyReports = document.getElementById("weeklyReports");

    // Save settings to localStorage
    if (themeSelect) {
      localStorage.setItem("healthyhabits_theme", themeSelect.value);
      const html = document.documentElement;
      let appliedTheme = themeSelect.value;
      if (themeSelect.value === "auto") {
        appliedTheme =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      }
      html.setAttribute("data-bs-theme", appliedTheme);
      this.updateThemeIcon(appliedTheme);
    }

    if (enableNotifications) {
      localStorage.setItem(
        "healthyhabits_notifications",
        enableNotifications.checked.toString()
      );
    }

    if (dailyReminders) {
      localStorage.setItem(
        "healthyhabits_dailyReminders",
        dailyReminders.checked.toString()
      );
    }

    if (weeklyReports) {
      localStorage.setItem(
        "healthyhabits_weeklyReports",
        weeklyReports.checked.toString()
      );
    }

    this.showToast("Settings saved successfully!");

    // Close the modal
    const settingsModal = bootstrap.Modal.getInstance(
      document.getElementById("settingsModal")
    );
    settingsModal.hide();
  }

  changePassword() {
    // Create change password modal
    const changePasswordContent = `
      <div class="modal fade" id="changePasswordModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-key me-2"></i>Change Password
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="changePasswordForm">
                <div class="mb-3">
                  <label for="currentPassword" class="form-label">Current Password</label>
                  <input type="password" class="form-control" id="currentPassword" required>
                </div>
                <div class="mb-3">
                  <label for="newPassword" class="form-label">New Password</label>
                  <div class="input-group">
                    <input type="password" class="form-control" id="newPassword" required>
                    <button class="btn btn-outline-secondary" type="button" onclick="window.tracker.togglePasswordVisibility('newPassword', 'newPasswordToggle')">
                      <i class="bi bi-eye" id="newPasswordToggle"></i>
                    </button>
                  </div>
                  <div id="newPasswordStrength"></div>
                </div>
                <div class="mb-3">
                  <label for="confirmNewPassword" class="form-label">Confirm New Password</label>
                  <input type="password" class="form-control" id="confirmNewPassword" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="window.tracker.updatePassword()">
                <i class="bi bi-check me-1"></i>Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById("changePasswordModal");
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", changePasswordContent);

    // Show the modal
    const changePasswordModal = new bootstrap.Modal(
      document.getElementById("changePasswordModal")
    );
    changePasswordModal.show();

    // Add password strength listener
    document.getElementById("newPassword").addEventListener("input", (e) => {
      this.checkPasswordStrength(
        e.target.value,
        "newPasswordStrength",
        "newPassword"
      );
    });
  }

  updatePassword() {
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword =
      document.getElementById("confirmNewPassword").value;

    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      this.showAlert("danger", "Please fill in all fields");
      return;
    }

    if (currentPassword !== this.currentUser.password) {
      this.showAlert("danger", "Current password is incorrect");
      return;
    }

    if (newPassword.length < 8) {
      this.showAlert(
        "danger",
        "New password must be at least 8 characters long"
      );
      return;
    }

    // Check for special character requirement
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      this.showAlert(
        "danger",
        "New password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      this.showAlert("danger", "New passwords do not match");
      return;
    }

    // Update password
    this.currentUser.password = newPassword;
    const userIndex = this.users.findIndex((u) => u.id === this.currentUser.id);
    this.users[userIndex] = this.currentUser;

    localStorage.setItem(
      "healthyhabits_user",
      JSON.stringify(this.currentUser)
    );
    localStorage.setItem("healthyhabits_users", JSON.stringify(this.users));

    this.showToast("Password updated successfully!");

    // Close the modal
    const changePasswordModal = bootstrap.Modal.getInstance(
      document.getElementById("changePasswordModal")
    );
    changePasswordModal.hide();
  }

  exportUserData() {
    const userData = {
      user: this.currentUser,
      habits: this.habits,
      moodHistory: this.moodHistory,
      settings: {
        theme: localStorage.getItem("healthyhabits_theme"),
        notifications: localStorage.getItem("healthyhabits_notifications"),
        dailyReminders: localStorage.getItem("healthyhabits_dailyReminders"),
        weeklyReports: localStorage.getItem("healthyhabits_weeklyReports"),
      },
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `healthyhabits_data_${this.currentUser.email}_${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();

    URL.revokeObjectURL(url);
    this.showToast("Data exported successfully!");
  }

  clearAllData() {
    if (
      confirm(
        "Are you sure you want to clear all your data? This action cannot be undone."
      )
    ) {
      // Clear all data
      this.habits = [];
      this.moodHistory = [];
      localStorage.removeItem("healthyhabits_habits");
      localStorage.removeItem("healthyhabits_moodHistory");

      this.showToast("All data cleared successfully!");
      this.renderAll();
    }
  }

  editProfile() {
    this.showAlert("info", "Profile editing feature coming soon!");
  }

  checkPasswordStrength(
    password,
    targetElementId = "passwordStrength",
    anchorInputId = "registerPassword"
  ) {
    let strength = 0;
    let feedback = "";

    // Check length
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Check for different character types
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    // Determine strength level
    let strengthClass = "";
    let strengthText = "";

    if (strength <= 2) {
      strengthClass = "weak";
      strengthText = "Weak";
    } else if (strength <= 4) {
      strengthClass = "medium";
      strengthText = "Medium";
    } else if (strength <= 6) {
      strengthClass = "strong";
      strengthText = "Strong";
    } else {
      strengthClass = "very-strong";
      strengthText = "Very Strong";
    }

    // Update or create strength indicator
    let strengthIndicator = document.getElementById(targetElementId);
    if (!strengthIndicator) {
      strengthIndicator = document.createElement("div");
      strengthIndicator.id = targetElementId;
      strengthIndicator.className = "password-strength";
      const anchorInput = document.getElementById(anchorInputId);
      if (anchorInput && anchorInput.parentNode) {
        anchorInput.parentNode.appendChild(strengthIndicator);
      } else {
        return;
      }
    }

    strengthIndicator.className = `password-strength ${strengthClass}`;
    strengthIndicator.title = `Password Strength: ${strengthText}`;
  }

  showForgotPassword() {
    const email = document.getElementById("loginEmail").value.trim();

    if (!email) {
      this.showAlert("error", "Please enter your email address first");
      return;
    }

    const user = this.users.find((u) => u.email === email);

    if (!user) {
      this.showAlert("error", "No account found with this email address");
      return;
    }

    // In a real application, you would send a password reset email
    // For this demo, we'll just show a message
    this.showAlert(
      "info",
      `Password reset instructions have been sent to ${email}. Please check your email.`
    );

    // Close the login modal
    const loginModal = bootstrap.Modal.getInstance(
      document.getElementById("loginModal")
    );
    loginModal.hide();
  }

  // Form validation helpers
  clearValidation(fieldId) {
    const field = document.getElementById(fieldId);
    field.classList.remove("is-invalid", "is-valid");

    // Remove existing feedback
    const existingFeedback = field.parentNode.querySelector(
      ".invalid-feedback, .valid-feedback"
    );
    if (existingFeedback) {
      existingFeedback.remove();
    }
  }

  showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.remove("is-valid");
    field.classList.add("is-invalid");

    // Remove existing feedback
    const existingFeedback =
      field.parentNode.querySelector(".invalid-feedback");
    if (existingFeedback) {
      existingFeedback.remove();
    }

    // Add new feedback
    const feedback = document.createElement("div");
    feedback.className = "invalid-feedback";
    feedback.textContent = message;
    field.parentNode.appendChild(feedback);
  }

  showFieldSuccess(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.remove("is-invalid");
    field.classList.add("is-valid");

    // Remove existing feedback
    const existingFeedback = field.parentNode.querySelector(".valid-feedback");
    if (existingFeedback) {
      existingFeedback.remove();
    }

    // Add new feedback
    const feedback = document.createElement("div");
    feedback.className = "valid-feedback";
    feedback.textContent = message;
    field.parentNode.appendChild(feedback);
  }

  resetLoginButton(button) {
    button.disabled = false;
    button.classList.remove("loading");
    button.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const html = document.documentElement;

    // Load saved theme
    const savedThemeRaw =
      localStorage.getItem("healthyhabits_theme") || "light";
    let savedTheme = savedThemeRaw;
    if (savedThemeRaw === "auto") {
      savedTheme =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    }
    html.setAttribute("data-bs-theme", savedTheme);
    this.updateThemeIcon(savedTheme);

    themeToggle.addEventListener("click", () => {
      const currentTheme = html.getAttribute("data-bs-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";

      html.setAttribute("data-bs-theme", newTheme);
      localStorage.setItem("healthyhabits_theme", newTheme);
      this.updateThemeIcon(newTheme);

      // Re-render charts with new theme
      setTimeout(() => this.renderAnalytics(), 100);
    });
  }

  updateThemeIcon(theme) {
    const themeIcon = document.getElementById("themeIcon");
    themeIcon.className =
      theme === "light" ? "bi bi-moon-fill" : "bi bi-sun-fill";
  }

  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach((tab) => {
      tab.classList.remove("active");
    });

    // Show selected tab
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
      targetTab.classList.add("active");
    }

    // Update navigation
    document.querySelectorAll(".nav-link[data-tab]").forEach((link) => {
      link.classList.remove("active");
    });

    const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeLink) {
      activeLink.classList.add("active");
    }

    this.currentTab = tabName;

    // Render tab-specific content
    if (tabName === "analytics") {
      setTimeout(() => this.renderAnalytics(), 100);
    } else if (tabName === "challenges") {
      this.renderChallenges();
    }
  }

  addHabit() {
    const name = document.getElementById("habitName").value.trim();
    const category = document.getElementById("habitCategory").value;
    const frequency = document.getElementById("habitFrequency").value;
    const goal = document.getElementById("habitGoal").value.trim();
    const target = parseInt(document.getElementById("habitTarget").value) || 1;
    const reminder = document.getElementById("habitReminder").value;

    if (!name || !category || !frequency) {
      this.showAlert("warning", "Please fill in all required fields!");
      return;
    }

    const habit = {
      id: Date.now().toString(),
      name,
      category,
      frequency,
      goal,
      target,
      reminder,
      createdAt: new Date().toISOString(),
      streak: 0,
      totalCompletions: 0,
      lastCompleted: null,
    };

    this.habits.push(habit);
    this.saveData();
    this.renderAll();

    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addHabitModal")
    );
    modal.hide();
    document.getElementById("addHabitForm").reset();

    this.showAlert(
      "success",
      `Great! "${name}" has been added to your habits!`
    );

    // Setup reminder if specified
    if (reminder) {
      this.setupHabitReminder(habit);
    }
  }

  editHabit(habitId) {
    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) return;

    // Populate edit form
    document.getElementById("editHabitId").value = habit.id;
    document.getElementById("editHabitName").value = habit.name;
    document.getElementById("editHabitCategory").value = habit.category;
    document.getElementById("editHabitFrequency").value = habit.frequency;
    document.getElementById("editHabitGoal").value = habit.goal || "";
    document.getElementById("editHabitTarget").value = habit.target;
    document.getElementById("editHabitReminder").value = habit.reminder || "";

    // Show modal
    const modal = new bootstrap.Modal(
      document.getElementById("editHabitModal")
    );
    modal.show();
  }

  updateHabit() {
    const habitId = document.getElementById("editHabitId").value;
    const habitIndex = this.habits.findIndex((h) => h.id === habitId);

    if (habitIndex === -1) return;

    const name = document.getElementById("editHabitName").value.trim();
    const category = document.getElementById("editHabitCategory").value;
    const frequency = document.getElementById("editHabitFrequency").value;
    const goal = document.getElementById("editHabitGoal").value.trim();
    const target =
      parseInt(document.getElementById("editHabitTarget").value) || 1;
    const reminder = document.getElementById("editHabitReminder").value;

    if (!name || !category || !frequency) {
      this.showAlert("warning", "Please fill in all required fields!");
      return;
    }

    this.habits[habitIndex] = {
      ...this.habits[habitIndex],
      name,
      category,
      frequency,
      goal,
      target,
      reminder,
    };

    this.saveData();
    this.renderAll();

    // Close modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("editHabitModal")
    );
    modal.hide();

    this.showAlert("success", "Habit updated successfully!");

    // Update reminder
    if (reminder) {
      this.setupHabitReminder(this.habits[habitIndex]);
    }
  }

  deleteHabit(habitId) {
    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) return;

    if (
      confirm(
        `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`
      )
    ) {
      this.habits = this.habits.filter((h) => h.id !== habitId);

      // Clean up completions
      Object.keys(this.completions).forEach((date) => {
        if (this.completions[date][habitId]) {
          delete this.completions[date][habitId];
        }
      });

      // Clean up reminders
      if (this.reminders[habitId]) {
        delete this.reminders[habitId];
      }

      this.saveData();
      this.renderAll();

      // Close modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editHabitModal")
      );
      modal.hide();

      this.showAlert("info", `"${habit.name}" has been deleted.`);
    }
  }

  toggleHabitCompletion(habitId, date = null) {
    const today = date || new Date().toISOString().split("T")[0];

    if (!this.completions[today]) {
      this.completions[today] = {};
    }

    if (!this.completions[today][habitId]) {
      this.completions[today][habitId] = 0;
    }

    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) return;

    const currentCompletions = this.completions[today][habitId];

    if (currentCompletions < habit.target) {
      this.completions[today][habitId]++;
      habit.totalCompletions++;
      habit.lastCompleted = today;

      // Update streak
      this.updateStreak(habitId);

      // Show completion animation
      const checkBtn = document.querySelector(
        `[data-habit-id="${habitId}"] .habit-check-btn`
      );
      if (checkBtn) {
        checkBtn.classList.add("completed", "bounce");
        setTimeout(() => checkBtn.classList.remove("bounce"), 800);
      }

      // Check if fully completed
      if (this.completions[today][habitId] >= habit.target) {
        this.showAlert(
          "success",
          `🎉 Awesome! You completed "${habit.name}" for today!`
        );
        this.celebrateCompletion();
      } else {
        this.showAlert(
          "success",
          `Great progress on "${habit.name}"! (${this.completions[today][habitId]}/${habit.target})`
        );
      }
    } else {
      // Reset completion
      this.completions[today][habitId] = 0;
      habit.totalCompletions = Math.max(
        0,
        habit.totalCompletions - habit.target
      );
      this.updateStreak(habitId);
    }

    this.saveData();
    this.renderAll();
    this.checkWellnessScore();
  }

  updateStreak(habitId) {
    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) return;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const completions = this.completions[dateStr]?.[habitId] || 0;
      const isCompleted = completions >= habit.target;

      if (isCompleted) {
        streak++;
      } else if (i === 0) {
        // If today is not completed, streak is 0
        break;
      } else {
        // If we hit a day that's not completed, stop counting
        break;
      }
    }

    habit.streak = streak;
  }

  calculateWellnessScore() {
    if (this.habits.length === 0) return 0;

    const last7Days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last7Days.push(date.toISOString().split("T")[0]);
    }

    let totalPossible = 0;
    let totalCompleted = 0;

    this.habits.forEach((habit) => {
      last7Days.forEach((date) => {
        const completions = this.completions[date]?.[habit.id] || 0;
        const target = habit.target;

        totalPossible += target;
        totalCompleted += Math.min(completions, target);
      });
    });

    return totalPossible === 0
      ? 0
      : Math.round((totalCompleted / totalPossible) * 100);
  }

  checkWellnessScore() {
    const currentScore = this.calculateWellnessScore();
    const previousScore =
      parseInt(localStorage.getItem("healthyhabits_previous_score")) ||
      currentScore;

    if (currentScore < previousScore - 15) {
      this.showAlert(
        "warning",
        "📉 Your wellness score has dropped. Don't give up - every small step counts!"
      );
    } else if (currentScore > previousScore + 15) {
      this.showAlert(
        "success",
        "📈 Amazing! Your wellness score is improving steadily!"
      );
    } else if (currentScore >= 90) {
      this.showAlert(
        "success",
        "🏆 Outstanding! You're maintaining excellent healthy habits!"
      );
    }

    localStorage.setItem(
      "healthyhabits_previous_score",
      currentScore.toString()
    );
  }

  setMood(mood) {
    const today = new Date().toISOString().split("T")[0];
    const moodEmojis = ["", "😢", "😞", "😐", "😊", "😄"];
    const moodNames = ["", "Very Bad", "Bad", "Neutral", "Good", "Excellent"];

    // Update mood history
    const existingMoodIndex = this.moodHistory.findIndex(
      (m) => m.date === today
    );
    if (existingMoodIndex !== -1) {
      this.moodHistory[existingMoodIndex].mood = mood;
    } else {
      this.moodHistory.push({ date: today, mood });
    }

    // Keep only last 30 days
    this.moodHistory = this.moodHistory.slice(-30);

    // Update UI
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });
    document.querySelector(`[data-mood="${mood}"]`).classList.add("selected");

    this.saveData();
    this.renderMoodHistory();
    this.showAlert(
      "success",
      `Mood recorded: ${moodEmojis[mood]} ${moodNames[mood]}`
    );
  }

  renderMoodHistory() {
    const container = document.getElementById("moodHistory");
    const moodEmojis = ["", "😢", "😞", "😐", "😊", "😄"];

    const last7Days = this.moodHistory.slice(-7).reverse();

    if (last7Days.length === 0) {
      container.innerHTML =
        '<span class="text-muted">No mood history yet</span>';
      return;
    }

    container.innerHTML = last7Days
      .map((entry) => {
        const date = new Date(entry.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        return `<span class="mood-history-item">${date}: ${
          moodEmojis[entry.mood]
        }</span>`;
      })
      .join("");
  }

  loadTodayMood() {
    const today = new Date().toISOString().split("T")[0];
    const todayMood = this.moodHistory.find((m) => m.date === today);

    if (todayMood) {
      const moodBtn = document.querySelector(`[data-mood="${todayMood.mood}"]`);
      if (moodBtn) {
        moodBtn.classList.add("selected");
      }
    }

    this.renderMoodHistory();
  }

  renderDashboard() {
    this.updateWellnessScore();
    this.updateQuickStats();
    this.renderTodayHabits();
  }

  updateWellnessScore() {
    const score = this.calculateWellnessScore();
    const scoreElement = document.getElementById("wellnessScore");
    const messageElement = document.getElementById("wellnessMessage");

    // Animate score change
    const currentScore = parseInt(scoreElement.textContent) || 0;
    const increment = score > currentScore ? 1 : score < currentScore ? -1 : 0;

    if (increment !== 0) {
      const animateScore = () => {
        const current = parseInt(scoreElement.textContent) || 0;
        if (current !== score) {
          scoreElement.textContent = current + increment;
          setTimeout(animateScore, 30);
        }
      };
      animateScore();
    } else {
      scoreElement.textContent = score;
    }

    // Update message based on score
    let message;
    if (score >= 90) {
      message = "🏆 Outstanding! You're crushing your healthy habits!";
    } else if (score >= 75) {
      message = "🌟 Great work! You're building strong healthy habits!";
    } else if (score >= 50) {
      message = "💪 Good progress! Keep building those habits!";
    } else if (score > 0) {
      message = "🌱 You're getting started! Every step counts!";
    } else {
      message = "🚀 Ready to start your healthy journey? Add your first habit!";
    }

    messageElement.textContent = message;
  }

  updateQuickStats() {
    const today = new Date().toISOString().split("T")[0];
    let completedToday = 0;
    let longestStreak = 0;
    let totalPoints = 0;

    this.habits.forEach((habit) => {
      const todayCompletions = this.completions[today]?.[habit.id] || 0;
      if (todayCompletions >= habit.target) {
        completedToday++;
      }

      longestStreak = Math.max(longestStreak, habit.streak);
      totalPoints += habit.totalCompletions * 10; // 10 points per completion
    });

    // Animate counters
    this.animateCounter("totalCompleted", completedToday);
    this.animateCounter("longestStreak", longestStreak);
    this.animateCounter("totalHabits", this.habits.length);
    this.animateCounter("totalPoints", totalPoints);
  }

  animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    const increment =
      targetValue > currentValue ? 1 : targetValue < currentValue ? -1 : 0;

    if (increment !== 0) {
      const animate = () => {
        const current = parseInt(element.textContent) || 0;
        if (current !== targetValue) {
          element.textContent = current + increment;
          setTimeout(animate, 50);
        }
      };
      animate();
    } else {
      element.textContent = targetValue;
    }
  }

  renderTodayHabits() {
    const container = document.getElementById("todayHabits");
    const today = new Date().toISOString().split("T")[0];

    if (this.habits.length === 0) {
      container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-plus-circle fs-1 text-muted mb-3"></i>
                    <h5 class="text-muted">No habits yet</h5>
                    <p class="text-muted">Start building healthy habits by adding your first one!</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addHabitModal">
                        Add Your First Habit
                    </button>
                </div>
            `;
      return;
    }

    container.innerHTML = this.habits
      .map((habit) => {
        const completions = this.completions[today]?.[habit.id] || 0;
        const isCompleted = completions >= habit.target;
        const progress = Math.min((completions / habit.target) * 100, 100);

        return `
                <div class="col-lg-4 col-md-6 mb-3">
                    <div class="card habit-card ${
                      habit.category
                    } fade-in-scale" data-habit-id="${habit.id}">
                        <div class="card-body d-flex align-items-center">
                            <div class="category-icon ${habit.category} me-3">
                                ${this.getCategoryIcon(habit.category)}
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1 fw-bold">${habit.name}</h6>
                                <small class="text-muted">${completions}/${
          habit.target
        } completed</small>
                                <div class="progress mt-2" style="height: 6px;">
                                    <div class="progress-bar" style="width: ${progress}%"></div>
                                </div>
                            </div>
                            <div class="habit-check-btn ${
                              isCompleted ? "completed" : ""
                            }" 
                                 onclick="tracker.toggleHabitCompletion('${
                                   habit.id
                                 }')">
                                <i class="bi bi-check"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  renderHabits() {
    const container = document.getElementById("habitsContainer");

    if (this.habits.length === 0) {
      container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-heart fs-1 text-muted mb-3"></i>
                    <h3 class="text-muted">Start Your Healthy Journey</h3>
                    <p class="text-muted mb-4">Create your first habit and begin building a healthier lifestyle!</p>
                    <button class="btn btn-primary btn-lg" data-bs-toggle="modal" data-bs-target="#addHabitModal">
                        <i class="bi bi-plus-lg me-2"></i>Add Your First Habit
                    </button>
                </div>
            `;
      return;
    }

    container.innerHTML = this.habits
      .map((habit) => {
        const today = new Date().toISOString().split("T")[0];
        const completions = this.completions[today]?.[habit.id] || 0;
        const isCompleted = completions >= habit.target;
        const progress = Math.min((completions / habit.target) * 100, 100);

        return `
                <div class="col-lg-6 col-xl-4 mb-4 habit-item slide-in-up" data-category="${
                  habit.category
                }">
                    <div class="card habit-card ${
                      habit.category
                    }" data-habit-id="${habit.id}">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h5 class="mb-1 fw-bold">${habit.name}</h5>
                                    <small class="opacity-75">
                                        ${this.getCategoryIcon(
                                          habit.category
                                        )} ${
          habit.category.charAt(0).toUpperCase() + habit.category.slice(1)
        } • 
                                        ${
                                          habit.frequency
                                            .charAt(0)
                                            .toUpperCase() +
                                          habit.frequency.slice(1)
                                        }
                                    </small>
                                </div>
                                <div class="habit-streak">
                                    <i class="bi bi-fire"></i> ${habit.streak}
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <p class="text-muted mb-3">${
                              habit.goal || "No specific goal set"
                            }</p>
                            
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="fw-semibold">Today's Progress</span>
                                <span class="fw-bold">${completions}/${
          habit.target
        }</span>
                            </div>
                            
                            <div class="progress habit-progress mb-3">
                                <div class="progress-bar" style="width: ${progress}%"></div>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="habit-check-btn ${
                                  isCompleted ? "completed" : ""
                                }" 
                                     onclick="tracker.toggleHabitCompletion('${
                                       habit.id
                                     }')">
                                    <i class="bi bi-check"></i>
                                </div>
                                
                                <div class="btn-group" role="group">
                                    <button class="btn btn-sm btn-outline-primary" onclick="tracker.editHabit('${
                                      habit.id
                                    }')" title="Edit habit">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" onclick="tracker.viewHabitStats('${
                                      habit.id
                                    }')" title="View statistics">
                                        <i class="bi bi-graph-up"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="mt-3">
                                <small class="text-muted">
                                    <i class="bi bi-trophy-fill text-warning me-1"></i>Total: ${
                                      habit.totalCompletions
                                    } | 
                                    <i class="bi bi-calendar-check me-1"></i>Created: ${new Date(
                                      habit.createdAt
                                    ).toLocaleDateString()}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  filterHabits(category) {
    const habitItems = document.querySelectorAll(".habit-item");

    habitItems.forEach((item, index) => {
      if (
        category === "all" ||
        item.getAttribute("data-category") === category
      ) {
        item.style.display = "block";
        // Stagger animation
        setTimeout(() => {
          item.classList.add("slide-in-up");
        }, index * 100);
      } else {
        item.style.display = "none";
        item.classList.remove("slide-in-up");
      }
    });
  }

  renderAnalytics() {
    this.renderCategoryChart();
    this.renderWeeklyChart();
    this.renderHabitPerformance();
  }

  renderCategoryChart() {
    const ctx = document.getElementById("categoryChart");
    if (!ctx) return;

    if (this.charts.category) {
      this.charts.category.destroy();
    }

    const categoryData = {
      fitness: { completed: 0, total: 0 },
      nutrition: { completed: 0, total: 0 },
      mindfulness: { completed: 0, total: 0 },
      sleep: { completed: 0, total: 0 },
    };

    // Calculate completion rates for last 7 days
    const last7Days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last7Days.push(date.toISOString().split("T")[0]);
    }

    this.habits.forEach((habit) => {
      last7Days.forEach((date) => {
        const completions = this.completions[date]?.[habit.id] || 0;
        const target = habit.target;

        categoryData[habit.category].total += target;
        categoryData[habit.category].completed += Math.min(completions, target);
      });
    });

    const data = Object.keys(categoryData).map((category) => {
      const { completed, total } = categoryData[category];
      return total === 0 ? 0 : Math.round((completed / total) * 100);
    });

    const isDarkMode =
      document.documentElement.getAttribute("data-bs-theme") === "dark";

    this.charts.category = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["🏃‍♂️ Fitness", "🥗 Nutrition", "🧘‍♀️ Mindfulness", "😴 Sleep"],
        datasets: [
          {
            data: data,
            backgroundColor: ["#ff6b6b", "#4ecdc4", "#a8edea", "#667eea"],
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: isDarkMode ? "#fff" : "#333",
              padding: 20,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${context.parsed}%`;
              },
            },
          },
        },
      },
    });
  }

  renderWeeklyChart() {
    const ctx = document.getElementById("weeklyChart");
    if (!ctx) return;

    if (this.charts.weekly) {
      this.charts.weekly.destroy();
    }

    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last7Days.push(date.toISOString().split("T")[0]);
    }

    const weeklyData = last7Days.map((date) => {
      let completed = 0;
      let total = 0;

      this.habits.forEach((habit) => {
        const completions = this.completions[date]?.[habit.id] || 0;
        const target = habit.target;

        total += target;
        completed += Math.min(completions, target);
      });

      return total === 0 ? 0 : Math.round((completed / total) * 100);
    });

    const isDarkMode =
      document.documentElement.getAttribute("data-bs-theme") === "dark";

    this.charts.weekly = new Chart(ctx, {
      type: "line",
      data: {
        labels: last7Days.map((date) => {
          return new Date(date).toLocaleDateString("en-US", {
            weekday: "short",
          });
        }),
        datasets: [
          {
            label: "Completion Rate (%)",
            data: weeklyData,
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#667eea",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: isDarkMode ? "#fff" : "#333",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: isDarkMode ? "#fff" : "#333",
              callback: function (value) {
                return value + "%";
              },
            },
            grid: {
              color: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            },
          },
          x: {
            ticks: {
              color: isDarkMode ? "#fff" : "#333",
            },
            grid: {
              color: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            },
          },
        },
      },
    });
  }

  renderHabitPerformance() {
    const container = document.getElementById("habitPerformance");

    if (this.habits.length === 0) {
      container.innerHTML =
        '<p class="text-muted text-center py-4">No habits to analyze yet. Add some habits to see performance data!</p>';
      return;
    }

    const performanceData = this.habits.map((habit) => {
      const last7Days = [];
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        last7Days.push(date.toISOString().split("T")[0]);
      }

      let completed = 0;
      let total = 0;

      last7Days.forEach((date) => {
        const completions = this.completions[date]?.[habit.id] || 0;
        const target = habit.target;

        total += target;
        completed += Math.min(completions, target);
      });

      const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

      return {
        ...habit,
        completionRate: rate,
        weeklyCompleted: completed,
        weeklyTotal: total,
      };
    });

    // Sort by completion rate
    performanceData.sort((a, b) => b.completionRate - a.completionRate);

    container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Habit</th>
                            <th>Category</th>
                            <th>Streak</th>
                            <th>7-Day Rate</th>
                            <th>Performance</th>
                            <th>Total Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${performanceData
                          .map((habit, index) => {
                            let performanceClass = "success";
                            let performanceText = "Excellent";
                            let performanceIcon = "bi-trophy-fill";

                            if (habit.completionRate < 50) {
                              performanceClass = "danger";
                              performanceText = "Needs Attention";
                              performanceIcon = "bi-exclamation-triangle-fill";
                            } else if (habit.completionRate < 75) {
                              performanceClass = "warning";
                              performanceText = "Good";
                              performanceIcon = "bi-star-fill";
                            }

                            const rankIcon =
                              index === 0
                                ? "🥇"
                                : index === 1
                                ? "🥈"
                                : index === 2
                                ? "🥉"
                                : "";

                            return `
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="category-icon ${
                                              habit.category
                                            } me-2" style="width: 35px; height: 35px; font-size: 0.9rem;">
                                                ${this.getCategoryIcon(
                                                  habit.category
                                                )}
                                            </div>
                                            <div>
                                                <div class="fw-bold">${rankIcon} ${
                              habit.name
                            }</div>
                                                <small class="text-muted">${
                                                  habit.goal || "No goal set"
                                                }</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="badge bg-secondary">${
                                      habit.category
                                    }</span></td>
                                    <td>
                                        <span class="d-flex align-items-center">
                                            <i class="bi bi-fire text-danger me-1"></i>${
                                              habit.streak
                                            }
                                        </span>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="progress me-2" style="width: 60px; height: 6px;">
                                                <div class="progress-bar bg-${performanceClass}" style="width: ${
                              habit.completionRate
                            }%"></div>
                                            </div>
                                            <span class="fw-bold">${
                                              habit.completionRate
                                            }%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge bg-${performanceClass}">
                                            <i class="bi ${performanceIcon} me-1"></i>${performanceText}
                                        </span>
                                    </td>
                                    <td class="fw-bold text-primary">${
                                      habit.totalCompletions * 10
                                    }</td>
                                </tr>
                            `;
                          })
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
  }

  renderChallenges() {
    this.renderActiveChallenges();
    this.renderLeaderboard();
    this.renderAISuggestions();
  }

  renderActiveChallenges() {
    const container = document.getElementById("activeChallenges");

    const challenges = [
      {
        id: 1,
        name: "7-Day Fitness Streak",
        description: "Complete all your fitness habits for 7 consecutive days",
        progress: this.calculateChallengeProgress("fitness", 7),
        maxProgress: 7,
        reward: "100 points + 🏆 Fitness Champion badge",
        category: "fitness",
        icon: "🏃‍♂️",
      },
      {
        id: 2,
        name: "Mindfulness Master",
        description: "Complete 20 mindfulness sessions this month",
        progress: this.calculateMonthlyProgress("mindfulness"),
        maxProgress: 20,
        reward: "200 points + 🧘‍♀️ Zen Master badge",
        category: "mindfulness",
        icon: "🧘‍♀️",
      },
      {
        id: 3,
        name: "Nutrition Champion",
        description:
          "Maintain 85% completion rate for nutrition habits this week",
        progress: this.calculateWeeklyCompletionRate("nutrition"),
        maxProgress: 85,
        reward: "150 points + 🥗 Healthy Eater badge",
        category: "nutrition",
        icon: "🥗",
      },
      {
        id: 4,
        name: "Sleep Consistency",
        description: "Complete sleep habits for 10 consecutive days",
        progress: this.calculateChallengeProgress("sleep", 10),
        maxProgress: 10,
        reward: "120 points + 😴 Dream Keeper badge",
        category: "sleep",
        icon: "😴",
      },
    ];

    container.innerHTML = challenges
      .map((challenge) => {
        const progressPercent = Math.min(
          (challenge.progress / challenge.maxProgress) * 100,
          100
        );
        const isCompleted = challenge.progress >= challenge.maxProgress;

        return `
                <div class="challenge-card card mb-3 fade-in-scale">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <span class="fs-4 me-2">${challenge.icon}</span>
                            <h6 class="mb-0 fw-bold">${challenge.name}</h6>
                        </div>
                        <span class="badge bg-light text-dark fs-6">${
                          challenge.reward.split("+")[0]
                        }</span>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-3">${challenge.description}</p>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <small class="fw-semibold">Progress</small>
                            <small class="fw-bold">${challenge.progress}/${
          challenge.maxProgress
        }</small>
                        </div>
                        <div class="progress challenge-progress mb-3">
                            <div class="progress-bar ${
                              isCompleted ? "bg-success" : "bg-primary"
                            }" 
                                 style="width: ${progressPercent}%"></div>
                        </div>
                        ${
                          isCompleted
                            ? '<div class="alert alert-success mb-0 py-2"><i class="bi bi-check-circle-fill me-2"></i>Challenge Completed! 🎉</div>'
                            : `<small class="text-muted">${challenge.reward}</small>`
                        }
                    </div>
                </div>
            `;
      })
      .join("");
  }

  calculateChallengeProgress(category, days) {
    const today = new Date();
    let streak = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const categoryHabits = this.habits.filter((h) => h.category === category);
      if (categoryHabits.length === 0) return 0;

      const allCompleted = categoryHabits.every((habit) => {
        const completions = this.completions[dateStr]?.[habit.id] || 0;
        return completions >= habit.target;
      });

      if (allCompleted) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  calculateMonthlyProgress(category) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let total = 0;

    const currentDate = new Date(startOfMonth);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const categoryHabits = this.habits.filter((h) => h.category === category);

      categoryHabits.forEach((habit) => {
        const completions = this.completions[dateStr]?.[habit.id] || 0;
        total += Math.min(completions, habit.target);
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return total;
  }

  calculateWeeklyCompletionRate(category) {
    const last7Days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last7Days.push(date.toISOString().split("T")[0]);
    }

    let completed = 0;
    let total = 0;

    const categoryHabits = this.habits.filter((h) => h.category === category);

    categoryHabits.forEach((habit) => {
      last7Days.forEach((date) => {
        const completions = this.completions[date]?.[habit.id] || 0;
        const target = habit.target;

        total += target;
        completed += Math.min(completions, target);
      });
    });

    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }

  renderLeaderboard() {
    const container = document.getElementById("leaderboard");
    const userPoints = this.calculateTotalPoints();

    // Mock leaderboard data with dynamic user position
    const leaderboard = [
      { name: "Emma Rodriguez", points: 3250, avatar: "👩‍💼" },
      { name: "Alex Chen", points: 3180, avatar: "👨‍💻" },
      { name: "Sarah Johnson", points: 2950, avatar: "👩‍🎓" },
      { name: "Mike Thompson", points: 2820, avatar: "👨‍🔬" },
      { name: "Lisa Wang", points: 2750, avatar: "👩‍🎨" },
      { name: "You", points: userPoints, avatar: "🎯" },
    ];

    // Sort by points and assign ranks
    leaderboard.sort((a, b) => b.points - a.points);

    container.innerHTML = leaderboard
      .slice(0, 6)
      .map((user, index) => {
        const isCurrentUser = user.name === "You";
        const rank = index + 1;
        const rankClass =
          rank === 1
            ? "first"
            : rank === 2
            ? "second"
            : rank === 3
            ? "third"
            : "";

        return `
                <div class="leaderboard-item ${
                  isCurrentUser ? "border border-primary" : ""
                } fade-in-scale">
                    <div class="leaderboard-rank ${rankClass}">
                        ${rank}
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center">
                            <span class="fs-5 me-2">${user.avatar}</span>
                            <div>
                                <h6 class="mb-0 ${
                                  isCurrentUser ? "text-primary fw-bold" : ""
                                }">${user.name}</h6>
                                <small class="text-muted">${user.points.toLocaleString()} points</small>
                            </div>
                        </div>
                    </div>
                    ${
                      isCurrentUser
                        ? '<i class="bi bi-person-fill text-primary fs-4"></i>'
                        : ""
                    }
                    ${
                      rank <= 3
                        ? '<span class="badge bg-warning text-dark ms-2">Top 3</span>'
                        : ""
                    }
                </div>
            `;
      })
      .join("");
  }

  calculateTotalPoints() {
    return this.habits.reduce(
      (total, habit) => total + habit.totalCompletions * 10,
      0
    );
  }

  renderAISuggestions() {
    const container = document.getElementById("aiSuggestions");
    const suggestions = this.generateAISuggestions();

    container.innerHTML = suggestions
      .map(
        (suggestion) => `
            <div class="ai-suggestion fade-in-scale">
                <h6 class="fw-bold">${suggestion.title}</h6>
                <p>${suggestion.description}</p>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm" onclick="tracker.applySuggestion('${suggestion.id}')">
                        <i class="bi bi-plus-lg me-1"></i>Try This Habit
                    </button>
                    <button class="btn btn-sm" onclick="tracker.dismissSuggestion('${suggestion.id}')">
                        <i class="bi bi-x-lg me-1"></i>Dismiss
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  generateAISuggestions() {
    const suggestions = [];
    const categories = ["fitness", "nutrition", "mindfulness", "sleep"];
    const userCategories = [...new Set(this.habits.map((h) => h.category))];
    const missingCategories = categories.filter(
      (cat) => !userCategories.includes(cat)
    );

    const categoryHabits = {
      fitness: [
        {
          title: "🏃‍♂️ Morning Walk Challenge",
          description:
            "Start your day with a 15-minute energizing walk. Perfect for beginners and builds momentum for the day ahead.",
          category: "fitness",
        },
        {
          title: "💪 Daily Push-ups",
          description:
            "Build upper body strength with just 5 push-ups daily. Increase gradually as you get stronger!",
          category: "fitness",
        },
      ],
      nutrition: [
        {
          title: "💧 Hydration Hero",
          description:
            "Stay hydrated with 8 glasses of water daily. Your body will thank you with improved energy and focus!",
          category: "nutrition",
        },
        {
          title: "🥬 Veggie Power",
          description:
            "Add one extra serving of vegetables to each meal. Boost your nutrition with colorful, healthy choices!",
          category: "nutrition",
        },
      ],
      mindfulness: [
        {
          title: "🧘‍♀️ Mindful Minutes",
          description:
            "Start with just 5 minutes of daily meditation. Reduce stress and improve mental clarity gradually.",
          category: "mindfulness",
        },
        {
          title: "📝 Gratitude Journal",
          description:
            "Write down 3 things you're grateful for each day. Cultivate positivity and improve your mental well-being!",
          category: "mindfulness",
        },
      ],
      sleep: [
        {
          title: "😴 Consistent Bedtime",
          description:
            "Go to bed at the same time every night. Improve your sleep quality and wake up more refreshed!",
          category: "sleep",
        },
        {
          title: "📱 Digital Sunset",
          description:
            "Stop using screens 1 hour before bedtime. Better sleep quality leads to better days!",
          category: "sleep",
        },
      ],
    };

    // Add suggestions for missing categories
    missingCategories.forEach((category) => {
      if (categoryHabits[category]) {
        const randomHabit =
          categoryHabits[category][
            Math.floor(Math.random() * categoryHabits[category].length)
          ];
        suggestions.push({
          id: `${category}_${Date.now()}`,
          ...randomHabit,
        });
      }
    });

    // Add improvement suggestions for existing habits
    if (suggestions.length < 3 && this.habits.length > 0) {
      const lowPerformingHabits = this.habits.filter((h) => h.streak < 3);
      if (lowPerformingHabits.length > 0) {
        suggestions.push({
          id: "improvement_suggestion",
          title: "🎯 Boost Your Consistency",
          description: `Focus on "${lowPerformingHabits[0].name}" - try reducing the daily target or setting a reminder to build momentum!`,
          improvement: true,
        });
      }
    }

    // Add motivational suggestion if user is doing well
    if (suggestions.length < 3 && this.calculateWellnessScore() >= 75) {
      suggestions.push({
        id: "challenge_suggestion",
        title: "🚀 Level Up Challenge",
        description:
          "You're doing amazing! Ready to challenge yourself? Try increasing your daily targets or adding a new habit category!",
        challenge: true,
      });
    }

    return suggestions.slice(0, 3);
  }

  applySuggestion(suggestionId) {
    const suggestions = this.generateAISuggestions();
    const suggestion = suggestions.find((s) => s.id === suggestionId);

    if (suggestion && suggestion.category) {
      // Pre-fill the add habit modal
      document.getElementById("habitName").value = suggestion.title
        .replace(/[^\w\s]/gi, "")
        .trim();
      document.getElementById("habitCategory").value = suggestion.category;
      document.getElementById("habitFrequency").value = "daily";
      document.getElementById("habitGoal").value = suggestion.description;
      document.getElementById("habitTarget").value = "1";

      const modal = new bootstrap.Modal(
        document.getElementById("addHabitModal")
      );
      modal.show();
    } else {
      this.showAlert(
        "info",
        "Great suggestion! Consider implementing this improvement to boost your progress."
      );
    }
  }

  dismissSuggestion(suggestionId) {
    // In a real app, this would save dismissed suggestions to avoid showing them again
    this.showAlert(
      "info",
      "Suggestion dismissed. We'll show you different suggestions next time!"
    );
    setTimeout(() => this.renderAISuggestions(), 1000);
  }

  renderDailySummary() {
    const container = document.getElementById("dailySummaryContent");
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last7Days.push(date);
    }

    container.innerHTML = last7Days
      .map((date) => {
        const dateStr = date.toISOString().split("T")[0];
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        const dayDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const isToday = dateStr === new Date().toISOString().split("T")[0];

        let completed = 0;
        let total = 0;
        const dayHabits = [];

        this.habits.forEach((habit) => {
          const completions = this.completions[dateStr]?.[habit.id] || 0;
          const target = habit.target;
          const isCompleted = completions >= target;

          total += target;
          completed += Math.min(completions, target);

          dayHabits.push({
            name: habit.name,
            category: habit.category,
            completions,
            target,
            isCompleted,
          });
        });

        const percentage =
          total === 0 ? 0 : Math.round((completed / total) * 100);
        const mood = this.moodHistory.find((m) => m.date === dateStr);
        const moodEmoji = mood
          ? ["", "😢", "😞", "😐", "��", "😄"][mood.mood]
          : "";

        return `
                <div class="card mb-3 ${isToday ? "border-primary" : ""}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0 fw-bold">${dayName} ${
          isToday ? "(Today)" : ""
        }</h6>
                            <small class="text-muted">${dayDate}</small>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            ${
                              moodEmoji
                                ? `<span class="fs-4">${moodEmoji}</span>`
                                : ""
                            }
                            <div class="text-end">
                                <div class="fw-bold text-${
                                  percentage >= 80
                                    ? "success"
                                    : percentage >= 60
                                    ? "warning"
                                    : "danger"
                                }">${percentage}%</div>
                                <small class="text-muted">${completed}/${total}</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="progress mb-3" style="height: 8px;">
                            <div class="progress-bar bg-${
                              percentage >= 80
                                ? "success"
                                : percentage >= 60
                                ? "warning"
                                : "danger"
                            }" 
                                 style="width: ${percentage}%"></div>
                        </div>
                        <div class="row">
                            ${dayHabits
                              .map(
                                (habit) => `
                                <div class="col-md-6 mb-2">
                                    <div class="d-flex align-items-center">
                                        <div class="category-icon ${
                                          habit.category
                                        } me-2" style="width: 25px; height: 25px; font-size: 0.7rem;">
                                            ${this.getCategoryIcon(
                                              habit.category
                                            )}
                                        </div>
                                        <span class="${
                                          habit.isCompleted
                                            ? "text-success fw-bold"
                                            : "text-muted"
                                        }">${habit.name}</span>
                                        <span class="ms-auto">
                                            ${
                                              habit.isCompleted ? "✅" : "⏳"
                                            } ${habit.completions}/${
                                  habit.target
                                }
                                        </span>
                                    </div>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  renderWeeklySummary() {
    const container = document.getElementById("weeklySummaryContent");
    const weeks = [];
    const today = new Date();

    // Get last 4 weeks
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay() + 7 * week));

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      weeks.push({ start: weekStart, end: weekEnd });
    }

    container.innerHTML = weeks
      .map((week, weekIndex) => {
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(week.start);
          day.setDate(week.start.getDate() + i);
          weekDays.push(day);
        }

        let weekCompleted = 0;
        let weekTotal = 0;
        const categoryStats = {
          fitness: { completed: 0, total: 0 },
          nutrition: { completed: 0, total: 0 },
          mindfulness: { completed: 0, total: 0 },
          sleep: { completed: 0, total: 0 },
        };

        weekDays.forEach((day) => {
          const dateStr = day.toISOString().split("T")[0];

          this.habits.forEach((habit) => {
            const completions = this.completions[dateStr]?.[habit.id] || 0;
            const target = habit.target;
            const completed = Math.min(completions, target);

            weekTotal += target;
            weekCompleted += completed;

            categoryStats[habit.category].total += target;
            categoryStats[habit.category].completed += completed;
          });
        });

        const percentage =
          weekTotal === 0 ? 0 : Math.round((weekCompleted / weekTotal) * 100);
        const weekLabel =
          weekIndex === 0
            ? "This Week"
            : `${weekIndex + 1} Week${weekIndex > 0 ? "s" : ""} Ago`;

        return `
                <div class="card mb-4">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0 fw-bold">${weekLabel}</h6>
                                <small class="text-muted">${week.start.toLocaleDateString()} - ${week.end.toLocaleDateString()}</small>
                            </div>
                            <div class="text-end">
                                <div class="fw-bold fs-4 text-${
                                  percentage >= 80
                                    ? "success"
                                    : percentage >= 60
                                    ? "warning"
                                    : "danger"
                                }">${percentage}%</div>
                                <small class="text-muted">${weekCompleted}/${weekTotal}</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="progress mb-4" style="height: 10px;">
                            <div class="progress-bar bg-${
                              percentage >= 80
                                ? "success"
                                : percentage >= 60
                                ? "warning"
                                : "danger"
                            }" 
                                 style="width: ${percentage}%"></div>
                        </div>
                        
                        <h6 class="fw-bold mb-3">Category Breakdown:</h6>
                        <div class="row">
                            ${Object.entries(categoryStats)
                              .map(([category, stats]) => {
                                const catPercentage =
                                  stats.total === 0
                                    ? 0
                                    : Math.round(
                                        (stats.completed / stats.total) * 100
                                      );
                                return `
                                    <div class="col-md-6 mb-3">
                                        <div class="d-flex align-items-center mb-1">
                                            <div class="category-icon ${category} me-2" style="width: 20px; height: 20px; font-size: 0.6rem;">
                                                ${this.getCategoryIcon(
                                                  category
                                                )}
                                            </div>
                                            <span class="fw-semibold">${
                                              category.charAt(0).toUpperCase() +
                                              category.slice(1)
                                            }</span>
                                            <span class="ms-auto fw-bold">${catPercentage}%</span>
                                        </div>
                                        <div class="progress" style="height: 4px;">
                                            <div class="progress-bar" style="width: ${catPercentage}%"></div>
                                        </div>
                                    </div>
                                `;
                              })
                              .join("")}
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  getCategoryIcon(category) {
    const icons = {
      fitness: '<i class="bi bi-heart-pulse"></i>',
      nutrition: '<i class="bi bi-apple"></i>',
      mindfulness: '<i class="bi bi-flower1"></i>',
      sleep: '<i class="bi bi-moon-stars"></i>',
    };
    return icons[category] || '<i class="bi bi-circle"></i>';
  }

  updateTodayDate() {
    const today = new Date();
    const dateElement = document.getElementById("todayDate");
    if (dateElement) {
      dateElement.textContent = today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  setupReminders() {
    this.habits.forEach((habit) => {
      if (habit.reminder) {
        this.setupHabitReminder(habit);
      }
    });

    // Setup daily wellness check
    this.setupDailyWellnessCheck();
  }

  setupHabitReminder(habit) {
    if (!habit.reminder) return;

    const now = new Date();
    const [hours, minutes] = habit.reminder.split(":").map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, set for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    setTimeout(() => {
      this.showHabitReminder(habit);
      // Set up recurring daily reminder
      setInterval(() => {
        this.showHabitReminder(habit);
      }, 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeUntilReminder);
  }

  setupDailyWellnessCheck() {
    // Show wellness check at 8 PM daily
    const now = new Date();
    const wellnessTime = new Date();
    wellnessTime.setHours(20, 0, 0, 0);

    if (wellnessTime <= now) {
      wellnessTime.setDate(wellnessTime.getDate() + 1);
    }

    const timeUntilWellnessCheck = wellnessTime.getTime() - now.getTime();

    setTimeout(() => {
      this.showWellnessCheck();
      setInterval(() => {
        this.showWellnessCheck();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilWellnessCheck);
  }

  showHabitReminder(habit) {
    const today = new Date().toISOString().split("T")[0];
    const completions = this.completions[today]?.[habit.id] || 0;

    if (completions < habit.target) {
      const message = `Time for "${habit.name}"! You're ${completions}/${habit.target} completed today.`;

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("HealthyHabits Reminder", {
          body: message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
      }

      this.showToast(message);
    }
  }

  showWellnessCheck() {
    const score = this.calculateWellnessScore();
    let message = "";

    if (score >= 80) {
      message = "🌟 Great day! Your wellness score is looking fantastic!";
    } else if (score >= 60) {
      message = "💪 Good progress today! Keep building those healthy habits!";
    } else {
      message = "🌱 Every step counts! How did your habits go today?";
    }

    this.showToast(message);
  }

  requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          this.showAlert(
            "success",
            "Notifications enabled! You'll receive habit reminders."
          );
        }
      });
    }
  }

  showToast(message) {
    const toastElement = document.getElementById("notificationToast");
    const toastMessage = document.getElementById("toastMessage");

    toastMessage.textContent = message;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
  }

  showAlert(type, message) {
    const alertContainer = document.getElementById("alertContainer");
    const alertId = "alert_" + Date.now();

    // Map type to Bootstrap alert classes
    const alertClass = type === "error" ? "danger" : type;
    const iconClass =
      type === "success"
        ? "check-circle-fill"
        : type === "warning"
        ? "exclamation-triangle-fill"
        : type === "danger" || type === "error"
        ? "x-circle-fill"
        : "info-circle-fill";

    const alertHtml = `
      <div id="${alertId}" class="alert alert-${alertClass} alert-dismissible fade show" role="alert">
        <i class="bi bi-${iconClass} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;

    alertContainer.insertAdjacentHTML("beforeend", alertHtml);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      const alert = document.getElementById(alertId);
      if (alert) {
        const bsAlert =
          bootstrap.Alert.getInstance(alert) || new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
  }

  celebrateCompletion() {
    // Add celebration animation or confetti effect
    const celebration = document.createElement("div");
    celebration.innerHTML = "🎉";
    celebration.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            font-size: 4rem;
            z-index: 9999;
            animation: celebrate 2s ease-out forwards;
            pointer-events: none;
        `;

    document.body.appendChild(celebration);

    setTimeout(() => {
      document.body.removeChild(celebration);
    }, 2000);
  }

  viewHabitStats(habitId) {
    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) return;

    // This could open a detailed statistics modal
    // For now, show a simple alert with key stats
    const stats = this.calculateHabitStats(habit);
    const message = `
            📊 ${habit.name} Statistics:
            
            🔥 Current Streak: ${habit.streak} days
            ✅ Total Completions: ${habit.totalCompletions}
            📈 7-Day Rate: ${stats.weeklyRate}%
            🏆 Total Points: ${habit.totalCompletions * 10}
        `;

    this.showAlert("info", message);
  }

  calculateHabitStats(habit) {
    const last7Days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last7Days.push(date.toISOString().split("T")[0]);
    }

    let completed = 0;
    let total = 0;

    last7Days.forEach((date) => {
      const completions = this.completions[date]?.[habit.id] || 0;
      const target = habit.target;

      total += target;
      completed += Math.min(completions, target);
    });

    return {
      weeklyRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  }

  shareProgress() {
    const score = this.calculateWellnessScore();
    const completedToday = this.habits.reduce((count, habit) => {
      const today = new Date().toISOString().split("T")[0];
      const completions = this.completions[today]?.[habit.id] || 0;
      return count + (completions >= habit.target ? 1 : 0);
    }, 0);

    const shareText = `🌟 My HealthyHabits Progress 🌟
        
Wellness Score: ${score}%
Habits Completed Today: ${completedToday}/${this.habits.length}
Total Habits: ${this.habits.length}
        
Building healthy habits one day at a time! 💪
        
#HealthyHabits #WellnessJourney #HealthyLifestyle`;

    if (navigator.share) {
      navigator.share({
        title: "My HealthyHabits Progress",
        text: shareText,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard
        .writeText(shareText)
        .then(() => {
          this.showAlert(
            "success",
            "Progress copied to clipboard! Share it wherever you like! 📋"
          );
        })
        .catch(() => {
          // Show the text in an alert if clipboard fails
          alert(shareText);
        });
    }
  }

  saveData() {
    try {
      localStorage.setItem("healthyhabits_habits", JSON.stringify(this.habits));
      localStorage.setItem(
        "healthyhabits_completions",
        JSON.stringify(this.completions)
      );
      localStorage.setItem(
        "healthyhabits_moods",
        JSON.stringify(this.moodHistory)
      );
      localStorage.setItem(
        "healthyhabits_reminders",
        JSON.stringify(this.reminders)
      );
    } catch (error) {
      console.error("Error saving data:", error);
      this.showAlert("warning", "Unable to save data. Storage might be full.");
    }
  }

  renderAll() {
    this.renderDashboard();
    this.renderHabits();
    if (this.currentTab === "analytics") {
      this.renderAnalytics();
    }
    if (this.currentTab === "challenges") {
      this.renderChallenges();
    }
  }

  // Export data for backup
  exportData() {
    const data = {
      habits: this.habits,
      completions: this.completions,
      moodHistory: this.moodHistory,
      reminders: this.reminders,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `healthyhabits_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showAlert(
      "success",
      "Data exported successfully! Keep this file safe as a backup."
    );
  }

  // Import data from backup
  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.habits && data.completions && data.moodHistory) {
          if (
            confirm(
              "This will replace all your current data. Are you sure you want to continue?"
            )
          ) {
            this.habits = data.habits || [];
            this.completions = data.completions || {};
            this.moodHistory = data.moodHistory || [];
            this.reminders = data.reminders || {};

            this.saveData();
            this.renderAll();
            this.loadTodayMood();
            this.setupReminders();

            this.showAlert(
              "success",
              "Data imported successfully! Your habits have been restored."
            );
          }
        } else {
          this.showAlert(
            "danger",
            "Invalid backup file format. Please select a valid HealthyHabits backup file."
          );
        }
      } catch (error) {
        console.error("Import error:", error);
        this.showAlert(
          "danger",
          "Error reading backup file. Please make sure it's a valid JSON file."
        );
      }
    };
    reader.readAsText(file);
  }
}

// Global functions for onclick handlers
window.tracker = null;

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.tracker = new HealthyHabitsTracker();

  // Add CSS animation for celebration
  const style = document.createElement("style");
  style.textContent = `
        @keyframes celebrate {
            0% { 
                transform: translate(-50%, -50%) scale(0) rotate(0deg); 
                opacity: 1; 
            }
            50% { 
                transform: translate(-50%, -50%) scale(2) rotate(180deg); 
                opacity: 0.8; 
            }
            100% { 
                transform: translate(-50%, -50%) scale(0) rotate(360deg); 
                opacity: 0; 
            }
        }
    `;
  document.head.appendChild(style);

  console.log("🌟 HealthyHabits Tracker loaded successfully!");
});

// Global utility functions
function deleteHabit(habitId) {
  if (window.tracker) {
    window.tracker.deleteHabit(habitId);
  }
}

function shareProgress() {
  if (window.tracker) {
    window.tracker.shareProgress();
  }
}
