-- ==========================================
-- 1. KHỞI TẠO CƠ SỞ DỮ LIỆU VÀ NGƯỜI DÙNG
-- ==========================================

USE master;
GO

-- Tạo database nếu chưa có
IF DB_ID('employee_management_demo') IS NULL
    CREATE DATABASE employee_management_demo;
GO

USE employee_management_demo;
GO

-- 1.1. Tạo các LOGIN và USER cho từng loại vai trò
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'ems_user')
    CREATE LOGIN ems_user WITH PASSWORD = 'StrongPassword123!';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'hr_user')
    CREATE LOGIN hr_user WITH PASSWORD = 'HrUser!2024';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'manager_user')
    CREATE LOGIN manager_user WITH PASSWORD = 'ManagerUser!2024';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'employee_user')
    CREATE LOGIN employee_user WITH PASSWORD = 'EmployeeUser!2024';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'accountant_user')
    CREATE LOGIN accountant_user WITH PASSWORD = 'AccountantUser!2024';

-- 1.2. Tạo các USER tương ứng trong database
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'ems_user')
    CREATE USER ems_user FOR LOGIN ems_user;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'hr_user')
    CREATE USER hr_user FOR LOGIN hr_user;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'manager_user')
    CREATE USER manager_user FOR LOGIN manager_user;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'employee_user')
    CREATE USER employee_user FOR LOGIN employee_user;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'accountant_user')
    CREATE USER accountant_user FOR LOGIN accountant_user;

-- 1.3. Gán quyền tổng quát cho ems_user (admin)
ALTER ROLE db_owner ADD MEMBER ems_user;
GO

-- ==========================================
-- 2. TẠO CÁC BẢNG VÀ CẤU TRÚC DỮ LIỆU
-- ==========================================

-- Tổ chức
IF OBJECT_ID('organizations', 'U') IS NOT NULL DROP TABLE organizations;
CREATE TABLE organizations (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL UNIQUE,
  description NVARCHAR(MAX) NOT NULL,
  organization_url NVARCHAR(255) NOT NULL UNIQUE,
  organization_mail NVARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Phòng ban
IF OBJECT_ID('departments', 'U') IS NOT NULL DROP TABLE departments;
CREATE TABLE departments (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX) NOT NULL,
  organization_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
GO
-- Nhân sự phòng nhân sự (HR)
IF OBJECT_ID('human_resources', 'U') IS NOT NULL DROP TABLE human_resources;
CREATE TABLE human_resources (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  firstname NVARCHAR(255) NOT NULL,
  lastname NVARCHAR(255) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  [password] NVARCHAR(255) NOT NULL, -- Hash ngoài ứng dụng
  [role] NVARCHAR(50) NOT NULL, -- HR-Admin, HR-Staff
  department_id BIGINT NOT NULL,
  organization_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
GO
-- Nhân viên
IF OBJECT_ID('employees', 'U') IS NOT NULL DROP TABLE employees;
CREATE TABLE employees (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  code NVARCHAR(20) NOT NULL UNIQUE, -- Mã nhân viên
  firstname NVARCHAR(255) NOT NULL,
  lastname NVARCHAR(255) NOT NULL,
  dob DATE NOT NULL, -- Ngày sinh
  email NVARCHAR(255) NOT NULL UNIQUE,
  [password] NVARCHAR(255) NOT NULL, -- Hash ngoài ứng dụng
  department_id BIGINT NOT NULL,
  organization_id BIGINT NOT NULL,
  salary VARBINARY(256) NOT NULL,     -- Lương (mã hóa)
  tax_code VARBINARY(256) NOT NULL,   -- Mã số thuế (mã hóa)
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
GO
-- Kế toán
IF OBJECT_ID('accountants', 'U') IS NOT NULL DROP TABLE accountants;
CREATE TABLE accountants (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  firstname NVARCHAR(255) NOT NULL,
  lastname NVARCHAR(255) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  [password] NVARCHAR(255) NOT NULL,
  organization_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
GO
-- ==========================================
-- 3. MÃ HÓA DỮ LIỆU NHẠY CẢM (LƯƠNG, MÃ SỐ THUẾ)
-- ==========================================
-- Sử dụng SYMMETRIC KEY để mã hóa dữ liệu nhạy cảm

-- Tạo master key (chỉ tạo lần đầu)
IF NOT EXISTS (SELECT * FROM sys.symmetric_keys WHERE name = '##MS_DatabaseMasterKey##')
    CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'MasterKey@2024!';
GO

-- Tạo symmetric key cho nhân viên
IF NOT EXISTS (SELECT * FROM sys.symmetric_keys WHERE name = 'SymKey_Emp')
    CREATE SYMMETRIC KEY SymKey_Emp
    WITH ALGORITHM = AES_256
    ENCRYPTION BY PASSWORD = 'SymKey_Employee@2024!';
GO

-- ==========================================
-- 4. AUDIT LOG: THEO DÕI THAO TÁC NHẠY CẢM
-- ==========================================
IF OBJECT_ID('audit_logs', 'U') IS NOT NULL DROP TABLE audit_logs;
CREATE TABLE audit_logs (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  [user] NVARCHAR(255) NOT NULL,
  action_type NVARCHAR(50) NOT NULL,
  table_name NVARCHAR(255) NOT NULL,
  record_id BIGINT NULL,
  access_time DATETIME DEFAULT GETDATE(),
  detail NVARCHAR(MAX)
);
GO
-- Trigger ghi log khi UPDATE bảng employees
IF OBJECT_ID('trg_employees_update', 'TR') IS NOT NULL
    DROP TRIGGER trg_employees_update;
GO

CREATE TRIGGER trg_employees_update
ON employees
AFTER UPDATE
AS
BEGIN
    INSERT INTO audit_logs([user], action_type, table_name, record_id, detail)
    SELECT SYSTEM_USER, 'UPDATE', 'employees', inserted.id,
           CONCAT('Updated fields for employee: ', inserted.code, '.')
    FROM inserted;
END;
GO

-- ==========================================
-- 5. DEMO DỮ LIỆU (THÊM NHIỀU DÒNG)
-- ==========================================
OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';

-- Tổ chức
INSERT INTO organizations (name, description, organization_url, organization_mail)
VALUES
(N'Demo Corp', N'A demonstration corporation.', N'https://demo.corp', N'contact@demo.corp');

-- Phòng ban
INSERT INTO departments (name, description, organization_id) VALUES
(N'Human Resources', N'Phòng nhân sự', 1),
(N'Engineering', N'Phòng kỹ thuật', 1),
(N'Sales', N'Phòng kinh doanh', 1),
(N'Accounting', N'Phòng kế toán', 1);

-- Nhân sự HR
INSERT INTO human_resources (firstname, lastname, email, [password], [role], department_id, organization_id)
VALUES
(N'Alice', N'Admin', N'alice.admin@demo.corp', N'$2b$10$hash1', N'HR-Admin', 1, 1),
(N'Bob', N'Manager', N'bob.manager@demo.corp', N'$2b$10$hash2', N'HR-Staff', 1, 1);

-- Nhân viên (mã hóa lương, mã số thuế)
INSERT INTO employees (code, firstname, lastname, dob, email, [password], department_id, organization_id, salary, tax_code)
VALUES
(N'NV001', N'Charlie', N'Dev', '1990-01-01', N'charlie.dev@demo.corp', N'$2b$10$hash3', 2, 1,
    EncryptByKey(Key_GUID('SymKey_Emp'), CAST(6000.00 AS NVARCHAR(50))),
    EncryptByKey(Key_GUID('SymKey_Emp'), N'TAX123456')),
(N'NV002', N'Diana', N'Engineer', '1992-02-02', N'diana.engineer@demo.corp', N'$2b$10$hash4', 2, 1,
    EncryptByKey(Key_GUID('SymKey_Emp'), CAST(6500.00 AS NVARCHAR(50))),
    EncryptByKey(Key_GUID('SymKey_Emp'), N'TAX654321')),
(N'NV003', N'Ethan', N'Salesperson', '1993-03-03', N'ethan.sales@demo.corp', N'$2b$10$hash5', 3, 1,
    EncryptByKey(Key_GUID('SymKey_Emp'), CAST(5000.00 AS NVARCHAR(50))),
    EncryptByKey(Key_GUID('SymKey_Emp'), N'TAX112233')),
(N'NV004', N'Fiona', N'Marketer', '1994-04-04', N'fiona.marketer@demo.corp', N'$2b$10$hash6', 4, 1,
    EncryptByKey(Key_GUID('SymKey_Emp'), CAST(4800.00 AS NVARCHAR(50))),
    EncryptByKey(Key_GUID('SymKey_Emp'), N'TAX445566'));

-- Nhân viên phòng kế toán
INSERT INTO accountants (firstname, lastname, email, [password], organization_id)
VALUES
(N'David', N'Accountant', N'david.acc@demo.corp', N'$2b$10$hash7', 1);

CLOSE SYMMETRIC KEY SymKey_Emp;
GO

-- ==========================================
-- 6. PHÂN QUYỀN SÂU BẰNG VIEW & STORED PROCEDURE (RBAC)
-- ==========================================

-- 6.1. HR: Được xem/sửa toàn bộ thông tin nhân viên
GRANT SELECT, UPDATE ON employees TO hr_user;
GO
-- 6.2. Trưởng phòng: chỉ được xem nhân viên cùng phòng, chỉ sửa thông tin bản thân

-- View cho trưởng phòng: chỉ xem nhân viên cùng phòng
CREATE OR ALTER VIEW v_manager_employees AS
    SELECT e.id, e.code, e.firstname, e.lastname, e.dob, e.email, e.department_id, e.organization_id,
           e.salary, e.tax_code, e.created_at, e.updated_at
    FROM employees e
    JOIN human_resources hr
      ON hr.department_id = e.department_id
    WHERE hr.email = SYSTEM_USER; -- chỉ xem nhân viên cùng phòng
GO

GRANT SELECT ON v_manager_employees TO manager_user;
GO

-- Stored Procedure: chỉ cho phép trưởng phòng sửa thông tin của chính mình
CREATE OR ALTER PROCEDURE sp_update_manager_profile
    @EmpID BIGINT,
    @Firstname NVARCHAR(255),
    @Lastname NVARCHAR(255),
    @DOB DATE,
    @Email NVARCHAR(255)
AS
BEGIN
    -- Kiểm tra email đăng nhập là email của nhân viên cần sửa
    IF EXISTS (SELECT 1 FROM employees WHERE id = @EmpID AND email = SYSTEM_USER)
    BEGIN
        UPDATE employees
        SET firstname = @Firstname,
            lastname = @Lastname,
            dob = @DOB,
            email = @Email,
            updated_at = GETDATE()
        WHERE id = @EmpID;
    END
    ELSE
    BEGIN
        RAISERROR(N'Bạn chỉ được phép cập nhật thông tin của mình.', 16, 1);
    END
END;
GO

GRANT EXECUTE ON sp_update_manager_profile TO manager_user;
GO

-- 6.3. Nhân viên: chỉ được xem thông tin bản thân, không xem lương/mã số thuế người khác
CREATE OR ALTER VIEW v_employee_self AS
    SELECT id, code, firstname, lastname, dob, email, department_id, organization_id, created_at, updated_at
    FROM employees WHERE email = SYSTEM_USER;
GO

GRANT SELECT ON v_employee_self TO employee_user;
GO

-- 6.4. Kế toán: Được xem lương, mã số thuế của toàn bộ nhân viên (giải mã)
CREATE OR ALTER VIEW v_accountant_employees AS
    SELECT id, code, firstname, lastname, 
           CONVERT(NVARCHAR(50), DecryptByKey(salary)) AS salary,
           CONVERT(NVARCHAR(50), DecryptByKey(tax_code)) AS tax_code,
           department_id, organization_id, created_at, updated_at
    FROM employees;

GO
GRANT SELECT ON v_accountant_employees TO accountant_user;
GO
-- ==========================================
-- 7. HƯỚNG DẪN GIẢI MÃ LƯƠNG, MÃ SỐ THUẾ (CHO KẾ TOÁN)
-- ==========================================
/*
-- Khi kế toán cần xem lương/mã số thuế:
OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';
SELECT * FROM v_accountant_employees;
CLOSE SYMMETRIC KEY SymKey_Emp;
*/

-- ==========================================
-- KẾT THÚC: ĐẦY ĐỦ CHÍNH SÁCH, PHÂN QUYỀN, MÃ HÓA, AUDIT, DEMO DỮ LIỆU
-- ==========================================

