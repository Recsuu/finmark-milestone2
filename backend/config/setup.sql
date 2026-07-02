-- Run this script in MSSQL to set up the FinMark database
-- Idempotent: safe to run multiple times (used by the Docker init container)

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'FinMarkDB')
BEGIN
  CREATE DATABASE FinMarkDB;
END
GO

USE FinMarkDB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
  CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) DEFAULT 'user',
    created_at DATETIME DEFAULT GETDATE()
  );
END
GO

-- Seed one test admin account (password: Admin@1234, already hashed)
IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@finmark.com')
BEGIN
  INSERT INTO Users (name, email, password, role)
  VALUES (
    'Admin User',
    'admin@finmark.com',
    '$2a$10$B3Ya.au0PmAejHZOu5D9AOUFa.RNwU3IN1Ix7xLw9LjrYgj7h4rw2',
    'admin'
  );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Appointments')
BEGIN
  CREATE TABLE Appointments (
    id VARCHAR(50) PRIMARY KEY,
    userId INT NOT NULL REFERENCES Users(id),
    title VARCHAR(255) NOT NULL,
    service VARCHAR(100) NOT NULL,
    submissionDate VARCHAR(50) NOT NULL,
    date VARCHAR(50) NOT NULL,
    details VARCHAR(MAX),
    attachments VARCHAR(MAX),
    status VARCHAR(50) DEFAULT 'Pending'
  );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
  CREATE TABLE Notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL REFERENCES Users(id),
    message VARCHAR(500) NOT NULL,
    isRead BIT DEFAULT 0,
    createdAt DATETIME DEFAULT GETDATE(),
    appointmentId VARCHAR(50)
  );
END
ELSE
BEGIN
  -- Add appointmentId if upgrading from an older schema that didn't have it
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'appointmentId' AND Object_ID = Object_ID(N'Notifications'))
  BEGIN
    ALTER TABLE Notifications ADD appointmentId VARCHAR(50);
  END
END
GO

PRINT 'FinMarkDB setup complete!';
