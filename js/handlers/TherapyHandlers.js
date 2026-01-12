// TherapyHandlers.js
// Handles therapy management and scheduling

class TherapyHandlers {
    constructor(manager) {
        this.manager = manager;
        this.patientMgmt = manager.patientMgmt;
        this.appointmentsManager = manager.appointmentsManager;
        this.therapyMgr = manager.therapyMgr;

        this.currentPatient = null;
        this.selectedTherapies = [];
    }

    renderTherapyView() {
        this.renderTherapyPatientList();
        this.setupTherapyEventListeners();
        this.renderRecentTherapyAssignments();
    }

    setupTherapyEventListeners() {
        // Patient search
        const therapyPatientSearch = document.getElementById('therapyPatientSearch');
        if (therapyPatientSearch) {
            // Remove old listener if exists
            const newSearch = therapyPatientSearch.cloneNode(true);
            therapyPatientSearch.parentNode.replaceChild(newSearch, therapyPatientSearch);

            newSearch.addEventListener('input', (e) => {
                this.renderTherapyPatientList(e.target.value);
            });
        }

        // Therapy cards - USE EVENT DELEGATION
        const therapyTypesSection = document.querySelector('.therapy-types-section .therapy-types');
        if (therapyTypesSection) {
            // Remove old listener
            const newTypesSection = therapyTypesSection.cloneNode(true);
            therapyTypesSection.parentNode.replaceChild(newTypesSection, therapyTypesSection);

            // Add event delegation listener
            newTypesSection.addEventListener('click', (e) => {
                const card = e.target.closest('.therapy-card');
                if (card) {
                    if (this.currentPatient) {
                        this.handleTherapySelection(card);
                    } else {
                        this.manager.showNotification('Please select a patient first', 'warning');
                    }
                }
            });
        }

        // Schedule therapy button
        const scheduleTherapyBtn = document.getElementById('scheduleTherapyBtn');
        if (scheduleTherapyBtn) {
            scheduleTherapyBtn.onclick = () => {
                this.openTherapyScheduleModal();
            };
        }

        // Save therapy assignment
        const saveTherapyBtn = document.getElementById('saveTherapyAssignmentBtn');
        if (saveTherapyBtn) {
            saveTherapyBtn.onclick = () => {
                this.handleSaveTherapyAssignment();
            };
        }

        // Cancel therapy assignment
        const cancelTherapyBtn = document.getElementById('cancelTherapyAssignmentBtn');
        if (cancelTherapyBtn) {
            cancelTherapyBtn.onclick = () => {
                this.handleCancelTherapyAssignment();
            };
        }

        // Therapy schedule form
        const therapyScheduleForm = document.getElementById('therapyScheduleForm');
        if (therapyScheduleForm) {
            therapyScheduleForm.onsubmit = (e) => {
                e.preventDefault();
                this.handleTherapyScheduleSubmit(e);
            };
        }

        // Close therapy schedule modal buttons
        const closeTherapyScheduleModalBtn = document.getElementById('closeTherapyScheduleModalBtn');
        const cancelTherapyScheduleModalBtn = document.getElementById('cancelTherapyScheduleModalBtn');

        if (closeTherapyScheduleModalBtn) {
            closeTherapyScheduleModalBtn.onclick = () => this.closeTherapyScheduleModal();
        }
        if (cancelTherapyScheduleModalBtn) {
            cancelTherapyScheduleModalBtn.onclick = () => this.closeTherapyScheduleModal();
        }
    }

    renderTherapyPatientList(searchQuery = '') {
        const patientList = document.getElementById('therapyPatientList');
        if (!patientList) return;

        let patients = this.patientMgmt.search(searchQuery);

        if (patients.length === 0) {
            patientList.innerHTML = `
                <div class="therapy-empty-state">
                    <div class="therapy-empty-state-icon">👥</div>
                    <p>No patients found</p>
                </div>
            `;
            return;
        }

        patientList.innerHTML = '';

        patients.forEach(patient => {
            const patientItem = document.createElement('div');
            patientItem.className = 'therapy-patient-item';
            patientItem.dataset.patientId = patient.id;

            patientItem.innerHTML = `
                <div class="therapy-patient-name">${patient.name}</div>
                <div class="therapy-patient-info">
                    Age: ${patient.age} | ${patient.constitution}<br>
                    Phone: ${patient.phone}
                </div>
            `;

            patientItem.addEventListener('click', () => {
                this.handlePatientSelection(patient);
            });

            patientList.appendChild(patientItem);
        });
    }

    handlePatientSelection(patient) {
        document.querySelectorAll('.therapy-patient-item').forEach(item => {
            item.classList.remove('selected');
        });

        const selectedItem = document.querySelector(`[data-patient-id="${patient.id}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        this.currentPatient = patient;
        this.selectedTherapies = [];

        const builderPanel = document.getElementById('therapyBuilderPanel');
        if (builderPanel) {
            builderPanel.classList.remove('disabled');
        }

        const patientHeader = document.getElementById('therapyPatientHeader');
        const patientName = document.getElementById('therapyPatientName');
        const patientDetails = document.getElementById('therapyPatientDetails');

        if (patientHeader) patientHeader.style.display = 'block';
        if (patientName) patientName.textContent = patient.name;
        if (patientDetails) {
            patientDetails.innerHTML = `
                <span><strong>Age:</strong> ${patient.age}</span>
                <span><strong>Constitution:</strong> ${patient.constitution}</span>
                <span><strong>Phone:</strong> ${patient.phone}</span>
            `;
        }

        document.querySelectorAll('.therapy-card').forEach(card => {
            card.classList.remove('selected');
        });

        this.renderSelectedTherapies();
        this.manager.showNotification(`Selected patient: ${patient.name}`, 'success');
    }

    handleTherapySelection(card) {
        const therapyName = card.querySelector('h3').textContent.trim();
        const therapyDescription = card.querySelector('p').textContent.trim();

        if (card.classList.contains('selected')) {
            card.classList.remove('selected');
            this.selectedTherapies = this.selectedTherapies.filter(t => t.name !== therapyName);
        } else {
            card.classList.add('selected');
            this.selectedTherapies.push({
                name: therapyName,
                description: therapyDescription,
                sessions: 0,
                duration: '',
                notes: ''
            });
        }

        this.renderSelectedTherapies();
    }

    renderSelectedTherapies() {
        const therapyList = document.getElementById('selectedTherapiesList');
        const countBadge = document.getElementById('therapyCountBadge');

        if (!therapyList) return;

        if (countBadge) countBadge.textContent = this.selectedTherapies.length;

        if (this.selectedTherapies.length === 0) {
            therapyList.innerHTML = `
                <div class="therapy-empty-state">
                    <div class="therapy-empty-state-icon">🧘</div>
                    <h4>No therapies selected</h4>
                    <p>Click on therapy cards above to select</p>
                </div>
            `;
            return;
        }

        therapyList.innerHTML = '';

        this.selectedTherapies.forEach((therapy, index) => {
            const therapyItem = document.createElement('div');
            therapyItem.className = 'selected-therapy-item';

            therapyItem.innerHTML = `
                <div class="selected-therapy-content">
                    <div class="selected-therapy-name">${therapy.name}</div>
                    <div class="selected-therapy-description">${therapy.description}</div>
                    <div class="therapy-input-row">
                        <input type="number" 
                               class="form-control therapy-sessions-input" 
                               placeholder="Sessions" 
                               min="1" 
                               value="${therapy.sessions || ''}"
                               data-index="${index}">
                        <input type="text" 
                               class="form-control therapy-duration-input" 
                               placeholder="Duration (e.g., 2 weeks)" 
                               value="${therapy.duration || ''}"
                               data-index="${index}">
                    </div>
                </div>
                <div class="selected-therapy-actions">
                    <button class="btn-remove-therapy" data-index="${index}">Remove</button>
                </div>
            `;

            const sessionsInput = therapyItem.querySelector('.therapy-sessions-input');
            const durationInput = therapyItem.querySelector('.therapy-duration-input');
            const removeBtn = therapyItem.querySelector('.btn-remove-therapy');

            sessionsInput.addEventListener('change', (e) => {
                this.selectedTherapies[index].sessions = parseInt(e.target.value) || 0;
            });

            durationInput.addEventListener('change', (e) => {
                this.selectedTherapies[index].duration = e.target.value;
            });

            removeBtn.addEventListener('click', () => {
                this.removeTherapy(index);
            });

            therapyList.appendChild(therapyItem);
        });
    }

    removeTherapy(index) {
        const therapyName = this.selectedTherapies[index].name;
        this.selectedTherapies.splice(index, 1);

        document.querySelectorAll('.therapy-card').forEach(card => {
            if (card.querySelector('h3').textContent.trim() === therapyName) {
                card.classList.remove('selected');
            }
        });

        this.renderSelectedTherapies();
        this.manager.showNotification('Therapy removed', 'info');
    }

    handleSaveTherapyAssignment() {
        if (!this.currentPatient) {
            this.manager.showNotification('No patient selected', 'error');
            return;
        }

        if (this.selectedTherapies.length === 0) {
            this.manager.showNotification('No therapies selected', 'error');
            return;
        }

        for (let therapy of this.selectedTherapies) {
            if (!therapy.sessions || therapy.sessions <= 0) {
                this.manager.showNotification(`Please enter number of sessions for ${therapy.name}`, 'error');
                return;
            }
            if (!therapy.duration) {
                this.manager.showNotification(`Please enter duration for ${therapy.name}`, 'error');
                return;
            }
        }

        const notes = document.getElementById('therapyNotes')?.value.trim() || '';

        const assignment = this.therapyMgr.addTherapyAssignment({
            patientId: this.currentPatient.id,
            patientName: this.currentPatient.name,
            patientAge: this.currentPatient.age,
            patientConstitution: this.currentPatient.constitution,
            therapies: [...this.selectedTherapies],
            notes: notes
        });

        this.manager.showNotification(
            `Therapy plan assigned to ${this.currentPatient.name}!`,
            'success'
        );

        this.handleCancelTherapyAssignment();
        this.renderRecentTherapyAssignments();
    }

    handleCancelTherapyAssignment() {
        this.currentPatient = null;
        this.selectedTherapies = [];

        document.querySelectorAll('.therapy-patient-item').forEach(item => {
            item.classList.remove('selected');
        });

        document.querySelectorAll('.therapy-card').forEach(card => {
            card.classList.remove('selected');
        });

        const builderPanel = document.getElementById('therapyBuilderPanel');
        if (builderPanel) {
            builderPanel.classList.add('disabled');
        }

        const patientHeader = document.getElementById('therapyPatientHeader');
        if (patientHeader) {
            patientHeader.style.display = 'none';
        }

        const notesField = document.getElementById('therapyNotes');
        if (notesField) notesField.value = '';

        this.renderSelectedTherapies();
    }

    openTherapyScheduleModal() {
        const modal = document.getElementById('therapyScheduleModal');
        if (modal) {
            // If patient is selected, pre-fill and make readonly
            if (this.currentPatient) {
                document.getElementById('schedulePatientName').value = this.currentPatient.name;
                document.getElementById('schedulePatientPhone').value = this.currentPatient.phone;
                document.getElementById('schedulePatientName').readOnly = true;
                document.getElementById('schedulePatientPhone').readOnly = true;
            } else {
                // Allow manual entry
                document.getElementById('schedulePatientName').value = '';
                document.getElementById('schedulePatientPhone').value = '';
                document.getElementById('schedulePatientName').readOnly = false;
                document.getElementById('schedulePatientPhone').readOnly = false;
            }

            const sessionDate = document.getElementById('sessionDate');
            if (sessionDate) {
                const today = new Date().toISOString().split('T')[0];
                sessionDate.value = today;
                sessionDate.min = today;
            }

            modal.classList.add('show');
        }
    }

    closeTherapyScheduleModal() {
        const modal = document.getElementById('therapyScheduleModal');
        const form = document.getElementById('therapyScheduleForm');

        if (modal) {
            modal.classList.remove('show');
        }
        if (form) {
            form.reset();
        }
    }

    handleTherapyScheduleSubmit(e) {
        e.preventDefault();

        const patientName = document.getElementById('schedulePatientName').value.trim();
        const patientPhone = document.getElementById('schedulePatientPhone').value.trim();
        const therapyType = document.getElementById('therapyType').value;
        const sessionDate = document.getElementById('sessionDate').value;
        const sessionTime = document.getElementById('sessionTime').value;
        const duration = document.getElementById('sessionDuration').value;
        const notes = document.getElementById('scheduleNotes').value.trim();

        if (!patientName || !patientPhone || !therapyType || !sessionDate || !sessionTime || !duration) {
            this.manager.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Find patient by name or phone
        let patient = this.currentPatient;
        if (!patient) {
            const allPatients = this.patientMgmt.getAllPatients();
            patient = allPatients.find(p =>
                p.name.toLowerCase() === patientName.toLowerCase() ||
                p.phone === patientPhone
            );
        }

        const [hours, minutes] = sessionTime.split(':');
        const hour = parseInt(hours);
        const time12 = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;

        // Create appointment
        const appointment = this.appointmentsManager.addAppointment({
            patientId: patient ? patient.id : Date.now(),
            patientName: patientName,
            patientPhone: patientPhone,
            appointmentType: `Therapy: ${therapyType}`,
            date: new Date(sessionDate),
            time: time12,
            status: 'scheduled',
            constitution: patient ? patient.constitution : '',
            notes: notes || `${therapyType} - Duration: ${duration}`
        });

        // Save therapy session
        this.therapyMgr.addTherapySession({
            patientId: patient ? patient.id : Date.now(),
            patientName: patientName,
            patientPhone: patientPhone,
            therapyType: therapyType,
            date: new Date(sessionDate),
            time: time12,
            duration: duration,
            notes: notes
        });

        this.closeTherapyScheduleModal();

        this.manager.showNotification(
            `Therapy session scheduled!\n${therapyType} for ${patientName}\n${new Date(sessionDate).toLocaleDateString()} at ${time12}`,
            'success'
        );

        // Update appointments view if active
        if (document.getElementById('appointmentsView').classList.contains('active')) {
            this.manager.appointmentHandlers.renderAppointmentsTimeline();
        }
    }

    renderRecentTherapyAssignments() {
        const historyGrid = document.getElementById('therapyAssignmentsHistory');
        if (!historyGrid) return;

        const assignments = this.therapyMgr.getRecentAssignments(10);

        if (assignments.length === 0) {
            historyGrid.innerHTML = `
                <div class="therapy-empty-state">
                    <p>No therapy assignments yet</p>
                </div>
            `;
            return;
        }

        historyGrid.innerHTML = '';

        assignments.forEach(assignment => {
            const card = document.createElement('div');
            card.className = 'therapy-assignment-card';

            const therapyNames = assignment.therapies.map(t => t.name.replace(/[🌿💧🌊👃🩸]/g, '').trim()).join(', ');

            card.innerHTML = `
                <div class="therapy-assignment-header">
                    <h4>${assignment.patientName}</h4>
                    <div class="therapy-assignment-header-actions">
                        <span class="therapy-status-badge ${assignment.status.toLowerCase()}">${assignment.status}</span>
                        <button class="btn-delete-therapy-assignment" data-id="${assignment.id}" title="Delete Assignment">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="therapy-assignment-details">
                    Age: ${assignment.patientAge} | ${assignment.patientConstitution}
                </div>
                <div class="therapy-assignment-therapies">
                    <strong>Therapies:</strong> ${therapyNames}
                </div>
                <div class="therapy-assignment-date">
                    ${new Date(assignment.date).toLocaleDateString()}
                </div>
            `;

            // Add click to view details (except on delete button)
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-delete-therapy-assignment')) {
                    this.showTherapyAssignmentDetails(assignment);
                }
            });

            // Delete button handler
            const deleteBtn = card.querySelector('.btn-delete-therapy-assignment');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeleteTherapyAssignment(assignment.id);
            });

            historyGrid.appendChild(card);
        });
    }

    handleDeleteTherapyAssignment(assignmentId) {
        if (confirm('Are you sure you want to delete this therapy assignment?')) {
            const success = this.therapyMgr.deleteAssignment(assignmentId);

            if (success) {
                this.manager.showNotification('Therapy assignment deleted', 'success');
                this.renderRecentTherapyAssignments();
            } else {
                this.manager.showNotification('Failed to delete assignment', 'error');
            }
        }
    }

    showTherapyAssignmentDetails(assignment) {
        let therapiesDetails = assignment.therapies.map(t =>
            `${t.name}: ${t.sessions} sessions over ${t.duration}`
        ).join('\n');

        alert(`THERAPY ASSIGNMENT DETAILS:

Patient: ${assignment.patientName}
Age: ${assignment.patientAge}
Constitution: ${assignment.patientConstitution}
Date: ${new Date(assignment.date).toLocaleDateString()}
Status: ${assignment.status}

THERAPIES:
${therapiesDetails}

NOTES:
${assignment.notes || 'No additional notes'}`);
    }
}