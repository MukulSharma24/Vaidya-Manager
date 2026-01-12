// DietManager.js
// Manages diet plans and assignments

class DietManager {
    constructor() {
        // Store diet plans in local storage
        this.dietPlans = JSON.parse(localStorage.getItem('dietPlans') || '[]');
    }

    // Add diet plan for a patient
    addDietPlan({ patientId, patientName, patientAge, patientConstitution, constitution, season, meals, notes }) {
        const dietPlan = {
            id: Date.now(),
            patientId,
            patientName,
            patientAge,
            patientConstitution,
            constitution,
            season,
            meals,
            notes,
            date: new Date(),
            status: 'Active'
        };

        this.dietPlans.unshift(dietPlan);
        localStorage.setItem('dietPlans', JSON.stringify(this.dietPlans));
        return dietPlan;
    }

    // Get diet plans for a patient
    getDietPlansForPatient(patientId) {
        return this.dietPlans.filter(d => d.patientId === patientId);
    }

    // Get recent diet plans
    getRecentDietPlans(limit = 10) {
        return this.dietPlans.slice(0, limit);
    }

    // Delete diet plan
    deleteDietPlan(planId) {
        const index = this.dietPlans.findIndex(d => d.id === planId);
        if (index > -1) {
            this.dietPlans.splice(index, 1);
            localStorage.setItem('dietPlans', JSON.stringify(this.dietPlans));
            return true;
        }
        return false;
    }

    // Update diet plan status
    updateDietPlanStatus(planId, newStatus) {
        const plan = this.dietPlans.find(d => d.id === planId);
        if (plan) {
            plan.status = newStatus;
            localStorage.setItem('dietPlans', JSON.stringify(this.dietPlans));
            return true;
        }
        return false;
    }

    // Get all diet plans
    getAllDietPlans() {
        return this.dietPlans;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DietManager;
}