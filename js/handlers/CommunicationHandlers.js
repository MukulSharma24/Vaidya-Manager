// CommunicationHandlers.js
// Enhanced Communication Handlers with Template Creation & Message Deletion

class CommunicationHandlers {
    constructor(manager) {
        console.log('CommunicationHandlers: Initializing...');
        this.manager = manager;
        this.communicationMgr = manager.communicationMgr;
        this.currentView = 'overview';
        this.selectedPatients = [];

        if (!this.communicationMgr) {
            console.error('CommunicationHandlers: CommunicationManager not found!');
            return;
        }

        console.log('CommunicationHandlers: Ready');
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        console.log('CommunicationHandlers: Setting up event listeners...');

        // Compose Message button
        const composeMessageBtn = document.getElementById('composeMessageBtn');
        if (composeMessageBtn) {
            composeMessageBtn.addEventListener('click', () => this.openComposeModal());
        }

        // Close modal buttons
        const closeComposeModalBtn = document.getElementById('closeComposeModalBtn');
        const cancelComposeBtn = document.getElementById('cancelComposeBtn');

        if (closeComposeModalBtn) {
            closeComposeModalBtn.addEventListener('click', () => this.closeComposeModal());
        }
        if (cancelComposeBtn) {
            cancelComposeBtn.addEventListener('click', () => this.closeComposeModal());
        }

        // Message type tabs
        const messageTypeTabs = document.querySelectorAll('.message-type-tab');
        messageTypeTabs.forEach(tab => {
            tab.addEventListener('click', () => this.handleMessageTypeChange(tab));
        });

        // Patient selection in compose modal
        const patientSelectAll = document.getElementById('patientSelectAll');
        if (patientSelectAll) {
            patientSelectAll.addEventListener('change', (e) => this.handleSelectAllPatients(e));
        }

        // Compose form submission
        const composeMessageForm = document.getElementById('composeMessageForm');
        if (composeMessageForm) {
            composeMessageForm.addEventListener('submit', (e) => this.handleMessageSend(e));
        }

        // Template search
        const templateSearchInput = document.getElementById('templateSearchInput');
        if (templateSearchInput) {
            templateSearchInput.addEventListener('input', (e) => this.filterTemplates(e.target.value));
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeComposeModal();
                this.closeCreateTemplateModal();
            }
        });

        // Click outside modal to close
        const composeModal = document.getElementById('composeMessageModal');
        if (composeModal) {
            composeModal.addEventListener('click', (e) => {
                if (e.target === composeModal) {
                    this.closeComposeModal();
                }
            });
        }

        console.log('CommunicationHandlers: Event listeners ready');
    }

    // Render the Communication Center view
    renderCommunicationView() {
        console.log('CommunicationHandlers: Rendering communication view...');

        try {
            this.renderMessageTemplates();
            this.renderRecentMessages();
            this.renderMessageStats();
            console.log('CommunicationHandlers: View rendered successfully');
        } catch (error) {
            console.error('CommunicationHandlers: Error rendering view:', error);
            this.manager.showNotification('Error loading communication center: ' + error.message, 'error');
        }
    }

    // Render message templates
    renderMessageTemplates() {
        const templatesContainer = document.getElementById('messageTemplatesContainer');
        if (!templatesContainer) {
            console.error('CommunicationHandlers: messageTemplatesContainer not found');
            return;
        }

        const templates = this.communicationMgr.getTemplates();
        console.log('CommunicationHandlers: Rendering', templates.length, 'templates');

        if (templates.length === 0) {
            templatesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>No templates found</h3>
                    <p>Create your first message template</p>
                    <button class="btn btn--primary" onclick="window.app.communicationHandlers.openCreateTemplateModal()">
                        Create Template
                    </button>
                </div>
            `;
            return;
        }

        templatesContainer.innerHTML = `
            <div class="message-template-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; cursor: pointer;" onclick="window.app.communicationHandlers.openCreateTemplateModal()">
                <div class="template-icon" style="font-size: 48px;">➕</div>
                <div class="template-content">
                    <h3 style="color: white;">Create New Template</h3>
                    <p style="color: rgba(255,255,255,0.9);">Add a custom message template</p>
                </div>
            </div>
        ` + templates.map(template => `
            <div class="message-template-card" data-template-id="${template.id}">
                <div class="template-icon">${template.icon}</div>
                <div class="template-content">
                    <h3>${template.name}</h3>
                    <p>${template.description}</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn--sm btn--outline" onclick="window.app.communicationHandlers.openTemplateView('${template.id}')">
                        View Patients
                    </button>
                    <button class="btn btn--sm" style="background: #ff4444; color: white; border: none;" onclick="window.app.communicationHandlers.deleteTemplate('${template.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Open create template modal
    openCreateTemplateModal() {
        const modalHTML = `
            <div id="createTemplateModal" class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Create New Template</h2>
                        <button class="modal-close" onclick="window.app.communicationHandlers.closeCreateTemplateModal()">&times;</button>
                    </div>
                    <form id="createTemplateForm" class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Template Name *</label>
                            <input type="text" id="templateName" class="form-control" required placeholder="e.g., Welcome Message">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Icon (Emoji)</label>
                            <input type="text" id="templateIcon" class="form-control" placeholder="📧" maxlength="2">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <input type="text" id="templateDescription" class="form-control" placeholder="Brief description of this template">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Message Body *</label>
                            <textarea id="templateBody" class="form-control" rows="5" required placeholder="Use {PatientName}, {Date}, {Time}, {AppointmentType} as placeholders"></textarea>
                            <small style="color: #666; display: block; margin-top: 8px;">
                                Available placeholders: {PatientName}, {Date}, {Time}, {AppointmentType}
                            </small>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn--outline" onclick="window.app.communicationHandlers.closeCreateTemplateModal()">Cancel</button>
                            <button type="submit" class="btn btn--primary">Create Template</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('createTemplateModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup form submission
        const form = document.getElementById('createTemplateForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCreateTemplate(e));
        }
    }

    // Close create template modal
    closeCreateTemplateModal() {
        const modal = document.getElementById('createTemplateModal');
        if (modal) {
            modal.remove();
        }
    }

    // Handle create template
    handleCreateTemplate(e) {
        e.preventDefault();

        const templateData = {
            name: document.getElementById('templateName').value,
            icon: document.getElementById('templateIcon').value || '📧',
            description: document.getElementById('templateDescription').value,
            body: document.getElementById('templateBody').value
        };

        try {
            this.communicationMgr.createTemplate(templateData);
            this.manager.showNotification('Template created successfully!', 'success');
            this.closeCreateTemplateModal();
            this.renderMessageTemplates();
        } catch (error) {
            this.manager.showNotification('Error creating template: ' + error.message, 'error');
        }
    }

    // Delete template
    deleteTemplate(templateId) {
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                this.communicationMgr.deleteTemplate(templateId);
                this.manager.showNotification('Template deleted successfully!', 'success');
                this.renderMessageTemplates();
            } catch (error) {
                this.manager.showNotification('Error deleting template: ' + error.message, 'error');
            }
        }
    }

    // Render recent messages
    renderRecentMessages() {
        const recentMessagesContainer = document.getElementById('recentMessagesContainer');
        if (!recentMessagesContainer) return;

        const recentMessages = this.communicationMgr.getRecentMessages(10);
        console.log('CommunicationHandlers: Rendering', recentMessages.length, 'recent messages');

        if (recentMessages.length === 0) {
            recentMessagesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📧</div>
                    <h3>No messages yet</h3>
                    <p>Start sending messages to your patients</p>
                </div>
            `;
            return;
        }

        recentMessagesContainer.innerHTML = recentMessages.map(message => `
            <div class="recent-message-item" data-message-id="${message.id}">
                <div class="message-info">
                    <h4>${message.subject}</h4>
                    <p>${message.type === 'bulk' ? `Sent to ${message.sentTo} patients` : `Sent to ${message.recipients[0].name}`}</p>
                    <span class="message-time">${this.communicationMgr.formatRelativeTime(message.sentAt)}</span>
                </div>
                <div class="message-status">
                    <span class="status-badge status-${message.status}">${this.formatStatus(message.status)}</span>
                    <button class="btn btn--sm" style="background: #ff4444; color: white; border: none; margin-left: 8px;" onclick="window.app.communicationHandlers.deleteMessage('${message.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Delete message
    deleteMessage(messageId) {
        if (confirm('Are you sure you want to delete this message?')) {
            try {
                this.communicationMgr.deleteMessage(messageId);
                this.manager.showNotification('Message deleted successfully!', 'success');
                this.renderRecentMessages();
                this.renderMessageStats();
            } catch (error) {
                this.manager.showNotification('Error deleting message: ' + error.message, 'error');
            }
        }
    }

    // Render message statistics
    renderMessageStats() {
        const stats = this.communicationMgr.getMessageStats();

        const totalMessagesEl = document.getElementById('totalMessagesCount');
        const todayMessagesEl = document.getElementById('todayMessagesCount');
        const thisMonthMessagesEl = document.getElementById('thisMonthMessagesCount');

        if (totalMessagesEl) totalMessagesEl.textContent = stats.totalMessages;
        if (todayMessagesEl) todayMessagesEl.textContent = stats.todayMessages;
        if (thisMonthMessagesEl) thisMonthMessagesEl.textContent = stats.thisMonthMessages;
    }

    // Open template-specific view
    openTemplateView(templateId) {
        console.log('CommunicationHandlers: Opening template view:', templateId);

        const template = this.communicationMgr.getTemplateById(templateId);
        if (!template) return;

        // Switch to detailed view
        const overviewSection = document.getElementById('communicationOverview');
        const detailSection = document.getElementById('communicationDetail');

        if (overviewSection) overviewSection.style.display = 'none';
        if (detailSection) detailSection.style.display = 'block';

        // Render patients based on template type
        this.renderTemplatePatientsView(templateId);
    }

    // Render patients for specific template
    renderTemplatePatientsView(templateId) {
        const detailHeaderEl = document.getElementById('detailViewHeader');
        const patientListEl = document.getElementById('templatePatientsList');
        const backToOverviewBtn = document.getElementById('backToOverviewBtn');
        const sendToAllBtn = document.getElementById('sendToAllBtn');

        if (!detailHeaderEl || !patientListEl) return;

        const template = this.communicationMgr.getTemplateById(templateId);
        let patients = [];

        // Get patients based on template type
        if (templateId === 'appointment_reminder') {
            patients = this.communicationMgr.getAppointmentReminderPatients(this.manager.appointmentsManager);
            detailHeaderEl.innerHTML = `
                <div>
                    <h2>📅 Appointment Reminders</h2>
                    <p>Patients with appointments scheduled for today (${patients.length} patients)</p>
                </div>
            `;
        } else if (templateId === 'follow_up_reminder') {
            patients = this.communicationMgr.getFollowUpPatients(
                this.manager.appointmentsManager,
                this.manager.patientMgmt
            );
            detailHeaderEl.innerHTML = `
                <div>
                    <h2>🔔 Follow-up Reminders</h2>
                    <p>Patients who need follow-up consultations (${patients.length} patients)</p>
                </div>
            `;
        } else if (templateId === 'treatment_completion') {
            patients = this.communicationMgr.getTreatmentCompletionPatients(
                this.manager.patientMgmt,
                this.manager.appointmentsManager
            );
            detailHeaderEl.innerHTML = `
                <div>
                    <h2>✅ Treatment Completion</h2>
                    <p>Patients who recently completed their treatment (${patients.length} patients)</p>
                </div>
            `;
        } else {
            // Show all patients with status
            patients = this.communicationMgr.getPatientsWithAppointmentStatus(
                this.manager.appointmentsManager,
                this.manager.patientMgmt
            );
            detailHeaderEl.innerHTML = `
                <div>
                    <h2>${template.icon} ${template.name}</h2>
                    <p>${template.description} (${patients.length} patients)</p>
                </div>
            `;
        }

        // Render patient list
        if (patients.length === 0) {
            patientListEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>No patients found</h3>
                    <p>There are no patients matching this criteria at the moment</p>
                </div>
            `;
            if (sendToAllBtn) sendToAllBtn.disabled = true;
        } else {
            patientListEl.innerHTML = patients.map((patient, index) => `
                <div class="patient-message-item">
                    <input type="checkbox" class="patient-checkbox" data-patient-index="${index}" 
                           data-patient='${JSON.stringify(patient).replace(/'/g, "&apos;")}'>
                    <div class="patient-info">
                        <h4>${patient.name}</h4>
                        <p>${patient.phone}</p>
                        <span class="patient-context">${patient.appointmentStatus || 'No appointment'}</span>
                        ${this.getPatientContextInfo(patient, templateId)}
                    </div>
                    <button class="btn btn--sm btn--outline" 
                            onclick="window.app.communicationHandlers.sendMessageToPatient('${templateId}', ${index})">
                        Send Message
                    </button>
                </div>
            `).join('');
            if (sendToAllBtn) sendToAllBtn.disabled = false;
        }

        // Setup back button
        if (backToOverviewBtn) {
            backToOverviewBtn.onclick = () => {
                const overviewSection = document.getElementById('communicationOverview');
                const detailSection = document.getElementById('communicationDetail');
                if (overviewSection) overviewSection.style.display = 'block';
                if (detailSection) detailSection.style.display = 'none';
            };
        }

        // Setup send to all button
        if (sendToAllBtn) {
            sendToAllBtn.onclick = () => this.sendBulkMessageToPatients(templateId, patients);
        }
    }

    // Get context information for patient
    getPatientContextInfo(patient, templateId) {
        if (templateId === 'appointment_reminder' && patient.appointmentTime) {
            return `<span class="patient-context">Time: ${patient.appointmentTime} | ${patient.appointmentType}</span>`;
        } else if (templateId === 'follow_up_reminder' && patient.daysSinceVisit) {
            return `<span class="patient-context">Last visit: ${patient.daysSinceVisit} days ago</span>`;
        } else if (templateId === 'treatment_completion' && patient.totalTreatments) {
            return `<span class="patient-context">Treatments: ${patient.totalTreatments}</span>`;
        }
        return '';
    }

    // Send message to individual patient
    sendMessageToPatient(templateId, patientIndex) {
        const checkboxes = document.querySelectorAll('.patient-checkbox');
        const checkbox = Array.from(checkboxes)[patientIndex];

        if (!checkbox) return;

        const patient = JSON.parse(checkbox.dataset.patient);

        try {
            this.communicationMgr.sendIndividualMessage(
                patient,
                templateId,
                null,
                this.manager.currentUser || 'System'
            );

            this.manager.showNotification(`Message sent to ${patient.name}`, 'success');
            this.renderRecentMessages();
            this.renderMessageStats();
        } catch (error) {
            this.manager.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // Send bulk message to patients
    sendBulkMessageToPatients(templateId, patients) {
        if (patients.length === 0) {
            this.manager.showNotification('No patients to send messages to', 'warning');
            return;
        }

        const confirmation = confirm(`Send message to all ${patients.length} patient${patients.length > 1 ? 's' : ''}?`);
        if (!confirmation) return;

        try {
            this.communicationMgr.sendBulkMessage(
                patients,
                templateId,
                null,
                this.manager.currentUser || 'System'
            );

            this.manager.showNotification(`Messages sent to ${patients.length} patient${patients.length > 1 ? 's' : ''}`, 'success');
            this.renderRecentMessages();
            this.renderMessageStats();
        } catch (error) {
            this.manager.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // Open compose modal
    openComposeModal() {
        const modal = document.getElementById('composeMessageModal');
        if (modal) {
            modal.classList.add('active');
            this.loadPatientsForCompose();
        }
    }

    // Close compose modal
    closeComposeModal() {
        const modal = document.getElementById('composeMessageModal');
        if (modal) {
            modal.classList.remove('active');
        }

        const form = document.getElementById('composeMessageForm');
        if (form) form.reset();
    }

    // Handle message type change
    handleMessageTypeChange(tab) {
        const allTabs = document.querySelectorAll('.message-type-tab');
        allTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const messageType = tab.dataset.type;
        const individualSection = document.getElementById('individualMessageSection');
        const groupSection = document.getElementById('groupMessageSection');

        if (messageType === 'individual') {
            if (individualSection) individualSection.style.display = 'block';
            if (groupSection) groupSection.style.display = 'none';
        } else {
            if (individualSection) individualSection.style.display = 'none';
            if (groupSection) groupSection.style.display = 'block';
        }
    }

    // Load patients for compose
    loadPatientsForCompose() {
        const patientsList = document.getElementById('composePatientsSelectionList');
        const individualPatientSelect = document.getElementById('individualPatientSelect');

        const allPatients = this.communicationMgr.getPatientsWithAppointmentStatus(
            this.manager.appointmentsManager,
            this.manager.patientMgmt
        );

        // Group message checkboxes
        if (patientsList) {
            patientsList.innerHTML = allPatients.map((patient, index) => `
                <div class="compose-patient-item">
                    <input type="checkbox" class="compose-patient-checkbox" 
                           id="compose-patient-${index}" 
                           data-patient='${JSON.stringify(patient).replace(/'/g, "&apos;")}'>
                    <label for="compose-patient-${index}">
                        <strong>${patient.name}</strong>
                        <span>${patient.phone} • ${patient.appointmentStatus}</span>
                    </label>
                </div>
            `).join('');
        }

        // Individual dropdown
        if (individualPatientSelect) {
            individualPatientSelect.innerHTML = '<option value="">Select a patient...</option>' +
                allPatients.map(patient => `
                    <option value='${JSON.stringify(patient).replace(/'/g, "&apos;")}'>${patient.name} (${patient.phone}) - ${patient.appointmentStatus}</option>
                `).join('');
        }
    }

    // Handle select all
    handleSelectAllPatients(e) {
        const checkboxes = document.querySelectorAll('.compose-patient-checkbox');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
    }

    // Handle message send
    handleMessageSend(e) {
        e.preventDefault();

        const messageType = document.querySelector('.message-type-tab.active').dataset.type;
        const templateSelect = document.getElementById('composeTemplateSelect');
        const customMessage = document.getElementById('composeCustomMessage');

        if (!templateSelect) return;

        const templateId = templateSelect.value;
        const messageBody = customMessage ? customMessage.value.trim() : '';

        if (!templateId) {
            this.manager.showNotification('Please select a message template', 'warning');
            return;
        }

        if (messageType === 'individual') {
            const individualPatientSelect = document.getElementById('individualPatientSelect');
            if (!individualPatientSelect || !individualPatientSelect.value) {
                this.manager.showNotification('Please select a patient', 'warning');
                return;
            }

            const selectedPatient = JSON.parse(individualPatientSelect.value);

            try {
                this.communicationMgr.sendIndividualMessage(
                    selectedPatient,
                    templateId,
                    messageBody || null,
                    this.manager.currentUser || 'System'
                );

                this.manager.showNotification(`Message sent to ${selectedPatient.name}`, 'success');
                this.closeComposeModal();
                this.renderRecentMessages();
                this.renderMessageStats();
            } catch (error) {
                this.manager.showNotification(`Error: ${error.message}`, 'error');
            }
        } else {
            const selectedCheckboxes = document.querySelectorAll('.compose-patient-checkbox:checked');
            const selectedPatients = Array.from(selectedCheckboxes).map(cb =>
                JSON.parse(cb.dataset.patient)
            );

            if (selectedPatients.length === 0) {
                this.manager.showNotification('Please select at least one patient', 'warning');
                return;
            }

            try {
                this.communicationMgr.sendBulkMessage(
                    selectedPatients,
                    templateId,
                    messageBody || null,
                    this.manager.currentUser || 'System'
                );

                this.manager.showNotification(`Messages sent to ${selectedPatients.length} patient${selectedPatients.length > 1 ? 's' : ''}`, 'success');
                this.closeComposeModal();
                this.renderRecentMessages();
                this.renderMessageStats();
            } catch (error) {
                this.manager.showNotification(`Error: ${error.message}`, 'error');
            }
        }
    }

    // Filter templates
    filterTemplates(searchTerm) {
        const templates = document.querySelectorAll('.message-template-card');
        const term = searchTerm.toLowerCase();

        templates.forEach(template => {
            const text = template.textContent.toLowerCase();
            if (text.includes(term)) {
                template.style.display = 'flex';
            } else {
                template.style.display = 'none';
            }
        });
    }

    // Format status
    formatStatus(status) {
        const statusMap = {
            'sent': 'Sent',
            'delivered': 'Delivered',
            'read': 'Read',
            'failed': 'Failed'
        };
        return statusMap[status] || status;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunicationHandlers;
}