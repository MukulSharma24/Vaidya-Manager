// TherapyManager.js
// Manages therapy sessions and assignments

class TherapyManager {
    constructor() {
        // Store sessions and assignments in local storage
        this.sessions = JSON.parse(localStorage.getItem('therapySessions') || '[]');
        this.assignments = JSON.parse(localStorage.getItem('therapyAssignments') || '[]');
    }

    /* ============================================================
       SAVE THERAPY SESSION (✔ Now saves to SQL Server backend too)
       ============================================================ */
    async addTherapySession({ patientId, patientName, patientPhone, therapyType, date, time, duration, notes }) {
        const newSession = {
            BookingID: patientId,
            SessionNumber: 1,
            TherapyDate: date.toISOString().split("T")[0], // yyyy-mm-dd
            DurationMinutes: parseInt(duration),
            Notes: notes || `${therapyType} session`,
            BP_Start: null,
            TherapistID: null
        };

        // ✔ Save to SQL Server via backend API
        try {
            const res = await window.API.createTherapySession(newSession);
            newSession.SessionID = res.SessionID;
        } catch (err) {
            console.error("ERROR saving therapy session to backend:", err);
        }

        // ✔ Also save in local storage for UI continuity
        this.sessions.push(newSession);
        localStorage.setItem('therapySessions', JSON.stringify(this.sessions));

        return newSession;
    }

    /* ============================================================
       ADD THERAPY ASSIGNMENT
       ============================================================ */
    addTherapyAssignment({ patientId, patientName, patientAge, patientConstitution, therapies, notes }) {
        const assignment = {
            id: Date.now(),
            patientId,
            patientName,
            patientAge,
            patientConstitution,
            therapies,
            notes,
            date: new Date(),
            status: 'Scheduled'
        };

        this.assignments.unshift(assignment);
        localStorage.setItem('therapyAssignments', JSON.stringify(this.assignments));

        return assignment;
    }

    /* ============================================================
       GET / FILTER METHODS
       ============================================================ */

    getSessionsForPatient(patientId) {
        return this.sessions.filter(s => s.patientId === patientId);
    }

    getAssignmentsForPatient(patientId) {
        return this.assignments.filter(a => a.patientId === patientId);
    }

    getRecentAssignments(limit = 10) {
        return this.assignments.slice(0, limit);
    }

    getSessionCount(therapyName) {
        // Remove emojis before matching
        const cleanName = therapyName.replace(/[🌿💧🌊👃🩸]/g, '').trim().toLowerCase();
        return this.sessions.filter(s =>
            s.therapyType && s.therapyType.toLowerCase().includes(cleanName)
        ).length;
    }

    /* ============================================================
       UPDATE / DELETE METHODS
       ============================================================ */

    updateSessionStatus(sessionId, newStatus) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            session.status = newStatus;
            localStorage.setItem('therapySessions', JSON.stringify(this.sessions));
            return true;
        }
        return false;
    }

    deleteAssignment(assignmentId) {
        const index = this.assignments.findIndex(a => a.id === assignmentId);
        if (index > -1) {
            this.assignments.splice(index, 1);
            localStorage.setItem('therapyAssignments', JSON.stringify(this.assignments));
            return true;
        }
        return false;
    }

    /* ============================================================
       GET ALL
       ============================================================ */

    getAllSessions() {
        return this.sessions;
    }

    getAllAssignments() {
        return this.assignments;
    }
}

// Export for use in Node (for testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TherapyManager;
}
