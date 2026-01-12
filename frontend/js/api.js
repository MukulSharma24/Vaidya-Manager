// js/api.js
const API_BASE = 'http://localhost:4001';

/* -------------------------------------------------------
   SINGLE SOURCE OF TRUTH — apiFetch (JSON SAFE)
-------------------------------------------------------- */
async function apiFetch(path, opts = {}) {
    const url = `${API_BASE}${path}`;
    const defaults = { headers: {} };
    const options = Object.assign({}, defaults, opts);

    // ✅ AUTO JSON SERIALIZE
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        options.body = JSON.stringify(options.body);
        options.headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, options);

    if (!res.ok) {
        const text = await res.text();
        let parsed;
        try { parsed = JSON.parse(text); } catch { parsed = text; }

        console.error("API ERROR RESPONSE:", parsed);

        const err = new Error(`API ${res.status} ${res.statusText}`);
        err.status = res.status;
        err.body = parsed;
        throw err;
    }

    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
}

/* -------------------------------------------------------
   GLOBAL API OBJECT
-------------------------------------------------------- */
window.API = {

    /* PATIENTS */
    getPatients: () => apiFetch('/api/patients'),
    getPatient: (id) => apiFetch(`/api/patients/${id}`),
    createPatient: (payload) => apiFetch('/api/patients', { method: 'POST', body: payload }),
    updatePatient: (id, payload) => apiFetch(`/api/patients/${id}`, { method: 'PUT', body: payload }),
    deletePatient: (id) => apiFetch(`/api/patients/${id}`, { method: 'DELETE' }),

    /* STAFF */
    getStaff: () => apiFetch('/api/staff'),
    createStaff: (payload) => apiFetch('/api/staff', { method: 'POST', body: payload }),
    updateStaff: (id, payload) => apiFetch(`/api/staff/${id}`, { method: 'PUT', body: payload }),
    deleteStaff: (id) => apiFetch(`/api/staff/${id}`, { method: 'DELETE' }),

    /* PHARMACY */
    getMedicineCategories: () => apiFetch('/api/medicine-categories'),
    getMedicineTypes: () => apiFetch('/api/medicine-types'),
    getMedicines: () => apiFetch('/api/medicines'),

    createMedicineFull: (payload) =>
        apiFetch('/api/medicines/full', {
            method: 'POST',
            body: payload
        }),

    addMedicineStock: (medicineId, quantity) =>
        apiFetch(`/api/medicines/${medicineId}/add-stock`, {
            method: 'POST',
            body: { quantity }
        }),

    /* PRESCRIPTIONS */
    getPrescriptions: () => apiFetch('/api/prescriptions'),
    createPrescription: (payload) =>
        apiFetch('/api/prescriptions', {
            method: 'POST',
            body: payload
        }),

    /* THERAPY */
    createTherapySession: (payload) =>
        apiFetch('/api/therapysessions', {
            method: 'POST',
            body: payload
        }),

    /* META */
    getDesignations: () => apiFetch('/api/meta/designations'),
    getDepartments: () => apiFetch('/api/meta/departments'),
    getMetaBloodGroups: () => apiFetch('/api/meta/bloodgroups'),

    /* HEALTH */
    getHealth: () => apiFetch('/api/health'),

    /* APPOINTMENTS */
    getAppointments: () => apiFetch('/api/appointments'),

    createAppointment: (payload) =>
        apiFetch('/api/appointments', {
            method: 'POST',
            body: payload
        }),
};
