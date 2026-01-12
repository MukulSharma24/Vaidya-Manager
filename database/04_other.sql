USE clinicdb;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MaterialMst')
BEGIN
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
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TherapyMaster')
BEGIN
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
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TherapyBooking')
BEGIN
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
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TherapySession')
BEGIN
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
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TherapyMaterialUsage')
BEGIN
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
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TherapyBilling')
BEGIN
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
END