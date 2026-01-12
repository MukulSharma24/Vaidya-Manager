-- clinic_sql.schema.sql
-- Creates clinicdb, all tables and initial lookup/sample data
SET NOCOUNT ON;
GO

-- Create database if not exists
IF DB_ID('clinicdb') IS NULL
BEGIN
  CREATE DATABASE clinicdb;
END
GO

USE clinicdb;
GO

/* --------------------------
   Master / lookup tables
   -------------------------- */
IF OBJECT_ID('dbo.DesignationMst','U') IS NULL
CREATE TABLE DesignationMst (
                                DesignationID INT IDENTITY(1,1) PRIMARY KEY,
                                Designation VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.PrefixMst','U') IS NULL
CREATE TABLE PrefixMst (
                           PrefixID INT IDENTITY(1,1) PRIMARY KEY,
                           Prefix VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.StaffCategoryMst','U') IS NULL
CREATE TABLE StaffCategoryMst (
                                  StaffCategoryID INT IDENTITY(1,1) PRIMARY KEY,
                                  StaffCategory VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.DepartmentMst','U') IS NULL
CREATE TABLE DepartmentMst (
                               DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
                               Department VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.UserRoleMst','U') IS NULL
CREATE TABLE UserRoleMst (
                             UserRoleID INT IDENTITY(1,1) PRIMARY KEY,
                             UserRole VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.ShiftTypeIDMst','U') IS NULL
CREATE TABLE ShiftTypeIDMst (
                                ShiftTypeID INT IDENTITY(1,1) PRIMARY KEY,
                                ShiftType VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.BloodGroupMst','U') IS NULL
CREATE TABLE BloodGroupMst (
                               BloodGroupID INT IDENTITY(1,1) PRIMARY KEY,
                               BloodGroupName VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.AppointmentTypeMst','U') IS NULL
CREATE TABLE AppointmentTypeMst(
                                   AppointmentTypeID INT IDENTITY(1,1) PRIMARY KEY,
                                   AppointmentType VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.ConstitutionTypeMst','U') IS NULL
CREATE TABLE ConstitutionTypeMst (
                                     ConstitutionTypeID INT IDENTITY(1,1) PRIMARY KEY,
                                     ConstitutionType VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.StatesMst','U') IS NULL
CREATE TABLE StatesMst (
                           StateID INT IDENTITY(1,1) PRIMARY KEY,
                           StateName VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.CitiesMst','U') IS NULL
CREATE TABLE CitiesMst (
                           CityID INT IDENTITY(1,1) PRIMARY KEY,
                           CityName VARCHAR(100) NOT NULL,
                           StateID INT NOT NULL
);
GO

IF OBJECT_ID('dbo.PostalCodesMst','U') IS NULL
CREATE TABLE PostalCodesMst (
                                PostalID INT IDENTITY(1,1) PRIMARY KEY,
                                Pincode VARCHAR(6) NOT NULL,
                                AreaName VARCHAR(150),
                                CityID INT NOT NULL,
                                StateID INT NOT NULL
);
GO

/* --------------------------
   Patients & Appointments
   -------------------------- */
IF OBJECT_ID('dbo.PatientMaster','U') IS NULL
CREATE TABLE PatientMaster (
                               PatientID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                               FirstName VARCHAR(200) NOT NULL,
                               MiddleName VARCHAR(100) NULL,
                               LastName VARCHAR(100) NULL,
                               DateOfBirth DATE NULL,
                               Age INT NULL,
                               GenderID INT NOT NULL,
                               PhoneNumber VARCHAR(15) NULL,
                               Email VARCHAR(250) NULL,
                               AddressLine1 VARCHAR(255) NULL,
                               AddressLine2 VARCHAR(255) NULL,
                               CityID INT NULL,
                               StateID INT NULL,
                               PostalID INT NULL,
                               Country VARCHAR(100) NULL,
                               BloodGroupID INT NULL,
                               ConstitutionTypeID INT NULL,
                               IsActive BIT NOT NULL DEFAULT 1,
                               CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                               CreatedBy INT NULL,
                               UpdatedAt DATETIME NULL,
                               UpdatedBy INT NULL
);
GO

IF OBJECT_ID('dbo.PatientSchedule','U') IS NULL
CREATE TABLE PatientSchedule (
                                 ScheduleID INT IDENTITY(1,1) PRIMARY KEY,
                                 PatientID INT NOT NULL,
                                 Mobile VARCHAR(15) NOT NULL,
                                 DepartmentID INT NOT NULL,
                                 DoctorID INT NOT NULL,
                                 AppointmentDate DATE NOT NULL,
                                 AppointmentStartTime TIME NOT NULL,
                                 AppointmentEndTime TIME NULL,
                                 AppointmentTypeID INT NULL,
                                 ConstitutionTypeID INT NULL,
                                 Note VARCHAR(500),
                                 AppointmentStatus VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
                                 IsCancelled BIT DEFAULT 0,
                                 CancelReason VARCHAR(250),
                                 CreatedBy INT NULL,
                                 CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                                 UpdatedBy INT NULL,
                                 UpdatedAt DATETIME
);
GO

/* --------------------------
   Staff
   -------------------------- */
IF OBJECT_ID('dbo.StaffMaster','U') IS NULL
CREATE TABLE StaffMaster (
                             StaffID INT IDENTITY(1,1) PRIMARY KEY,
                             PrefixID INT NULL,
                             FirstName VARCHAR(200) NOT NULL,
                             MiddleName VARCHAR(100),
                             LastName VARCHAR(100),
                             GenderID INT NOT NULL,
                             DOB DATETIME NOT NULL,
                             Mobile VARCHAR(15) NOT NULL,
                             AlternateMobile VARCHAR(15),
                             Email VARCHAR(250),
                             AddressLine1 VARCHAR(200),
                             AddressLine2 VARCHAR(200),
                             StateID INT,
                             CityID INT,
                             PostalCode INT,
                             StaffCategoryID INT NOT NULL,
                             DepartmentID INT,
                             DesignationID INT,
                             Specialty VARCHAR(100),
                             Qualification VARCHAR(150),
                             RegistrationNumber VARCHAR(100),
                             ExperienceYears INT,
                             DateOfJoining DATETIME,
                             WorkingStatus VARCHAR(20) DEFAULT 'Active',
                             ShiftTypeID INT,
                             Salary DECIMAL(10,2),
                             UserRoleID INT NOT NULL,
                             UserName VARCHAR(100),
                             Password VARCHAR(200),
                             CreatedBy INT NULL,
                             CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                             UpdatedBy INT NULL,
                             UpdatedAt DATETIME
);
GO

/* --------------------------
   Medicines & pharmacy
   -------------------------- */
IF OBJECT_ID('dbo.MedicinesCategoryMst','U') IS NULL
CREATE TABLE MedicinesCategoryMst (
                                      CategoryID INT IDENTITY(1,1) PRIMARY KEY,
                                      Category VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.MedicinesTypeMst','U') IS NULL
CREATE TABLE MedicinesTypeMst (
                                  MedicinesTypeID INT IDENTITY(1,1) PRIMARY KEY,
                                  MedicinesType VARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.Medicines','U') IS NULL
CREATE TABLE Medicines (
                           medicine_id INT IDENTITY PRIMARY KEY,
                           medicine_name VARCHAR(150) NOT NULL,
                           Sanskrit_name NVARCHAR(150) NULL,
                           brand_name VARCHAR(150),
                           CategoryID INT,
                           MedicinesTypeID INT,
                           dosage_strength VARCHAR(50),
                           manufacturer VARCHAR(150),
                           min_stock_level INT DEFAULT 0,
                           Timing VARCHAR(50),
                           is_active BIT DEFAULT 1,
                           CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                           CreatedBy INT NULL,
                           UpdatedAt DATETIME NULL,
                           UpdatedBy INT NULL
);
GO

IF OBJECT_ID('dbo.Medicine_Batches','U') IS NULL
CREATE TABLE Medicine_Batches (
                                  batch_id INT IDENTITY PRIMARY KEY,
                                  medicine_id INT NOT NULL,
                                  batch_number VARCHAR(100),
                                  mfg_date DATE,
                                  expiry_date DATE,
                                  purchase_rate DECIMAL(10,2),
                                  mrp_rate DECIMAL(10,2),
                                  selling_rate DECIMAL(10,2),
                                  quantity_in_stock INT NOT NULL,
                                  location_rack VARCHAR(50),
                                  CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                                  CreatedBy INT NULL,
                                  UpdatedAt DATETIME NULL,
                                  UpdatedBy INT NULL
);
GO

IF OBJECT_ID('dbo.Sales_Master','U') IS NULL
CREATE TABLE Sales_Master (
                              sale_id INT IDENTITY PRIMARY KEY,
                              bill_number VARCHAR(100),
                              customer_name VARCHAR(150),
                              sale_date DATETIME DEFAULT GETDATE(),
                              total_amount DECIMAL(12,2),
                              CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                              CreatedBy INT NULL,
                              UpdatedAt DATETIME NULL,
                              UpdatedBy INT NULL
);
GO

IF OBJECT_ID('dbo.Sales_Details','U') IS NULL
CREATE TABLE Sales_Details (
                               sale_detail_id INT IDENTITY PRIMARY KEY,
                               sale_id INT NOT NULL,
                               batch_id INT NOT NULL,
                               quantity_sold INT NOT NULL,
                               selling_rate DECIMAL(10,2),
                               total_amount AS (quantity_sold * selling_rate),
                               CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                               CreatedBy INT NULL,
                               UpdatedAt DATETIME NULL,
                               UpdatedBy INT NULL
);
GO

/* --------------------------
   Prescriptions
   -------------------------- */
IF OBJECT_ID('dbo.Prescription','U') IS NULL
CREATE TABLE Prescription (
                              PrescriptionID INT IDENTITY(1,1) PRIMARY KEY,
                              PrescriptionNumber VARCHAR(50) UNIQUE NOT NULL,
                              AppointmentID INT NULL,
                              PatientID INT NOT NULL,
                              DoctorID INT NOT NULL,
                              VisitDate DATE NOT NULL,
                              Notes VARCHAR(1000) NULL,
                              FollowUpDate DATE NULL,
                              CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                              CreatedBy INT NULL,
                              UpdatedAt DATETIME NULL,
                              UpdatedBy INT NULL
);
GO

IF OBJECT_ID('dbo.PrescriptionMedicine','U') IS NULL
CREATE TABLE PrescriptionMedicine (
                                      PrescriptionMedicineID INT IDENTITY(1,1) PRIMARY KEY,
                                      PrescriptionID INT NOT NULL,
                                      MedicineID INT NOT NULL,
                                      Dosage VARCHAR(100) NOT NULL,
                                      Frequency VARCHAR(50) NOT NULL,
                                      DurationDays INT NOT NULL,
                                      QuantityPrescribed INT NOT NULL,
                                      Instructions VARCHAR(500) NULL,
                                      CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                                      CreatedBy INT NULL,
                                      UpdatedAt DATETIME NULL,
                                      UpdatedBy INT NULL
);
GO

/* --------------------------
   Material / Therapy
   -------------------------- */
IF OBJECT_ID('dbo.MaterialMst','U') IS NULL
CREATE TABLE MaterialMst (
                             MaterialID INT IDENTITY(1,1) PRIMARY KEY,
                             MaterialName VARCHAR(200) NOT NULL,
                             Category VARCHAR(100) NULL,
                             Unit VARCHAR(20) NOT NULL,
                             CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                             CreatedBy INT NULL,
                             UpdatedAt DATETIME NULL,
                             UpdatedBy INT NULL
);
GO

IF OBJECT_ID('dbo.TherapyMaster','U') IS NULL
CREATE TABLE TherapyMaster (
                               TherapyID INT IDENTITY(1,1) PRIMARY KEY,
                               TherapyName VARCHAR(200) NOT NULL,
                               Category VARCHAR(100) NULL,
                               DurationMinutes INT NOT NULL,
                               Description VARCHAR(1000) NULL,
                               Price DECIMAL(10,2) NOT NULL,
                               CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                               CreatedBy INT NULL,
                               UpdatedAt DATETIME NULL,
                               UpdatedBy INT NULL
);
GO

IF OBJECT_ID('dbo.TherapyBooking','U') IS NULL
CREATE TABLE TherapyBooking (
                                BookingID INT IDENTITY(1,1) PRIMARY KEY,
                                BookingNumber VARCHAR(50) UNIQUE NOT NULL,
                                PatientID INT NOT NULL,
                                DoctorID INT NULL,
                                TherapyID INT NOT NULL,
                                BookingDate DATE NOT NULL,
                                StartDate DATE NULL,
                                EndDate DATE NULL,
                                NumberOfSessions INT NOT NULL,
                                Notes VARCHAR(1000) NULL,
                                Status VARCHAR(20) DEFAULT 'Scheduled',
                                CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                                CreatedBy INT NULL,
                                UpdatedAt DATETIME NULL,
                                UpdatedBy INT NULL
);
GO

IF OBJECT_ID('dbo.TherapySession','U') IS NULL
CREATE TABLE TherapySession (
                                SessionID INT IDENTITY(1,1) PRIMARY KEY,
                                BookingID INT NOT NULL,
                                SessionNumber INT NOT NULL,
                                TherapyDate DATETIME NOT NULL,
                                TherapistID INT NOT NULL,
                                DurationMinutes INT NOT NULL,
                                BP_Start VARCHAR(20) NULL,
                                BP_End VARCHAR(20) NULL,
                                Pulse_Start VARCHAR(20) NULL,
                                Pulse_End VARCHAR(20) NULL,
                                PatientFeedback VARCHAR(1000) NULL,
                                Status VARCHAR(20) DEFAULT 'Completed',
                                CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                                CreatedBy INT NULL,
                                UpdatedAt DATETIME NULL,
                                UpdatedBy INT NULL
);
GO

IF OBJECT_ID('dbo.TherapyMaterialUsage','U') IS NULL
CREATE TABLE TherapyMaterialUsage (
                                      UsageID INT IDENTITY(1,1) PRIMARY KEY,
                                      SessionID INT NOT NULL,
                                      MaterialID INT NOT NULL,
                                      QuantityUsed DECIMAL(10,2) NOT NULL,
                                      Remarks VARCHAR(500) NULL,
                                      CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                                      CreatedBy INT NULL,
                                      UpdatedAt DATETIME NULL,
                                      UpdatedBy INT NULL
);
GO

IF OBJECT_ID('dbo.TherapyBilling','U') IS NULL
CREATE TABLE TherapyBilling (
                                BillingID INT IDENTITY(1,1) PRIMARY KEY,
                                BookingID INT NOT NULL,
                                BillNumber VARCHAR(50) UNIQUE NOT NULL,
                                BillDate DATETIME NOT NULL,
                                TotalSessions INT NOT NULL,
                                TotalAmount DECIMAL(10,2) NOT NULL,
                                DiscountAmount DECIMAL(10,2) DEFAULT 0,
                                NetAmount AS (TotalAmount - DiscountAmount),
                                Status VARCHAR(20) DEFAULT 'Unpaid',
                                CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
                                CreatedBy INT NULL,
                                UpdatedAt DATETIME NULL,
                                UpdatedBy INT NULL
);
GO

/* --------------------------
   SchemaVersion marker
   -------------------------- */
IF OBJECT_ID('dbo.SchemaVersion','U') IS NULL
CREATE TABLE SchemaVersion (
                               VersionNum VARCHAR(50),
                               AppliedAt DATETIME DEFAULT SYSDATETIME()
);
GO

IF NOT EXISTS (SELECT * FROM SchemaVersion)
  INSERT INTO SchemaVersion (VersionNum) VALUES ('v1.0');
GO

/* --------------------------
   Seed lookup/sample data (idempotent)
   -------------------------- */

-- Designations
IF NOT EXISTS (SELECT 1 FROM dbo.DesignationMst)
BEGIN
INSERT INTO dbo.DesignationMst (Designation) VALUES
                                                 ('Doctor'),('Nurse'),('Receptionist'),('Pharmacist'),('Therapist');
END
GO

-- Prefix
IF NOT EXISTS (SELECT 1 FROM dbo.PrefixMst)
BEGIN
INSERT INTO dbo.PrefixMst (Prefix) VALUES ('Dr'),('Mr'),('Ms'),('Mrs');
END
GO

-- Departments
IF NOT EXISTS (SELECT 1 FROM dbo.DepartmentMst)
BEGIN
INSERT INTO dbo.DepartmentMst (Department) VALUES
                                               ('General Medicine'),('Ayurveda'),('Pharmacy'),('Therapy');
END
GO

-- Blood Groups
IF NOT EXISTS (SELECT 1 FROM dbo.BloodGroupMst)
BEGIN
INSERT INTO dbo.BloodGroupMst (BloodGroupName) VALUES
                                                   ('A+'),('A-'),('B+'),('B-'),('AB+'),('AB-'),('O+'),('O-');
END
GO

-- User Roles
IF NOT EXISTS (SELECT 1 FROM dbo.UserRoleMst)
BEGIN
INSERT INTO dbo.UserRoleMst (UserRole) VALUES ('Admin'),('Doctor'),('Receptionist'),('Pharmacist');
END
GO

-- Medicines Category & Types
IF NOT EXISTS (SELECT 1 FROM dbo.MedicinesCategoryMst)
BEGIN
INSERT INTO dbo.MedicinesCategoryMst (Category) VALUES ('Tablet'),('Syrup'),('Injection'),('Ointment'),('Powder');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.MedicinesTypeMst)
BEGIN
INSERT INTO dbo.MedicinesTypeMst (MedicinesType) VALUES ('Allopathic'),('Ayurvedic'),('Homeopathic');
END
GO

-- Appointment Types
IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentTypeMst)
BEGIN
INSERT INTO dbo.AppointmentTypeMst (AppointmentType) VALUES ('Consultation'),('Follow-up'),('Emergency'),('Therapy Session');
END
GO

-- Staff Categories
IF NOT EXISTS (SELECT 1 FROM dbo.StaffCategoryMst)
BEGIN
INSERT INTO dbo.StaffCategoryMst (StaffCategory) VALUES ('Medical'),('Administrative'),('Support'),('Technical');
END
GO

PRINT 'clinicdb schema & sample data applied';
GO
