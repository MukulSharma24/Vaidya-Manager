// StaffManagementHandlers.js
// Staff Management UI Handlers

class StaffManagementHandlers {
    constructor(manager) {
        this.manager = manager;
        this.currentStaff = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add Staff Button
        const addStaffBtn = document.getElementById('addStaffBtn');
        if (addStaffBtn) {
            addStaffBtn.addEventListener('click', () => this.openAddStaffModal());
        }

        // Search
        const staffSearchInput = document.getElementById('staffSearchInput');
        if (staffSearchInput) {
            staffSearchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Role Filter
        const roleFilter = document.getElementById('staffRoleFilter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.handleRoleFilter(e.target.value);
            });
        }

        // Status Filter
        const statusFilter = document.getElementById('staffStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.handleStatusFilter(e.target.value);
            });
        }

        // Modal close buttons
        this.setupModalListeners();

        console.log('✅ Staff Management Handlers initialized');
    }

    setupModalListeners() {
        // Add Staff Modal
        const closeAddModalBtn = document.getElementById('closeAddStaffModalBtn');
        const cancelAddStaffBtn = document.getElementById('cancelAddStaffBtn');
        const addStaffModal = document.getElementById('addStaffModal');
        const addStaffForm = document.getElementById('addStaffForm');

        if (closeAddModalBtn) {
            closeAddModalBtn.addEventListener('click', () => this.closeAddStaffModal());
        }
        if (cancelAddStaffBtn) {
            cancelAddStaffBtn.addEventListener('click', () => this.closeAddStaffModal());
        }
        if (addStaffModal) {
            addStaffModal.addEventListener('click', (e) => {
                if (e.target === addStaffModal) this.closeAddStaffModal();
            });
        }
        if (addStaffForm) {
            addStaffForm.addEventListener('submit', (e) => this.handleAddStaff(e));
        }

        // Edit Staff Modal
        const closeEditModalBtn = document.getElementById('closeEditStaffModalBtn');
        const cancelEditStaffBtn = document.getElementById('cancelEditStaffBtn');
        const editStaffModal = document.getElementById('editStaffModal');
        const editStaffForm = document.getElementById('editStaffForm');

        if (closeEditModalBtn) {
            closeEditModalBtn.addEventListener('click', () => this.closeEditStaffModal());
        }
        if (cancelEditStaffBtn) {
            cancelEditStaffBtn.addEventListener('click', () => this.closeEditStaffModal());
        }
        if (editStaffModal) {
            editStaffModal.addEventListener('click', (e) => {
                if (e.target === editStaffModal) this.closeEditStaffModal();
            });
        }
        if (editStaffForm) {
            editStaffForm.addEventListener('submit', (e) => this.handleEditStaff(e));
        }

        // More Info Modal
        const closeMoreInfoModalBtn = document.getElementById('closeMoreInfoModalBtn');
        const moreInfoModal = document.getElementById('moreInfoModal');

        if (closeMoreInfoModalBtn) {
            closeMoreInfoModalBtn.addEventListener('click', () => this.closeMoreInfoModal());
        }
        if (moreInfoModal) {
            moreInfoModal.addEventListener('click', (e) => {
                if (e.target === moreInfoModal) this.closeMoreInfoModal();
            });
        }

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAddStaffModal();
                this.closeEditStaffModal();
                this.closeMoreInfoModal();
            }
        });
    }

    // Render Staff View
    renderStaffView() {
        console.log('📋 Rendering Staff Management View');
        this.renderStatistics();
        this.renderStaffGrid();
        this.populateRoleFilter();
    }

    // Load staff from backend and populate local staffMgmt
    async loadFromBackend() {
        if (!window.API || typeof window.API.getStaff !== 'function') {
            console.warn('API.getStaff not available');
            return;
        }

        try {
            const rows = await window.API.getStaff();
            if (!Array.isArray(rows)) {
                console.warn('getStaff returned non-array:', rows);
                return;
            }

            // map rows into your local staffMgmt store (avoid duplicates)
            rows.forEach(r => {
                const mobile = r.Mobile || '';
                // If a staff with same contact or server ID exists, skip
                if (this.manager.staffMgmt.getStaffById && r.StaffID && this.manager.staffMgmt.getStaffById(String(r.StaffID))) {
                    return;
                }
                if (mobile && this.manager.staffMgmt.findByContact && this.manager.staffMgmt.findByContact(mobile)) {
                    return;
                }

                // Add to local store - adapt fields to your staffMgmt.addStaff signature
                const s = this.manager.staffMgmt.addStaff({
                    id: String(r.StaffID || (new Date()).getTime()), // keep server id if available
                    name: [r.FirstName, r.MiddleName, r.LastName].filter(Boolean).join(' ') || r.FirstName || 'Unknown',
                    age: r.ExperienceYears || 0,
                    email: r.Email || null,
                    contact: mobile,
                    role: r.DesignationID ? String(r.DesignationID) : 'Staff',
                    responsibility: r.Specialty || '',
                    joiningDate: r.DateOfJoining || r.DateOfJoining,
                    salary: r.Salary || 0,
                    employmentType: 'Full-time',
                    address: r.AddressLine1 || '',
                    emergencyContact: '',
                    qualification: r.Qualification || '',
                    experience: r.ExperienceYears || '',
                    specialization: r.Specialty || '',
                    shift: '',
                    avatar: this.getAvatarForRole(r.DesignationID ? String(r.DesignationID) : 'staff'),
                    status: r.WorkingStatus || 'Active'
                });

                // if your staffMgmt supports a dbId field, attach it
                if (s && r.StaffID) {
                    s.dbId = r.StaffID;
                }
            });

            // re-render view if staff view is active
            this.renderStaffView();

            console.log('Staff loaded from backend:', rows.length);
        } catch (err) {
            console.error('Failed to load staff from backend', err);
        }
    }

    // Render Statistics
    renderStatistics() {
        const stats = this.manager.staffMgmt.getStatistics();

        const totalStaffCount = document.getElementById('totalStaffCount');
        const activeStaffCount = document.getElementById('activeStaffCount');
        const doctorsCount = document.getElementById('doctorsCount');
        const totalSalaryCount = document.getElementById('totalSalaryCount');

        if (totalStaffCount) totalStaffCount.textContent = stats.total;
        if (activeStaffCount) activeStaffCount.textContent = stats.active;
        if (doctorsCount) doctorsCount.textContent = stats.doctors;
        if (totalSalaryCount) totalSalaryCount.textContent = `₹${stats.totalSalary.toLocaleString()}`;
    }

    // Render Staff Grid
    renderStaffGrid(staffList = null) {
        const container = document.getElementById('staffGridContainer');
        if (!container) return;

        const staff = staffList || this.manager.staffMgmt.getAllStaff();

        if (staff.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>No Staff Members Found</h3>
                    <p>Add your first staff member to get started</p>
                    <button class="btn btn--primary" onclick="window.app.staffHandlers.openAddStaffModal()">
                        Add Staff Member
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = staff.map(s => `
            <div class="staff-card">
                <div class="staff-card-header">
                    <div class="staff-avatar">${s.avatar || '👤'}</div>
                    <div class="staff-status-badge status-${s.status.toLowerCase()}">${s.status}</div>
                </div>
                
                <div class="staff-card-body">
                    <h3 class="staff-name">${s.name}</h3>
                    <p class="staff-role">${s.role}</p>
                    <p class="staff-id">ID: ${s.id}</p>
                    
                    <div class="staff-details">
                        <div class="staff-detail-item">
                            <span class="detail-icon">📧</span>
                            <span class="detail-text">${s.email}</span>
                        </div>
                        <div class="staff-detail-item">
                            <span class="detail-icon">📱</span>
                            <span class="detail-text">${s.contact}</span>
                        </div>
                        <div class="staff-detail-item">
                            <span class="detail-icon">🎂</span>
                            <span class="detail-text">${s.age} years</span>
                        </div>
                        <div class="staff-detail-item">
                            <span class="detail-icon">💼</span>
                            <span class="detail-text">${s.responsibility}</span>
                        </div>
                    </div>
                </div>
                
                <div class="staff-card-footer">
                    <button class="btn btn--sm btn--outline" onclick="window.app.staffHandlers.openMoreInfoModal('${s.id}')">
                        More Info
                    </button>
                    <button class="btn btn--sm btn--outline" onclick="window.app.staffHandlers.openEditStaffModal('${s.id}')">
                        Edit
                    </button>
                    <button class="btn btn--sm btn--danger" onclick="window.app.staffHandlers.confirmDeleteStaff('${s.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Populate Role Filter
    populateRoleFilter() {
        const filter = document.getElementById('staffRoleFilter');
        if (!filter) return;

        const roles = this.manager.staffMgmt.getRoles();

        filter.innerHTML = '<option value="all">All Roles</option>' +
            roles.map(role => `<option value="${role}">${role}</option>`).join('');
    }

    // Handle Search
    handleSearch(query) {
        if (!query.trim()) {
            this.renderStaffGrid();
            return;
        }

        const results = this.manager.staffMgmt.searchStaff(query);
        this.renderStaffGrid(results);
    }

    // Handle Role Filter
    handleRoleFilter(role) {
        const filtered = this.manager.staffMgmt.filterByRole(role);
        this.renderStaffGrid(filtered);
    }

    // Handle Status Filter
    handleStatusFilter(status) {
        const filtered = this.manager.staffMgmt.filterByStatus(status);
        this.renderStaffGrid(filtered);
    }

    // Open Add Staff Modal
    openAddStaffModal() {
        const modal = document.getElementById('addStaffModal');
        const form = document.getElementById('addStaffForm');

        if (form) form.reset();
        if (modal) modal.classList.add('active');
    }

    // Close Add Staff Modal
    closeAddStaffModal() {
        const modal = document.getElementById('addStaffModal');
        if (modal) modal.classList.remove('active');
    }

    // inside StaffManagementHandlers class — replace your existing handleAddStaff with this
    async handleAddStaff(e) {
        e.preventDefault();

        // collect values
        const firstName = (document.getElementById('staffName').value || '').trim();
        const age = parseInt(document.getElementById('staffAge').value || '0', 10);
        const email = (document.getElementById('staffEmail').value || '').trim();
        const mobile = (document.getElementById('staffContact').value || '').trim();
        const role = (document.getElementById('staffRole').value || '').trim();
        const responsibility = (document.getElementById('staffResponsibility').value || '').trim();
        const joiningDate = (document.getElementById('staffJoiningDate').value || null);
        const salary = parseFloat(document.getElementById('staffSalary').value || '0');
        const employmentType = (document.getElementById('staffEmploymentType').value || '').trim();
        const address = (document.getElementById('staffAddress').value || '').trim();
        const emergencyContact = (document.getElementById('staffEmergencyContact').value || '').trim();
        const qualification = (document.getElementById('staffQualification').value || '').trim();
        const experience = (document.getElementById('staffExperience').value || '').trim();
        const specialization = (document.getElementById('staffSpecialization').value || '').trim();
        const shift = (document.getElementById('staffShift').value || '').trim();

        // simple validation (backend requires FirstName and Mobile)
        if (!firstName || !mobile) {
            this.manager.showNotification('Please fill name and mobile number', 'error');
            return;
        }

        // disable submit button to avoid double submits
        const submitBtn = document.querySelector('#addStaffForm button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        // Build server payload expected by your backend (field names from your server)
        const payload = {
            FirstName: firstName,
            MiddleName: null,
            LastName: null,
            GenderID: 1,

            // Auto-fill DOB (your UI does NOT collect DOB)
            DOB: document.getElementById('staffDOB')?.value || '1980-01-01',

            Mobile: mobile,
            Email: email || null,

            DepartmentID: null,
            DesignationID: null,

            // StaffCategoryID cannot be NULL → assign fallback value = 1
            StaffCategoryID: parseInt(document.getElementById('staffCategory')?.value || '1', 10),

            UserRoleID: 1,
            Qualification: qualification || null,
            DateOfJoining: joiningDate || null,

            Salary: isNaN(salary) ? 0 : salary
        };


        // debug log so you can inspect exact payload in console
        console.log('POST /api/staff payload:', payload);

        // Try to save to server first
        try {
            if (window.API && typeof window.API.createStaff === 'function') {
                const res = await window.API.createStaff(payload);
                console.log('Server staff create response:', res);

                // backend returns { StaffID: X }
                if (res && res.StaffID) {
                    // Add to local staffMgmt with server id included
                    const newStaff = this.manager.staffMgmt.addStaff({
                        id: String(res.StaffID),
                        name: firstName,
                        age: age || 0,
                        email: email,
                        contact: mobile,
                        role: role || 'Staff',
                        responsibility,
                        joiningDate,
                        salary: payload.Salary,
                        employmentType,
                        address,
                        emergencyContact,
                        qualification,
                        experience,
                        specialization,
                        shift,
                        avatar: this.getAvatarForRole(role),
                        status: 'Active'
                    });

                    this.manager.showNotification('Staff member added and saved to server!', 'success');
                    this.closeAddStaffModal();
                    this.renderStaffView();
                    if (submitBtn) submitBtn.disabled = false;
                    return;
                } else {
                    console.warn('createStaff returned unexpected value', res);
                    this.manager.showNotification('Saved locally — server returned unexpected response', 'warning');
                }
            } else {
                console.warn('window.API.createStaff not available');
                this.manager.showNotification('API not available — saved locally only', 'warning');
            }
        } catch (err) {
            console.error('createStaff API error:', err);
            // if server sent back body with details (see improved apiFetch), log it
            if (err && err.body) console.error('Server error body:', err.body);
            this.manager.showNotification('Failed to save to server — saved locally only', 'error');
        }

        // Fallback: save locally if server failed/unavailable
        const fallbackStaff = this.manager.staffMgmt.addStaff({
            name: firstName,
            age: age || 0,
            email,
            contact: mobile,
            role: role || 'Staff',
            responsibility,
            joiningDate,
            salary: isNaN(salary) ? 0 : salary,
            employmentType,
            address,
            emergencyContact,
            qualification,
            experience,
            specialization,
            shift,
            avatar: this.getAvatarForRole(role),
            status: 'Active'
        });

        this.manager.showNotification('Staff member added locally', 'success');
        this.closeAddStaffModal();
        this.renderStaffView();
        if (submitBtn) submitBtn.disabled = false;
    }


    // Get Avatar for Role
    getAvatarForRole(role) {
        const lowerRole = role.toLowerCase();
        if (lowerRole.includes('doctor')) return '👨‍⚕️';
        if (lowerRole.includes('nurse')) return '👩‍⚕️';
        if (lowerRole.includes('pharmacy') || lowerRole.includes('pharmacist')) return '💊';
        if (lowerRole.includes('therapist')) return '🧘';
        if (lowerRole.includes('reception')) return '👨‍💼';
        return '👤';
    }

    // Open Edit Staff Modal
    openEditStaffModal(staffId) {
        const staff = this.manager.staffMgmt.getStaffById(staffId);
        if (!staff) return;

        this.currentStaff = staff;

        // Populate form
        document.getElementById('editStaffId').value = staff.id;
        document.getElementById('editStaffName').value = staff.name;
        document.getElementById('editStaffAge').value = staff.age;
        document.getElementById('editStaffEmail').value = staff.email;
        document.getElementById('editStaffContact').value = staff.contact;
        document.getElementById('editStaffRole').value = staff.role;
        document.getElementById('editStaffResponsibility').value = staff.responsibility;
        document.getElementById('editStaffJoiningDate').value = staff.joiningDate;
        document.getElementById('editStaffSalary').value = staff.salary;
        document.getElementById('editStaffEmploymentType').value = staff.employmentType;
        document.getElementById('editStaffAddress').value = staff.address || '';
        document.getElementById('editStaffEmergencyContact').value = staff.emergencyContact || '';
        document.getElementById('editStaffQualification').value = staff.qualification || '';
        document.getElementById('editStaffExperience').value = staff.experience || '';
        document.getElementById('editStaffSpecialization').value = staff.specialization || '';
        document.getElementById('editStaffShift').value = staff.shift || '';
        document.getElementById('editStaffStatus').value = staff.status;

        const modal = document.getElementById('editStaffModal');
        if (modal) modal.classList.add('active');
    }

    // Close Edit Staff Modal
    closeEditStaffModal() {
        const modal = document.getElementById('editStaffModal');
        if (modal) modal.classList.remove('active');
        this.currentStaff = null;
    }

    // Handle Edit Staff
    handleEditStaff(e) {
        e.preventDefault();

        const staffId = document.getElementById('editStaffId').value;
        const updates = {
            name: document.getElementById('editStaffName').value,
            age: parseInt(document.getElementById('editStaffAge').value),
            email: document.getElementById('editStaffEmail').value,
            contact: document.getElementById('editStaffContact').value,
            role: document.getElementById('editStaffRole').value,
            responsibility: document.getElementById('editStaffResponsibility').value,
            joiningDate: document.getElementById('editStaffJoiningDate').value,
            salary: parseFloat(document.getElementById('editStaffSalary').value),
            employmentType: document.getElementById('editStaffEmploymentType').value,
            address: document.getElementById('editStaffAddress').value,
            emergencyContact: document.getElementById('editStaffEmergencyContact').value,
            qualification: document.getElementById('editStaffQualification').value,
            experience: document.getElementById('editStaffExperience').value,
            specialization: document.getElementById('editStaffSpecialization').value,
            shift: document.getElementById('editStaffShift').value,
            status: document.getElementById('editStaffStatus').value,
            avatar: this.getAvatarForRole(document.getElementById('editStaffRole').value)
        };

        const updated = this.manager.staffMgmt.updateStaff(staffId, updates);

        if (updated) {
            this.manager.showNotification('Staff member updated successfully!', 'success');
            this.closeEditStaffModal();
            this.renderStaffView();
        } else {
            this.manager.showNotification('Error updating staff member', 'error');
        }
    }

    // Open More Info Modal
    openMoreInfoModal(staffId) {
        const staff = this.manager.staffMgmt.getStaffById(staffId);
        if (!staff) return;

        const modal = document.getElementById('moreInfoModal');
        const content = document.getElementById('moreInfoContent');

        if (!content) return;

        const tenureYears = this.calculateTenure(staff.joiningDate);

        content.innerHTML = `
            <div class="more-info-header">
                <div class="more-info-avatar">${staff.avatar || '👤'}</div>
                <div>
                    <h2>${staff.name}</h2>
                    <p class="more-info-role">${staff.role}</p>
                    <span class="status-badge status-${staff.status.toLowerCase()}">${staff.status}</span>
                </div>
            </div>

            <div class="more-info-grid">
                <div class="more-info-section">
                    <h3>📋 Basic Information</h3>
                    <div class="more-info-item">
                        <span class="label">Staff ID:</span>
                        <span class="value">${staff.id}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Age:</span>
                        <span class="value">${staff.age} years</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Email:</span>
                        <span class="value">${staff.email}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Contact:</span>
                        <span class="value">${staff.contact}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Emergency Contact:</span>
                        <span class="value">${staff.emergencyContact || 'N/A'}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Address:</span>
                        <span class="value">${staff.address || 'N/A'}</span>
                    </div>
                </div>

                <div class="more-info-section">
                    <h3>💼 Professional Details</h3>
                    <div class="more-info-item">
                        <span class="label">Role:</span>
                        <span class="value">${staff.role}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Responsibility:</span>
                        <span class="value">${staff.responsibility}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Qualification:</span>
                        <span class="value">${staff.qualification || 'N/A'}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Experience:</span>
                        <span class="value">${staff.experience || 'N/A'}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Specialization:</span>
                        <span class="value">${staff.specialization || 'N/A'}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Shift:</span>
                        <span class="value">${staff.shift || 'N/A'}</span>
                    </div>
                </div>

                <div class="more-info-section">
                    <h3>💰 Employment Details</h3>
                    <div class="more-info-item">
                        <span class="label">Joining Date:</span>
                        <span class="value">${new Date(staff.joiningDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Tenure:</span>
                        <span class="value">${tenureYears}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Employment Type:</span>
                        <span class="value">${staff.employmentType}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Monthly Salary:</span>
                        <span class="value salary-highlight">₹${staff.salary.toLocaleString()}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Annual Salary:</span>
                        <span class="value salary-highlight">₹${(staff.salary * 12).toLocaleString()}</span>
                    </div>
                    <div class="more-info-item">
                        <span class="label">Status:</span>
                        <span class="value">
                            <span class="status-badge status-${staff.status.toLowerCase()}">${staff.status}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div class="more-info-actions">
                <button class="btn btn--outline" onclick="window.app.staffHandlers.openEditStaffModal('${staff.id}'); window.app.staffHandlers.closeMoreInfoModal();">
                    Edit Details
                </button>
                <button class="btn btn--danger" onclick="window.app.staffHandlers.confirmDeleteStaff('${staff.id}'); window.app.staffHandlers.closeMoreInfoModal();">
                    Delete Staff
                </button>
            </div>
        `;

        if (modal) modal.classList.add('active');
    }

    // Close More Info Modal
    closeMoreInfoModal() {
        const modal = document.getElementById('moreInfoModal');
        if (modal) modal.classList.remove('active');
    }

    // Calculate Tenure
    calculateTenure(joiningDate) {
        const start = new Date(joiningDate);
        const now = new Date();
        const diff = now - start;
        const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
        const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));

        if (years > 0) {
            return months > 0 ? `${years} years, ${months} months` : `${years} years`;
        }
        return `${months} months`;
    }

    // Confirm Delete Staff
    confirmDeleteStaff(staffId) {
        const staff = this.manager.staffMgmt.getStaffById(staffId);
        if (!staff) return;

        const confirmed = confirm(
            `Are you sure you want to delete ${staff.name}?\n\n` +
            `Role: ${staff.role}\n` +
            `ID: ${staff.id}\n\n` +
            `This action cannot be undone.`
        );

        if (confirmed) {
            const deleted = this.manager.staffMgmt.deleteStaff(staffId);
            if (deleted) {
                this.manager.showNotification('Staff member deleted successfully', 'success');
                this.renderStaffView();
            } else {
                this.manager.showNotification('Error deleting staff member', 'error');
            }
        }
    }

    // Export Staff Data
    exportStaffData() {
        const csv = this.manager.staffMgmt.exportToCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `staff_data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.manager.showNotification('Staff data exported successfully', 'success');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StaffManagementHandlers;
}
