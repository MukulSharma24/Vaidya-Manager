// StaffManagement.js
// Staff Management Data Class

class StaffManagement {
    constructor() {
        this.staff = [];
        this.loadStaffFromStorage();
        this.initializeDefaultStaff();
    }

    initializeDefaultStaff() {
        if (this.staff.length === 0) {
            this.staff = [
                {
                    id: 'STF001',
                    name: 'Dr. Rajesh Kumar',
                    age: 45,
                    email: 'rajesh.kumar@shajag.com',
                    contact: '+91-9876543210',
                    role: 'Senior Ayurvedic Doctor',
                    responsibility: 'Primary consultant, Panchakarma specialist',
                    joiningDate: '2018-05-15',
                    salary: 85000,
                    employmentType: 'Full-time',
                    address: '123, Green Park, New Delhi',
                    emergencyContact: '+91-9876543211',
                    qualification: 'BAMS, MD (Ayurveda)',
                    experience: '20 years',
                    specialization: 'Panchakarma, Raktamokshana',
                    shift: 'Morning (9 AM - 5 PM)',
                    status: 'Active',
                    avatar: '👨‍⚕️'
                },
                {
                    id: 'STF002',
                    name: 'Dr. Priya Sharma',
                    age: 38,
                    email: 'priya.sharma@shajag.com',
                    contact: '+91-9876543220',
                    role: 'Ayurvedic Doctor',
                    responsibility: 'Diet consultation, Women wellness',
                    joiningDate: '2019-08-20',
                    salary: 65000,
                    employmentType: 'Full-time',
                    address: '456, Lotus Avenue, Mumbai',
                    emergencyContact: '+91-9876543221',
                    qualification: 'BAMS',
                    experience: '12 years',
                    specialization: 'Diet Management, Vata-Pitta Balance',
                    shift: 'Morning (9 AM - 5 PM)',
                    status: 'Active',
                    avatar: '👩‍⚕️'
                },
                {
                    id: 'STF003',
                    name: 'Ramesh Patel',
                    age: 32,
                    email: 'ramesh.patel@shajag.com',
                    contact: '+91-9876543230',
                    role: 'Pharmacy Manager',
                    responsibility: 'Medicine inventory, Stock management',
                    joiningDate: '2020-01-10',
                    salary: 45000,
                    employmentType: 'Full-time',
                    address: '789, Herbal Lane, Ahmedabad',
                    emergencyContact: '+91-9876543231',
                    qualification: 'B.Pharm',
                    experience: '8 years',
                    specialization: 'Ayurvedic Medicine Management',
                    shift: 'Full Day (9 AM - 6 PM)',
                    status: 'Active',
                    avatar: '💊'
                },
                {
                    id: 'STF004',
                    name: 'Sneha Reddy',
                    age: 28,
                    email: 'sneha.reddy@shajag.com',
                    contact: '+91-9876543240',
                    role: 'Ayurvedic Nurse',
                    responsibility: 'Patient care, Therapy assistance',
                    joiningDate: '2021-03-15',
                    salary: 35000,
                    employmentType: 'Full-time',
                    address: '321, Wellness Street, Hyderabad',
                    emergencyContact: '+91-9876543241',
                    qualification: 'GNM, Ayurveda Therapy Certificate',
                    experience: '5 years',
                    specialization: 'Panchakarma Therapy, Patient Care',
                    shift: 'Morning (8 AM - 4 PM)',
                    status: 'Active',
                    avatar: '👩‍⚕️'
                },
                {
                    id: 'STF005',
                    name: 'Amit Verma',
                    age: 35,
                    email: 'amit.verma@shajag.com',
                    contact: '+91-9876543250',
                    role: 'Receptionist',
                    responsibility: 'Appointments, Patient registration',
                    joiningDate: '2020-11-01',
                    salary: 28000,
                    employmentType: 'Full-time',
                    address: '654, Reception Road, Bangalore',
                    emergencyContact: '+91-9876543251',
                    qualification: 'BBA',
                    experience: '4 years',
                    specialization: 'Front Office Management',
                    shift: 'Morning (8 AM - 4 PM)',
                    status: 'Active',
                    avatar: '👨‍💼'
                },
                {
                    id: 'STF006',
                    name: 'Kavita Mehta',
                    age: 42,
                    email: 'kavita.mehta@shajag.com',
                    contact: '+91-9876543260',
                    role: 'Therapist',
                    responsibility: 'Panchakarma treatments, Massage therapy',
                    joiningDate: '2019-06-10',
                    salary: 40000,
                    employmentType: 'Full-time',
                    address: '987, Therapy Gardens, Pune',
                    emergencyContact: '+91-9876543261',
                    qualification: 'Ayurvedic Therapy Diploma',
                    experience: '15 years',
                    specialization: 'Abhyanga, Shirodhara, Basti',
                    shift: 'Full Day (9 AM - 6 PM)',
                    status: 'Active',
                    avatar: '🧘‍♀️'
                }
            ];
            this.saveStaffToStorage();
        }
    }

    // Get all staff
    getAllStaff() {
        return [...this.staff];
    }

    // Get staff by ID
    getStaffById(id) {
        return this.staff.find(s => s.id === id);
    }

    // Add new staff
    addStaff(staffData) {
        const newId = this.generateStaffId();
        const newStaff = {
            id: newId,
            ...staffData,
            status: 'Active'
        };
        this.staff.push(newStaff);
        this.saveStaffToStorage();
        console.log('✅ Staff added:', newStaff);
        return newStaff;
    }

    // Update staff
    updateStaff(id, updates) {
        const index = this.staff.findIndex(s => s.id === id);
        if (index !== -1) {
            this.staff[index] = { ...this.staff[index], ...updates };
            this.saveStaffToStorage();
            console.log('✅ Staff updated:', this.staff[index]);
            return this.staff[index];
        }
        return null;
    }

    // Delete staff
    deleteStaff(id) {
        const index = this.staff.findIndex(s => s.id === id);
        if (index !== -1) {
            const deleted = this.staff.splice(index, 1)[0];
            this.saveStaffToStorage();
            console.log('✅ Staff deleted:', deleted);
            return deleted;
        }
        return null;
    }

    // Search staff
    searchStaff(query) {
        const lowerQuery = query.toLowerCase();
        return this.staff.filter(s =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.id.toLowerCase().includes(lowerQuery) ||
            s.email.toLowerCase().includes(lowerQuery) ||
            s.role.toLowerCase().includes(lowerQuery) ||
            s.contact.includes(query)
        );
    }

    // Filter by role
    filterByRole(role) {
        if (role === 'all') return this.getAllStaff();
        return this.staff.filter(s => s.role.toLowerCase().includes(role.toLowerCase()));
    }

    // Filter by status
    filterByStatus(status) {
        if (status === 'all') return this.getAllStaff();
        return this.staff.filter(s => s.status === status);
    }

    // Get statistics
    getStatistics() {
        const total = this.staff.length;
        const active = this.staff.filter(s => s.status === 'Active').length;
        const doctors = this.staff.filter(s => s.role.toLowerCase().includes('doctor')).length;
        const nurses = this.staff.filter(s => s.role.toLowerCase().includes('nurse')).length;
        const totalSalary = this.staff.reduce((sum, s) => sum + (s.salary || 0), 0);

        return {
            total,
            active,
            doctors,
            nurses,
            totalSalary
        };
    }

    // Generate unique staff ID
    generateStaffId() {
        const maxId = this.staff.reduce((max, s) => {
            const num = parseInt(s.id.replace('STF', ''));
            return num > max ? num : max;
        }, 0);
        return `STF${String(maxId + 1).padStart(3, '0')}`;
    }

    // Get roles list
    getRoles() {
        const roles = [...new Set(this.staff.map(s => s.role))];
        return roles.sort();
    }

    // Storage methods
    saveStaffToStorage() {
        try {
            localStorage.setItem('svmStaff', JSON.stringify(this.staff));
            console.log('💾 Staff data saved to localStorage');
        } catch (error) {
            console.error('❌ Error saving staff:', error);
        }
    }

    loadStaffFromStorage() {
        try {
            const stored = localStorage.getItem('svmStaff');
            if (stored) {
                this.staff = JSON.parse(stored);
                console.log('✅ Staff data loaded from localStorage:', this.staff.length, 'staff members');
            }
        } catch (error) {
            console.error('❌ Error loading staff:', error);
            this.staff = [];
        }
    }

    // Export to CSV
    exportToCSV() {
        const headers = ['ID', 'Name', 'Age', 'Email', 'Contact', 'Role', 'Salary', 'Status'];
        const rows = this.staff.map(s => [
            s.id,
            s.name,
            s.age,
            s.email,
            s.contact,
            s.role,
            s.salary,
            s.status
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });

        return csv;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StaffManagement;
}