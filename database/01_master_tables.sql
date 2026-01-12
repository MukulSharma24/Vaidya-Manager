/* 01_master_tables.sql - Master / lookup tables and Patient / Staff core tables */

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DesignationMst')
BEGIN
CREATE TABLE DesignationMst (
  DesignationID INT IDENTITY(1,1) PRIMARY KEY,
  Designation VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PrefixMst')
BEGIN
CREATE TABLE PrefixMst (
  PrefixID INT IDENTITY(1,1) PRIMARY KEY,
  Prefix VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StaffCategoryMst')
BEGIN
CREATE TABLE StaffCategoryMst (
  StaffCategoryID INT IDENTITY(1,1) PRIMARY KEY,
  StaffCategory VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DepartmentMst')
BEGIN
CREATE TABLE DepartmentMst (
  DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
  Department VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoleMst')
BEGIN
CREATE TABLE UserRoleMst (
  UserRoleID INT IDENTITY(1,1) PRIMARY KEY,
  UserRole VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ShiftTypeIDMst')
BEGIN
CREATE TABLE ShiftTypeIDMst (
  ShiftTypeID INT IDENTITY(1,1) PRIMARY KEY,
  ShiftType VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BloodGroupMst')
BEGIN
CREATE TABLE BloodGroupMst (
  BloodGroupID INT IDENTITY(1,1) PRIMARY KEY,
  BloodGroupName VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AppointmentTypeMst')
BEGIN
CREATE TABLE AppointmentTypeMst(
  AppointmentTypeID INT IDENTITY(1,1) PRIMARY KEY,
  AppointmentType VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ConstitutionTypeMst')
BEGIN
CREATE TABLE ConstitutionTypeMst (
  ConstitutionTypeID INT IDENTITY(1,1) PRIMARY KEY,
  ConstitutionType VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StatesMst')
BEGIN
CREATE TABLE StatesMst (
  StateID INT IDENTITY(1,1) PRIMARY KEY,
  StateName VARCHAR(100) NOT NULL UNIQUE
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CitiesMst')
BEGIN
CREATE TABLE CitiesMst (
  CityID INT IDENTITY(1,1) PRIMARY KEY,
  CityName VARCHAR(100) NOT NULL,
  StateID INT NOT NULL
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PostalCodesMst')
BEGIN
CREATE TABLE PostalCodesMst (
  PostalID INT IDENTITY(1,1) PRIMARY KEY,
  Pincode VARCHAR(6) NOT NULL,
  AreaName VARCHAR(150),
  CityID INT NOT NULL,
  StateID INT NOT NULL
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PatientMaster')
BEGIN
CREATE TABLE PatientMaster (
  PatientID BIGINT IDENTITY (1,1) NOT NULL,
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
  IsActive BIT NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT SYSDATETIME(),
  CreatedBy INT NULL,
  UpdatedAt DATETIME NULL,
  UpdatedBy INT NULL
);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PatientSchedule')
BEGIN
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
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StaffMaster')
BEGIN
CREATE TABLE StaffMaster (
  StaffID INT IDENTITY(1,1) PRIMARY KEY,
  PrefixID int NULL,
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
END
