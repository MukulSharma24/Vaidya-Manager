// PatientManagement.js
// Patient Management Class with full integration

class PatientManagement {
    constructor() {
        this.patients = [
            { id: 1, name: 'Rajesh Kumar', gender: 'Male', age: 45, constitution: 'Vata', phone: '+91-9876543210', treatments: 8, lastVisit: new Date(Date.now() - 2 * 86400000), email: 'rajesh@example.com', address: 'Mumbai, Maharashtra' },
            { id: 2, name: 'Priya Sharma', gender: 'Female', age: 32, constitution: 'Pitta', phone: '+91-9876543211', treatments: 12, lastVisit: new Date(Date.now() - 7 * 86400000), email: 'priya@example.com', address: 'Delhi, Delhi' },
            { id: 3, name: 'Amit Patel', gender: 'Male', age: 38, constitution: 'Kapha', phone: '+91-9876543212', treatments: 6, lastVisit: new Date(Date.now() - 3 * 86400000), email: 'amit@example.com', address: 'Ahmedabad, Gujarat' },
            { id: 4, name: 'Sunita Verma', gender: 'Female', age: 29, constitution: 'Vata-Pitta', phone: '+91-9876543213', treatments: 4, lastVisit: new Date(Date.now() - 5 * 86400000), email: 'sunita@example.com', address: 'Pune, Maharashtra' },
            { id: 5, name: 'Karan Singh', gender: 'Male', age: 52, constitution: 'Kapha', phone: '+91-9876543214', treatments: 15, lastVisit: new Date(Date.now() - 1 * 86400000), email: 'karan@example.com', address: 'Jaipur, Rajasthan' },
            { id: 6, name: 'Deepa Nair', gender: 'Female', age: 41, constitution: 'Pitta', phone: '+91-9876543215', treatments: 9, lastVisit: new Date(Date.now() - 4 * 86400000), email: 'deepa@example.com', address: 'Kochi, Kerala' },
            { id: 7, name: 'Rohit Malhotra', gender: 'Male', age: 36, constitution: 'Vata', phone: '+91-9876543216', treatments: 7, lastVisit: new Date(Date.now() - 10 * 86400000), email: 'rohit@example.com', address: 'Bangalore, Karnataka' }
        ];
        this.nextId = 8;
    }

    search(query) {
        if (!query) return this.patients;
        return this.patients.filter(patient =>
            (patient.name && patient.name.toLowerCase().includes(query.toLowerCase())) ||
            (patient.phone && patient.phone.includes(query)) ||
            (patient.email && patient.email.toLowerCase().includes(query.toLowerCase()))
        );
    }

    getPatientById(id) {
        return this.patients.find(p => p.id === id);
    }

    getPatientByPhone(phone) {
        return this.patients.find(p => p.phone === phone);
    }

    // New helper to lookup by DB id if present
    getPatientByDbId(dbId) {
        return this.patients.find(p => p.dbId && String(p.dbId) === String(dbId));
    }

    addPatient(patientData) {
        const newPatient = {
            id: this.nextId++,
            name: patientData.name,
            gender: patientData.gender || 'Other',
            age: patientData.age,
            constitution: patientData.constitution || 'Not assessed',
            phone: patientData.phone,
            email: patientData.email || '',
            address: patientData.address || '',
            treatments: patientData.treatments || 0,
            lastVisit: patientData.lastVisit || new Date(),
            // extra fields:
            DateOfBirth: patientData.DateOfBirth || null,
            AddressLine1: patientData.AddressLine1 || null,
            AddressLine2: patientData.AddressLine2 || null,
            CityName: patientData.CityName || null,
            StateName: patientData.StateName || null,
            PostalCode: patientData.PostalCode || null,
            Country: patientData.Country || null,
            BloodGroup: patientData.BloodGroup || null,
            dbId: patientData.dbId || null
        };
        this.patients.push(newPatient);
        return newPatient;
    }

    updatePatient(id, updates) {
        const patient = this.getPatientById(id);
        if (patient) {
            Object.assign(patient, updates);
            return true;
        }
        return false;
    }

    getTotalPatients() {
        return this.patients.length;
    }

    getRecentPatients(limit = 10) {
        return [...this.patients]
            .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit))
            .slice(0, limit);
    }

    formatLastVisit(date) {
        const now = new Date();
        const visitDate = new Date(date);
        const diffTime = Math.abs(now - visitDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
        return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatientManagement;
}
