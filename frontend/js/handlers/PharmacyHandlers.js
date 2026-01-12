// PharmacyHandlers.js
// FULL HEIGHT RIGHT SIDE DRAWER WIZARD (STEP 1 → STEP 2)

class PharmacyHandlers {
    constructor(manager) {
        this.manager = manager;
        this.medicineDB = manager.medicineDB;

        this.currentWizardData = {};  // stores step 1 until step 2 finishes
    }

    // ======================================================================
    // BACKWARDS COMPATIBILITY
    // ======================================================================
    renderPharmacyManagement() {
        return this.renderPrescriptionView();
    }

    /* ======================================================================
       ENTRY POINT
    ====================================================================== */
    renderPrescriptionView() {
        this.renderMedicineSearchResults('');
        this.setupPharmacyEventListeners();
    }

    setupPharmacyEventListeners() {
        const addBtn = document.getElementById('addNewMedicineBtn');
        if (addBtn) {
            const btn = addBtn.cloneNode(true);
            addBtn.parentNode.replaceChild(btn, addBtn);
            btn.addEventListener('click', () => this.openMedicineWizard());
        }

        const searchInput = document.getElementById('pharmacyMedicineSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.renderMedicineSearchResults(e.target.value);
            });
        }
    }

    /* ======================================================================
       PREMIUM SLIDE-IN DRAWER WIZARD
    ====================================================================== */
    async openMedicineWizard() {
        let drawer = document.getElementById("medicineDrawer");

        if (!drawer) {
            drawer = document.createElement("div");
            drawer.id = "medicineDrawer";
            drawer.className = "drawer";

            drawer.innerHTML = `
                <div class="drawer-content">

                    <!-- HEADER -->
                    <div class="drawer-header">
                        <h2 id="drawerTitle">Add New Medicine</h2>
                        <button id="closeDrawerBtn" class="drawer-close">&times;</button>
                    </div>

                    <!-- STEPS -->
                    <div class="drawer-steps">
                        <div class="step active" id="step1Tab">1. Medicine Details</div>
                        <div class="step" id="step2Tab">2. Batch Details</div>
                    </div>

                    <!-- BODY -->
                    <div class="drawer-body" id="drawerBody">

                        <!-- STEP 1 -->
                        <div id="drawerStep1" class="step-pane">

                            <div class="form-group">
                                <label>Medicine Name *</label>
                                <input id="med_name" class="form-control" type="text" required>
                            </div>

                            <div class="form-group">
                                <label>Sanskrit Name</label>
                                <input id="med_sanskrit" class="form-control" type="text">
                            </div>

                            <div class="form-group">
                                <label>Category *</label>
                                <select id="med_category" class="form-control"></select>
                            </div>

                            <div class="form-group">
                                <label>Medicine Type *</label>
                                <select id="med_type" class="form-control"></select>
                            </div>

                            <div class="form-group">
                                <label>Dosage Strength *</label>
                                <input id="med_dosage" class="form-control" type="text">
                            </div>

                            <div class="form-group">
                                <label>Timing *</label>
                                <input id="med_timing" class="form-control" type="text">
                            </div>

                            <button id="goToStep2Btn" class="btn btn--primary drawer-nav-btn">Next →</button>
                        </div>

                        <!-- STEP 2 -->
                        <div id="drawerStep2" class="step-pane hidden">

                            <div class="form-group">
                                <label>Batch Number *</label>
                                <input id="batch_number" class="form-control" type="text">
                            </div>

                            <div class="form-group">
                                <label>Mfg Date</label>
                                <input id="batch_mfg" class="form-control" type="date">
                            </div>

                            <div class="form-group">
                                <label>Expiry Date *</label>
                                <input id="batch_expiry" class="form-control" type="date">
                            </div>

                            <div class="form-group">
                                <label>Purchase Rate (₹)</label>
                                <input id="batch_purchase" class="form-control" type="number">
                            </div>

                            <div class="form-group">
                                <label>Selling Rate (₹)</label>
                                <input id="batch_selling" class="form-control" type="number">
                            </div>

                            <div class="form-group">
                                <label>Quantity in Stock *</label>
                                <input id="batch_qty" class="form-control" type="number">
                            </div>

                            <button id="submitWizardBtn" class="btn btn--primary drawer-nav-btn">
                                Save Medicine ✓
                            </button>

                        </div>

                    </div>
                </div>
            `;

            document.body.appendChild(drawer);
        }

        drawer.classList.add("open");

        /* FIXED — ALWAYS REBIND BUTTONS */
        this.bindDrawerButtons(drawer);

        this.loadMetaDropdowns();

        /* ------------------------------
           NEW — RESET ALL FIELDS CLEAN
           ------------------------------ */
        this.resetWizardFields();
    }

    /* ======================================================================
       FIXED: ENSURE BUTTON EVENTS ALWAYS WORK
    ====================================================================== */
    bindDrawerButtons(drawer) {
        // Close button
        let closeBtn = drawer.querySelector("#closeDrawerBtn");
        if (closeBtn) {
            const clone = closeBtn.cloneNode(true);
            closeBtn.replaceWith(clone);
            clone.addEventListener("click", () => this.closeDrawer());
        }

        // Step 2 button
        let nextBtn = drawer.querySelector("#goToStep2Btn");
        if (nextBtn) {
            const clone = nextBtn.cloneNode(true);
            nextBtn.replaceWith(clone);
            clone.addEventListener("click", () => this.wizardNext());
        }

        // Submit button
        let submitBtn = drawer.querySelector("#submitWizardBtn");
        if (submitBtn) {
            const clone = submitBtn.cloneNode(true);
            submitBtn.replaceWith(clone);
            clone.addEventListener("click", () => this.submitWizard());
        }
    }

    /* ======================================================================
       LOAD CATEGORY + TYPE FROM BACKEND
    ====================================================================== */
    async loadMetaDropdowns() {
        const catSel = document.getElementById("med_category");
        const typeSel = document.getElementById("med_type");

        catSel.innerHTML = `<option value="">Loading...</option>`;
        typeSel.innerHTML = `<option value="">Loading...</option>`;

        const categories = await API.getMedicineCategories();
        const types = await API.getMedicineTypes();

        catSel.innerHTML = `<option value="">Select Category</option>` +
            categories.map(c => `<option value="${c.CategoryID}">${c.Category}</option>`).join("");

        typeSel.innerHTML = `<option value="">Select Type</option>` +
            types.map(t => `<option value="${t.MedicinesTypeID}">${t.MedicinesType}</option>`).join("");
    }

    /* ======================================================================
       DRAWER CLOSE
    ====================================================================== */
    closeDrawer() {
        const drawer = document.getElementById("medicineDrawer");
        if (drawer) drawer.classList.remove("open");
    }

    /* ======================================================================
       STEP NAVIGATION (1 → 2)
    ====================================================================== */
    wizardNext() {
        const name = document.getElementById("med_name").value.trim();
        const category = document.getElementById("med_category").value;
        const type = document.getElementById("med_type").value;
        const dosage = document.getElementById("med_dosage").value.trim();
        const timing = document.getElementById("med_timing").value.trim();

        if (!name || !category || !type || !dosage || !timing) {
            this.manager.showNotification("Please fill all required fields", "error");
            return;
        }

        this.currentWizardData = {
            name,
            sanskrit: document.getElementById("med_sanskrit").value.trim(),
            category,
            type,
            dosage,
            timing
        };

        document.getElementById("drawerStep1").classList.add("hidden");
        document.getElementById("drawerStep2").classList.remove("hidden");

        document.getElementById("step1Tab").classList.remove("active");
        document.getElementById("step2Tab").classList.add("active");
    }

    /* ======================================================================
       FINAL SUBMISSION → CALL /api/medicines/full
    ====================================================================== */
    async submitWizard() {
        const payload = {
            medicine_name: this.currentWizardData.name,
            Sanskrit_name: this.currentWizardData.sanskrit || null,
            brand_name: null,

            CategoryID: Number(this.currentWizardData.category),
            MedicinesTypeID: Number(this.currentWizardData.type),

            dosage_strength: this.currentWizardData.dosage,
            manufacturer: null,
            Timing: this.currentWizardData.timing,

            batch_number: document.getElementById("batch_number").value.trim(),
            mfg_date: document.getElementById("batch_mfg").value || null,
            expiry_date: document.getElementById("batch_expiry").value || null,
            purchase_rate: parseFloat(document.getElementById("batch_purchase").value) || 0,
            mrp_rate: 0,
            selling_rate: parseFloat(document.getElementById("batch_selling").value) || 0,
            quantity_in_stock: parseInt(document.getElementById("batch_qty").value) || 0,
            location_rack: null
        };

        if (!payload.batch_number || !payload.expiry_date || !payload.quantity_in_stock) {
            this.manager.showNotification("Please fill required batch fields", "error");
            return;
        }

        try {
            await API.createMedicineFull(payload);

            await this.medicineDB.loadFromBackend();
            this.renderMedicineSearchResults('');

            this.closeDrawer();
            this.manager.showNotification("Medicine added successfully!", "success");

        } catch (err) {
            console.error(err);
            this.manager.showNotification("Failed to save medicine", "error");
        }
    }

    /* ======================================================================
       RENDER MEDICINE LIST (UNCHANGED)
    ====================================================================== */
    renderMedicineSearchResults(query) {
        const medicines = this.medicineDB.search(query);
        let container = document.getElementById('medicineSearchResults');

        if (!container) {
            container = document.createElement('div');
            container.id = 'medicineSearchResults';
            document.getElementById('prescriptionView')?.appendChild(container);
        }

        container.className = 'medicines-grid';
        container.innerHTML = '';

        if (medicines.length === 0) {
            container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💊</div>
                <p>No medicines found</p>
            </div>`;
            return;
        }

        medicines.forEach(med => {
            const stockClass =
                med.stock === 0 ? 'low-stock' :
                    med.stock < 10 ? 'low-stock' :
                        'in-stock';

            const card = document.createElement('div');
            card.className = 'medicine-card';

            /* 🔥 CRITICAL: Attach full medicine object */
            card.dataset.medicineId = med.id;

            /* Click anywhere on card → update stock */
            card.addEventListener('click', () => {
                this.openStockUpdateModal(med);
            });


            card.innerHTML = `
            <div class="medicine-header">
                <h3 class="medicine-name">${med.name}</h3>
                <span class="stock-badge ${stockClass}">
                    ${med.stock === 0 ? 'Out' : med.stock < 10 ? 'Low' : 'In Stock'}
                </span>
            </div>

            <p class="medicine-meta">${med.category || 'General Medicine'}</p>

            <div class="medicine-details">
                <div class="medicine-detail-item">
                    <span class="medicine-detail-label">Dosage</span>
                    <span class="medicine-detail-value">${med.dosage || '-'}</span>
                </div>
                <div class="medicine-detail-item">
                    <span class="medicine-detail-label">Timing</span>
                    <span class="medicine-detail-value">${med.timing || '-'}</span>
                </div>
            </div>

            <div class="medicine-info">
                <div class="medicine-info-item">
                    <span class="medicine-info-label">Stock</span>
                    <span class="medicine-info-value ${med.stock < 10 ? 'stock-low' : 'stock-ok'}">
                        ${med.stock} units
                    </span>
                </div>
            </div>

            <div class="medicine-actions">
                <button class="btn btn-update-stock">Update Stock</button>
                <button class="btn btn--outline btn-remove-medicine">Remove</button>
            </div>
        `;

            /* UPDATE STOCK */
            card.querySelector('.btn-update-stock')
                .addEventListener('click', (e) => {
                    e.stopPropagation();       // 🔥 ADD THIS
                    this.openStockUpdateModal(med);
                });

            /* FRONTEND ONLY REMOVE */
            card.querySelector('.btn-remove-medicine')
                .addEventListener('click', (e) => {
                    e.stopPropagation();       // 🔥 ADD THIS

                    if (!confirm(`Remove "${med.name}" from list?`)) return;

                    this.medicineDB.markRemoved(med.id);

                    this.medicineDB.medicines =
                        this.medicineDB.medicines.filter(m => m.id !== med.id);

                    this.renderMedicineSearchResults(query);
                    this.manager.showNotification("Medicine removed", "success");


                    this.renderMedicineSearchResults(query);
                    this.manager.showNotification('Medicine removed', 'success');
                });

            container.appendChild(card);
        });
    }


    /* ======================================================================
       STOCK UPDATE MODAL (UNCHANGED)
    ====================================================================== */
    openStockUpdateModal(medicine) {
        let modal = document.getElementById('stockUpdateModal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'stockUpdateModal';
            modal.className = 'modal';

            modal.innerHTML = `
            <div class="modal-content stock-modal">
                <div class="modal-header">
                    <h2>Update Stock</h2>
                    <button class="modal-close" id="closeStockUpdateModalBtn">&times;</button>
                </div>

                <div class="modal-body stock-modal-body">
                    <div class="stock-info">
                        <strong id="stockMedicineName"></strong>
                        <span id="stockCurrentValue"></span>
                    </div>

                    <div class="form-group">
                        <label>New Stock Quantity</label>
                        <input type="number" id="newStockValue" class="form-control" min="0">
                    </div>

                    <div class="modal-footer stock-modal-footer">
                        <button class="btn btn--outline" id="cancelStockUpdateBtn">Cancel</button>
                        <button class="btn btn--primary" id="confirmStockUpdateBtn">Update</button>
                    </div>
                </div>
            </div>
        `;

            document.body.appendChild(modal);
        }

        /* Populate values */
        document.getElementById('stockMedicineName').textContent = medicine.name;
        document.getElementById('stockCurrentValue').textContent = `Current stock: ${medicine.stock} units`;
        document.getElementById('newStockValue').value = medicine.stock;

        /* 🔁 SAFE REBIND — CLOSE */
        const closeBtn = document.getElementById('closeStockUpdateModalBtn');
        const closeClone = closeBtn.cloneNode(true);
        closeBtn.replaceWith(closeClone);
        closeClone.addEventListener('click', () => this.closeStockUpdateModal());

        /* 🔁 SAFE REBIND — CANCEL */
        const cancelBtn = document.getElementById('cancelStockUpdateBtn');
        const cancelClone = cancelBtn.cloneNode(true);
        cancelBtn.replaceWith(cancelClone);
        cancelClone.addEventListener('click', () => this.closeStockUpdateModal());

        /* 🔁 SAFE REBIND — UPDATE */
        const updateBtn = document.getElementById('confirmStockUpdateBtn');
        const updateClone = updateBtn.cloneNode(true);
        updateBtn.replaceWith(updateClone);

        updateClone.addEventListener('click', () => {
            const newStock = parseInt(document.getElementById('newStockValue').value);

            if (isNaN(newStock) || newStock < 0) {
                this.manager.showNotification('Invalid stock value', 'error');
                return;
            }

            const med = this.medicineDB.medicines.find(m => m.id === medicine.id);

            if (!med) {
                this.manager.showNotification("Medicine not found", "error");
                return;
            }

            API.addMedicineStock(medicine.id, newStock)
                .then(async () => {
                    await this.medicineDB.loadFromBackend();
                    this.renderMedicineSearchResults('');
                    this.closeStockUpdateModal();
                    this.manager.showNotification("Stock updated successfully", "success");
                })
                .catch(() => {
                    this.manager.showNotification("Failed to update stock", "error");
                });


            this.manager.showNotification("Stock updated successfully", "success");

            this.closeStockUpdateModal();
            this.renderMedicineSearchResults('');
            this.manager.showNotification('Stock updated successfully', 'success');
        });

        modal.classList.add('show');
    }


    closeStockUpdateModal() {
        const modal = document.getElementById('stockUpdateModal');
        if (modal) modal.classList.remove('show');
    }

    /* ======================================================================
       NEW — RESET ALL INPUTS WHEN OPENING DRAWER
    ====================================================================== */
    resetWizardFields() {
        // STEP 1
        document.getElementById("med_name").value = "";
        document.getElementById("med_sanskrit").value = "";
        document.getElementById("med_category").value = "";
        document.getElementById("med_type").value = "";
        document.getElementById("med_dosage").value = "";
        document.getElementById("med_timing").value = "";

        // STEP 2
        document.getElementById("batch_number").value = "";
        document.getElementById("batch_mfg").value = "";
        document.getElementById("batch_expiry").value = "";
        document.getElementById("batch_purchase").value = "";
        document.getElementById("batch_selling").value = "";
        document.getElementById("batch_qty").value = "";

        // CLEAR SAVED DATA
        this.currentWizardData = {};

        // RESET UI STEPS
        document.getElementById("drawerStep1").classList.remove("hidden");
        document.getElementById("drawerStep2").classList.add("hidden");

        document.getElementById("step1Tab").classList.add("active");
        document.getElementById("step2Tab").classList.remove("active");
    }
}
