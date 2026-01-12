// ChartHandlers.js
// Handles chart initialization and rendering

class ChartHandlers {
    constructor(manager) {
        this.manager = manager;
    }

    initializeCharts() {
        setTimeout(() => {
            this.initConstitutionChart();
            this.initPatientFlowChart();
        }, 200);
    }

    initConstitutionChart() {
        const ctx = document.getElementById('constitutionChart');
        if (!ctx) return;

        try {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Vata', 'Pitta', 'Kapha', 'Mixed'],
                    datasets: [{
                        data: [35, 30, 25, 10],
                        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing constitution chart:', error);
        }
    }

    initPatientFlowChart() {
        const ctx = document.getElementById('patientFlowChart');
        if (!ctx) return;

        try {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'New Patients',
                        data: [65, 78, 90, 81, 96, 115],
                        borderColor: '#2E8B57',
                        backgroundColor: 'rgba(46, 139, 87, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Follow-up Visits',
                        data: [85, 95, 110, 120, 135, 145],
                        borderColor: '#FF8C00',
                        backgroundColor: 'rgba(255, 140, 0, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing patient flow chart:', error);
        }
    }
}