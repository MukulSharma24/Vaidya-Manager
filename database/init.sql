-- init.sql - Sample data insertion
-- Database already created by db-init container

-- Designations
IF NOT EXISTS (SELECT * FROM DesignationMst)
BEGIN
INSERT INTO DesignationMst (Designation) VALUES
                                             ('Doctor'),
                                             ('Nurse'),
                                             ('Receptionist'),
                                             ('Pharmacist'),
                                             ('Therapist');
END

-- Departments
IF NOT EXISTS (SELECT * FROM DepartmentMst)
BEGIN
INSERT INTO DepartmentMst (Department) VALUES
                                           ('General Medicine'),
                                           ('Ayurveda'),
                                           ('Pharmacy'),
                                           ('Therapy');
END

-- Blood Groups
IF NOT EXISTS (SELECT * FROM BloodGroupMst)
BEGIN
INSERT INTO BloodGroupMst (BloodGroupName) VALUES
                                               ('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-');
END

-- User Roles
IF NOT EXISTS (SELECT * FROM UserRoleMst)
BEGIN
INSERT INTO UserRoleMst (UserRole) VALUES
                                       ('Admin'),
                                       ('Doctor'),
                                       ('Receptionist'),
                                       ('Pharmacist');
END

-- Medicine Categories
IF NOT EXISTS (SELECT * FROM MedicinesCategoryMst)
BEGIN
INSERT INTO MedicinesCategoryMst (Category) VALUES
                                                ('Tablet'),
                                                ('Syrup'),
                                                ('Injection'),
                                                ('Ointment'),
                                                ('Powder');
END

-- Medicine Types
IF NOT EXISTS (SELECT * FROM MedicinesTypeMst)
BEGIN
INSERT INTO MedicinesTypeMst (MedicinesType) VALUES
                                                 ('Allopathic'),
                                                 ('Ayurvedic'),
                                                 ('Homeopathic');
END

-- Appointment Types
IF NOT EXISTS (SELECT * FROM AppointmentTypeMst)
BEGIN
INSERT INTO AppointmentTypeMst (AppointmentType) VALUES
                                                     ('Consultation'),
                                                     ('Follow-up'),
                                                     ('Emergency'),
                                                     ('Therapy Session');
END

-- Staff Categories (IMPORTANT: needed for StaffMaster)
IF NOT EXISTS (SELECT * FROM StaffCategoryMst)
BEGIN
INSERT INTO StaffCategoryMst (StaffCategory) VALUES
                                                 ('Medical'),
                                                 ('Administrative'),
                                                 ('Support'),
                                                 ('Technical');
END

PRINT 'Sample data inserted successfully!';