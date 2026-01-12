// js/handlers/PatientHandlers.js
// Handles all patient-related UI operations (backend-sync ready)

class PatientHandlers {
    constructor(manager) {
        this.manager = manager;
        this.patientMgmt = manager.patientMgmt;
        this.isEditing = false;
        this.editingId = null;
    }

    // Normalize gender values from backend or local input into standardized strings
    normalizeGender(value) {
        if (value === null || value === undefined) return 'Other';

        // If numeric (1,2 etc.) or numeric string
        if (typeof value === 'number' || (/^\d+$/.test(String(value).trim()))) {
            const n = parseInt(value, 10);
            if (n === 1) return 'Male';
            if (n === 2) return 'Female';
            return 'Other';
        }

        // String-based handling
        const s = String(value).trim().toLowerCase();
        if (!s) return 'Other';
        if (s === 'm' || s === 'male' || s === 'man' || s === 'boy') return 'Male';
        if (s === 'f' || s === 'female' || s === 'woman' || s === 'girl') return 'Female';

        // If server returns "GenderName" like "Male" or "Female" but weird case, capitalize
        const cap = s.charAt(0).toUpperCase() + s.slice(1);
        return cap || 'Other';
    }

    // Load existing patients from backend
    async loadFromBackend() {
        if (!window.API || typeof window.API.getPatients !== 'function') return;

        try {
            const rows = await window.API.getPatients();
            if (!Array.isArray(rows)) {
                console.warn('getPatients returned non-array:', rows);
                return;
            }

            let added = 0;
            rows.forEach(row => {
                const phone = row.PhoneNumber || '';
                // compute age from DateOfBirth if DOB present
                let age = 0;
                if (row.DateOfBirth) {
                    try {
                        const dob = new Date(row.DateOfBirth);
                        const now = new Date();
                        let years = now.getFullYear() - dob.getFullYear();
                        const m = now.getMonth() - dob.getMonth();
                        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;
                        age = years;
                    } catch (e) {
                        age = row.Age || 0;
                    }
                } else {
                    age = row.Age || 0;
                }

                // avoid duplicates by phone or server id
                if (phone && this.patientMgmt.getPatientByPhone && this.patientMgmt.getPatientByPhone(phone)) return;
                if (row.PatientID && this.patientMgmt.getPatientByDbId && this.patientMgmt.getPatientByDbId(row.PatientID)) return;

                const address = [row.AddressLine1, row.AddressLine2].filter(Boolean).join(', ') || (row.Address || '');

                // normalize gender robustly (check different possible fields: Gender, GenderName, GenderID, GenderId)
                const rawGender = row.Gender ?? row.GenderName ?? row.GenderID ?? row.GenderId ?? row.GenderIdNumber ?? null;
                const gender = this.normalizeGender(rawGender);

                const patient = this.patientMgmt.addPatient({
                    name: [row.FirstName, row.LastName].filter(Boolean).join(' ') || 'Unknown',
                    age: age || 0,
                    gender: gender,
                    phone,
                    email: row.Email || '',
                    constitution: row.ConstitutionTypeName || 'Not assessed',
                    address: address,
                    DateOfBirth: row.DateOfBirth || null,
                    AddressLine1: row.AddressLine1 || null,
                    AddressLine2: row.AddressLine2 || null,
                    CityName: row.CityName || row.City || null,
                    StateName: row.StateName || row.State || null,
                    PostalCode: row.Pincode || row.PostalCode || null,
                    Country: row.Country || null,
                    // map BloodGroupName and BloodGroupID if available
                    BloodGroup: row.BloodGroupName || null,
                    BloodGroupID: typeof row.BloodGroupID !== 'undefined' ? row.BloodGroupID : null
                });

                // attach db id if present
                if (patient && row.PatientID) {
                    patient.dbId = row.PatientID;
                }

                added++;
            });

            this.updateTotalPatientsCount();
            this.renderPatientsGrid();
            console.log(`✅ Loaded ${added} patients from backend (total local: ${this.patientMgmt.getTotalPatients ? this.patientMgmt.getTotalPatients() : 'N/A'})`);
        } catch (err) {
            console.error('Failed to sync patients from backend', err);
        }
    }

    updateTotalPatientsCount() {
        const totalPatientsElement = document.getElementById('totalPatientsCount');
        if (totalPatientsElement) {
            const total = (this.patientMgmt.getTotalPatients && typeof this.patientMgmt.getTotalPatients === 'function')
                ? this.patientMgmt.getTotalPatients()
                : (this.patientMgmt.getAllPatients ? this.patientMgmt.getAllPatients().length : 0);
            totalPatientsElement.textContent = total;
        }
    }

    // HELPER: Get Emoji based on Gender
    getAvatarForGender(gender) {
        if (!gender) return '❓';

        const g = gender.toLowerCase();

        if (g === 'male' || g === 'm' || g === 'boy' || g === 'man') return '👨🏼';
        if (g === 'female' || g === 'f' || g === 'girl' || g === 'woman') return '👩🏻';

        // Default / Other
        return '❓';
    }

    renderPatientsGrid(searchQuery = '') {
        const patientsGrid = document.getElementById('patientsGrid');
        if (!patientsGrid) return;

        const patients = this.patientMgmt.search ? this.patientMgmt.search(searchQuery) : (this.patientMgmt.getAllPatients ? this.patientMgmt.getAllPatients() : []);

        patientsGrid.innerHTML = '';

        if (!patients || patients.length === 0) {
            patientsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p>No patients found</p>
                </div>
            `;
            return;
        }

        patients.forEach(patient => {
            const patientCard = document.createElement('div');
            patientCard.className = 'patient-card';

            const avatar = this.getAvatarForGender(patient.gender);
            const lastVisit = this.patientMgmt.formatLastVisit ? this.patientMgmt.formatLastVisit(patient.lastVisit) : 'Never';

            patientCard.innerHTML = `
                <div class="patient-avatar">${avatar}</div>
                <div class="patient-info">
                    <h4>${patient.name}</h4>
                    <p>Age: ${patient.age || 0} • ${patient.constitution || 'Not assessed'}</p>
                    <p>${patient.treatments || 0} Treatment${patient.treatments !== 1 ? 's' : ''}</p>
                    <p>Last Visit: ${lastVisit}</p>
                    <p>${patient.phone || ''}</p>
                </div>
                <div class="patient-actions">
                    <button class="btn btn--sm btn--primary" data-action="schedule" data-patient-id="${patient.id}">Schedule</button>
                    <button class="btn btn--sm btn--edit" data-action="edit" data-patient-id="${patient.id}">Edit</button>
                    <button class="btn btn--outline btn--sm" data-action="view" data-patient-id="${patient.id}">View</button>
                    <button class="btn btn--danger btn--sm" data-action="remove" data-patient-id="${patient.id}">Remove</button>
                </div>
            `;

            const scheduleBtn = patientCard.querySelector('[data-action="schedule"]');
            const editBtn = patientCard.querySelector('[data-action="edit"]');
            const viewBtn = patientCard.querySelector('[data-action="view"]');
            const removeBtn = patientCard.querySelector('[data-action="remove"]');

            if (scheduleBtn) {
                scheduleBtn.addEventListener('click', () => {
                    if (this.manager && this.manager.appointmentHandlers) {
                        this.manager.appointmentHandlers.openAppointmentModal(patient);
                    }
                });
            }

            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openPatientModal(patient); // Pass patient data for editing
                });
            }

            if (viewBtn) {
                viewBtn.addEventListener('click', () => {
                    this.showPatientProfile(patient.id);
                });
            }

            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.confirmAndRemovePatient(patient.id);
                });
            }

            patientsGrid.appendChild(patientCard);
        });

        const addPatientBtn = document.getElementById('addNewPatientBtn');
        if (addPatientBtn) {
            const newBtn = addPatientBtn.cloneNode(true);
            addPatientBtn.parentNode.replaceChild(newBtn, addPatientBtn);

            newBtn.addEventListener('click', () => {
                this.openPatientModal(); // No argument = Add Mode
            });
        }
    }

    showPatientProfile(patientId) {
        const patient = this.patientMgmt.getPatientById ? this.patientMgmt.getPatientById(patientId) : null;
        if (patient) {
            this.manager.showNotification(
                `Patient Profile:\n${patient.name}\nGender: ${patient.gender}\nAge: ${patient.age}\nConstitution: ${patient.constitution}\nPhone: ${patient.phone}\nEmail: ${patient.email}\nAddress: ${patient.address}`,
                'info'
            );
        }
    }

    // Confirm & remove helper
    async confirmAndRemovePatient(id) {
        const patient = this.patientMgmt.getPatientById ? this.patientMgmt.getPatientById(id) : null;
        if (!patient) return;

        const confirmed = confirm(`Are you sure you want to remove "${patient.name}"?`);
        if (!confirmed) return;

        // Try delete from backend if dbId present
        if (patient.dbId && window.API && typeof window.API.deletePatient === 'function') {
            try {
                await window.API.deletePatient(patient.dbId);
                console.log('🗑 Deleted patient from backend:', patient.dbId);
            } catch (err) {
                console.error('Failed to delete patient from backend:', err);
                // continue to remove locally regardless, but inform user
                this.manager.showNotification('Warning: backend delete failed, removed locally.', 'warning');
            }
        }

        // Remove from local model
        if (Array.isArray(this.patientMgmt.patients)) {
            this.patientMgmt.patients = this.patientMgmt.patients.filter(p => p.id !== id);
        } else if (this.patientMgmt.getAllPatients && typeof this.patientMgmt.getAllPatients === 'function') {
            // fallback if you use different storage
            const all = this.patientMgmt.getAllPatients();
            const remaining = all.filter(p => p.id !== id);
            // try to replace internal array if available
            if (this.patientMgmt.patients) this.patientMgmt.patients = remaining;
        }

        this.updateTotalPatientsCount();
        this.renderPatientsGrid();
        this.manager.showNotification('Patient removed successfully!', 'success');
    }

    // ---------------------------
    // New helper: load blood groups into select
    // ---------------------------
    async loadBloodGroupsIntoSelect() {
        const sel = document.getElementById('patientBloodGroup');
        if (!sel) return;
        // Keep placeholder as first option
        sel.innerHTML = '<option value="">Select</option>';
        try {
            let rows = null;
            if (window.API && typeof window.API.getMetaBloodGroups === 'function') {
                rows = await window.API.getMetaBloodGroups();
            } else {
                // direct fetch fallback
                const res = await fetch('/api/meta/bloodgroups');
                if (!res.ok) return;
                rows = await res.json();
            }
            if (!Array.isArray(rows)) return;
            rows.forEach(bg => {
                const opt = document.createElement('option');
                opt.value = String(bg.BloodGroupID);
                opt.textContent = bg.BloodGroupName;
                sel.appendChild(opt);
            });
        } catch (err) {
            console.warn('Could not load blood groups', err);
        }
    }

    // Handles Opening Modal for both ADD and EDIT
    openPatientModal(patientToEdit = null) {
        let modal = document.getElementById('patientModal');

        // Check mode
        if (patientToEdit) {
            this.isEditing = true;
            this.editingId = patientToEdit.id;
        } else {
            this.isEditing = false;
            this.editingId = null;
        }

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'patientModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="patientModalTitle">Add New Patient</h2>
                        <button class="modal-close" id="closePatientModalBtn">&times;</button>
                    </div>
                    <form id="patientForm" class="modal-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="patientFullName" class="form-label">Full Name *</label>
                                <input type="text" id="patientFullName" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="patientDOB" class="form-label">Date of Birth</label>
                                <input type="date" id="patientDOB" class="form-control" placeholder="YYYY-MM-DD">
                            </div>
                            <div class="form-group">
                                <label for="patientAge" class="form-label">Age *</label>
                                <input type="number" id="patientAge" class="form-control" min="0" max="150" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="patientGender" class="form-label">Gender *</label>
                                <select id="patientGender" class="form-control" required>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Phone Number *</label>
                                <div style="display:flex;gap:8px;">
                                    <select id="phoneCountryCode" class="form-control" style="max-width:120px;">
                                        <option value="+91">+91</option>
                                        <option value="+1">+1</option>
                                        <option value="+44">+44</option>
                                        <option value="+61">+61</option>
                                    </select>
                                    <input type="tel" id="patientPhoneNumber" class="form-control" placeholder="9876543210" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="patientBloodGroup" class="form-label">Blood Group</label>
                                <select id="patientBloodGroup" class="form-control">
                                    <option value="">Select</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="patientEmail" class="form-label">Email</label>
                            <input type="email" id="patientEmail" class="form-control" placeholder="email@example.com">
                        </div>

                        <div class="form-row">
                            <div class="form-group" style="flex:1;">
                                <label for="patientAddressLine1" class="form-label">Address Line 1</label>
                                <input type="text" id="patientAddressLine1" class="form-control" placeholder="House no, Street">
                            </div>
                            <div class="form-group" style="flex:1;">
                                <label for="patientAddressLine2" class="form-label">Address Line 2</label>
                                <input type="text" id="patientAddressLine2" class="form-control" placeholder="Locality / Landmark">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group" style="max-width:180px;">
                                <label for="patientPostal" class="form-label">Postal Code</label>
                                <input type="text" id="patientPostal" class="form-control" placeholder="560001">
                            </div>
                            <div class="form-group" style="flex:1;">
                                <label for="patientCity" class="form-label">City</label>
                                <input type="text" id="patientCity" class="form-control">
                            </div>
                            <div class="form-group" style="flex:1;">
                                <label for="patientState" class="form-label">State</label>
                                <input type="text" id="patientState" class="form-control">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="patientConstitution" class="form-label">Constitution Type</label>
                            <select id="patientConstitution" class="form-control">
                                <option value="Not assessed">Not assessed yet</option>
                                <option value="Vata">Vata</option>
                                <option value="Pitta">Pitta</option>
                                <option value="Kapha">Kapha</option>
                                <option value="Vata-Pitta">Vata-Pitta</option>
                                <option value="Pitta-Kapha">Pitta-Kapha</option>
                                <option value="Vata-Kapha">Vata-Kapha</option>
                                <option value="Tridosha">Tridosha</option>
                            </select>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn--outline" id="cancelPatientModalBtn">Cancel</button>
                            <button type="submit" class="btn btn--primary" id="savePatientBtn">Add Patient</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            const closeBtn = modal.querySelector('#closePatientModalBtn');
            const cancelBtn = modal.querySelector('#cancelPatientModalBtn');
            const form = modal.querySelector('#patientForm');

            closeBtn.addEventListener('click', () => this.closePatientModal());
            cancelBtn.addEventListener('click', () => this.closePatientModal());

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closePatientModal();
                }
            });

            form.addEventListener('submit', (e) => this.handlePatientSubmit(e));

            // --- extra helpers for new inputs ---
            // DOB -> auto fill Age
            const dobInput = modal.querySelector('#patientDOB');
            const ageInput = modal.querySelector('#patientAge');
            if (dobInput && ageInput) {
                dobInput.addEventListener('change', () => {
                    const v = dobInput.value;
                    if (!v) return;
                    const dob = new Date(v);
                    if (isNaN(dob.getTime())) return;
                    const now = new Date();
                    let years = now.getFullYear() - dob.getFullYear();
                    const m = now.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;
                    ageInput.value = Math.max(0, years);
                });
            }

            // Postal -> try backend lookup for city/state
            const postalInput = modal.querySelector('#patientPostal');
            const cityInput = modal.querySelector('#patientCity');
            const stateInput = modal.querySelector('#patientState');

            if (postalInput) {
                postalInput.addEventListener('blur', async () => {
                    const p = (postalInput.value || '').trim();
                    if (!p) return;
                    try {
                        if (window.API && typeof window.API.getPostalByPincode === 'function') {
                            const res = await window.API.getPostalByPincode(p);
                            let entry = null;
                            if (Array.isArray(res)) entry = res[0];
                            else entry = res;
                            if (entry) {
                                if (entry.CityName) cityInput.value = entry.CityName;
                                if (entry.StateName) stateInput.value = entry.StateName;
                                // store ids on inputs for submit
                                postalInput.dataset.postalid = entry.PostalID || entry.PostalId || entry.PostalID;
                                cityInput.dataset.cityid = entry.CityID || entry.CityId || entry.CityID;
                                stateInput.dataset.stateid = entry.StateID || entry.StateId || entry.StateID;
                            }
                        }
                    } catch (err) {
                        console.warn('Postal lookup failed', err);
                    }
                });
            }
        }

        // Update Modal Text based on mode
        const modalTitle = document.getElementById('patientModalTitle');
        const saveBtn = document.getElementById('savePatientBtn');
        const form = document.getElementById('patientForm');

        // Ensure blood groups are loaded before we fill values (we call without await to avoid blocking UI,
        // but in edit mode we set values after calling it to let it populate)
        this.loadBloodGroupsIntoSelect();

        if (this.isEditing && patientToEdit) {
            modalTitle.textContent = "Edit Patient Details";
            saveBtn.textContent = "Update Patient";

            // Fill Data
            document.getElementById('patientFullName').value = patientToEdit.name || '';
            document.getElementById('patientAge').value = patientToEdit.age || '';
            if (patientToEdit.DateOfBirth) {
                // format DOB as YYYY-MM-DD if possible
                try {
                    const d = new Date(patientToEdit.DateOfBirth);
                    if (!isNaN(d.getTime())) {
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        document.getElementById('patientDOB').value = `${d.getFullYear()}-${mm}-${dd}`;
                    }
                } catch (e) { /* ignore */ }
            }

            // Normalize gender when filling the form so select shows correctly
            const normalizedGender = this.normalizeGender(patientToEdit.gender);
            document.getElementById('patientGender').value = normalizedGender || 'Other';

            // Phone may be stored with country code already
            let p = patientToEdit.phone || '';
            if (p.startsWith('+')) {
                // try to split country code and number
                const match = p.match(/^(\+\d{1,3})(.*)$/);
                if (match) {
                    document.getElementById('phoneCountryCode').value = match[1];
                    document.getElementById('patientPhoneNumber').value = match[2].replace(/[^0-9]/g,'');
                } else {
                    document.getElementById('patientPhoneNumber').value = p;
                }
            } else {
                document.getElementById('patientPhoneNumber').value = p;
            }

            document.getElementById('patientEmail').value = patientToEdit.email || '';
            document.getElementById('patientConstitution').value = patientToEdit.constitution || 'Not assessed';
            document.getElementById('patientAddressLine1').value = patientToEdit.AddressLine1 || patientToEdit.address || '';
            document.getElementById('patientAddressLine2').value = patientToEdit.AddressLine2 || '';
            document.getElementById('patientCity').value = patientToEdit.CityName || '';
            document.getElementById('patientState').value = patientToEdit.StateName || '';
            document.getElementById('patientPostal').value = patientToEdit.PostalCode || '';

            // Set blood group selection using ID when possible; fallback to text match
            const bgSel = document.getElementById('patientBloodGroup');
            if (bgSel) {
                if (typeof patientToEdit.BloodGroupID !== 'undefined' && patientToEdit.BloodGroupID !== null) {
                    // set by id (stringified)
                    bgSel.value = String(patientToEdit.BloodGroupID);
                } else if (patientToEdit.BloodGroup) {
                    // fallback: try to choose option by text (case-insensitive)
                    for (const opt of Array.from(bgSel.options)) {
                        if (opt.textContent.trim().toLowerCase() === String(patientToEdit.BloodGroup).trim().toLowerCase()) {
                            bgSel.value = opt.value;
                            break;
                        }
                    }
                }
            }
        } else {
            modalTitle.textContent = "Add New Patient";
            saveBtn.textContent = "Add Patient";
            form.reset();
        }

        modal.classList.add('show');
    }

    closePatientModal() {
        const modal = document.getElementById('patientModal');
        const form = document.getElementById('patientForm');

        if (modal) {
            modal.classList.remove('show');
        }

        if (form) {
            form.reset();
        }

        // Reset mode
        this.isEditing = false;
        this.editingId = null;
    }

    async handlePatientSubmit(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('savePatientBtn');
        if (submitBtn) submitBtn.disabled = true;

        const fullName = (document.getElementById('patientFullName').value || '').trim();
        const nameParts = fullName.split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

        const dobVal = (document.getElementById('patientDOB').value || '').trim();
        const ageInputVal = document.getElementById('patientAge').value || '0';
        const age = parseInt(ageInputVal, 10) || 0;
        const gender = (document.getElementById('patientGender').value || 'Other').trim();
        const countryCode = (document.getElementById('phoneCountryCode').value || '+91').trim();
        const phoneRaw = (document.getElementById('patientPhoneNumber').value || '').trim();
        const phone = phoneRaw.startsWith('+') ? phoneRaw : `${countryCode}${phoneRaw}`;
        const email = (document.getElementById('patientEmail').value || '').trim();
        const constitution = (document.getElementById('patientConstitution').value || 'Not assessed').trim();
        const address1 = (document.getElementById('patientAddressLine1').value || '').trim();
        const address2 = (document.getElementById('patientAddressLine2').value || '').trim();
        const postal = (document.getElementById('patientPostal').value || '').trim();
        const city = (document.getElementById('patientCity').value || '').trim();
        const state = (document.getElementById('patientState').value || '').trim();

        // read BloodGroupID from select value (value is numeric id)
        const bgValue = document.getElementById('patientBloodGroup').value;
        const BloodGroupID = bgValue ? parseInt(bgValue, 10) : null;
        // and store the textual name for UI
        const bgSelectEl = document.getElementById('patientBloodGroup');
        const BloodGroupName = (bgSelectEl && bgSelectEl.selectedOptions && bgSelectEl.selectedOptions[0]) ? bgSelectEl.selectedOptions[0].textContent : null;

        if (!fullName || !age || !phone) {
            this.manager.showNotification('Please fill in all required fields (name, age, phone)', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        // Duplicate check for Add
        if (!this.isEditing) {
            const existingPatient = this.patientMgmt.getPatientByPhone ? this.patientMgmt.getPatientByPhone(phone) : null;
            if (existingPatient) {
                this.manager.showNotification('A patient with this phone number already exists!', 'error');
                if (submitBtn) submitBtn.disabled = false;
                return;
            }
        }

        // helper to map gender to id (server expects numeric GenderID)
        function mapGenderToId(g) {
            if (!g) return 3;
            const gg = String(g).toLowerCase();
            if (gg === 'male' || gg === 'm') return 1;
            if (gg === 'female' || gg === 'f') return 2;
            return 3; // other / unspecified
        }

        // retrieve dataset ids if postal lookup stored them
        const postalInputEl = document.getElementById('patientPostal');
        const cityEl = document.getElementById('patientCity');
        const stateEl = document.getElementById('patientState');

        if (this.isEditing) {
            // Update local model
            const success = this.patientMgmt.updatePatient ? this.patientMgmt.updatePatient(this.editingId, {
                name: fullName,
                age,
                gender,
                phone,
                email,
                constitution,
                address: `${address1}${address2 ? ', ' + address2 : ''}`,
                BloodGroup: BloodGroupName || null,
                BloodGroupID: BloodGroupID || null,
                DateOfBirth: dobVal || null,
                AddressLine1: address1 || null,
                AddressLine2: address2 || null,
                CityName: city || null,
                StateName: state || null,
                PostalCode: postal || null,
                Country: countryCode || null
            }) : false;

            // Also attempt to update backend if dbId present on local patient
            const local = this.patientMgmt.getPatientById ? this.patientMgmt.getPatientById(this.editingId) : null;
            if (local && local.dbId && window.API && typeof window.API.updatePatient === 'function') {
                const payload = {
                    FirstName: firstName,
                    LastName: lastName || null,
                    DateOfBirth: dobVal || null,
                    Age: isNaN(age) ? 0 : age,
                    GenderID: mapGenderToId(gender),
                    PhoneNumber: phone || null,
                    Email: email || null,
                    AddressLine1: address1 || null,
                    AddressLine2: address2 || null,
                    // include dataset ids if available else pass null
                    CityID: cityEl && cityEl.dataset.cityid ? parseInt(cityEl.dataset.cityid, 10) : null,
                    StateID: stateEl && stateEl.dataset.stateid ? parseInt(stateEl.dataset.stateid, 10) : null,
                    PostalID: postalInputEl && postalInputEl.dataset.postalid ? parseInt(postalInputEl.dataset.postalid, 10) : null,
                    Country: countryCode || null,
                    BloodGroupID: BloodGroupID || null,
                    ConstitutionTypeID: constitution || null
                };
                try {
                    await window.API.updatePatient(local.dbId, payload);
                } catch (err) {
                    console.warn('Backend update failed (patient)', err);
                    // it's ok — server may ignore unknown fields if not implemented
                }
            }

            if (success) this.manager.showNotification('Patient updated successfully!', 'success');
            else this.manager.showNotification('Error updating patient.', 'error');

            if (submitBtn) submitBtn.disabled = false;
        } else {
            // CREATE: call backend and then local add
            let dbPatientId = null;
            try {
                if (window.API && typeof window.API.createPatient === 'function') {
                    const payload = {
                        FirstName: firstName,
                        LastName: lastName || null,
                        DateOfBirth: dobVal || null,
                        Age: isNaN(age) ? 0 : age,
                        GenderID: mapGenderToId(gender),
                        PhoneNumber: phone || null,
                        Email: email || null,
                        AddressLine1: address1 || null,
                        AddressLine2: address2 || null,
                        CityID: cityEl && cityEl.dataset.cityid ? parseInt(cityEl.dataset.cityid, 10) : null,
                        StateID: stateEl && stateEl.dataset.stateid ? parseInt(stateEl.dataset.stateid, 10) : null,
                        PostalID: postalInputEl && postalInputEl.dataset.postalid ? parseInt(postalInputEl.dataset.postalid, 10) : null,
                        Country: countryCode || null,
                        BloodGroupID: BloodGroupID || null,
                        ConstitutionTypeID: constitution || null,
                        IsActive: 1
                    };

                    console.log('POST /api/patients payload:', payload);
                    const res = await window.API.createPatient(payload);
                    console.log('createPatient response:', res);

                    if (res && (res.PatientID || res.patientId || res.id)) {
                        dbPatientId = res.PatientID || res.patientId || res.id;
                    }
                } else {
                    console.warn('window.API.createPatient not available');
                }
            } catch (err) {
                console.error('Error creating patient in backend', err);
                if (err && err.body) {
                    const msg = (err.body.error || err.body.message || JSON.stringify(err.body));
                    this.manager.showNotification(`Server error: ${msg}`, 'error');
                } else {
                    this.manager.showNotification('Could not save patient to server (saved locally)', 'warning');
                }
            }

            // Local add
            const newPatient = this.patientMgmt.addPatient ? this.patientMgmt.addPatient({
                name: fullName,
                age,
                gender,
                phone,
                email,
                constitution,
                address: `${address1}${address2 ? ', ' + address2 : ''}`,
                BloodGroup: BloodGroupName || null,
                BloodGroupID: BloodGroupID || null,
                DateOfBirth: dobVal || null,
                AddressLine1: address1 || null,
                AddressLine2: address2 || null,
                CityName: city || null,
                StateName: state || null,
                PostalCode: postal || null,
                Country: countryCode || null
            }) : null;

            if (newPatient && dbPatientId != null) newPatient.dbId = dbPatientId;

            this.manager.showNotification(`Patient ${fullName} added successfully!`, 'success');
            if (submitBtn) submitBtn.disabled = false;
        }

        this.closePatientModal();
        this.updateTotalPatientsCount();
        this.renderPatientsGrid();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatientHandlers;
}
