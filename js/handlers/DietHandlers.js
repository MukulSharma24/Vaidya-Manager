// DietHandlers.js
// Handles diet management

class DietHandlers {
    constructor(manager) {
        this.manager = manager;
        this.patientMgmt = manager.patientMgmt;
        this.dietMgr = manager.dietMgr;

        this.currentPatient = null;
        this.selectedConstitution = null;
        this.selectedSeason = 'Spring (Vasant)';
        this.currentMeals = [];
    }

    renderDietView() {
        this.renderDietPatientList();
        this.setupDietEventListeners();
        this.renderRecentDietPlans();
        this.renderDietPreview();
    }

    setupDietEventListeners() {
        // Patient search
        const dietPatientSearch = document.getElementById('dietPatientSearch');
        if (dietPatientSearch) {
            const newSearch = dietPatientSearch.cloneNode(true);
            dietPatientSearch.parentNode.replaceChild(newSearch, dietPatientSearch);

            newSearch.addEventListener('input', (e) => {
                this.renderDietPatientList(e.target.value);
            });
        }

        // Constitution buttons
        document.querySelectorAll('.constitution-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleConstitutionSelection(e);
            });
        });

        // Seasonal selector
        const seasonalSelector = document.querySelector('.seasonal-selector select');
        if (seasonalSelector) {
            seasonalSelector.addEventListener('change', (e) => {
                this.selectedSeason = e.target.value;
                this.renderDietPreview();
            });
        }

        // Create Diet Plan button
        const createDietPlanBtn = document.getElementById('createDietPlanBtn');
        if (createDietPlanBtn) {
            createDietPlanBtn.onclick = () => {
                this.handleCreateDietPlan();
            };
        }

        // Cancel Diet Plan button
        const cancelDietPlanBtn = document.getElementById('cancelDietPlanBtn');
        if (cancelDietPlanBtn) {
            cancelDietPlanBtn.onclick = () => {
                this.handleCancelDietPlan();
            };
        }
    }

    renderDietPatientList(searchQuery = '') {
        const patientList = document.getElementById('dietPatientList');
        if (!patientList) return;

        let patients = this.patientMgmt.search(searchQuery);

        if (patients.length === 0) {
            patientList.innerHTML = `
                <div class="diet-empty-state">
                    <div class="diet-empty-state-icon">👥</div>
                    <p>No patients found</p>
                </div>
            `;
            return;
        }

        patientList.innerHTML = '';

        patients.forEach(patient => {
            const patientItem = document.createElement('div');
            patientItem.className = 'diet-patient-item';
            patientItem.dataset.patientId = patient.id;

            patientItem.innerHTML = `
                <div class="diet-patient-name">${patient.name}</div>
                <div class="diet-patient-info">
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
        document.querySelectorAll('.diet-patient-item').forEach(item => {
            item.classList.remove('selected');
        });

        const selectedItem = document.querySelector(`[data-patient-id="${patient.id}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        this.currentPatient = patient;
        this.selectedConstitution = null;

        // Enable diet builder panel
        const builderPanel = document.getElementById('dietBuilderPanel');
        if (builderPanel) {
            builderPanel.classList.remove('disabled');
        }

        // Update patient header
        const patientHeader = document.getElementById('dietPatientHeader');
        const patientName = document.getElementById('dietPatientName');
        const patientDetails = document.getElementById('dietPatientDetails');

        if (patientHeader) patientHeader.style.display = 'block';
        if (patientName) patientName.textContent = patient.name;
        if (patientDetails) {
            patientDetails.innerHTML = `
                <span><strong>Age:</strong> ${patient.age}</span>
                <span><strong>Constitution:</strong> ${patient.constitution}</span>
                <span><strong>Phone:</strong> ${patient.phone}</span>
            `;
        }

        // Clear constitution selection
        document.querySelectorAll('.constitution-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        this.manager.showNotification(`Selected patient: ${patient.name}`, 'success');
    }

    handleConstitutionSelection(e) {
        if (!this.currentPatient) {
            this.manager.showNotification('Please select a patient first', 'warning');
            return;
        }

        const btn = e.target.closest('.constitution-btn');
        if (!btn) return;

        const constitution = btn.dataset.constitution;

        // Toggle selection
        document.querySelectorAll('.constitution-btn').forEach(b => {
            b.classList.remove('active');
        });

        btn.classList.add('active');
        this.selectedConstitution = constitution;

        this.renderDietPreview();
        this.manager.showNotification(`Selected constitution: ${constitution}`, 'success');
    }

    renderDietPreview() {
        const preview = document.getElementById('dietPreview');
        if (!preview) return;

        if (!this.selectedConstitution) {
            preview.innerHTML = `
                <div class="diet-empty-state">
                    <div class="diet-empty-state-icon">🥗</div>
                    <h4>No constitution selected</h4>
                    <p>Select a constitution to view diet recommendations</p>
                </div>
            `;
            return;
        }

        const dietPlans = {
            'vata': {
                morning: 'Warm water with ginger • Light breakfast with ghee • Cooked oatmeal',
                lunch: 'Cooked grains • Warm vegetables • Buttermilk • Warm soups',
                evening: 'Light dinner • Warm milk with turmeric • Avoid raw foods'
            },
            'pitta': {
                morning: 'Cool water • Fresh fruits • Coconut water • Light breakfast',
                lunch: 'Cooling grains • Fresh salads • Cucumber • Mint tea',
                evening: 'Light dinner • Cool milk • Sweet fruits • Avoid spicy foods'
            },
            'kapha': {
                morning: 'Warm water with honey • Light breakfast • Ginger tea',
                lunch: 'Light grains • Steamed vegetables • Spices • Warm soups',
                evening: 'Early light dinner • Herbal tea • Avoid dairy • Light foods'
            }
        };

        const plan = dietPlans[this.selectedConstitution];

        preview.innerHTML = `
            <h3>Diet Plan - ${this.selectedConstitution.charAt(0).toUpperCase() + this.selectedConstitution.slice(1)} Constitution</h3>
            <p class="season-info">Season: ${this.selectedSeason}</p>
            <div class="diet-schedule">
                <div class="meal-time">
                    <h4>Morning (6-8 AM)</h4>
                    <p>${plan.morning}</p>
                </div>
                <div class="meal-time">
                    <h4>Lunch (12-1 PM)</h4>
                    <p>${plan.lunch}</p>
                </div>
                <div class="meal-time">
                    <h4>Evening (6-7 PM)</h4>
                    <p>${plan.evening}</p>
                </div>
            </div>
        `;

        this.currentMeals = [
            { time: 'Morning (6-8 AM)', description: plan.morning },
            { time: 'Lunch (12-1 PM)', description: plan.lunch },
            { time: 'Evening (6-7 PM)', description: plan.evening }
        ];
    }

    handleCreateDietPlan() {
        if (!this.currentPatient) {
            this.manager.showNotification('Please select a patient', 'error');
            return;
        }

        if (!this.selectedConstitution) {
            this.manager.showNotification('Please select a constitution', 'error');
            return;
        }

        const notes = document.getElementById('dietNotes')?.value.trim() || '';

        const dietPlan = this.dietMgr.addDietPlan({
            patientId: this.currentPatient.id,
            patientName: this.currentPatient.name,
            patientAge: this.currentPatient.age,
            patientConstitution: this.currentPatient.constitution,
            constitution: this.selectedConstitution,
            season: this.selectedSeason,
            meals: this.currentMeals,
            notes: notes
        });

        this.manager.showNotification(
            `Diet plan created for ${this.currentPatient.name}!`,
            'success'
        );

        this.handleCancelDietPlan();
        this.renderRecentDietPlans();
    }

    handleCancelDietPlan() {
        this.currentPatient = null;
        this.selectedConstitution = null;
        this.currentMeals = [];

        // Clear patient selection
        document.querySelectorAll('.diet-patient-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Clear constitution selection
        document.querySelectorAll('.constitution-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Disable builder panel
        const builderPanel = document.getElementById('dietBuilderPanel');
        if (builderPanel) {
            builderPanel.classList.add('disabled');
        }

        const patientHeader = document.getElementById('dietPatientHeader');
        if (patientHeader) {
            patientHeader.style.display = 'none';
        }

        const notesField = document.getElementById('dietNotes');
        if (notesField) notesField.value = '';

        this.renderDietPreview();
    }

    renderRecentDietPlans() {
        const historyGrid = document.getElementById('dietPlansHistory');
        if (!historyGrid) return;

        const plans = this.dietMgr.getRecentDietPlans(10);

        if (plans.length === 0) {
            historyGrid.innerHTML = `
                <div class="diet-empty-state">
                    <p>No diet plans created yet</p>
                </div>
            `;
            return;
        }

        historyGrid.innerHTML = '';

        plans.forEach(plan => {
            const card = document.createElement('div');
            card.className = 'diet-plan-card';

            card.innerHTML = `
                <div class="diet-plan-header">
                    <h4>${plan.patientName}</h4>
                    <div class="diet-plan-header-actions">
                        <span class="diet-status-badge ${plan.status.toLowerCase()}">${plan.status}</span>
                        <button class="btn-delete-diet-plan" data-id="${plan.id}" title="Delete Plan">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="diet-plan-details">
                    Age: ${plan.patientAge} | ${plan.patientConstitution}
                </div>
                <div class="diet-plan-info">
                    <strong>Constitution:</strong> ${plan.constitution.charAt(0).toUpperCase() + plan.constitution.slice(1)}<br>
                    <strong>Season:</strong> ${plan.season}
                </div>
                <div class="diet-plan-date">
                    ${new Date(plan.date).toLocaleDateString()}
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-delete-diet-plan')) {
                    this.showDietPlanDetails(plan);
                }
            });

            const deleteBtn = card.querySelector('.btn-delete-diet-plan');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeleteDietPlan(plan.id);
            });

            historyGrid.appendChild(card);
        });
    }

    handleDeleteDietPlan(planId) {
        if (confirm('Are you sure you want to delete this diet plan?')) {
            const success = this.dietMgr.deleteDietPlan(planId);

            if (success) {
                this.manager.showNotification('Diet plan deleted', 'success');
                this.renderRecentDietPlans();
            } else {
                this.manager.showNotification('Failed to delete plan', 'error');
            }
        }
    }

    showDietPlanDetails(plan) {
        let mealsDetails = plan.meals.map(m =>
            `${m.time}:\n${m.description}`
        ).join('\n\n');

        alert(`DIET PLAN DETAILS:

Patient: ${plan.patientName}
Age: ${plan.patientAge}
Constitution: ${plan.patientConstitution}
Recommended For: ${plan.constitution.charAt(0).toUpperCase() + plan.constitution.slice(1)}
Season: ${plan.season}
Date: ${new Date(plan.date).toLocaleDateString()}
Status: ${plan.status}

MEAL PLAN:
${mealsDetails}

NOTES:
${plan.notes || 'No additional notes'}`);
    }
}