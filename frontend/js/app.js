// js/app.js
// Main Application Initialization

document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------
    // CREATE MAIN APPLICATION MANAGER
    // -------------------------------------------
    window.svm = new ShajagVaidyaManager();
    window.app = window.svm;

    console.log('Shajag Vaidya Manager initialized successfully');
    console.log('Patient Management, Appointments & Medicine Stock Management system ready');

    // -------------------------------------------
    // LOAD MEDICINES BEFORE PHARMACY UI SHOWS
    // -------------------------------------------
    if (window.svm && window.svm.medicineDB && typeof window.svm.medicineDB.loadFromBackend === "function") {
        window.svm.medicineDB.loadFromBackend().then(() => {
            console.log("✅ Medicines loaded from backend");

            if (
                window.svm.pharmacyHandlers &&
                typeof window.svm.pharmacyHandlers.renderPharmacy === "function"
            ) {
                window.svm.pharmacyHandlers.renderPharmacy();
                window.svm.pharmacyHandlers.setupPharmacyEventListeners();
            }
        });
    }

    // -------------------------------------------
    // LOAD PATIENTS FROM BACKEND
    // -------------------------------------------
    if (
        window.API &&
        window.svm &&
        window.svm.patientHandlers &&
        typeof window.svm.patientHandlers.loadFromBackend === 'function'
    ) {
        window.svm.patientHandlers.loadFromBackend();
    }

    // -------------------------------------------
    // LOAD STAFF FROM BACKEND
    // -------------------------------------------
    if (
        window.API &&
        window.svm &&
        window.svm.staffHandlers &&
        typeof window.svm.staffHandlers.loadFromBackend === 'function'
    ) {
        window.svm.staffHandlers.loadFromBackend();
    }

    // -------------------------------------------
    // 🔥 LOAD APPOINTMENTS FROM BACKEND (FIX)
    // -------------------------------------------
    // -------------------------------------------
// 🔥 LOAD PATIENTS → THEN APPOINTMENTS (ORDER FIX)
// -------------------------------------------
    (async () => {
        if (
            window.API &&
            window.svm?.patientHandlers?.loadFromBackend
        ) {
            await window.svm.patientHandlers.loadFromBackend();
            console.log("✅ Patients loaded");
        }

        if (
            window.API?.getAppointments &&
            window.svm?.appointmentsManager
        ) {
            const appointments = await window.API.getAppointments();
            window.svm.appointmentsManager.loadAppointmentsFromBackend(appointments);

            if (window.svm.appointmentHandlers) {
                window.svm.appointmentHandlers.renderTodaysAppointments();
                window.svm.appointmentHandlers.renderAppointmentsTimeline();
                window.svm.appointmentHandlers.updateTodaysAppointmentsCount();

                // 📅 INIT APPOINTMENT CALENDAR (ADD HERE)
                window.svm.calendar = new AppointmentCalendar(
                    window.svm.appointmentsManager,
                    (date) => {
                        // Store selected date globally
                        window.selectedCalendarDate = date;

                        // Force filters to "all"
                        const dateFilter = document.getElementById("dateFilter");
                        if (dateFilter) dateFilter.value = "all";

                        // Re-render timeline (it will read selectedCalendarDate)
                        window.svm.appointmentHandlers.renderAppointmentsTimeline();
                    }
                );


                window.svm.calendar.render();
            }

            console.log("✅ Appointments loaded:", appointments.length);
        }
    })();


    // -------------------------------------------
    // HOOK APPOINTMENT FORM SUBMIT
    // -------------------------------------------
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm && window.svm && window.svm.appointmentHandlers) {
        appointmentForm.addEventListener(
            'submit',
            (e) => window.svm.appointmentHandlers.handleAppointmentSubmit(e)
        );
    }

    // -------------------------------------------
    // HOOK PATIENT FORM SUBMIT
    // -------------------------------------------
    const patientForm = document.getElementById('patientForm');
    if (patientForm && window.svm && window.svm.patientHandlers) {
        patientForm.addEventListener(
            'submit',
            (e) => window.svm.patientHandlers.handlePatientSubmit(e)
        );
    }
});


// ------------------------------------------------
// SERVICE WORKER (UNCHANGED)
// ------------------------------------------------
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const swCode = `
            const CACHE_NAME = 'shajag-vaidya-manager-v1';
            const urlsToCache = ['/'];

            self.addEventListener('install', function(event) {
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            return cache.addAll(urlsToCache);
                        })
                );
            });

            self.addEventListener('fetch', function(event) {
                event.respondWith(
                    caches.match(event.request)
                        .then(function(response) {
                            return response || fetch(event.request);
                        })
                );
            });
        `;

        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);

        navigator.serviceWorker.register(swUrl)
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
