const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, poolConnect } = require('../config/db');
const mssql = require('mssql');

// Hàm đăng nhập chung cho tất cả các loại người dùng
const login = async (req, res) => {
  try {
    await poolConnect; // Đảm bảo kết nối đã được thiết lập
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu' });
    }

    // Kiểm tra trong bảng human_resources
    const hrRequest = pool.request();
    hrRequest.input('email', mssql.NVarChar, email);
    const hrResult = await hrRequest.query(`
      SELECT id, firstname, lastname, email, password, role, department_id, organization_id 
      FROM human_resources 
      WHERE email = @email
    `);

    // Kiểm tra trong bảng employees
    const empRequest = pool.request();
    empRequest.input('email', mssql.NVarChar, email);
    const empResult = await empRequest.query(`
      SELECT id, code, firstname, lastname, email, password, department_id, organization_id 
      FROM employees 
      WHERE email = @email
    `);

    // Kiểm tra trong bảng accountants
    const accRequest = pool.request();
    accRequest.input('email', mssql.NVarChar, email);
    const accResult = await accRequest.query(`
      SELECT id, firstname, lastname, email, password, organization_id 
      FROM accountants 
      WHERE email = @email
    `);

    let user;
    let role;

    if (hrResult.recordset.length > 0) {
      user = hrResult.recordset[0];
      role = user.role; // HR-Admin hoặc HR-Staff
    } else if (empResult.recordset.length > 0) {
      user = empResult.recordset[0];
      role = 'Employee';
    } else if (accResult.recordset.length > 0) {
      user = accResult.recordset[0];
      role = 'Accountant';
    } else {
      return res.status(401).json({ message: 'Email không tồn tại' });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mật khẩu không chính xác' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: role,
        organization_id: user.organization_id,
        department_id: user.department_id || null
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Trả về thông tin người dùng và token
    const userInfo = {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: role,
      organization_id: user.organization_id,
      department_id: user.department_id || null,
      code: user.code || null
    };

    res.status(200).json({
      message: 'Đăng nhập thành công',
      user: userInfo,
      token
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
};

// Đăng ký tài khoản HR (chỉ HR-Admin mới có quyền)
const registerHR = async (req, res) => {
  try {
    await poolConnect; // Đảm bảo kết nối đã được thiết lập
    const { firstname, lastname, email, password, role, department_id, organization_id } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!firstname || !lastname || !email || !password || !role || !department_id || !organization_id) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    // Kiểm tra vai trò hợp lệ
    if (role !== 'HR-Admin' && role !== 'HR-Staff') {
      return res.status(400).json({ message: 'Vai trò không hợp lệ cho HR' });
    }

    // Kiểm tra email đã tồn tại chưa
    const checkRequest = pool.request();
    checkRequest.input('email', mssql.NVarChar, email);
    const existingUser = await checkRequest.query(`
      SELECT id FROM human_resources WHERE email = @email
    `);

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Thêm người dùng mới vào database
    const insertRequest = pool.request();
    insertRequest.input('firstname', mssql.NVarChar, firstname);
    insertRequest.input('lastname', mssql.NVarChar, lastname);
    insertRequest.input('email', mssql.NVarChar, email);
    insertRequest.input('password', mssql.NVarChar, hashedPassword);
    insertRequest.input('role', mssql.NVarChar, role);
    insertRequest.input('department_id', mssql.BigInt, department_id);
    insertRequest.input('organization_id', mssql.BigInt, organization_id);

    const result = await insertRequest.query(`
      INSERT INTO human_resources (firstname, lastname, email, password, role, department_id, organization_id)
      VALUES (@firstname, @lastname, @email, @password, @role, @department_id, @organization_id);
      SELECT SCOPE_IDENTITY() AS id;
    `);

    res.status(201).json({
      message: 'Đăng ký tài khoản HR thành công',
      user_id: result.recordset[0].id
    });
  } catch (error) {
    console.error('Lỗi đăng ký HR:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

// Đăng ký tài khoản nhân viên (chỉ HR mới có quyền)
const registerEmployee = async (req, res) => {
  try {
    await poolConnect; // Đảm bảo kết nối đã được thiết lập
    const { code, firstname, lastname, dob, email, password, department_id, organization_id } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!firstname || !lastname || !dob || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    // Kiểm tra email đã tồn tại chưa
    const checkRequest = pool.request();
    checkRequest.input('email', mssql.NVarChar, email);
    const existingUser = await checkRequest.query(`
      SELECT id FROM employees WHERE email = @email
    `);

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Mở khóa đối xứng để mã hóa dữ liệu nhạy cảm
    await pool.request().query(`
      OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';
    `);

    // Lấy mã nhân viên mới
    const codeRequest = pool.request();
    const codeResult = await codeRequest.query(`
      SELECT MAX(CAST(SUBSTRING(code, 3, LEN(code)) AS INT)) AS max_code 
      FROM employees 
      WHERE code LIKE 'NV%'
    `);
    
    let newCode = 'NV001';
    if (codeResult.recordset[0].max_code) {
      const nextCode = codeResult.recordset[0].max_code + 1;
      newCode = `NV${nextCode.toString().padStart(3, '0')}`;
    }

    // Sử dụng department_id và organization_id từ request hoặc giá trị mặc định
    const dept_id = department_id || 1; // Giả sử 1 là ID của phòng ban mặc định
    const org_id = organization_id || 1; // Giả sử 1 là ID của tổ chức mặc định

    // Thêm nhân viên mới vào database với mã hóa lương và mã số thuế
    const insertRequest = pool.request();
    insertRequest.input('code', mssql.NVarChar, newCode);
    insertRequest.input('firstname', mssql.NVarChar, firstname);
    insertRequest.input('lastname', mssql.NVarChar, lastname);
    insertRequest.input('dob', mssql.Date, new Date(dob));
    insertRequest.input('email', mssql.NVarChar, email);
    insertRequest.input('password', mssql.NVarChar, hashedPassword);
    insertRequest.input('department_id', mssql.BigInt, dept_id);
    insertRequest.input('organization_id', mssql.BigInt, org_id);

    const result = await insertRequest.query(`
      INSERT INTO employees (code, firstname, lastname, dob, email, password, department_id, organization_id, salary, tax_code)
      VALUES (
        @code, @firstname, @lastname, @dob, @email, @password, @department_id, @organization_id,
        EncryptByKey(Key_GUID('SymKey_Emp'), CAST('0' AS NVARCHAR(50))),
        EncryptByKey(Key_GUID('SymKey_Emp'), N'N/A')
      );
      SELECT SCOPE_IDENTITY() AS id;
    `);

    // Đóng khóa đối xứng
    await pool.request().query(`
      CLOSE SYMMETRIC KEY SymKey_Emp;
    `);

    res.status(201).json({
      message: 'Đăng ký tài khoản nhân viên thành công',
      user_id: result.recordset[0].id
    });
  } catch (error) {
    console.error('Lỗi đăng ký nhân viên:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

// Đăng ký công khai cho nhân viên (không yêu cầu xác thực)
const publicRegisterEmployee = async (req, res) => {
  try {
    await poolConnect; // Đảm bảo kết nối đã được thiết lập
    const { firstname, lastname, dob, email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!firstname || !lastname || !dob || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    // Kiểm tra độ mạnh của mật khẩu
    if (password.length < 8) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất một ký tự viết hoa' });
    }

    // Kiểm tra email đã tồn tại chưa
    const checkRequest = pool.request();
    checkRequest.input('email', mssql.NVarChar, email);
    const existingUser = await checkRequest.query(`
      SELECT id FROM employees WHERE email = @email
      UNION
      SELECT id FROM human_resources WHERE email = @email
      UNION
      SELECT id FROM accountants WHERE email = @email
    `);

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Mở khóa đối xứng để mã hóa dữ liệu nhạy cảm
    await pool.request().query(`
      OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';
    `);

    // Lấy mã nhân viên mới
    const codeRequest = pool.request();
    const codeResult = await codeRequest.query(`
      SELECT MAX(CAST(SUBSTRING(code, 3, LEN(code)) AS INT)) AS max_code 
      FROM employees 
      WHERE code LIKE 'NV%'
    `);
    
    let newCode = 'NV001';
    if (codeResult.recordset[0].max_code) {
      const nextCode = codeResult.recordset[0].max_code + 1;
      newCode = `NV${nextCode.toString().padStart(3, '0')}`;
    }

    // Sử dụng giá trị mặc định cho department_id và organization_id
    const dept_id = 1; // Giả sử 1 là ID của phòng ban mặc định
    const org_id = 1; // Giả sử 1 là ID của tổ chức mặc định

    // Thêm nhân viên mới vào database với mã hóa lương và mã số thuế
    const insertRequest = pool.request();
    insertRequest.input('code', mssql.NVarChar, newCode);
    insertRequest.input('firstname', mssql.NVarChar, firstname);
    insertRequest.input('lastname', mssql.NVarChar, lastname);
    insertRequest.input('dob', mssql.Date, new Date(dob));
    insertRequest.input('email', mssql.NVarChar, email);
    insertRequest.input('password', mssql.NVarChar, hashedPassword);
    insertRequest.input('department_id', mssql.BigInt, dept_id);
    insertRequest.input('organization_id', mssql.BigInt, org_id);

    const result = await insertRequest.query(`
      INSERT INTO employees (code, firstname, lastname, dob, email, password, department_id, organization_id, salary, tax_code)
      VALUES (
        @code, @firstname, @lastname, @dob, @email, @password, @department_id, @organization_id,
        EncryptByKey(Key_GUID('SymKey_Emp'), CAST('0' AS NVARCHAR(50))),
        EncryptByKey(Key_GUID('SymKey_Emp'), N'N/A')
      );
      SELECT SCOPE_IDENTITY() AS id;
    `);

    // Đóng khóa đối xứng
    await pool.request().query(`
      CLOSE SYMMETRIC KEY SymKey_Emp;
    `);

    res.status(201).json({
      message: 'Đăng ký tài khoản nhân viên thành công',
      user_id: result.recordset[0].id
    });
  } catch (error) {
    console.error('Lỗi đăng ký nhân viên:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

// Đăng ký tài khoản kế toán (chỉ HR-Admin mới có quyền)
const registerAccountant = async (req, res) => {
  try {
    await poolConnect; // Đảm bảo kết nối đã được thiết lập
    const { firstname, lastname, email, password, organization_id } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!firstname || !lastname || !email || !password || !organization_id) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    // Kiểm tra email đã tồn tại chưa
    const checkRequest = pool.request();
    checkRequest.input('email', mssql.NVarChar, email);
    const existingUser = await checkRequest.query(`
      SELECT id FROM accountants WHERE email = @email
    `);

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Thêm kế toán mới vào database
    const insertRequest = pool.request();
    insertRequest.input('firstname', mssql.NVarChar, firstname);
    insertRequest.input('lastname', mssql.NVarChar, lastname);
    insertRequest.input('email', mssql.NVarChar, email);
    insertRequest.input('password', mssql.NVarChar, hashedPassword);
    insertRequest.input('organization_id', mssql.BigInt, organization_id);

    const result = await insertRequest.query(`
      INSERT INTO accountants (firstname, lastname, email, password, organization_id)
      VALUES (@firstname, @lastname, @email, @password, @organization_id);
      SELECT SCOPE_IDENTITY() AS id;
    `);

    res.status(201).json({
      message: 'Đăng ký tài khoản kế toán thành công',
      user_id: result.recordset[0].id
    });
  } catch (error) {
    console.error('Lỗi đăng ký kế toán:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

// Lấy thông tin người dùng hiện tại
const getCurrentUser = async (req, res) => {
  try {
    await poolConnect; // Đảm bảo kết nối đã được thiết lập
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let user;
    
    if (userRole === 'HR-Admin' || userRole === 'HR-Staff') {
      const request = pool.request();
      request.input('id', mssql.BigInt, userId);
      const result = await request.query(`
        SELECT id, firstname, lastname, email, role, department_id, organization_id 
        FROM human_resources 
        WHERE id = @id
      `);
      user = result.recordset[0];
    } else if (userRole === 'Employee') {
      const request = pool.request();
      request.input('id', mssql.BigInt, userId);
      const result = await request.query(`
        SELECT id, code, firstname, lastname, email, department_id, organization_id 
        FROM employees 
        WHERE id = @id
      `);
      user = result.recordset[0];
      user.role = 'Employee';
    } else if (userRole === 'Accountant') {
      const request = pool.request();
      request.input('id', mssql.BigInt, userId);
      const result = await request.query(`
        SELECT id, firstname, lastname, email, organization_id 
        FROM accountants 
        WHERE id = @id
      `);
      user = result.recordset[0];
      user.role = 'Accountant';
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin người dùng' });
  }
};

module.exports = {
  login,
  registerHR,
  registerEmployee,
  registerAccountant,
  publicRegisterEmployee,
  getCurrentUser
};
