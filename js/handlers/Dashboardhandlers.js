// DashboardHandlers.js
// Handles real-time dashboard statistics and analytics

class DashboardHandlers {
    constructor(app) {
        this.app = app;
    }

    // Initialize dashboard
    init() {
        this.updateAllStats();
        this.setupStatCardClickHandlers();
    }

    // Update all dashboard statistics
    updateAllStats() {
        this.updatePatientStats();
        this.updateAppointmentStats();
        this.updatePharmacyStats();
        this.updateTherapyStats();
        this.updateStaffStats();
        this.updateRevenueStats();
    }

    // Update patient statistics
    updatePatientStats() {
        const totalPatients = this.app.patientMgmt.getAllPatients().length;
        const totalPatientsElement = document.getElementById('totalPatientsCount');
        if (totalPatientsElement) {
            totalPatientsElement.textContent = totalPatients;
        }
    }

    // Update appointment statistics
    updateAppointmentStats() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const allAppointments = this.app.appointmentsManager.getAllAppointments();
        const todayAppointments = allAppointments.filter(apt => {
            const aptDate = new Date(apt.date).toISOString().split('T')[0];
            return aptDate === todayStr;
        });

        const todayCountElement = document.getElementById('todayAppointmentsCount');
        if (todayCountElement) {
            todayCountElement.textContent = todayAppointments.length;
        }
    }

    // Update pharmacy statistics
    updatePharmacyStats() {
        const allMedicines = this.app.medicineDB.getAllMedicines();
        const totalMedicines = allMedicines.length;

        const pharmacyCountElement = document.getElementById('pharmacyStockCount');
        if (pharmacyCountElement) {
            pharmacyCountElement.textContent = totalMedicines;
        }
    }

    // Update therapy statistics
    updateTherapyStats() {
        const allTherapyAssignments = this.app.therapyMgr.getAllTherapyAssignments();
        const totalTherapyAssignments = allTherapyAssignments.length;

        const therapyCountElement = document.getElementById('therapySessionsCount');
        if (therapyCountElement) {
            therapyCountElement.textContent = totalTherapyAssignments;
        }
    }

    // Update staff statistics
    updateStaffStats() {
        const allStaff = this.app.staffMgmt.getAllStaff();
        const totalStaff = allStaff.length;

        const staffCountElement = document.getElementById('dashboardTotalStaffCount');
        if (staffCountElement) {
            staffCountElement.textContent = totalStaff;
        }
    }

    // Update revenue statistics
    updateRevenueStats() {
        const allInvoices = this.app.billingMgr.getAllInvoices();
        const totalRevenue = allInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

        const revenueElement = document.getElementById('dashboardTotalRevenue');
        if (revenueElement) {
            revenueElement.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
        }
    }

    // Setup click handlers for stat cards
    setupStatCardClickHandlers() {
        // Patients card - navigate to Patient Management
        const patientsCard = document.getElementById('totalPatientsCard');
        if (patientsCard) {
            patientsCard.addEventListener('click', () => {
                this.app.showView('patientView');
                this.app.setActiveNavByViewId('patient');
                this.app.patientHandlers.renderPatientsGrid();
            });
        }

        // Appointments card - navigate to Appointments
        const appointmentsCard = document.getElementById('todayAppointmentsCard');
        if (appointmentsCard) {
            appointmentsCard.addEventListener('click', () => {
                this.app.showView('appointmentsView');
                this.app.setActiveNavByViewId('appointments');
                this.app.appointmentHandlers.renderAppointmentsTimeline();
            });
        }

        // Pharmacy card - navigate to Pharmacy Management
        const pharmacyCard = document.getElementById('pharmacyStockCard');
        if (pharmacyCard) {
            pharmacyCard.addEventListener('click', () => {
                this.app.showView('prescriptionView');
                this.app.setActiveNavByViewId('prescription');
                this.app.pharmacyHandlers.renderPrescriptionView();
            });
        }

        // Therapy card - navigate to Therapy Management
        const therapyCard = document.getElementById('therapySessionsCard');
        if (therapyCard) {
            therapyCard.addEventListener('click', () => {
                this.app.showView('therapyView');
                this.app.setActiveNavByViewId('therapy');
                this.app.therapyHandlers.renderTherapyView();
            });
        }

        // Staff card - navigate to Staff Management
        const staffCard = document.getElementById('totalStaffCard');
        if (staffCard) {
            staffCard.addEventListener('click', () => {
                this.app.showView('staffManagementView');
                this.app.setActiveNavByViewId('staffManagement');
                this.app.staffHandlers.renderStaffView();
            });
        }

        // Revenue card - navigate to Billing
        const revenueCard = document.getElementById('totalRevenueCard');
        if (revenueCard) {
            revenueCard.addEventListener('click', () => {
                this.app.showView('billingView');
                this.app.setActiveNavByViewId('billing');
                this.app.billingHandlers.renderBillingView();
            });
        }
    }

    // Render today's appointments widget
    renderTodaysAppointments() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const allAppointments = this.app.appointmentsManager.getAllAppointments();
        const todayAppointments = allAppointments.filter(apt => {
            const aptDate = new Date(apt.date).toISOString().split('T')[0];
            return aptDate === todayStr;
        });

        // Sort by time
        todayAppointments.sort((a, b) => {
            return a.time.localeCompare(b.time);
        });

        const container = document.getElementById('todayAppointmentsList');
        if (!container) return;

        if (todayAppointments.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📅</div>
                    <p style="font-size: 16px; margin: 0;">No appointments scheduled for today</p>
                </div>
            `;
            return;
        }

        container.innerHTML = todayAppointments.map(apt => `
            <div class="appointment-item">
                <div class="appointment-time ${apt.status.toLowerCase().replace(/\s+/g, '-')}">${apt.time}</div>
                <div class="appointment-details">
                    <div class="appointment-patient">${apt.patientName}</div>
                    <div class="appointment-type">${apt.type}</div>
                </div>
                <span class="appointment-status ${apt.status.toLowerCase().replace(/\s+/g, '-')}">${apt.status}</span>
            </div>
        `).join('');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardHandlers;
}