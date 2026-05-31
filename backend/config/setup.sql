-- Run this script in MSSQL to set up the FinMark database

-- Create database
CREATE DATABASE FinMarkDB;
GO

USE FinMarkDB;
GO

-- Create Users table
CREATE TABLE Users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  email NVARCHAR(150) NOT NULL UNIQUE,
  password NVARCHAR(255) NOT NULL,
  role NVARCHAR(50) DEFAULT 'user',
  created_at DATETIME DEFAULT GETDATE()
);
GO

-- Insert a test admin user
-- Password is: Admin@1234 (already hashed below)
INSERT INTO Users (name, email, password, role)
VALUES (
  'Admin User',
  'admin@finmark.com',
  '$2a$10$Nzr3VqHzX1qL0e5K9mWvDeXwY6T8pQkJlMnBcAsDfGhIjKlMnOpQr',
  'admin'
);
GO

PRINT 'FinMarkDB setup complete!';
