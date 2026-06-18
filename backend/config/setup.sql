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

PRINT 'FinMarkDB setup complete!';
