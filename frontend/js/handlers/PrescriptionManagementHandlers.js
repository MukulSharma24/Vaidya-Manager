// PrescriptionManagementHandlers.js
// Handles prescription management UI operations

class PrescriptionManagementHandlers {
    constructor(manager) {
        this.manager = manager;
        this.prescriptionMgr = manager.prescriptionMgr;
        this.patientMgmt = manager.patientMgmt;
        this.medicineDB = manager.medicineDB;
        this.appointmentsManager = manager.appointmentsManager;
    }

    renderPrescriptionManagement() {
        this.renderPrescriptionPatientList();
        this.setupPrescriptionEventListeners();
        this.renderRecentPrescriptions();
    }

    setupPrescriptionEventListeners() {
        const prescriptionPatientSearch = document.getElementById('prescriptionPatientSearch');
        if (prescriptionPatientSearch) {
            prescriptionPatientSearch.addEventListener('input', (e) => {
                this.renderPrescriptionPatientList(e.target.value);
            });
        }

        const medicineTabs = document.querySelectorAll('.medicine-tab');
        medicineTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                medicineTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });

                const tabId = tab.dataset.tab === 'pharmacy' ? 'pharmacyTab' : 'externalTab';
                document.getElementById(tabId).classList.add('active');
            });
        });

        const pharmacyMedicineSearch = document.getElementById('pharmacyMedicineSearch');
        if (pharmacyMedicineSearch) {
            pharmacyMedicineSearch.addEventListener('input', (e) => {
                this.renderAvailableMedicines(e.target.value);
            });
        }

        const externalMedicineForm = document.getElementById('externalMedicineForm');
        if (externalMedicineForm) {
            externalMedicineForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleExternalMedicineAdd(e);
            });
        }

        const cancelPrescriptionBtn = document.getElementById('cancelPrescriptionBtn');
        if (cancelPrescriptionBtn) {
            cancelPrescriptionBtn.addEventListener('click', () => {
                this.handleCancelPrescription();
            });
        }

        const savePrescriptionBtn = document.getElementById('savePrescriptionBtn');
        if (savePrescriptionBtn) {
            savePrescriptionBtn.addEventListener('click', () => {
                this.handleSavePrescription();
            });
        }

        const closeDosageModalBtn = document.getElementById('closeDosageModalBtn');
        const cancelDosageModalBtn = document.getElementById('cancelDosageModalBtn');
        const dosageForm = document.getElementById('dosageForm');

        if (closeDosageModalBtn) {
            closeDosageModalBtn.addEventListener('click', () => this.closeMedicineDosageModal());
        }
        if (cancelDosageModalBtn) {
            cancelDosageModalBtn.addEventListener('click', () => this.closeMedicineDosageModal());
        }
        if (dosageForm) {
            dosageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddMedicineFromModal(e);
            });
        }
    }

    renderPrescriptionPatientList(searchQuery = '') {
        const patientList = document.getElementById('prescriptionPatientList');
        if (!patientList) return;

        const todaysAppointments = this.appointmentsManager.getTodaysAppointments();

        const patientMap = new Map();
        todaysAppointments.forEach(apt => {
            if (!patientMap.has(apt.patientId)) {
                const patient = this.patientMgmt.getPatientById(apt.patientId);
                if (patient) {
                    patientMap.set(apt.patientId, {
                        ...patient,
                        appointmentId: apt.id,
                        appointmentTime: apt.time,
                        appointmentType: apt.appointmentType,
                        appointmentStatus: apt.status
                    });
                }
            }
        });

        let patients = Array.from(patientMap.values());

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            patients = patients.filter(patient =>
                patient.name.toLowerCase().includes(query) ||
                patient.phone.includes(query) ||
                patient.constitution.toLowerCase().includes(query) ||
                patient.appointmentType.toLowerCase().includes(query)
            );
        }

        if (patients.length === 0) {
            patientList.innerHTML = `
                <div class="prescription-empty-state">
                    <div class="prescription-empty-state-icon">📅</div>
                    <p>${searchQuery ? 'No patients found matching your search' : 'No appointments scheduled for today'}</p>
                    ${!searchQuery ? '<p style="font-size: 0.9em; color: var(--text-tertiary); margin-top: 8px;">Schedule appointments to create prescriptions</p>' : ''}
                </div>
            `;
            return;
        }

        patientList.innerHTML = '';

        patients.forEach(patient => {
            const patientItem = document.createElement('div');
            patientItem.className = 'patient-list-item';
            patientItem.dataset.patientId = patient.id;

            const statusClass = patient.appointmentStatus || 'scheduled';
            const statusText = patient.appointmentStatus.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

            patientItem.innerHTML = `
                <div class="patient-list-item-header">
                    <div class="patient-list-item-name">${patient.name}</div>
                    <span class="appointment-status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="patient-list-item-info">
                    Age: ${patient.age} | ${patient.constitution}<br>
                    Phone: ${patient.phone}<br>
                    <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border-dark);">
                        <strong>📅 Today's Appointment:</strong> ${patient.appointmentTime} - ${patient.appointmentType}
                    </div>
                </div>
            `;

            patientItem.addEventListener('click', () => {
                this.handlePatientSelection(patient);
            });

            patientList.appendChild(patientItem);
        });
    }

    handlePatientSelection(patient) {
        document.querySelectorAll('.patient-list-item').forEach(item => {
            item.classList.remove('selected');
        });

        const selectedItem = document.querySelector(`[data-patient-id="${patient.id}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        this.prescriptionMgr.startNewPrescription(patient, this.manager.currentUser);

        const builderPanel = document.getElementById('prescriptionBuilderPanel');
        if (builderPanel) {
            builderPanel.classList.remove('disabled');
        }

        const patientHeader = document.getElementById('prescriptionPatientHeader');
        const patientName = document.getElementById('prescriptionPatientName');
        const patientDetails = document.getElementById('prescriptionPatientDetails');

        if (patientHeader) patientHeader.style.display = 'block';
        if (patientName) patientName.textContent = patient.name;
        if (patientDetails) {
            patientDetails.innerHTML = `
                <span><strong>Age:</strong> ${patient.age}</span>
                <span><strong>Constitution:</strong> ${patient.constitution}</span>
                <span><strong>Phone:</strong> ${patient.phone}</span>
            `;
        }

        this.renderAvailableMedicines('');

        const pharmacyMedicineSearch = document.getElementById('pharmacyMedicineSearch');
        if (pharmacyMedicineSearch) {
            pharmacyMedicineSearch.value = '';
        }

        this.renderCurrentPrescription();

        this.manager.showNotification(`Prescription started for ${patient.name}`, 'success');
    }

    renderAvailableMedicines(searchQuery = '') {
        const medicinesGrid = document.getElementById('availableMedicinesGrid');
        if (!medicinesGrid) {
            console.error('availableMedicinesGrid not found!');
            return;
        }

        const medicines = this.medicineDB.search(searchQuery);
        console.log(`Found ${medicines.length} medicines for query: "${searchQuery}"`);

        medicinesGrid.innerHTML = '';

        if (medicines.length === 0) {
            medicinesGrid.innerHTML = `
                <div class="prescription-empty-state">
                    <div class="prescription-empty-state-icon">💊</div>
                    <h4>No medicines found</h4>
                    <p>Try searching with different keywords or add medicines to your pharmacy</p>
                </div>
            `;
            return;
        }

        medicines.forEach(medicine => {
            const medicineCard = document.createElement('div');
            medicineCard.className = 'medicine-select-card';

            let stockIndicatorClass = 'in-stock';
            let stockIndicatorText = `Stock: ${medicine.stock}`;

            if (medicine.stock === 0) {
                stockIndicatorClass = 'out-of-stock';
                stockIndicatorText = 'Out of Stock';
            } else if (medicine.stock < 10) {
                stockIndicatorClass = 'low-stock';
            }

            medicineCard.innerHTML = `
                <div class="medicine-select-info">
                    <div class="medicine-select-name">
                        ${medicine.name}
                        ${medicine.sanskritName ? `<div class="medicine-select-name-sanskrit">${medicine.sanskritName}</div>` : ''}
                    </div>
                    <div class="medicine-select-details">
                        ${medicine.category} • ${medicine.dosage} • ${medicine.timing}
                    </div>
                </div>
                <div class="medicine-stock-indicator ${stockIndicatorClass}">
                    ${stockIndicatorText}
                </div>
            `;

            medicineCard.addEventListener('click', () => {
                console.log('Medicine clicked:', medicine.name);
                this.openMedicineDosageModal(medicine);
            });

            medicinesGrid.appendChild(medicineCard);
        });

        console.log(`Rendered ${medicines.length} medicine cards`);
    }

    openMedicineDosageModal(medicine) {
        const modal = document.getElementById('medicineDosageModal');
        const medicineIdInput = document.getElementById('selectedMedicineId');
        const medicineNameDisplay = document.getElementById('selectedMedicineName');
        const customDosage = document.getElementById('customDosage');
        const customTiming = document.getElementById('customTiming');

        if (medicineIdInput) medicineIdInput.value = medicine.id;
        if (medicineNameDisplay) {
            medicineNameDisplay.textContent = `${medicine.name} ${medicine.sanskritName ? `(${medicine.sanskritName})` : ''}`;
        }
        if (customDosage) customDosage.value = medicine.dosage;
        if (customTiming) {
            const timingOptions = Array.from(customTiming.options);
            const matchingOption = timingOptions.find(opt => opt.value.toLowerCase() === medicine.timing.toLowerCase());
            if (matchingOption) {
                customTiming.value = matchingOption.value;
            }
        }

        if (modal) {
            modal.classList.add('show');
        }
    }

    closeMedicineDosageModal() {
        const modal = document.getElementById('medicineDosageModal');
        const form = document.getElementById('dosageForm');

        if (modal) {
            modal.classList.remove('show');
        }
        if (form) {
            form.reset();
        }
    }

    handleAddMedicineFromModal(e) {
        e.preventDefault();

        const medicineId = parseInt(document.getElementById('selectedMedicineId').value);
        const customDosage = document.getElementById('customDosage').value.trim();
        const customTiming = document.getElementById('customTiming').value;
        const duration = document.getElementById('medicineDuration').value.trim();

        if (!customDosage || !customTiming || !duration) {
            this.manager.showNotification('Please fill in all fields', 'error');
            return;
        }

        const medicine = this.medicineDB.getMedicineById(medicineId);
        if (!medicine) {
            this.manager.showNotification('Medicine not found', 'error');
            return;
        }

        try {
            this.prescriptionMgr.addMedicineToPrescription(medicine, customDosage, customTiming, duration);
            this.closeMedicineDosageModal();
            this.renderCurrentPrescription();
            this.manager.showNotification(`${medicine.name} added to prescription`, 'success');
        } catch (error) {
            this.manager.showNotification(error.message, 'error');
        }
    }

    handleExternalMedicineAdd(e) {
        e.preventDefault();

        const name = document.getElementById('externalMedicineName').value.trim();
        const company = document.getElementById('externalMedicineCompany').value.trim();
        const dosage = document.getElementById('externalMedicineDosage').value.trim();
        const timing = document.getElementById('externalMedicineTiming').value.trim();
        const duration = document.getElementById('externalMedicineDuration').value.trim();
        const notes = document.getElementById('externalMedicineNotes').value.trim();

        if (!name || !dosage || !timing) {
            this.manager.showNotification('Please fill in required fields', 'error');
            return;
        }

        try {
            this.prescriptionMgr.addExternalMedicine({
                name,
                company,
                dosage,
                timing,
                duration: duration || '30 days',
                notes
            });

            e.target.reset();

            this.renderCurrentPrescription();
            this.manager.showNotification(`External medicine ${name} added to prescription`, 'success');
        } catch (error) {
            this.manager.showNotification(error.message, 'error');
        }
    }

    renderCurrentPrescription() {
        const prescriptionList = document.getElementById('prescriptionMedicineList');
        const countBadge = document.getElementById('prescriptionCountBadge');

        if (!prescriptionList) return;

        const currentPrescription = this.prescriptionMgr.getCurrentPrescription();

        if (!currentPrescription) {
            prescriptionList.innerHTML = `
                <div class="prescription-empty-state">
                    <div class="prescription-empty-state-icon">💊</div>
                    <h4>No medicines added yet</h4>
                    <p>Select medicines from pharmacy or add external medicines</p>
                </div>
            `;
            if (countBadge) countBadge.textContent = '0';
            return;
        }

        const totalMedicines = (currentPrescription.medicines?.length || 0) +
            (currentPrescription.externalMedicines?.length || 0);

        if (countBadge) countBadge.textContent = totalMedicines;

        if (totalMedicines === 0) {
            prescriptionList.innerHTML = `
                <div class="prescription-empty-state">
                    <div class="prescription-empty-state-icon">💊</div>
                    <h4>No medicines added yet</h4>
                    <p>Select medicines from pharmacy or add external medicines</p>
                </div>
            `;
            return;
        }

        prescriptionList.innerHTML = '';

        currentPrescription.medicines?.forEach((medicine, index) => {
            const medicineItem = document.createElement('div');
            medicineItem.className = 'prescription-medicine-item';

            medicineItem.innerHTML = `
                <div class="prescription-medicine-content">
                    <div class="prescription-medicine-name">
                        ${medicine.name}
                        ${medicine.sanskritName ? `<span style="font-size: 0.9em; color: #999; font-style: italic;">(${medicine.sanskritName})</span>` : ''}
                        <span class="prescription-medicine-type-badge pharmacy">Our Pharmacy</span>
                    </div>
                    <div class="prescription-medicine-dosage">
                        <span><strong>💊 Dosage:</strong> ${medicine.dosage}</span>
                        <span><strong>⏰ Timing:</strong> ${medicine.timing}</span>
                        <span><strong>📅 Duration:</strong> ${medicine.duration}</span>
                    </div>
                </div>
                <div class="prescription-medicine-actions">
                    <button class="btn-remove-prescription-medicine" data-index="${index}" data-external="false">Remove</button>
                </div>
            `;

            const removeBtn = medicineItem.querySelector('.btn-remove-prescription-medicine');
            removeBtn.addEventListener('click', () => {
                this.prescriptionMgr.removeMedicineFromPrescription(index, false);
                this.renderCurrentPrescription();
                this.manager.showNotification('Medicine removed from prescription', 'info');
            });

            prescriptionList.appendChild(medicineItem);
        });

        currentPrescription.externalMedicines?.forEach((medicine, index) => {
            const medicineItem = document.createElement('div');
            medicineItem.className = 'prescription-medicine-item external';

            medicineItem.innerHTML = `
                <div class="prescription-medicine-content">
                    <div class="prescription-medicine-name">
                        ${medicine.name}
                        ${medicine.company ? `<span style="font-size: 0.9em; color: #999;">- ${medicine.company}</span>` : ''}
                        <span class="prescription-medicine-type-badge external">External</span>
                    </div>
                    <div class="prescription-medicine-dosage">
                        <span><strong>💊 Dosage:</strong> ${medicine.dosage}</span>
                        <span><strong>⏰ Timing:</strong> ${medicine.timing}</span>
                        <span><strong>📅 Duration:</strong> ${medicine.duration}</span>
                    </div>
                    ${medicine.notes ? `<div style="margin-top: 8px; font-size: 0.9em; color: #666;"><strong>Note:</strong> ${medicine.notes}</div>` : ''}
                </div>
                <div class="prescription-medicine-actions">
                    <button class="btn-remove-prescription-medicine" data-index="${index}" data-external="true">Remove</button>
                </div>
            `;

            const removeBtn = medicineItem.querySelector('.btn-remove-prescription-medicine');
            removeBtn.addEventListener('click', () => {
                this.prescriptionMgr.removeMedicineFromPrescription(index, true);
                this.renderCurrentPrescription();
                this.manager.showNotification('External medicine removed from prescription', 'info');
            });

            prescriptionList.appendChild(medicineItem);
        });
    }

    handleCancelPrescription() {
        if (confirm('Are you sure you want to cancel this prescription? All changes will be lost.')) {
            this.prescriptionMgr.cancelPrescription();

            const builderPanel = document.getElementById('prescriptionBuilderPanel');
            if (builderPanel) {
                builderPanel.classList.add('disabled');
            }

            const patientHeader = document.getElementById('prescriptionPatientHeader');
            if (patientHeader) {
                patientHeader.style.display = 'none';
            }

            document.querySelectorAll('.patient-list-item').forEach(item => {
                item.classList.remove('selected');
            });

            this.renderCurrentPrescription();
            this.manager.showNotification('Prescription cancelled', 'info');
        }
    }

    handleSavePrescription() {
        const notes = document.getElementById('prescriptionNotes')?.value.trim();

        if (notes) {
            this.prescriptionMgr.updatePrescriptionNotes(notes);
        }

        try {
            const savedPrescription = this.prescriptionMgr.savePrescription();

            const prescriptionText = this.prescriptionMgr.generatePrescriptionText(savedPrescription);

            this.manager.showNotification(
                `Prescription ${savedPrescription.prescriptionNumber} saved successfully!`,
                'success'
            );

            alert(`PRESCRIPTION GENERATED:\n\n${prescriptionText}\n\n(In production, this would print or save as PDF)`);

            const builderPanel = document.getElementById('prescriptionBuilderPanel');
            if (builderPanel) {
                builderPanel.classList.add('disabled');
            }

            const patientHeader = document.getElementById('prescriptionPatientHeader');
            if (patientHeader) {
                patientHeader.style.display = 'none';
            }

            document.querySelectorAll('.patient-list-item').forEach(item => {
                item.classList.remove('selected');
            });

            const notesField = document.getElementById('prescriptionNotes');
            if (notesField) notesField.value = '';

            this.renderCurrentPrescription();
            this.renderRecentPrescriptions();

        } catch (error) {
            this.manager.showNotification(error.message, 'error');
        }
    }

    renderRecentPrescriptions() {
        const historyGrid = document.getElementById('prescriptionsHistoryGrid');
        if (!historyGrid) return;

        const recentPrescriptions = this.prescriptionMgr.getRecentPrescriptions(10);

        if (recentPrescriptions.length === 0) {
            historyGrid.innerHTML = '<div class="prescription-empty-state"><p>No prescriptions yet</p></div>';
            return;
        }

        historyGrid.innerHTML = '';

        recentPrescriptions.forEach(prescription => {
            const card = document.createElement('div');
            card.className = 'prescription-history-card';

            const totalMedicines = (prescription.medicines?.length || 0) +
                (prescription.externalMedicines?.length || 0);

            card.innerHTML = `
                <div class="prescription-history-header">
                    <div>
                        <div class="prescription-history-number">${prescription.prescriptionNumber}</div>
                        <div class="prescription-history-date">${new Date(prescription.date).toLocaleDateString()}</div>
                    </div>
                </div>
                <div class="prescription-history-patient">${prescription.patientName}</div>
                <div class="prescription-history-details">
                    Age: ${prescription.patientAge} | ${prescription.patientConstitution} | Dr. ${prescription.doctorName}
                </div>
                <div class="prescription-history-medicines">
                    ${totalMedicines} medicine(s) prescribed
                </div>
            `;

            card.addEventListener('click', () => {
                const prescriptionText = this.prescriptionMgr.generatePrescriptionText(prescription);
                alert(`PRESCRIPTION DETAILS:\n\n${prescriptionText}`);
            });

            historyGrid.appendChild(card);
        });
    }
}