// AppointmentsManager.js
// FINAL — Backend-safe, refresh-safe, time-safe

class AppointmentsManager {
    constructor() {
        this.appointments = [];
        this.nextId = 1;
    }

    getAllAppointments() {
        return this.appointments;
    }

    /* ---------------------------------------------------------
       LOAD FROM BACKEND (🔥 FIXED)
    --------------------------------------------------------- */
    loadAppointmentsFromBackend(backendList = []) {
        // 🔥 CRITICAL: reset before loading
        this.appointments = [];

        backendList.forEach(b => {
            this.appointments.push({
                id: b.ScheduleID,
                patientId: b.PatientID,
                patientName: b.PatientName || "",
                patientPhone: b.Mobile || "",
                appointmentType: b.AppointmentType || "General",

                // 🔥 normalize date ONCE
                date: this.normalizeBackendDate(b.AppointmentDate),

                // 🔥 normalize time safely
                time: this.normalizeBackendTime(b.AppointmentStartTime),

                status: (b.AppointmentStatus || "scheduled").toLowerCase(),
                constitution: b.ConstitutionType || "",
                notes: b.Note || ""
            });
        });

        // 🔥 keep IDs in sync
        const maxId = this.appointments.reduce((m, a) => Math.max(m, a.id), 0);
        this.nextId = maxId + 1;

        return this.appointments;
    }

    /* ---------------------------------------------------------
       DATE NORMALIZER (🔥 FIX)
    --------------------------------------------------------- */
    normalizeBackendDate(dateVal) {
        if (!dateVal) return null;

        const d = new Date(dateVal);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /* ---------------------------------------------------------
       TIME NORMALIZER (🔥 FIXED)
       Accepts: "HH:mm", "HH:mm:ss"
       Returns: "h:mm AM/PM"
    --------------------------------------------------------- */
    normalizeBackendTime(sqlTime) {
        if (!sqlTime) return "";

        const parts = sqlTime.split(":");
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];

        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;

        return `${hours}:${minutes} ${period}`;
    }

    /* ---------------------------------------------------------
       TODAY'S APPOINTMENTS
    --------------------------------------------------------- */
    getTodaysAppointments() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.appointments
            .filter(apt => {
                if (!apt.date) return false;
                return apt.date.getTime() === today.getTime();
            })
            .sort((a, b) => this.timeToMinutes(a.time) - this.timeToMinutes(b.time));
    }

    /* ---------------------------------------------------------
       TIME → MINUTES (🔥 SAFE)
    --------------------------------------------------------- */
    timeToMinutes(timeStr) {
        if (!timeStr) return 0;

        const [time, period] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        return hours * 60 + minutes;
    }

    /* ---------------------------------------------------------
       FILTERED LIST
    --------------------------------------------------------- */
    getFilteredAppointments(dateFilter = "today", statusFilter = "all", searchQuery = "") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);

        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        let filtered = this.appointments.filter(a => {
            if (!a.date) return false;

            const aptDate = new Date(a.date);
            aptDate.setHours(0, 0, 0, 0);

            // 🔥 HARD BLOCK — NO PAST APPOINTMENTS
            if (aptDate < today) return false;

            let dateMatch = true;

            switch (dateFilter) {
                case "today":
                    dateMatch = aptDate.getTime() === today.getTime();
                    break;

                case "tomorrow":
                    dateMatch = aptDate.getTime() === tomorrow.getTime();
                    break;

                case "thisWeek":
                    dateMatch = aptDate >= today && aptDate <= weekEnd;
                    break;

                case "thisMonth":
                    dateMatch = aptDate >= today && aptDate <= monthEnd;
                    break;

                case "all":
                default:
                    dateMatch = true;
            }

            const statusMatch =
                statusFilter === "all" || a.status === statusFilter;

            const q = searchQuery.toLowerCase();
            const searchMatch =
                !q ||
                a.patientName?.toLowerCase().includes(q) ||
                a.patientPhone?.includes(q) ||
                a.appointmentType?.toLowerCase().includes(q);

            return dateMatch && statusMatch && searchMatch;
        });


        /* ---------- SORT (unchanged logic) ---------- */
        filtered.sort((a, b) => {
            const d = new Date(a.date) - new Date(b.date);
            return d !== 0
                ? d
                : this.timeToMinutes(a.time) - this.timeToMinutes(b.time);
        });

        return filtered;
    }


    /* ---------------------------------------------------------
       ADD APPOINTMENT (UI)
    --------------------------------------------------------- */
    addAppointment(data) {
        // UI should NOT invent or cache appointments
        // Backend (DB) is the single source of truth
        // Appointments must be reloaded from backend after create/update
        return null;
    }


    updateAppointmentStatus(id, status) {
        const apt = this.appointments.find(a => a.id === id);
        if (!apt) return false;
        apt.status = status;
        return true;
    }

    groupAppointmentsByDate(list) {
        const grouped = {};
        list.forEach(a => {
            const key = a.date.toDateString();
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(a);
        });
        return grouped;
    }

    formatDate(date) {
        const d = new Date(date);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (d.getTime() === today.getTime()) return "Today";

        return d.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric"
        });
    }
}

if (typeof module !== "undefined") {
    module.exports = AppointmentsManager;
}
