// MedicineDatabase.js
class MedicineDatabase {
    constructor() {
        this.medicines = [];
    }

    /* -------------------------------
      FRONTEND-ONLY REMOVAL HELPERS
   -------------------------------- */
    getRemovedIds() {
        return JSON.parse(localStorage.getItem("removedMedicines") || "[]");
    }

    markRemoved(id) {
        const removed = this.getRemovedIds();
        if (!removed.includes(id)) {
            removed.push(id);
            localStorage.setItem("removedMedicines", JSON.stringify(removed));
        }
    }

    async loadFromBackend() {
        try {
            const data = await window.API.getMedicines();

            const removedIds = this.getRemovedIds();

            this.medicines = data
                .map(m => ({
                    id: m.MedicineID,
                    name: m.MedicineName || "—",
                    sanskritName: m.Sanskrit_name || "—",
                    category: m.Category || "—",
                    type: m.MedicinesType || "—",
                    dosage: m.dosage_strength || "—",
                    timing: m.Timing || "—",
                    stock: m.TotalStock || 0,
                    expiry: m.LatestExpiry ? m.LatestExpiry.split("T")[0] : "—"
                }))
                .filter(m => !removedIds.includes(m.id));


            console.log("✔ Loaded medicines:", this.medicines);

        } catch (err) {
            console.error("LOAD FAILED:", err);
        }
    }

    search(q) {
        if (!q) return this.medicines;
        q = q.toLowerCase();
        return this.medicines.filter(m =>
            m.name.toLowerCase().includes(q) ||
            (m.sanskritName || "").toLowerCase().includes(q)
        );
    }

    getAll() { return this.medicines; }
}
