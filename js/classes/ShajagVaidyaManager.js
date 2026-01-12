// ShajagVaidyaManager.js
// Main Application Manager Class - Slim Coordinator Version

class ShajagVaidyaManager {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.currentLanguage = 'en';

        // Initialize data management classes
        this.patientMgmt = new PatientManagement();
        this.appointmentsManager = new AppointmentsManager();
        this.medicineDB = new MedicineDatabase();
        this.prescriptionMgr = new PrescriptionManager(this.patientMgmt, this.medicineDB);
        this.therapyMgr = new TherapyManager();
        this.dietMgr = new DietManager();

        // Communication Manager
        this.communicationMgr = new CommunicationManager();

        // Staff & Billing Manager
        this.staffMgmt = new StaffManagement();
        this.billingMgr = new BillingManager();

        // Initialize handler classes
        this.appointmentHandlers = new AppointmentHandlers(this);
        this.patientHandlers = new PatientHandlers(this);
        this.pharmacyHandlers = new PharmacyHandlers(this); // Important
        this.prescriptionMgtHandlers = new PrescriptionManagementHandlers(this);
        this.chartHandlers = new ChartHandlers(this);
        this.dietHandlers = new DietHandlers(this);
        this.therapyHandlers = new TherapyHandlers(this);
        this.communicationHandlers = new CommunicationHandlers(this);
        this.staffHandlers = new StaffManagementHandlers(this);
        this.billingHandlers = new BillingHandlers(this);

        this.modules = [
            { name: "Dashboard & Analytics", completion: "100%", icon: "📊", id: "dashboard" },
            { name: "Patient Management", completion: "95%", icon: "👥", id: "patient" },
            { name: "Pharmacy Management", completion: "98%", icon: "💊", id: "pharmacy" },
            { name: "Prescription Management", completion: "100%", icon: "📝", id: "prescriptionManagement" },
            { name: "Panchakarma Therapy", completion: "92%", icon: "🧘", id: "therapy" },
            { name: "Diet Management", completion: "90%", icon: "🥗", id: "diet" },
            { name: "Appointments", completion: "96%", icon: "📅", id: "appointments" },
            { name: "Communication", completion: "96%", icon: "📧", id: "communication" },
            { name: "Staff Management", completion: "88%", icon: "💼", id: "staffManagement" },
            { name: "Billing", completion: "91%", icon: "💰", id: "billing" },
            { name: "Reports", completion: "89%", icon: "📋", id: "reports" }
        ];

        // ---------------------------------------
        // ✅ FIXED ROLE PERMISSIONS (PHARMACY ADDED)
        // ---------------------------------------
        this.rolePermissions = {
            owner: [
                'dashboard', 'patient', 'pharmacy', 'prescriptionManagement',
                'therapy', 'diet', 'appointments', 'communication',
                'staffManagement', 'billing', 'reports'
            ],
            doctor: [
                'dashboard', 'patient', 'pharmacy', 'prescriptionManagement',
                'therapy', 'diet', 'appointments', 'reports'
            ],
            patient: ['dashboard', 'diet', 'appointments'],
            nurse: ['dashboard', 'patient', 'therapy', 'diet', 'appointments'],

            // FIXED — Pharmacy staff must see pharmacy module
            pharmacy: ['dashboard', 'pharmacy', 'prescriptionManagement', 'appointments'],

            assistant: ['dashboard', 'appointments', 'patient', 'communication']
        };

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.renderModules();
            });
        } else {
            this.setupEventListeners();
            this.renderModules();
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Language selector
        const languageSelector = document.getElementById('languageSelector');
        if (languageSelector) {
            languageSelector.addEventListener('change', (e) => this.handleLanguageChange(e));
        }

        // Total Patients Card
        const totalPatientsCard = document.querySelector('.stat-card:first-child');
        if (totalPatientsCard) {
            totalPatientsCard.style.cursor = 'pointer';
            totalPatientsCard.addEventListener('click', () => {
                this.showView('patientView');
                this.setActiveNavByViewId('patient');
                this.patientHandlers.renderPatientsGrid();
            });
        }

        // Today's Appointments Card
        const todayAppointmentsCard = document.getElementById('todayAppointmentsCard');
        if (todayAppointmentsCard) {
            todayAppointmentsCard.addEventListener('click', () => {
                this.showView('appointmentsView');
                this.setActiveNavByViewId('appointments');
            });
        }

        // View All Appointments
        const viewAllAppointments = document.getElementById('viewAllAppointments');
        if (viewAllAppointments) {
            viewAllAppointments.addEventListener('click', () => {
                this.showView('appointmentsView');
                this.setActiveNavByViewId('appointments');
            });
        }

        // Patient Search
        const patientSearchInput = document.getElementById('patientSearchInput');
        const patientSearchBtn = document.getElementById('patientSearchBtn');

        if (patientSearchInput) {
            patientSearchInput.addEventListener('input', (e) => {
                this.patientHandlers.renderPatientsGrid(e.target.value);
            });
        }

        if (patientSearchBtn) {
            patientSearchBtn.addEventListener('click', () => {
                this.patientHandlers.renderPatientsGrid(patientSearchInput.value);
            });
        }

        // Medicine Search
        const medicineSearchInput = document.getElementById('pharmacyMedicineSearchInput');
        if (medicineSearchInput) {
            medicineSearchInput.addEventListener('input', (e) => {
                this.pharmacyHandlers.renderMedicineSearchResults(e.target.value);
            });
        }

        // ESC — Close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {

                this.appointmentHandlers.closeAppointmentModal();
                this.patientHandlers.closePatientModal();

                if (this.pharmacyHandlers?.closeDrawer) {
                    this.pharmacyHandlers.closeDrawer();
                }

                this.pharmacyHandlers.closeStockUpdateModal();
                this.prescriptionMgtHandlers.closeMedicineDosageModal();

                if (this.therapyHandlers) {
                    this.therapyHandlers.closeTherapyScheduleModal();
                }
            }
        });

        // New Appointment
        const newAppointmentBtn = document.getElementById('newAppointmentBtn');
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', () => {
                this.appointmentHandlers.openAppointmentModal();
            });
        }
    }

    handleLogin(e) {
        e.preventDefault();

        const roleSelect = document.getElementById('userRole');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        const role = roleSelect.value;
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!role || !username || !password) {
            this.showNotification('Please fill login details correctly', 'error');
            return;
        }

        this.currentUser = username;
        this.currentRole = role;

        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');

        loginScreen.style.display = 'none';
        mainApp.classList.remove('hidden');
        mainApp.style.display = 'grid';

        document.getElementById('currentUser').textContent = username;
        document.getElementById('currentRole').textContent = this.getRoleDisplayName(role);

        this.generateNavigation();
        this.showView('dashboardView');

        setTimeout(async () => {
            if (this.patientHandlers?.loadFromBackend) await this.patientHandlers.loadFromBackend();
            if (this.staffHandlers?.loadFromBackend) await this.staffHandlers.loadFromBackend();

            await this.appointmentHandlers.renderAppointmentsTimeline();

            this.chartHandlers.initializeCharts();
            this.appointmentHandlers.renderTodaysAppointments();
            this.appointmentHandlers.updateTodaysAppointmentsCount();
            this.patientHandlers.updateTotalPatientsCount();

        }, 100);

        this.showNotification(`Welcome, ${username}!`, 'success');
    }

    handleLogout() {
        this.currentUser = null;
        this.currentRole = null;

        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';

        document.getElementById('loginForm').reset();
        this.showNotification('Logged out successfully', 'info');
    }

    handleLanguageChange(e) {
        this.currentLanguage = e.target.value;
        this.showNotification(`Language changed to: ${e.target.options[e.target.selectedIndex].text}`, 'info');
    }

    getRoleDisplayName(role) {
        const roleNames = {
            owner: 'Practice Owner',
            doctor: 'Ayurvedic Doctor',
            patient: 'Patient',
            nurse: 'Ayurvedic Nurse',
            pharmacy: 'Pharmacy Staff',
            assistant: 'Clinical Assistant'
        };
        return roleNames[role] || role;
    }

    generateNavigation() {
        const navList = document.getElementById('navList');
        if (!navList) return;

        const allowedModules = this.rolePermissions[this.currentRole] || [];

        navList.innerHTML = '';

        this.modules.forEach(module => {
            if (allowedModules.includes(module.id)) {

                const navItem = document.createElement('button');
                navItem.className = 'nav-item';
                navItem.dataset.viewId = module.id;

                navItem.innerHTML = `
                    <span class="nav-icon">${module.icon}</span>
                    <span>${module.name}</span>
                `;

                navItem.addEventListener('click', () => {
                    this.showView(module.id + 'View');
                    this.setActiveNavItem(navItem);

                    if (module.id === 'appointments') {
                        this.showAppointmentsView();
                    }

                    else if (module.id === 'patient') {
                        this.patientHandlers.renderPatientsGrid();
                    }
                    else if (module.id === 'pharmacy') {
                        // ----------------------------------------
                        // ✅ FIXED: Correct pharmacy handler call
                        // ----------------------------------------
                        this.pharmacyHandlers.renderPharmacyManagement();
                    }
                    else if (module.id === 'prescriptionManagement') {
                        this.prescriptionMgtHandlers.renderPrescriptionManagement();
                    }
                    else if (module.id === 'therapy') {
                        this.therapyHandlers.renderTherapyView();
                    }
                    else if (module.id === 'diet') {
                        this.dietHandlers.renderDietView();
                    }
                    else if (module.id === 'communication') {
                        this.communicationHandlers.renderCommunicationView();
                    }
                    else if (module.id === 'staffManagement') {
                        this.staffHandlers.renderStaffView();
                    }
                    else if (module.id === 'billing') {
                        this.billingHandlers.renderBillingView();
                    }
                });

                if (module.id === 'dashboard') {
                    navItem.classList.add('active');
                }

                navList.appendChild(navItem);
            }
        });
    }

    setActiveNavItem(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        activeItem.classList.add('active');
    }

    setActiveNavByViewId(viewId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.viewId === viewId) {
                item.classList.add('active');
            }
        });
    }

    showView(viewId) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.add('active');
    }

    showAppointmentsView() {
        // show appointments view
        this.showView('appointmentsView');
        this.setActiveNavByViewId('appointments');

        // 🔥 render calendar AFTER view is visible
        setTimeout(() => {
            if (this.calendar) {
                this.calendar.render();
            }
        }, 0);
    }


    renderModules() {
        const modulesList = document.getElementById('modulesList');
        if (!modulesList) return;

        modulesList.innerHTML = '';

        this.modules.forEach(module => {
            const moduleCard = document.createElement('div');
            moduleCard.className = 'module-card';

            const completionValue = parseInt(module.completion);

            moduleCard.innerHTML = `
                <div class="module-icon">${module.icon}</div>
                <div class="module-info">
                    <div class="module-name">${module.name}</div>
                    <div class="module-progress">${module.completion} Complete</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${completionValue}%"></div>
                    </div>
                </div>
            `;
            modulesList.appendChild(moduleCard);
        });
    }

    showNotification(message, type = 'info') {
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;

        let background = 'white', border = '#ddd', text = '#333';

        if (type === 'success') {
            background = 'rgba(33,128,141,0.1)';
            border = '#21808D';
            text = '#21808D';
        }
        else if (type === 'error') {
            background = 'rgba(192,21,47,0.1)';
            border = '#C0152F';
            text = '#C0152F';
        }
        else if (type === 'warning') {
            background = 'rgba(255,140,0,0.1)';
            border = '#FF8C00';
            text = '#FF8C00';
        }

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${background};
            border: 1px solid ${border};
            color: ${text};
            border-radius: 8px;
            z-index: 1000;
            transition: opacity 0.3s ease;
            font-weight: 500;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Export for Node compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShajagVaidyaManager;
}
