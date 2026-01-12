// PrescriptionManager.js
// Prescription Management Class for Doctors to prescribe medicines to patients

class PrescriptionManager {
    constructor(patientMgmt, medicineDB) {
        this.patientMgmt = patientMgmt;
        this.medicineDB = medicineDB;
        this.prescriptions = [
            {
                id: 1,
                prescriptionNumber: 'RX001',
                patientId: 1,
                patientName: 'Rajesh Kumar',
                doctorName: 'Dr. Mukul',
                date: new Date(Date.now() - 5 * 86400000),
                medicines: [
                    { medicineId: 1, name: 'Triphala Churna', dosage: '3g', timing: 'Night before bed', duration: '30 days', fromPharmacy: true },
                    { medicineId: 2, name: 'Ashwagandha', dosage: '2g', timing: 'With warm milk', duration: '45 days', fromPharmacy: true }
                ],
                notes: 'Continue for 30 days, review after',
                status: 'active'
            },
            {
                id: 2,
                prescriptionNumber: 'RX002',
                patientId: 2,
                patientName: 'Priya Sharma',
                doctorName: 'Dr. Mukul',
                date: new Date(Date.now() - 2 * 86400000),
                medicines: [
                    { medicineId: 3, name: 'Brahmi Ghrita', dosage: '5ml', timing: 'Morning empty stomach', duration: '21 days', fromPharmacy: true }
                ],
                notes: 'Take on empty stomach',
                status: 'active'
            }
        ];
        this.currentPrescription = null;
        this.nextId = 3;
        this.nextPrescriptionNumber = 3;
    }

    startNewPrescription(patient, doctorName) {
        this.currentPrescription = {
            id: null, // Will be assigned on save
            prescriptionNumber: null, // Will be generated on save
            patientId: patient.id,
            patientName: patient.name,
            patientAge: patient.age,
            patientConstitution: patient.constitution,
            patientPhone: patient.phone,
            doctorName: doctorName,
            date: new Date(),
            medicines: [],
            externalMedicines: [], // Medicines not in our pharmacy
            notes: '',
            status: 'draft'
        };
        return this.currentPrescription;
    }

    addMedicineToPrescription(medicine, customDosage, customTiming, duration) {
        if (!this.currentPrescription) {
            throw new Error('No active prescription. Start a new prescription first.');
        }

        const prescriptionMedicine = {
            medicineId: medicine.id,
            name: medicine.name,
            sanskritName: medicine.sanskritName,
            category: medicine.category,
            dosage: customDosage || medicine.dosage,
            timing: customTiming || medicine.timing,
            duration: duration || '30 days',
            fromPharmacy: true,
            stock: medicine.stock
        };

        this.currentPrescription.medicines.push(prescriptionMedicine);
        return prescriptionMedicine;
    }

    addExternalMedicine(medicineData) {
        if (!this.currentPrescription) {
            throw new Error('No active prescription. Start a new prescription first.');
        }

        const externalMedicine = {
            id: Date.now(), // Temporary ID
            name: medicineData.name,
            company: medicineData.company || 'Not specified',
            dosage: medicineData.dosage,
            timing: medicineData.timing,
            duration: medicineData.duration || '30 days',
            fromPharmacy: false,
            notes: medicineData.notes || ''
        };

        this.currentPrescription.externalMedicines.push(externalMedicine);
        return externalMedicine;
    }

    removeMedicineFromPrescription(index, isExternal = false) {
        if (!this.currentPrescription) return false;

        if (isExternal) {
            this.currentPrescription.externalMedicines.splice(index, 1);
        } else {
            this.currentPrescription.medicines.splice(index, 1);
        }
        return true;
    }

    updatePrescriptionNotes(notes) {
        if (!this.currentPrescription) return false;
        this.currentPrescription.notes = notes;
        return true;
    }

    savePrescription() {
        if (!this.currentPrescription) {
            throw new Error('No active prescription to save.');
        }

        if (this.currentPrescription.medicines.length === 0 &&
            this.currentPrescription.externalMedicines.length === 0) {
            throw new Error('Cannot save prescription without medicines.');
        }

        // Assign ID and prescription number
        this.currentPrescription.id = this.nextId++;
        this.currentPrescription.prescriptionNumber = `RX${String(this.nextPrescriptionNumber++).padStart(3, '0')}`;
        this.currentPrescription.status = 'active';

        // Add to prescriptions list
        this.prescriptions.push({...this.currentPrescription});

        // Update patient's last visit
        if (this.patientMgmt) {
            this.patientMgmt.updatePatient(this.currentPrescription.patientId, {
                lastVisit: new Date()
            });
        }

        const savedPrescription = {...this.currentPrescription};
        this.currentPrescription = null;

        return savedPrescription;
    }

    cancelPrescription() {
        this.currentPrescription = null;
    }

    getCurrentPrescription() {
        return this.currentPrescription;
    }

    getPrescriptionById(id) {
        return this.prescriptions.find(p => p.id === id);
    }

    getPrescriptionsByPatient(patientId) {
        return this.prescriptions.filter(p => p.patientId === patientId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getRecentPrescriptions(limit = 10) {
        return [...this.prescriptions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    searchPrescriptions(query) {
        if (!query) return this.prescriptions;

        query = query.toLowerCase();
        return this.prescriptions.filter(p =>
            p.prescriptionNumber.toLowerCase().includes(query) ||
            p.patientName.toLowerCase().includes(query) ||
            p.doctorName.toLowerCase().includes(query)
        );
    }

    updatePrescriptionStatus(id, status) {
        const prescription = this.getPrescriptionById(id);
        if (prescription) {
            prescription.status = status;
            return true;
        }
        return false;
    }

    generatePrescriptionText(prescription) {
        const lines = [];
        lines.push(`PRESCRIPTION - ${prescription.prescriptionNumber}`);
        lines.push(`Date: ${new Date(prescription.date).toLocaleDateString()}`);
        lines.push('');
        lines.push(`Patient: ${prescription.patientName}`);
        lines.push(`Age: ${prescription.patientAge} | Constitution: ${prescription.patientConstitution}`);
        lines.push(`Doctor: ${prescription.doctorName}`);
        lines.push('');
        lines.push('MEDICINES:');
        lines.push('─'.repeat(50));

        let medicineNumber = 1;

        // Add pharmacy medicines
        prescription.medicines.forEach(med => {
            lines.push(`${medicineNumber}. ${med.name} ${med.sanskritName ? `(${med.sanskritName})` : ''}`);
            lines.push(`   Dosage: ${med.dosage}`);
            lines.push(`   Timing: ${med.timing}`);
            lines.push(`   Duration: ${med.duration}`);
            lines.push('');
            medicineNumber++;
        });

        // Add external medicines
        if (prescription.externalMedicines && prescription.externalMedicines.length > 0) {
            lines.push('EXTERNAL MEDICINES (Not in pharmacy):');
            prescription.externalMedicines.forEach(med => {
                lines.push(`${medicineNumber}. ${med.name} - ${med.company}`);
                lines.push(`   Dosage: ${med.dosage}`);
                lines.push(`   Timing: ${med.timing}`);
                lines.push(`   Duration: ${med.duration}`);
                if (med.notes) {
                    lines.push(`   Notes: ${med.notes}`);
                }
                lines.push('');
                medicineNumber++;
            });
        }

        if (prescription.notes) {
            lines.push('ADDITIONAL NOTES:');
            lines.push(prescription.notes);
        }

        return lines.join('\n');
    }

    getTotalPrescriptions() {
        return this.prescriptions.length;
    }

    getActivePrescriptions() {
        return this.prescriptions.filter(p => p.status === 'active');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrescriptionManager;
}