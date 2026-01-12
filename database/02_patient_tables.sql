-- 02_patient_tables.sql - Medicine and sales tables
-- Remove the "USE clinicdb; GO" since it's already being run against clinicdb

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MedicinesCategoryMst')
BEGIN
CREATE TABLE MedicinesCategoryMst (
                                      CategoryID INT IDENTITY(1,1) PRIMARY KEY,
                                      Category VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MedicinesTypeMst')
BEGIN
CREATE TABLE MedicinesTypeMst (
                                  MedicinesTypeID INT IDENTITY(1,1) PRIMARY KEY,
                                  MedicinesType VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Medicines')
BEGIN
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
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Medicine_Batches')
BEGIN
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
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sales_Master')
BEGIN
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
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sales_Details')
BEGIN
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
END