// BillingManager.js
// Billing and Invoice Management Data Class

class BillingManager {
    constructor() {
        this.invoices = [];
        this.services = [];
        this.paymentMethods = ['Cash', 'Card', 'UPI', 'Net Banking', 'Insurance'];
        this.loadFromStorage();
        this.initializeDefaultServices();
        this.initializeDefaultInvoices();
    }

    initializeDefaultServices() {
        if (this.services.length === 0) {
            this.services = [
                // Consultations
                { id: 'SRV001', name: 'Initial Consultation', category: 'Consultation', price: 1000, gst: 18, type: 'service' },
                { id: 'SRV002', name: 'Follow-up Consultation', category: 'Consultation', price: 500, gst: 18, type: 'service' },
                { id: 'SRV003', name: 'Online Consultation', category: 'Consultation', price: 800, gst: 18, type: 'service' },

                // Panchakarma Therapies
                { id: 'SRV004', name: 'Abhyanga (Full Body Massage)', category: 'Therapy', price: 2000, gst: 18, type: 'service' },
                { id: 'SRV005', name: 'Shirodhara', category: 'Therapy', price: 2500, gst: 18, type: 'service' },
                { id: 'SRV006', name: 'Nasya', category: 'Therapy', price: 1500, gst: 18, type: 'service' },
                { id: 'SRV007', name: 'Basti (Enema)', category: 'Therapy', price: 3000, gst: 18, type: 'service' },
                { id: 'SRV008', name: 'Vamana', category: 'Therapy', price: 5000, gst: 18, type: 'service' },
                { id: 'SRV009', name: 'Virechana', category: 'Therapy', price: 4500, gst: 18, type: 'service' },
                { id: 'SRV010', name: 'Raktamokshana', category: 'Therapy', price: 3500, gst: 18, type: 'service' },

                // Special Treatments
                { id: 'SRV011', name: 'Kati Basti (Lower Back)', category: 'Therapy', price: 1800, gst: 18, type: 'service' },
                { id: 'SRV012', name: 'Janu Basti (Knee)', category: 'Therapy', price: 1800, gst: 18, type: 'service' },
                { id: 'SRV013', name: 'Netra Tarpana (Eye)', category: 'Therapy', price: 2200, gst: 18, type: 'service' },
                { id: 'SRV014', name: 'Karna Purana (Ear)', category: 'Therapy', price: 1200, gst: 18, type: 'service' },

                // Diagnostic Services
                { id: 'SRV015', name: 'Nadi Pariksha (Pulse Diagnosis)', category: 'Diagnosis', price: 800, gst: 18, type: 'service' },
                { id: 'SRV016', name: 'Prakriti Analysis', category: 'Diagnosis', price: 1200, gst: 18, type: 'service' },

                // Diet & Lifestyle
                { id: 'SRV017', name: 'Personalized Diet Plan', category: 'Diet', price: 1500, gst: 18, type: 'service' },
                { id: 'SRV018', name: 'Lifestyle Counseling', category: 'Counseling', price: 1000, gst: 18, type: 'service' },

                // Packages
                { id: 'PKG001', name: '7-Day Panchakarma Package', category: 'Package', price: 25000, gst: 18, type: 'package' },
                { id: 'PKG002', name: '14-Day Detox Package', category: 'Package', price: 45000, gst: 18, type: 'package' },
                { id: 'PKG003', name: 'Monthly Wellness Package', category: 'Package', price: 15000, gst: 18, type: 'package' }
            ];
            this.saveToStorage();
        }
    }

    initializeDefaultInvoices() {
        if (this.invoices.length === 0) {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);

            this.invoices = [
                {
                    id: 'INV001',
                    invoiceNumber: 'SVM/2024-25/001',
                    patientName: 'Rajesh Kumar',
                    patientId: 'P001',
                    patientPhone: '+91-9876543210',
                    date: today.toISOString(),
                    items: [
                        { serviceId: 'SRV001', name: 'Initial Consultation', quantity: 1, price: 1000, gst: 18 },
                        { serviceId: 'SRV005', name: 'Shirodhara', quantity: 3, price: 2500, gst: 18 }
                    ],
                    subtotal: 8500,
                    gstAmount: 1530,
                    discount: 500,
                    total: 9530,
                    amountPaid: 9530,
                    paymentMethod: 'UPI',
                    paymentStatus: 'Paid',
                    notes: 'Package discount applied'
                },
                {
                    id: 'INV002',
                    invoiceNumber: 'SVM/2024-25/002',
                    patientName: 'Priya Sharma',
                    patientId: 'P002',
                    patientPhone: '+91-9876543220',
                    date: yesterday.toISOString(),
                    items: [
                        { serviceId: 'SRV002', name: 'Follow-up Consultation', quantity: 1, price: 500, gst: 18 },
                        { serviceId: 'SRV004', name: 'Abhyanga', quantity: 1, price: 2000, gst: 18 }
                    ],
                    subtotal: 2500,
                    gstAmount: 450,
                    discount: 0,
                    total: 2950,
                    amountPaid: 2950,
                    paymentMethod: 'Card',
                    paymentStatus: 'Paid',
                    notes: ''
                },
                {
                    id: 'INV003',
                    invoiceNumber: 'SVM/2024-25/003',
                    patientName: 'Amit Verma',
                    patientId: 'P003',
                    patientPhone: '+91-9876543230',
                    date: lastWeek.toISOString(),
                    items: [
                        { serviceId: 'PKG001', name: '7-Day Panchakarma Package', quantity: 1, price: 25000, gst: 18 }
                    ],
                    subtotal: 25000,
                    gstAmount: 4500,
                    discount: 2000,
                    total: 27500,
                    amountPaid: 15000,
                    paymentMethod: 'Cash',
                    paymentStatus: 'Partial',
                    notes: 'Balance: ₹12,500'
                }
            ];
            this.saveToStorage();
        }
    }

    // Get all services
    getAllServices() {
        return [...this.services];
    }

    // Get services by category
    getServicesByCategory(category) {
        if (category === 'all') return this.getAllServices();
        return this.services.filter(s => s.category === category);
    }

    // Search services
    searchServices(query) {
        const lowerQuery = query.toLowerCase();
        return this.services.filter(s =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.id.toLowerCase().includes(lowerQuery) ||
            s.category.toLowerCase().includes(lowerQuery)
        );
    }

    // Get all invoices
    getAllInvoices() {
        return [...this.invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Get invoice by ID
    getInvoiceById(id) {
        return this.invoices.find(i => i.id === id);
    }

    // Create new invoice
    createInvoice(invoiceData) {
        const newId = this.generateInvoiceId();
        const invoiceNumber = this.generateInvoiceNumber();

        const invoice = {
            id: newId,
            invoiceNumber: invoiceNumber,
            ...invoiceData,
            date: new Date().toISOString()
        };

        this.invoices.push(invoice);
        this.saveToStorage();
        console.log('✅ Invoice created:', invoice);
        return invoice;
    }

    // Update invoice
    updateInvoice(id, updates) {
        const index = this.invoices.findIndex(i => i.id === id);
        if (index !== -1) {
            this.invoices[index] = { ...this.invoices[index], ...updates };
            this.saveToStorage();
            console.log('✅ Invoice updated:', this.invoices[index]);
            return this.invoices[index];
        }
        return null;
    }

    // Delete invoice
    deleteInvoice(id) {
        const index = this.invoices.findIndex(i => i.id === id);
        if (index !== -1) {
            const deleted = this.invoices.splice(index, 1)[0];
            this.saveToStorage();
            console.log('✅ Invoice deleted:', deleted);
            return deleted;
        }
        return null;
    }

    // Calculate invoice totals
    calculateInvoiceTotals(items, discount = 0) {
        let subtotal = 0;
        let gstAmount = 0;

        items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            gstAmount += (itemTotal * item.gst) / 100;
        });

        const total = subtotal + gstAmount - discount;

        return {
            subtotal,
            gstAmount,
            discount,
            total
        };
    }

    // Get statistics
    getStatistics() {
        const total = this.invoices.length;
        const paid = this.invoices.filter(i => i.paymentStatus === 'Paid').length;
        const partial = this.invoices.filter(i => i.paymentStatus === 'Partial').length;
        const pending = this.invoices.filter(i => i.paymentStatus === 'Pending').length;

        const totalRevenue = this.invoices
            .filter(i => i.paymentStatus === 'Paid')
            .reduce((sum, i) => sum + i.total, 0);

        const pendingAmount = this.invoices
            .filter(i => i.paymentStatus === 'Partial' || i.paymentStatus === 'Pending')
            .reduce((sum, i) => sum + (i.total - i.amountPaid), 0);

        // Today's revenue
        const today = new Date().toDateString();
        const todayRevenue = this.invoices
            .filter(i => new Date(i.date).toDateString() === today && i.paymentStatus === 'Paid')
            .reduce((sum, i) => sum + i.total, 0);

        // This month's revenue
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthRevenue = this.invoices
            .filter(i => {
                const invoiceDate = new Date(i.date);
                return invoiceDate.getMonth() === thisMonth &&
                    invoiceDate.getFullYear() === thisYear &&
                    i.paymentStatus === 'Paid';
            })
            .reduce((sum, i) => sum + i.total, 0);

        return {
            total,
            paid,
            partial,
            pending,
            totalRevenue,
            pendingAmount,
            todayRevenue,
            monthRevenue
        };
    }

    // Filter invoices
    filterInvoices(filters) {
        let filtered = [...this.invoices];

        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(i => i.paymentStatus === filters.status);
        }

        if (filters.paymentMethod && filters.paymentMethod !== 'all') {
            filtered = filtered.filter(i => i.paymentMethod === filters.paymentMethod);
        }

        if (filters.dateRange) {
            const { start, end } = filters.dateRange;
            filtered = filtered.filter(i => {
                const invoiceDate = new Date(i.date);
                return invoiceDate >= start && invoiceDate <= end;
            });
        }

        if (filters.search) {
            const query = filters.search.toLowerCase();
            filtered = filtered.filter(i =>
                i.patientName.toLowerCase().includes(query) ||
                i.invoiceNumber.toLowerCase().includes(query) ||
                i.patientPhone.includes(query)
            );
        }

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Generate invoice ID
    generateInvoiceId() {
        const maxId = this.invoices.reduce((max, i) => {
            const num = parseInt(i.id.replace('INV', ''));
            return num > max ? num : max;
        }, 0);
        return `INV${String(maxId + 1).padStart(3, '0')}`;
    }

    // Generate invoice number
    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const nextYear = year + 1;
        const fiscalYear = `${year}-${String(nextYear).slice(-2)}`;

        const yearInvoices = this.invoices.filter(i =>
            i.invoiceNumber.includes(fiscalYear)
        );

        const maxNum = yearInvoices.reduce((max, i) => {
            const num = parseInt(i.invoiceNumber.split('/').pop());
            return num > max ? num : max;
        }, 0);

        return `SVM/${fiscalYear}/${String(maxNum + 1).padStart(3, '0')}`;
    }

    // Storage methods
    saveToStorage() {
        try {
            localStorage.setItem('svmInvoices', JSON.stringify(this.invoices));
            localStorage.setItem('svmServices', JSON.stringify(this.services));
            console.log('💾 Billing data saved');
        } catch (error) {
            console.error('❌ Error saving billing data:', error);
        }
    }

    loadFromStorage() {
        try {
            const invoices = localStorage.getItem('svmInvoices');
            const services = localStorage.getItem('svmServices');

            if (invoices) this.invoices = JSON.parse(invoices);
            if (services) this.services = JSON.parse(services);

            console.log('✅ Billing data loaded');
        } catch (error) {
            console.error('❌ Error loading billing data:', error);
            this.invoices = [];
            this.services = [];
        }
    }

    // Export to CSV
    exportToCSV() {
        const headers = ['Invoice Number', 'Date', 'Patient', 'Phone', 'Subtotal', 'GST', 'Discount', 'Total', 'Paid', 'Status', 'Payment Method'];
        const rows = this.invoices.map(i => [
            i.invoiceNumber,
            new Date(i.date).toLocaleDateString('en-IN'),
            i.patientName,
            i.patientPhone,
            i.subtotal,
            i.gstAmount,
            i.discount,
            i.total,
            i.amountPaid,
            i.paymentStatus,
            i.paymentMethod
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });

        return csv;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BillingManager;
}