// BillingHandlers.js
// Billing UI Handlers

class BillingHandlers {
    constructor(manager) {
        this.manager = manager;
        this.currentInvoice = {
            items: [],
            discount: 0
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Create Invoice Button
        const createInvoiceBtn = document.getElementById('createInvoiceBtn');
        if (createInvoiceBtn) {
            createInvoiceBtn.addEventListener('click', () => this.openCreateInvoiceModal());
        }

        // Search
        const invoiceSearchInput = document.getElementById('invoiceSearchInput');
        if (invoiceSearchInput) {
            invoiceSearchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Filters
        const statusFilter = document.getElementById('invoiceStatusFilter');
        const paymentFilter = document.getElementById('invoicePaymentFilter');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        if (paymentFilter) {
            paymentFilter.addEventListener('change', () => this.applyFilters());
        }

        console.log('✅ Billing Handlers initialized');
    }

    // Render Billing View
    renderBillingView() {
        console.log('📋 Rendering Billing View');
        this.renderStatistics();
        this.renderInvoicesGrid();
    }

    // Render Statistics
    renderStatistics() {
        const stats = this.manager.billingMgr.getStatistics();

        const totalInvoicesCount = document.getElementById('totalInvoicesCount');
        const totalRevenueCount = document.getElementById('totalRevenueCount');
        const pendingPaymentsCount = document.getElementById('pendingPaymentsCount');
        const monthRevenueCount = document.getElementById('monthRevenueCount');

        if (totalInvoicesCount) totalInvoicesCount.textContent = stats.total;
        if (totalRevenueCount) totalRevenueCount.textContent = `₹${stats.totalRevenue.toLocaleString()}`;
        if (pendingPaymentsCount) pendingPaymentsCount.textContent = `₹${stats.pendingAmount.toLocaleString()}`;
        if (monthRevenueCount) monthRevenueCount.textContent = `₹${stats.monthRevenue.toLocaleString()}`;
    }

    // Render Invoices List (Table View)
    renderInvoicesGrid(invoicesList = null) {
        const container = document.getElementById('invoicesGridContainer');
        if (!container) return;

        const invoices = invoicesList || this.manager.billingMgr.getAllInvoices();

        if (invoices.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💰</div>
                    <h3>No Invoices Found</h3>
                    <p>Create your first invoice to get started</p>
                    <button class="btn btn--primary" onclick="window.app.billingHandlers.openCreateInvoiceModal()">
                        Create Invoice
                    </button>
                </div>
            `;
            return;
        }

        // Create table structure
        container.innerHTML = `
            <div class="invoices-table-container">
                <table class="invoices-table">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Date</th>
                            <th>Patient</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoices.map(invoice => this.renderInvoiceRow(invoice)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Render Individual Invoice Row
    renderInvoiceRow(invoice) {
        const statusClass = invoice.paymentStatus.toLowerCase().replace(' ', '-');
        const date = new Date(invoice.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const pendingAmount = invoice.total - invoice.amountPaid;

        return `
            <tr class="invoice-row">
                <td class="invoice-number-cell">
                    <div class="invoice-number-wrapper">
                        <span class="invoice-number-text">${invoice.invoiceNumber}</span>
                    </div>
                </td>
                
                <td class="date-cell">
                    <span class="date-text">${date}</span>
                </td>
                
                <td class="patient-cell">
                    <div class="patient-info">
                        <div class="patient-name">
                            <span class="icon">👤</span>
                            ${invoice.patientName}
                        </div>
                        <div class="patient-phone">
                            <span class="icon">📱</span>
                            ${invoice.patientPhone}
                        </div>
                    </div>
                </td>
                
                <td class="items-cell">
                    <span class="items-count">${invoice.items.length} item(s)</span>
                </td>
                
                <td class="amount-cell">
                    <div class="amount-details">
                        <div class="amount-row">
                            <span class="label">Subtotal:</span>
                            <span class="value">₹${invoice.subtotal.toLocaleString()}</span>
                        </div>
                        ${invoice.discount > 0 ? `
                        <div class="amount-row discount">
                            <span class="label">Discount:</span>
                            <span class="value">-₹${invoice.discount.toLocaleString()}</span>
                        </div>
                        ` : ''}
                        <div class="amount-row total">
                            <span class="label">Total:</span>
                            <span class="value">₹${invoice.total.toLocaleString()}</span>
                        </div>
                        ${pendingAmount > 0 ? `
                        <div class="amount-row pending">
                            <span class="label">Pending:</span>
                            <span class="value">₹${pendingAmount.toLocaleString()}</span>
                        </div>
                        ` : ''}
                    </div>
                </td>
                
                <td class="payment-cell">
                    <span class="payment-method-badge">${invoice.paymentMethod}</span>
                </td>
                
                <td class="status-cell">
                    <span class="status-badge status-${statusClass}">${invoice.paymentStatus}</span>
                </td>
                
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="btn-action btn-view" 
                                onclick="window.app.billingHandlers.viewInvoiceDetails('${invoice.id}')"
                                title="View Details">
                            <span class="icon">👁️</span>
                        </button>
                        <button class="btn-action btn-download" 
                                onclick="window.app.billingHandlers.downloadInvoice('${invoice.id}')"
                                title="Download">
                            <span class="icon">⬇️</span>
                        </button>
                        ${invoice.paymentStatus !== 'Paid' ? `
                        <button class="btn-action btn-payment" 
                                onclick="window.app.billingHandlers.recordPayment('${invoice.id}')"
                                title="Record Payment">
                            <span class="icon">💳</span>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    // Handle Search
    handleSearch(query) {
        if (!query.trim()) {
            this.renderInvoicesGrid();
            return;
        }

        const filtered = this.manager.billingMgr.filterInvoices({ search: query });
        this.renderInvoicesGrid(filtered);
    }

    // Apply Filters
    applyFilters() {
        const status = document.getElementById('invoiceStatusFilter')?.value || 'all';
        const paymentMethod = document.getElementById('invoicePaymentFilter')?.value || 'all';

        const filtered = this.manager.billingMgr.filterInvoices({
            status: status,
            paymentMethod: paymentMethod
        });

        this.renderInvoicesGrid(filtered);
    }

    // Open Create Invoice Modal
    openCreateInvoiceModal() {
        this.currentInvoice = {
            items: [],
            discount: 0
        };

        const modal = document.getElementById('createInvoiceModal');
        if (modal) {
            modal.classList.add('active');
            this.renderServicesSelection();
            this.updateInvoicePreview();
        }
    }

    // Close Create Invoice Modal
    closeCreateInvoiceModal() {
        const modal = document.getElementById('createInvoiceModal');
        if (modal) modal.classList.remove('active');
    }

    // Render Services Selection
    renderServicesSelection() {
        const container = document.getElementById('servicesSelectionGrid');
        if (!container) return;

        const services = this.manager.billingMgr.getAllServices();

        const grouped = {};
        services.forEach(service => {
            if (!grouped[service.category]) grouped[service.category] = [];
            grouped[service.category].push(service);
        });

        container.innerHTML = Object.keys(grouped).map(category => `
            <div class="service-category">
                <h4 class="category-title">${category}</h4>
                <div class="services-list">
                    ${grouped[category].map(service => `
                        <div class="service-item" onclick="window.app.billingHandlers.addServiceToInvoice('${service.id}')">
                            <div class="service-info">
                                <h5>${service.name}</h5>
                                <p class="service-price">₹${service.price.toLocaleString()} + ${service.gst}% GST</p>
                            </div>
                            <button class="btn btn--sm btn--primary">Add</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // Add Service to Invoice
    addServiceToInvoice(serviceId) {
        const service = this.manager.billingMgr.getAllServices().find(s => s.id === serviceId);
        if (!service) return;

        // Check if already exists
        const existing = this.currentInvoice.items.find(i => i.serviceId === serviceId);
        if (existing) {
            existing.quantity++;
        } else {
            this.currentInvoice.items.push({
                serviceId: service.id,
                name: service.name,
                price: service.price,
                gst: service.gst,
                quantity: 1
            });
        }

        this.updateInvoicePreview();
        this.manager.showNotification('Service added to invoice', 'success');
    }

    // Remove Service from Invoice
    removeServiceFromInvoice(index) {
        this.currentInvoice.items.splice(index, 1);
        this.updateInvoicePreview();
    }

    // Update Service Quantity
    updateServiceQuantity(index, quantity) {
        if (quantity < 1) {
            this.removeServiceFromInvoice(index);
            return;
        }
        this.currentInvoice.items[index].quantity = parseInt(quantity);
        this.updateInvoicePreview();
    }

    // Update Invoice Preview
    updateInvoicePreview() {
        const preview = document.getElementById('invoicePreview');
        if (!preview) return;

        if (this.currentInvoice.items.length === 0) {
            preview.innerHTML = `
                <div class="invoice-empty">
                    <p>No services added yet</p>
                    <p class="text-muted">Select services from the list above</p>
                </div>
            `;
            return;
        }

        const totals = this.manager.billingMgr.calculateInvoiceTotals(
            this.currentInvoice.items,
            this.currentInvoice.discount
        );

        preview.innerHTML = `
            <div class="invoice-preview-items">
                ${this.currentInvoice.items.map((item, index) => `
                    <div class="invoice-preview-item">
                        <div class="item-details">
                            <h5>${item.name}</h5>
                            <p>₹${item.price.toLocaleString()} × 
                               <input type="number" value="${item.quantity}" min="1" 
                                      class="qty-input" 
                                      onchange="window.app.billingHandlers.updateServiceQuantity(${index}, this.value)">
                            </p>
                        </div>
                        <div class="item-total">
                            <p>₹${(item.price * item.quantity).toLocaleString()}</p>
                            <button class="btn-remove" onclick="window.app.billingHandlers.removeServiceFromInvoice(${index})">×</button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="invoice-preview-totals">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>₹${totals.subtotal.toLocaleString()}</span>
                </div>
                <div class="total-row">
                    <span>GST (18%):</span>
                    <span>₹${totals.gstAmount.toLocaleString()}</span>
                </div>
                <div class="total-row discount">
                    <span>Discount:</span>
                    <input type="number" value="${this.currentInvoice.discount}" min="0" 
                           class="discount-input" 
                           onchange="window.app.billingHandlers.updateDiscount(this.value)"
                           placeholder="0">
                </div>
                <div class="total-row grand-total">
                    <span>Grand Total:</span>
                    <span>₹${totals.total.toLocaleString()}</span>
                </div>
            </div>
        `;
    }

    // Update Discount
    updateDiscount(value) {
        this.currentInvoice.discount = parseFloat(value) || 0;
        this.updateInvoicePreview();
    }

    // Generate Invoice
    generateInvoice(e) {
        e.preventDefault();

        const patientName = document.getElementById('invoicePatientName').value;
        const patientPhone = document.getElementById('invoicePatientPhone').value;
        const paymentMethod = document.getElementById('invoicePaymentMethod').value;
        const paymentStatus = document.getElementById('invoicePaymentStatus').value;
        const amountPaid = parseFloat(document.getElementById('invoiceAmountPaid').value) || 0;
        const notes = document.getElementById('invoiceNotes').value;

        if (this.currentInvoice.items.length === 0) {
            this.manager.showNotification('Please add at least one service', 'error');
            return;
        }

        const totals = this.manager.billingMgr.calculateInvoiceTotals(
            this.currentInvoice.items,
            this.currentInvoice.discount
        );

        const invoiceData = {
            patientName,
            patientPhone,
            patientId: 'P' + Date.now().toString().slice(-3),
            items: this.currentInvoice.items,
            subtotal: totals.subtotal,
            gstAmount: totals.gstAmount,
            discount: this.currentInvoice.discount,
            total: totals.total,
            amountPaid,
            paymentMethod,
            paymentStatus,
            notes
        };

        const invoice = this.manager.billingMgr.createInvoice(invoiceData);

        if (invoice) {
            this.manager.showNotification('Invoice created successfully!', 'success');
            this.closeCreateInvoiceModal();
            this.renderBillingView();
        }
    }

    // View Invoice Details
    viewInvoiceDetails(invoiceId) {
        const invoice = this.manager.billingMgr.getInvoiceById(invoiceId);
        if (!invoice) return;

        const modal = document.getElementById('invoiceDetailsModal');
        const content = document.getElementById('invoiceDetailsContent');

        if (!content) return;

        const date = new Date(invoice.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        content.innerHTML = `
            <div class="invoice-details-header">
                <div>
                    <h2>${invoice.invoiceNumber}</h2>
                    <p class="invoice-date">${date}</p>
                </div>
                <span class="payment-status-badge status-${invoice.paymentStatus.toLowerCase()}">
                    ${invoice.paymentStatus}
                </span>
            </div>

            <div class="invoice-details-patient">
                <h3>Patient Information</h3>
                <p><strong>Name:</strong> ${invoice.patientName}</p>
                <p><strong>Phone:</strong> ${invoice.patientPhone}</p>
                <p><strong>Patient ID:</strong> ${invoice.patientId}</p>
            </div>

            <div class="invoice-details-items">
                <h3>Services</h3>
                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>GST</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>₹${item.price.toLocaleString()}</td>
                                <td>${item.gst}%</td>
                                <td>₹${(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="invoice-details-totals">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>₹${invoice.subtotal.toLocaleString()}</span>
                </div>
                <div class="total-row">
                    <span>GST Amount:</span>
                    <span>₹${invoice.gstAmount.toLocaleString()}</span>
                </div>
                ${invoice.discount > 0 ? `
                <div class="total-row">
                    <span>Discount:</span>
                    <span>-₹${invoice.discount.toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="total-row grand-total">
                    <span>Grand Total:</span>
                    <span>₹${invoice.total.toLocaleString()}</span>
                </div>
                <div class="total-row">
                    <span>Amount Paid:</span>
                    <span>₹${invoice.amountPaid.toLocaleString()}</span>
                </div>
                ${invoice.paymentStatus !== 'Paid' ? `
                <div class="total-row pending">
                    <span>Balance Due:</span>
                    <span>₹${(invoice.total - invoice.amountPaid).toLocaleString()}</span>
                </div>
                ` : ''}
            </div>

            <div class="invoice-details-payment">
                <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
                ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
            </div>
        `;

        if (modal) modal.classList.add('active');
    }

    // Close Invoice Details Modal
    closeInvoiceDetailsModal() {
        const modal = document.getElementById('invoiceDetailsModal');
        if (modal) modal.classList.remove('active');
    }

    // Download Invoice
    // Download Invoice
    downloadInvoice(invoiceId) {
        const invoice = this.manager.billingMgr.getInvoiceById(invoiceId);
        if (!invoice) return;

        // 🔥 Delegate to UI invoice renderer
        if (!window.InvoiceRenderer) {
            this.manager.showNotification('Invoice renderer not loaded', 'error');
            return;
        }

        window.InvoiceRenderer.downloadInvoice(invoice);

        this.manager.showNotification('Invoice opened for download', 'success');
    }


    // Record Payment
    recordPayment(invoiceId) {
        const invoice = this.manager.billingMgr.getInvoiceById(invoiceId);
        if (!invoice) return;

        const remaining = invoice.total - invoice.amountPaid;
        const amount = prompt(`Enter payment amount (Balance: ₹${remaining.toLocaleString()}):`, remaining);

        if (amount === null) return;

        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            this.manager.showNotification('Invalid amount', 'error');
            return;
        }

        const newPaid = invoice.amountPaid + paymentAmount;
        const newStatus = newPaid >= invoice.total ? 'Paid' : 'Partial';

        this.manager.billingMgr.updateInvoice(invoiceId, {
            amountPaid: newPaid,
            paymentStatus: newStatus
        });

        this.manager.showNotification('Payment recorded successfully', 'success');
        this.renderBillingView();
    }

    // Export Data
    exportBillingData() {
        const csv = this.manager.billingMgr.exportToCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing_data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.manager.showNotification('Billing data exported', 'success');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BillingHandlers;
}