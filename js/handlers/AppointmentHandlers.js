// js/handlers/AppointmentHandlers.js
// FINAL — Stable, duplicate-proof, SQL-safe appointment handler

class AppointmentHandlers {
    constructor(manager) {
        this.manager = manager;
        this.appointmentsManager = manager.appointmentsManager;
        this.patientMgmt = manager.patientMgmt;

        // Prevent double binding
        this.isSubmitting = false;
    }

    /* -------------------------------------------------------
       Convert "HH:mm" → "HH:mm:00" (SQL-compatible)
    -------------------------------------------------------- */
    toSqlTime(timeInput) {
        if (!timeInput) return null;

        // Case 1: input[type="time"] → "HH:mm"
        if (/^\d{2}:\d{2}$/.test(timeInput)) {
            return `${timeInput}:00`;
        }

        // Case 2: "hh:mm AM/PM"
        const match = timeInput.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
        if (!match) return null;

        let [, h, m, period] = match;
        h = parseInt(h, 10);

        if (period.toUpperCase() === "PM" && h !== 12) h += 12;
        if (period.toUpperCase() === "AM" && h === 12) h = 0;

        return `${String(h).padStart(2, "0")}:${m}:00`;
    }

    /* -------------------------------------------------------
       Convert SQL "HH:mm:ss" → 12h UI
    -------------------------------------------------------- */
    toDisplayTime(timeInput) {
        if (!timeInput) return "";
        let [h, m] = timeInput.split(":");
        h = Number(h);
        const period = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${m} ${period}`;
    }

    /* -------------------------------------------------------
       Render TODAY's list
    -------------------------------------------------------- */
    renderTodaysAppointments() {
        const dateFilter = document.getElementById("dateFilter")?.value || "today";

        // 🔥 HARD STOP — do NOT render if not today
        if (dateFilter !== "today") return;

        const container = document.getElementById("todayAppointmentsList");
        if (!container) return;


        const todays = this.appointmentsManager.getTodaysAppointments();

        if (todays.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p>No appointments scheduled for today</p>
                </div>
            `;
            return;
        }

        container.innerHTML = "";

        todays.forEach(apt => {
            const icon = this.getDepartmentIcon(apt.appointmentType);

            const item = document.createElement("div");
            item.className = "appointment-item";
            item.dataset.appointmentId = apt.id;

            item.innerHTML = `
                <div class="appointment-time ${apt.status}">${apt.time}</div>
                <div class="appointment-details">
                    <div class="appointment-patient">
                        <span class="appointment-dept-icon">${icon}</span>
                        ${apt.patientName}
                    </div>
                    <div class="appointment-type">${apt.appointmentType}</div>
                </div>
                <select class="status-dropdown ${apt.status}" data-appointment-id="${apt.id}">
                    <option value="scheduled" ${apt.status==="scheduled"?"selected":""}>Scheduled</option>
                    <option value="in-progress" ${apt.status==="in-progress"?"selected":""}>In Progress</option>
                    <option value="completed" ${apt.status==="completed"?"selected":""}>Completed</option>
                    <option value="cancelled" ${apt.status==="cancelled"?"selected":""}>Cancelled</option>
                    <option value="rescheduled" ${apt.status==="rescheduled"?"selected":""}>Rescheduled</option>
                </select>
            `;

            item.querySelector(".status-dropdown").addEventListener("change", e =>
                this.handleStatusChange(apt.id, e.target.value)
            );

            container.appendChild(item);
        });
    }

    updateTodaysAppointmentsCount() {
        const el = document.getElementById("todayAppointmentsCount");
        if (el) {
            el.textContent = this.appointmentsManager.getTodaysAppointments().length;
        }
    }

    /* -------------------------------------------------------
       🔥 ADDED: Render ALL appointments (timeline view)
    -------------------------------------------------------- */
    renderAppointmentsTimeline(selectedDate = null) {

        const container = document.getElementById("appointmentsTimeline");
        if (!container) return;

        const dateFilter = document.getElementById("dateFilter")?.value || "today";
        const statusFilter = document.getElementById("statusFilter")?.value || "all";
        const searchQuery = document.getElementById("appointmentSearch")?.value || "";

        // 🔥 Show Today widget ONLY when dateFilter === "today"
        const todaySection = document.getElementById("todayAppointmentsSection");
        if (todaySection) {
            todaySection.style.display = dateFilter === "today" ? "block" : "none";
        }

        let filtered = this.appointmentsManager.getFilteredAppointments(
            dateFilter,
            statusFilter,
            searchQuery
        );

// 🔥 FILTER BY CALENDAR DATE (if selected)
        if (selectedDate) {
            selectedDate.setHours(0, 0, 0, 0);

            filtered = filtered.filter(a => {
                const d = new Date(a.date);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === selectedDate.getTime();
            });
        }


        if (filtered.length === 0) {
            container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>No appointments found</p>
            </div>
        `;
            return;
        }

        const grouped = this.appointmentsManager.groupAppointmentsByDate(filtered);
        let html = "";

        Object.keys(grouped).forEach(dateKey => {
            html += `
        <div class="timeline-date-group">
            <h3 class="timeline-date-header">
                ${this.appointmentsManager.formatDate(dateKey)}
            </h3>
            <div class="timeline-appointments">
    `;

            grouped[dateKey].forEach(apt => {
                const icon = this.getDepartmentIcon(apt.appointmentType);
                html += `
            <div class="timeline-item">
                <div class="timeline-time ${apt.status}">
                    ${apt.time}
                </div>
                <div class="timeline-details">
                    <div class="timeline-patient">
                        <span class="timeline-icon">${icon}</span>
                        ${apt.patientName}
                    </div>
                    <div class="timeline-type">
                        ${apt.appointmentType}
                    </div>
                </div>
            </div>
        `;
            });

            html += `
            </div>
        </div>
    `;
        });



        container.innerHTML = html;

        // 🔁 Keep calendar in sync
        if (window.svm?.calendar) {
            window.svm.calendar.render();
        }
    }



    /* -------------------------------------------------------
    CREATE Appointment — FINAL CORRECT VERSION
 -------------------------------------------------------- */
    async handleAppointmentSubmit(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (this.isSubmitting) return;
        this.isSubmitting = true;

        try {
            const patientName = document.getElementById('patientName')?.value.trim();
            const patientPhone = document.getElementById('patientPhone')?.value.trim();
            const rawDate = document.getElementById('appointmentDate')?.value;

            // Convert DD/MM/YYYY → YYYY-MM-DD
            const date = rawDate && rawDate.includes("/")
                ? rawDate.split("/").reverse().join("-")
                : rawDate;

            const timeUi = document.getElementById('appointmentTime')?.value;

            // ✅ FIX: Appointment Type (ID, not text)
            const appointmentTypeSelect = document.getElementById('appointmentType');
            const appointmentTypeId = appointmentTypeSelect
                ? parseInt(appointmentTypeSelect.value, 10)
                : null;

            if (!appointmentTypeId || isNaN(appointmentTypeId)) {
                this.manager.showNotification("Please select appointment type", "error");
                this.isSubmitting = false;
                return;
            }

            const constitution = document.getElementById('constitution')?.value || "Not specified";
            const notes = document.getElementById('appointmentNotes')?.value.trim() || null;

            console.log("AppointmentTypeId:", appointmentTypeId);

            // ✅ REQUIRED FIELD CHECK
            if (!patientName || !patientPhone || !date || !appointmentTypeId) {
                this.manager.showNotification("Please fill all required fields", "error");
                this.isSubmitting = false;
                return;
            }

            if (!timeUi) {
                this.manager.showNotification("Please select appointment time", "error");
                this.isSubmitting = false;
                return;
            }

            const sqlTime = this.toSqlTime(timeUi);
            if (!sqlTime) {
                this.manager.showNotification("Invalid time selected", "error");
                this.isSubmitting = false;
                return;
            }

            // ✅ Ensure patient exists
            let patient = this.patientMgmt.getPatientByPhone(patientPhone);

// 🔥 Ensure patient exists in DATABASE
            if (!patient) {
                const res = await window.API.createPatient({
                    FirstName: patientName,
                    PhoneNumber: patientPhone
                });

                patient = {
                    id: res.PatientID,
                    name: patientName,
                    phone: patientPhone
                };

                // keep local cache in sync
                this.patientMgmt.addPatient(patient);
            }


            // ✅ FINAL PAYLOAD (MATCHES BACKEND)
            const payload = {
                PatientID: patient.id,          // MUST be real DB ID
                Mobile: patientPhone,
                DepartmentID: 1,
                DoctorID: 1,
                AppointmentDate: date,           // YYYY-MM-DD
                AppointmentStartTime: sqlTime,   // HH:mm:ss
                AppointmentEndTime: null,
                AppointmentTypeID: appointmentTypeId, // 🔥 INT ONLY
                Note: notes || null
            };

            console.log("🟢 APPOINTMENT PAYLOAD:", payload);

            const res = await window.API.createAppointment(payload);

            if (!res?.ScheduleID) {
                throw new Error("ScheduleID not returned from backend");
            }

            // ✅ Update UI
            // ✅ SINGLE SOURCE OF TRUTH — reload from backend
            const backendAppointments = await window.API.getAppointments();
            this.appointmentsManager.loadAppointmentsFromBackend(backendAppointments);


            this.manager.showNotification(
                `Appointment scheduled for ${patientName}`,
                "success"
            );

            this.closeAppointmentModal();

            const dateFilter = document.getElementById("dateFilter")?.value || "today";

            if (dateFilter === "today") {
                this.renderTodaysAppointments();
                this.updateTodaysAppointmentsCount();
            }

            this.renderAppointmentsTimeline();


        } catch (err) {
            console.error("❌ Appointment error:", err);
            this.manager.showNotification("Server error creating appointment", "error");
        } finally {
            this.isSubmitting = false;
        }
    }



    /* -------------------------------------------------------
       Modal
    -------------------------------------------------------- */
    openAppointmentModal(patient = null) {
        document.getElementById("appointmentModal").classList.add("show");

        const dateInput = document.getElementById("appointmentDate");
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
        dateInput.min = today;

        if (patient) {
            document.getElementById("patientName").value = patient.name;
            document.getElementById("patientPhone").value = patient.phone;
        }

        // 🔥🔥🔥 CRITICAL FIX: bind submit handler 🔥🔥🔥
        const form = document.getElementById("appointmentForm");
        if (form) {
            // prevent multiple bindings
            if (this._boundSubmit) {
                form.removeEventListener("submit", this._boundSubmit);
            }

            this._boundSubmit = this.handleAppointmentSubmit.bind(this);
            form.addEventListener("submit", this._boundSubmit);
        }
    }


    closeAppointmentModal() {
        document.getElementById("appointmentModal").classList.remove("show");
        document.getElementById("appointmentForm").reset();
    }



    /* -------------------------------------------------------
       Status change
    -------------------------------------------------------- */
    handleStatusChange(id, newStatus) {
        const ok = this.appointmentsManager.updateAppointmentStatus(id, newStatus);
        if (!ok) {
            this.manager.showNotification("Could not update status", "error");
            return;
        }

        this.manager.showNotification("Status updated", "success");

        const dateFilter = document.getElementById("dateFilter")?.value || "today";
        if (dateFilter === "today") {
            this.renderTodaysAppointments();
        }
        this.renderAppointmentsTimeline();

    }

    /* -------------------------------------------------------
       Icon
    -------------------------------------------------------- */
    getDepartmentIcon(type) {
        const t = (type || "").toLowerCase();
        if (t.includes("therapy")) return "🧘";
        if (t.includes("diet")) return "🥗";
        return "💊";
    }


}
