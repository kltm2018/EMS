// salary_management.js - Quản lý lương và chế độ
const express = require('express');
const router = express.Router();
const { pool, poolConnect } = require('../config/db');
const mssql = require('mssql');
const { authenticateToken, isHR, isAccountant } = require('../middleware/auth');

// Lấy thông tin lương của nhân viên (chỉ HR và Kế toán mới có quyền)
router.get('/:employee_id', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const employeeId = req.params.employee_id;
    
    // Kiểm tra quyền truy cập
    if (!req.user.role.includes('HR') && !req.user.role.includes('Accountant') && req.user.id != employeeId) {
      return res.status(403).json({ message: 'Không có quyền truy cập thông tin lương' });
    }
    
    // Kiểm tra nhân viên tồn tại
    const checkRequest = pool.request();
    checkRequest.input('id', mssql.BigInt, employeeId);
    
    const employeeResult = await checkRequest.query(`
      SELECT id, code, firstname, lastname, email, department_id 
      FROM employees 
      WHERE id = @id
    `);
    
    if (employeeResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    
    // Mở khóa đối xứng để giải mã dữ liệu lương (chỉ cho HR và Kế toán)
    if (req.user.role.includes('HR') || req.user.role.includes('Accountant')) {
      await pool.request().query(`
        OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';
      `);
      
      // Lấy thông tin lương đã giải mã
      const salaryRequest = pool.request();
      salaryRequest.input('employee_id', mssql.BigInt, employeeId);
      
      const salaryResult = await salaryRequest.query(`
        SELECT 
          id, 
          employee_id,
          CONVERT(NVARCHAR(50), DecryptByKey(salary)) AS salary,
          CONVERT(NVARCHAR(50), DecryptByKey(tax_code)) AS tax_code,
          basic_salary,
          salary_coefficient,
          social_insurance,
          health_insurance,
          unemployment_insurance,
          allowance,
          income_tax,
          created_at,
          updated_at
        FROM employee_salaries 
        WHERE employee_id = @employee_id
      `);
      
      // Đóng khóa đối xứng
      await pool.request().query(`
        CLOSE SYMMETRIC KEY SymKey_Emp;
      `);
      
      // Ghi log audit
      const auditRequest = pool.request();
      auditRequest.input('user', mssql.NVarChar, req.user.email);
      auditRequest.input('action_type', mssql.NVarChar, 'VIEW');
      auditRequest.input('table_name', mssql.NVarChar, 'employee_salaries');
      auditRequest.input('record_id', mssql.BigInt, employeeId);
      auditRequest.input('detail', mssql.NVarChar, `Viewed salary information for employee ID: ${employeeId}`);
      
      await auditRequest.query(`
        INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
        VALUES (@user, @action_type, @table_name, @record_id, @detail)
      `);
      
      if (salaryResult.recordset.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin lương của nhân viên' });
      }
      
      const employee = employeeResult.recordset[0];
      employee.salary_info = salaryResult.recordset[0];
      
      return res.status(200).json({ employee });
    } else {
      // Nhân viên chỉ xem thông tin cơ bản (không xem được lương thực tế và mã số thuế)
      const salaryRequest = pool.request();
      salaryRequest.input('employee_id', mssql.BigInt, employeeId);
      
      const salaryResult = await salaryRequest.query(`
        SELECT 
          id, 
          employee_id,
          basic_salary,
          salary_coefficient,
          social_insurance,
          health_insurance,
          unemployment_insurance,
          allowance,
          created_at,
          updated_at
        FROM employee_salaries 
        WHERE employee_id = @employee_id
      `);
      
      if (salaryResult.recordset.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin lương của nhân viên' });
      }
      
      const employee = employeeResult.recordset[0];
      employee.salary_info = salaryResult.recordset[0];
      
      return res.status(200).json({ employee });
    }
  } catch (error) {
    console.error('Lỗi khi lấy thông tin lương:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin lương' });
  }
});

// Cập nhật thông tin lương (chỉ HR mới có quyền)
router.put('/:employee_id', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    const employeeId = req.params.employee_id;
    const { 
      basic_salary, 
      salary_coefficient, 
      social_insurance, 
      health_insurance, 
      unemployment_insurance, 
      allowance, 
      income_tax 
    } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!basic_salary || !salary_coefficient) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin lương cơ bản và hệ số lương' });
    }
    
    // Kiểm tra nhân viên tồn tại
    const checkRequest = pool.request();
    checkRequest.input('id', mssql.BigInt, employeeId);
    
    const employeeResult = await checkRequest.query(`
      SELECT id, code, firstname, lastname 
      FROM employees 
      WHERE id = @id
    `);
    
    if (employeeResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    
    const employeeName = `${employeeResult.recordset[0].lastname} ${employeeResult.recordset[0].firstname}`;
    
    // Tính toán lương thực lãnh
    const actualSalary = basic_salary * salary_coefficient;
    
    // Mở khóa đối xứng để mã hóa dữ liệu lương
    await pool.request().query(`
      OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';
    `);
    
    // Kiểm tra xem nhân viên đã có thông tin lương chưa
    const checkSalaryRequest = pool.request();
    checkSalaryRequest.input('employee_id', mssql.BigInt, employeeId);
    
    const salaryResult = await checkSalaryRequest.query(`
      SELECT id FROM employee_salaries WHERE employee_id = @employee_id
    `);
    
    if (salaryResult.recordset.length === 0) {
      // Thêm mới thông tin lương
      const insertRequest = pool.request();
      insertRequest.input('employee_id', mssql.BigInt, employeeId);
      insertRequest.input('basic_salary', mssql.Float, basic_salary);
      insertRequest.input('salary_coefficient', mssql.Float, salary_coefficient);
      insertRequest.input('social_insurance', mssql.Float, social_insurance || 0.08);
      insertRequest.input('health_insurance', mssql.Float, health_insurance || 0.015);
      insertRequest.input('unemployment_insurance', mssql.Float, unemployment_insurance || 0.01);
      insertRequest.input('allowance', mssql.Float, allowance || 0);
      insertRequest.input('income_tax', mssql.Float, income_tax || 0.05);
      insertRequest.input('actual_salary', mssql.NVarChar, actualSalary.toString());
      insertRequest.input('tax_code', mssql.NVarChar, `TAX${employeeId}`);
      
      await insertRequest.query(`
        INSERT INTO employee_salaries (
          employee_id, 
          salary, 
          tax_code, 
          basic_salary, 
          salary_coefficient, 
          social_insurance, 
          health_insurance, 
          unemployment_insurance, 
          allowance, 
          income_tax
        )
        VALUES (
          @employee_id,
          EncryptByKey(Key_GUID('SymKey_Emp'), @actual_salary),
          EncryptByKey(Key_GUID('SymKey_Emp'), @tax_code),
          @basic_salary,
          @salary_coefficient,
          @social_insurance,
          @health_insurance,
          @unemployment_insurance,
          @allowance,
          @income_tax
        )
      `);
    } else {
      // Cập nhật thông tin lương
      const updateRequest = pool.request();
      updateRequest.input('employee_id', mssql.BigInt, employeeId);
      updateRequest.input('basic_salary', mssql.Float, basic_salary);
      updateRequest.input('salary_coefficient', mssql.Float, salary_coefficient);
      updateRequest.input('social_insurance', mssql.Float, social_insurance || 0.08);
      updateRequest.input('health_insurance', mssql.Float, health_insurance || 0.015);
      updateRequest.input('unemployment_insurance', mssql.Float, unemployment_insurance || 0.01);
      updateRequest.input('allowance', mssql.Float, allowance || 0);
      updateRequest.input('income_tax', mssql.Float, income_tax || 0.05);
      updateRequest.input('actual_salary', mssql.NVarChar, actualSalary.toString());
      updateRequest.input('updated_at', mssql.DateTime, new Date());
      
      await updateRequest.query(`
        UPDATE employee_salaries
        SET 
          salary = EncryptByKey(Key_GUID('SymKey_Emp'), @actual_salary),
          basic_salary = @basic_salary,
          salary_coefficient = @salary_coefficient,
          social_insurance = @social_insurance,
          health_insurance = @health_insurance,
          unemployment_insurance = @unemployment_insurance,
          allowance = @allowance,
          income_tax = @income_tax,
          updated_at = @updated_at
        WHERE employee_id = @employee_id
      `);
    }
    
    // Đóng khóa đối xứng
    await pool.request().query(`
      CLOSE SYMMETRIC KEY SymKey_Emp;
    `);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'UPDATE');
    auditRequest.input('table_name', mssql.NVarChar, 'employee_salaries');
    auditRequest.input('record_id', mssql.BigInt, employeeId);
    auditRequest.input('detail', mssql.NVarChar, 
      `Updated salary information for employee: ${employeeName}, Basic salary: ${basic_salary}, Coefficient: ${salary_coefficient}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    // Thêm vào bảng lịch sử cập nhật lương
    const historyRequest = pool.request();
    historyRequest.input('employee_id', mssql.BigInt, employeeId);
    historyRequest.input('previous_salary', mssql.Float, 0); // Cần lấy lương cũ nếu có
    historyRequest.input('new_salary', mssql.Float, basic_salary * salary_coefficient);
    historyRequest.input('social_insurance', mssql.Float, social_insurance || 0.08);
    historyRequest.input('health_insurance', mssql.Float, health_insurance || 0.015);
    historyRequest.input('unemployment_insurance', mssql.Float, unemployment_insurance || 0.01);
    historyRequest.input('allowance', mssql.Float, allowance || 0);
    historyRequest.input('income_tax', mssql.Float, income_tax || 0.05);
    historyRequest.input('salary_coefficient', mssql.Float, salary_coefficient);
    historyRequest.input('update_date', mssql.Date, new Date());
    
    await historyRequest.query(`
      INSERT INTO salary_updates (
        employee_id,
        previous_salary,
        new_salary,
        social_insurance,
        health_insurance,
        unemployment_insurance,
        allowance,
        income_tax,
        salary_coefficient,
        update_date
      )
      VALUES (
        @employee_id,
        @previous_salary,
        @new_salary,
        @social_insurance,
        @health_insurance,
        @unemployment_insurance,
        @allowance,
        @income_tax,
        @salary_coefficient,
        @update_date
      )
    `);
    
    res.status(200).json({
      message: 'Cập nhật thông tin lương thành công'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin lương:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật thông tin lương' });
  }
});

// Lấy lịch sử cập nhật lương của nhân viên (chỉ HR và Kế toán mới có quyền)
router.get('/:employee_id/history', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const employeeId = req.params.employee_id;
    
    // Kiểm tra quyền truy cập
    if (!req.user.role.includes('HR') && !req.user.role.includes('Accountant') && req.user.id != employeeId) {
      return res.status(403).json({ message: 'Không có quyền truy cập lịch sử lương' });
    }
    
    // Kiểm tra nhân viên tồn tại
    const checkRequest = pool.request();
    checkRequest.input('id', mssql.BigInt, employeeId);
    
    const employeeResult = await checkRequest.query(`
      SELECT id, code, firstname, lastname 
      FROM employees 
      WHERE id = @id
    `);
    
    if (employeeResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    
    // Lấy lịch sử cập nhật lương
    const historyRequest = pool.request();
    historyRequest.input('employee_id', mssql.BigInt, employeeId);
    
    const historyResult = await historyRequest.query(`
      SELECT 
        id,
        employee_id,
        previous_salary,
        new_salary,
        social_insurance,
        health_insurance,
        unemployment_insurance,
        allowance,
        income_tax,
        salary_coefficient,
        update_date
      FROM salary_updates
      WHERE employee_id = @employee_id
      ORDER BY update_date DESC
    `);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'VIEW');
    auditRequest.input('table_name', mssql.NVarChar, 'salary_updates');
    auditRequest.input('record_id', mssql.BigInt, employeeId);
    auditRequest.input('detail', mssql.NVarChar, `Viewed salary history for employee ID: ${employeeId}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    const employee = employeeResult.recordset[0];
    employee.salary_history = historyResult.recordset;
    
    res.status(200).json({ employee });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử lương:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử lương' });
  }
});

// Tính lương tháng cho nhân viên (chỉ HR và Kế toán mới có quyền)
router.post('/calculate-monthly', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const { month, year } = req.body;
    
    // Kiểm tra quyền truy cập
    if (!req.user.role.includes('HR') && !req.user.role.includes('Accountant')) {
      return res.status(403).json({ message: 'Không có quyền tính lương' });
    }
    
    // Kiểm tra dữ liệu đầu vào
    if (!month || !year) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin tháng và năm' });
    }
    
    // Mở khóa đối xứng để giải mã dữ liệu lương
    await pool.request().query(`
      OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';
    `);
    
    // Lấy danh sách nhân viên và thông tin lương
    const employeesResult = await pool.request().query(`
      SELECT 
        e.id,
        e.code,
        e.firstname,
        e.lastname,
        e.department_id,
        CONVERT(NVARCHAR(50), DecryptByKey(s.salary)) AS salary,
        s.basic_salary,
        s.salary_coefficient,
        s.social_insurance,
        s.health_insurance,
        s.unemployment_insurance,
        s.allowance,
        s.income_tax
      FROM employees e
      LEFT JOIN employee_salaries s ON e.id = s.employee_id
    `);
    
    // Đóng khóa đối xứng
    await pool.request().query(`
      CLOSE SYMMETRIC KEY SymKey_Emp;
    `);
    
    // Tính lương cho từng nhân viên
    const salaryCalculations = [];
    
    for (const employee of employeesResult.recordset) {
      if (!employee.salary) continue; // Bỏ qua nhân viên chưa có thông tin lương
      
      const actualSalary = parseFloat(employee.salary);
      const socialInsuranceAmount = actualSalary * employee.social_insurance;
      const healthInsuranceAmount = actualSalary * employee.health_insurance;
      const unemploymentInsuranceAmount = actualSalary * employee.unemployment_insurance;
      const incomeTaxAmount = actualSalary * employee.income_tax;
      const allowanceAmount = employee.allowance;
      
      const netSalary = actualSalary - socialInsuranceAmount - healthInsuranceAmount - 
                        unemploymentInsuranceAmount - incomeTaxAmount + allowanceAmount;
      
      // Thêm vào bảng lương tháng
      const insertRequest = pool.request();
      insertRequest.input('employee_id', mssql.BigInt, employee.id);
      insertRequest.input('basic_salary', mssql.Float, employee.basic_salary);
      insertRequest.input('actual_salary', mssql.Float, actualSalary);
      insertRequest.input('social_insurance_amount', mssql.Float, socialInsuranceAmount);
      insertRequest.input('health_insurance_amount', mssql.Float, healthInsuranceAmount);
      insertRequest.input('unemployment_insurance_amount', mssql.Float, unemploymentInsuranceAmount);
      insertRequest.input('income_tax_amount', mssql.Float, incomeTaxAmount);
      insertRequest.input('allowance_amount', mssql.Float, allowanceAmount);
      insertRequest.input('net_salary', mssql.Float, netSalary);
      insertRequest.input('salary_month', mssql.Int, month);
      insertRequest.input('salary_year', mssql.Int, year);
      insertRequest.input('payment_date', mssql.Date, new Date());
      
      await insertRequest.query(`
        INSERT INTO monthly_salaries (
          employee_id,
          basic_salary,
          actual_salary,
          social_insurance_amount,
          health_insurance_amount,
          unemployment_insurance_amount,
          income_tax_amount,
          allowance_amount,
          net_salary,
          salary_month,
          salary_year,
          payment_date
        )
        VALUES (
          @employee_id,
          @basic_salary,
          @actual_salary,
          @social_insurance_amount,
          @health_insurance_amount,
          @unemployment_insurance_amount,
          @income_tax_amount,
          @allowance_amount,
          @net_salary,
          @salary_month,
          @salary_year,
          @payment_date
        )
      `);
      
      salaryCalculations.push({
        employee_id: employee.id,
        employee_name: `${employee.lastname} ${employee.firstname}`,
        employee_code: employee.code,
        actual_salary: actualSalary,
        social_insurance: socialInsuranceAmount,
        health_insurance: healthInsuranceAmount,
        unemployment_insurance: unemploymentInsuranceAmount,
        income_tax: incomeTaxAmount,
        allowance: allowanceAmount,
        net_salary: netSalary
      });
    }
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'CALCULATE');
    auditRequest.input('table_name', mssql.NVarChar, 'monthly_salaries');
    auditRequest.input('record_id', mssql.BigInt, 0);
    auditRequest.input('detail', mssql.NVarChar, 
      `Calculated monthly salaries for ${month}/${year}, ${salaryCalculations.length} employees processed`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(200).json({
      message: `Tính lương tháng ${month}/${year} thành công cho ${salaryCalculations.length} nhân viên`,
      salary_calculations: salaryCalculations
    });
  } catch (error) {
    console.error('Lỗi khi tính lương tháng:', error);
    res.status(500).json({ message: 'Lỗi server khi tính lương tháng' });
  }
});

module.exports = router;
