-- 03_staff_tables.sql - Prescription tables

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Prescription')
BEGIN
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
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PrescriptionMedicine')
BEGIN
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
END