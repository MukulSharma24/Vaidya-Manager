// CommunicationManager.js
// Enhanced Communication Manager with Template Creation & Message Deletion

class CommunicationManager {
    constructor() {
        console.log('CommunicationManager: Initializing...');

        this.messageTemplates = this.loadTemplates();
        this.messages = this.loadMessages();

        // Initialize with default templates if none exist
        if (Object.keys(this.messageTemplates).length === 0) {
            this.initializeDefaultTemplates();
        }

        console.log('CommunicationManager: Loaded', Object.keys(this.messageTemplates).length, 'templates');
        console.log('CommunicationManager: Loaded', this.messages.length, 'messages');
    }

    // Load templates from localStorage
    loadTemplates() {
        const stored = localStorage.getItem('svmMessageTemplates');
        if (stored) {
            return JSON.parse(stored);
        }
        return {};
    }

    // Save templates to localStorage
    saveTemplates() {
        localStorage.setItem('svmMessageTemplates', JSON.stringify(this.messageTemplates));
        console.log('CommunicationManager: Templates saved');
    }

    // Initialize default templates
    initializeDefaultTemplates() {
        console.log('CommunicationManager: Creating default templates...');

        this.messageTemplates = {
            appointment_reminder: {
                id: 'appointment_reminder',
                name: 'Appointment Reminder',
                subject: 'Appointment Reminder',
                body: 'Dear {PatientName}, your appointment is scheduled for {Date} at {Time}. Type: {AppointmentType}',
                icon: '📅',
                description: 'Automatic reminders for upcoming appointments',
                createdAt: new Date().toISOString()
            },
            follow_up_reminder: {
                id: 'follow_up_reminder',
                name: 'Follow-up Reminder',
                subject: 'Follow-up Consultation Reminder',
                body: "Dear {PatientName}, it's time for your follow-up consultation. Please book your appointment.",
                icon: '🔔',
                description: 'Reminders for patients needing follow-up consultations',
                createdAt: new Date().toISOString()
            },
            treatment_completion: {
                id: 'treatment_completion',
                name: 'Treatment Completion',
                subject: 'Treatment Course Completed',
                body: 'Dear {PatientName}, congratulations on completing your treatment course. Please continue following your prescribed diet.',
                icon: '✅',
                description: 'Notifications for completed treatment courses',
                createdAt: new Date().toISOString()
            },
            therapy_reminder: {
                id: 'therapy_reminder',
                name: 'Therapy Session Reminder',
                subject: 'Panchakarma Therapy Reminder',
                body: 'Dear {PatientName}, your therapy session is scheduled for {Date} at {Time}.',
                icon: '🧘',
                description: 'Reminders for scheduled therapy sessions',
                createdAt: new Date().toISOString()
            },
            prescription_ready: {
                id: 'prescription_ready',
                name: 'Prescription Ready',
                subject: 'Your Prescription is Ready',
                body: 'Dear {PatientName}, your prescription is ready for pickup at our clinic.',
                icon: '💊',
                description: 'Notification when prescription is ready',
                createdAt: new Date().toISOString()
            },
            diet_plan_update: {
                id: 'diet_plan_update',
                name: 'Diet Plan Update',
                subject: 'New Diet Plan Available',
                body: 'Dear {PatientName}, your personalized diet plan has been updated.',
                icon: '🥗',
                description: 'Notifications for diet plan changes',
                createdAt: new Date().toISOString()
            }
        };

        this.saveTemplates();
        console.log('CommunicationManager: Default templates created');
    }

    // Load messages from localStorage
    loadMessages() {
        const stored = localStorage.getItem('svmMessages');
        return stored ? JSON.parse(stored) : [];
    }

    // Save messages to localStorage
    saveMessages() {
        localStorage.setItem('svmMessages', JSON.stringify(this.messages));
    }

    // Generate unique ID
    generateId() {
        return 'ID' + Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // CREATE NEW TEMPLATE
    createTemplate(templateData) {
        const templateId = templateData.id || this.generateId();

        const newTemplate = {
            id: templateId,
            name: templateData.name,
            subject: templateData.subject || templateData.name,
            body: templateData.body,
            icon: templateData.icon || '📧',
            description: templateData.description || '',
            createdAt: new Date().toISOString()
        };

        this.messageTemplates[templateId] = newTemplate;
        this.saveTemplates();

        console.log('CommunicationManager: Template created:', templateId);
        return newTemplate;
    }

    // DELETE TEMPLATE
    deleteTemplate(templateId) {
        if (this.messageTemplates[templateId]) {
            delete this.messageTemplates[templateId];
            this.saveTemplates();
            console.log('CommunicationManager: Template deleted:', templateId);
            return true;
        }
        return false;
    }

    // DELETE MESSAGE
    deleteMessage(messageId) {
        const index = this.messages.findIndex(m => m.id === messageId);
        if (index !== -1) {
            this.messages.splice(index, 1);
            this.saveMessages();
            console.log('CommunicationManager: Message deleted:', messageId);
            return true;
        }
        return false;
    }

    // Get all templates
    getTemplates() {
        return Object.values(this.messageTemplates);
    }

    // Get template by ID
    getTemplateById(templateId) {
        return this.messageTemplates[templateId];
    }

    // Get recent messages
    getRecentMessages(limit = 10) {
        return this.messages
            .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
            .slice(0, limit);
    }

    // Get patients with appointment status
    getPatientsWithAppointmentStatus(appointmentsManager, patientManagement) {
        if (!appointmentsManager || !patientManagement) {
            console.warn('CommunicationManager: Missing managers for patient status');
            return [];
        }

        const patients = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        patientManagement.patients.forEach(patient => {
            // Find patient's appointments
            const patientAppointments = appointmentsManager.appointments.filter(
                apt => apt.patientId === patient.id
            );

            // Determine appointment status
            let appointmentStatus = 'No upcoming appointment';
            let nextAppointment = null;

            patientAppointments.forEach(apt => {
                const aptDate = new Date(apt.date);
                aptDate.setHours(0, 0, 0, 0);

                if (apt.status === 'scheduled') {
                    if (aptDate.getTime() === today.getTime()) {
                        appointmentStatus = '📅 Today';
                        nextAppointment = apt;
                    } else if (aptDate.getTime() === tomorrow.getTime()) {
                        appointmentStatus = '📅 Tomorrow';
                        nextAppointment = apt;
                    } else if (aptDate > today && (!nextAppointment || aptDate < new Date(nextAppointment.date))) {
                        appointmentStatus = `📅 ${aptDate.toLocaleDateString('en-IN')}`;
                        nextAppointment = apt;
                    }
                }
            });

            patients.push({
                id: patient.id,
                name: patient.name,
                phone: patient.phone,
                email: patient.email || '',
                constitution: patient.constitution,
                appointmentStatus: appointmentStatus,
                nextAppointment: nextAppointment,
                totalTreatments: patient.treatments,
                lastVisit: patient.lastVisit
            });
        });

        return patients;
    }

    // Get today's appointment patients
    getAppointmentReminderPatients(appointmentsManager) {
        if (!appointmentsManager) return [];

        const todaysAppointments = appointmentsManager.getTodaysAppointments();
        const scheduledAppointments = todaysAppointments.filter(apt => apt.status === 'scheduled');

        console.log('CommunicationManager: Found', scheduledAppointments.length, 'scheduled appointments today');

        return scheduledAppointments.map(apt => ({
            id: apt.patientId || apt.id,
            name: apt.patientName,
            phone: apt.patientPhone,
            appointmentDate: apt.date,
            appointmentTime: apt.time,
            appointmentType: apt.appointmentType || apt.type,
            constitution: apt.constitution
        }));
    }

    // Get follow-up patients
    getFollowUpPatients(appointmentsManager, patientManagement) {
        if (!appointmentsManager || !patientManagement) return [];

        const followUpPatients = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        appointmentsManager.appointments.forEach(apt => {
            if (apt.status === 'completed') {
                const aptDate = new Date(apt.date);
                aptDate.setHours(0, 0, 0, 0);
                const daysSinceAppointment = Math.floor((today - aptDate) / (1000 * 60 * 60 * 24));

                if (daysSinceAppointment >= 15 && daysSinceAppointment <= 30) {
                    const hasFollowUp = appointmentsManager.appointments.some(followUp =>
                        followUp.patientName === apt.patientName &&
                        (followUp.appointmentType === 'Follow-up' || followUp.type === 'Follow-up') &&
                        followUp.status === 'scheduled' &&
                        new Date(followUp.date) > today
                    );

                    if (!hasFollowUp && !followUpPatients.find(p => p.name === apt.patientName)) {
                        const patient = patientManagement.getPatientById(apt.patientId);

                        followUpPatients.push({
                            id: apt.patientId || apt.id,
                            name: apt.patientName,
                            phone: apt.patientPhone,
                            lastVisit: apt.date,
                            daysSinceVisit: daysSinceAppointment,
                            constitution: patient ? patient.constitution : apt.constitution,
                            email: patient ? patient.email : ''
                        });
                    }
                }
            }
        });

        console.log('CommunicationManager: Found', followUpPatients.length, 'follow-up patients');
        return followUpPatients;
    }

    // Get treatment completion patients
    getTreatmentCompletionPatients(patientManagement, appointmentsManager) {
        if (!patientManagement || !appointmentsManager) return [];

        const completedPatients = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        patientManagement.patients.forEach(patient => {
            const completedAppointments = appointmentsManager.appointments.filter(apt =>
                apt.patientId === patient.id &&
                apt.status === 'completed'
            ).sort((a, b) => new Date(b.date) - new Date(a.date));

            if (completedAppointments.length > 0 && patient.treatments >= 5) {
                const lastCompleted = completedAppointments[0];
                const completionDate = new Date(lastCompleted.date);
                completionDate.setHours(0, 0, 0, 0);
                const daysSinceCompletion = Math.floor((today - completionDate) / (1000 * 60 * 60 * 24));

                if (daysSinceCompletion <= 7) {
                    completedPatients.push({
                        id: patient.id,
                        name: patient.name,
                        phone: patient.phone,
                        treatmentType: lastCompleted.appointmentType || 'Treatment Course',
                        completedDate: lastCompleted.date,
                        daysSinceCompletion: daysSinceCompletion,
                        totalTreatments: patient.treatments,
                        constitution: patient.constitution,
                        email: patient.email
                    });
                }
            }
        });

        console.log('CommunicationManager: Found', completedPatients.length, 'completed treatment patients');
        return completedPatients;
    }

    // Send individual message
    sendIndividualMessage(recipient, templateId, customBody = null, sentBy = 'System') {
        const template = this.getTemplateById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        let body = customBody || template.body;

        // Replace placeholders
        body = body.replace('{PatientName}', recipient.name);

        if (recipient.appointmentDate) {
            const dateStr = new Date(recipient.appointmentDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            body = body.replace('{Date}', dateStr);
        }

        if (recipient.appointmentTime) {
            body = body.replace('{Time}', recipient.appointmentTime);
        }

        if (recipient.appointmentType) {
            body = body.replace('{AppointmentType}', recipient.appointmentType);
        }

        const message = {
            id: this.generateId(),
            type: 'individual',
            templateId: templateId,
            subject: `Individual Message - ${recipient.name}`,
            recipients: [recipient],
            body: body,
            status: 'sent',
            sentAt: new Date().toISOString(),
            sentBy: sentBy
        };

        this.messages.unshift(message);
        this.saveMessages();

        console.log('CommunicationManager: Individual message sent to', recipient.name);
        return message;
    }

    // Send bulk message
    sendBulkMessage(recipients, templateId, customBody = null, sentBy = 'System') {
        const template = this.getTemplateById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        const message = {
            id: this.generateId(),
            type: 'bulk',
            templateId: templateId,
            subject: `Bulk Message - ${template.name}`,
            recipients: recipients,
            sentTo: recipients.length,
            body: customBody || template.body,
            status: 'delivered',
            sentAt: new Date().toISOString(),
            sentBy: sentBy
        };

        this.messages.unshift(message);
        this.saveMessages();

        console.log('CommunicationManager: Bulk message sent to', recipients.length, 'patients');
        return message;
    }

    // Get message statistics
    getMessageStats() {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7);

        return {
            totalMessages: this.messages.length,
            todayMessages: this.messages.filter(m =>
                m.sentAt.split('T')[0] === today
            ).length,
            thisMonthMessages: this.messages.filter(m =>
                m.sentAt.slice(0, 7) === thisMonth
            ).length,
            deliveredMessages: this.messages.filter(m =>
                m.status === 'delivered' || m.status === 'read'
            ).length
        };
    }

    // Format relative time
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString('en-IN');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunicationManager;
}