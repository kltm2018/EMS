// department_management.js - Quản lý phòng ban
const express = require('express');
const router = express.Router();
const { pool, poolConnect } = require('../config/db');
const mssql = require('mssql');
const { authenticateToken, isHR } = require('../middleware/auth');

// Lấy danh sách tất cả phòng ban
router.get('/', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const request = pool.request();
    const result = await request.query(`
      SELECT id, name, description, organization_id, created_at, updated_at
      FROM departments
      ORDER BY name
    `);
    
    res.status(200).json({ departments: result.recordset });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng ban:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách phòng ban' });
  }
});

// Lấy thông tin chi tiết một phòng ban
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    const request = pool.request();
    request.input('id', mssql.BigInt, req.params.id);
    
    // Lấy thông tin phòng ban
    const departmentResult = await request.query(`
      SELECT id, name, description, organization_id, created_at, updated_at
      FROM departments
      WHERE id = @id
    `);
    
    if (departmentResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng ban' });
    }
    
    // Lấy danh sách nhân viên thuộc phòng ban
    const employeesRequest = pool.request();
    employeesRequest.input('department_id', mssql.BigInt, req.params.id);
    const employeesResult = await employeesRequest.query(`
      SELECT id, code, firstname, lastname, email, department_id
      FROM employees
      WHERE department_id = @department_id
      ORDER BY lastname, firstname
    `);
    
    const department = departmentResult.recordset[0];
    department.employees = employeesResult.recordset;
    
    res.status(200).json({ department });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin phòng ban:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin phòng ban' });
  }
});

// Thêm phòng ban mới (chỉ HR mới có quyền)
router.post('/', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    const { name, description, organization_id } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!name || !description || !organization_id) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin phòng ban' });
    }
    
    // Kiểm tra tổ chức tồn tại
    const checkOrgRequest = pool.request();
    checkOrgRequest.input('organization_id', mssql.BigInt, organization_id);
    const orgResult = await checkOrgRequest.query(`
      SELECT id FROM organizations WHERE id = @organization_id
    `);
    
    if (orgResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Tổ chức không tồn tại' });
    }
    
    // Kiểm tra tên phòng ban đã tồn tại chưa
    const checkNameRequest = pool.request();
    checkNameRequest.input('name', mssql.NVarChar, name);
    checkNameRequest.input('organization_id', mssql.BigInt, organization_id);
    const nameResult = await checkNameRequest.query(`
      SELECT id FROM departments 
      WHERE name = @name AND organization_id = @organization_id
    `);
    
    if (nameResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Tên phòng ban đã tồn tại trong tổ chức này' });
    }
    
    // Thêm phòng ban mới
    const insertRequest = pool.request();
    insertRequest.input('name', mssql.NVarChar, name);
    insertRequest.input('description', mssql.NVarChar, description);
    insertRequest.input('organization_id', mssql.BigInt, organization_id);
    
    const result = await insertRequest.query(`
      INSERT INTO departments (name, description, organization_id)
      VALUES (@name, @description, @organization_id);
      SELECT SCOPE_IDENTITY() AS id;
    `);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'CREATE');
    auditRequest.input('table_name', mssql.NVarChar, 'departments');
    auditRequest.input('record_id', mssql.BigInt, result.recordset[0].id);
    auditRequest.input('detail', mssql.NVarChar, `Created department: ${name}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(201).json({
      message: 'Thêm phòng ban thành công',
      department_id: result.recordset[0].id
    });
  } catch (error) {
    console.error('Lỗi khi thêm phòng ban:', error);
    res.status(500).json({ message: 'Lỗi server khi thêm phòng ban' });
  }
});

// Cập nhật thông tin phòng ban (chỉ HR mới có quyền)
router.put('/:id', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    const { name, description } = req.body;
    const departmentId = req.params.id;
    
    // Kiểm tra dữ liệu đầu vào
    if (!name || !description) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin phòng ban' });
    }
    
    // Kiểm tra phòng ban tồn tại
    const checkRequest = pool.request();
    checkRequest.input('id', mssql.BigInt, departmentId);
    const checkResult = await checkRequest.query(`
      SELECT id, name FROM departments WHERE id = @id
    `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng ban' });
    }
    
    const oldName = checkResult.recordset[0].name;
    
    // Kiểm tra tên mới đã tồn tại chưa (nếu tên thay đổi)
    if (name !== oldName) {
      const checkNameRequest = pool.request();
      checkNameRequest.input('name', mssql.NVarChar, name);
      checkNameRequest.input('id', mssql.BigInt, departmentId);
      const nameResult = await checkNameRequest.query(`
        SELECT id FROM departments 
        WHERE name = @name AND id != @id
      `);
      
      if (nameResult.recordset.length > 0) {
        return res.status(400).json({ message: 'Tên phòng ban đã tồn tại' });
      }
    }
    
    // Cập nhật thông tin phòng ban
    const updateRequest = pool.request();
    updateRequest.input('id', mssql.BigInt, departmentId);
    updateRequest.input('name', mssql.NVarChar, name);
    updateRequest.input('description', mssql.NVarChar, description);
    updateRequest.input('updated_at', mssql.DateTime, new Date());
    
    await updateRequest.query(`
      UPDATE departments
      SET name = @name, description = @description, updated_at = @updated_at
      WHERE id = @id
    `);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'UPDATE');
    auditRequest.input('table_name', mssql.NVarChar, 'departments');
    auditRequest.input('record_id', mssql.BigInt, departmentId);
    auditRequest.input('detail', mssql.NVarChar, `Updated department: ${oldName} to ${name}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(200).json({
      message: 'Cập nhật phòng ban thành công'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật phòng ban:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật phòng ban' });
  }
});

// Xóa phòng ban (chỉ HR mới có quyền)
router.delete('/:id', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    const departmentId = req.params.id;
    
    // Kiểm tra phòng ban tồn tại
    const checkRequest = pool.request();
    checkRequest.input('id', mssql.BigInt, departmentId);
    const checkResult = await checkRequest.query(`
      SELECT id, name FROM departments WHERE id = @id
    `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng ban' });
    }
    
    const departmentName = checkResult.recordset[0].name;
    
    // Kiểm tra có nhân viên trong phòng ban không
    const checkEmployeesRequest = pool.request();
    checkEmployeesRequest.input('department_id', mssql.BigInt, departmentId);
    const employeesResult = await checkEmployeesRequest.query(`
      SELECT COUNT(*) as count FROM employees WHERE department_id = @department_id
    `);
    
    if (employeesResult.recordset[0].count > 0) {
      return res.status(400).json({ 
        message: 'Không thể xóa phòng ban vì còn nhân viên thuộc phòng ban này' 
      });
    }
    
    // Xóa phòng ban
    const deleteRequest = pool.request();
    deleteRequest.input('id', mssql.BigInt, departmentId);
    
    await deleteRequest.query(`
      DELETE FROM departments WHERE id = @id
    `);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'DELETE');
    auditRequest.input('table_name', mssql.NVarChar, 'departments');
    auditRequest.input('record_id', mssql.BigInt, departmentId);
    auditRequest.input('detail', mssql.NVarChar, `Deleted department: ${departmentName}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(200).json({
      message: 'Xóa phòng ban thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa phòng ban:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa phòng ban' });
  }
});

// Chuyển nhân viên sang phòng ban khác (chỉ HR mới có quyền)
router.post('/:id/transfer-employee', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    const { employee_id, new_department_id } = req.body;
    const currentDepartmentId = req.params.id;
    
    // Kiểm tra dữ liệu đầu vào
    if (!employee_id || !new_department_id) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }
    
    // Kiểm tra nhân viên tồn tại và thuộc phòng ban hiện tại
    const checkEmployeeRequest = pool.request();
    checkEmployeeRequest.input('employee_id', mssql.BigInt, employee_id);
    checkEmployeeRequest.input('department_id', mssql.BigInt, currentDepartmentId);
    
    const employeeResult = await checkEmployeeRequest.query(`
      SELECT id, firstname, lastname, department_id 
      FROM employees 
      WHERE id = @employee_id AND department_id = @department_id
    `);
    
    if (employeeResult.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'Không tìm thấy nhân viên hoặc nhân viên không thuộc phòng ban này' 
      });
    }
    
    const employeeName = `${employeeResult.recordset[0].lastname} ${employeeResult.recordset[0].firstname}`;
    
    // Kiểm tra phòng ban mới tồn tại
    const checkNewDeptRequest = pool.request();
    checkNewDeptRequest.input('id', mssql.BigInt, new_department_id);
    
    const newDeptResult = await checkNewDeptRequest.query(`
      SELECT id, name FROM departments WHERE id = @id
    `);
    
    if (newDeptResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phòng ban mới' });
    }
    
    const newDepartmentName = newDeptResult.recordset[0].name;
    
    // Cập nhật phòng ban cho nhân viên
    const updateRequest = pool.request();
    updateRequest.input('employee_id', mssql.BigInt, employee_id);
    updateRequest.input('new_department_id', mssql.BigInt, new_department_id);
    updateRequest.input('updated_at', mssql.DateTime, new Date());
    
    await updateRequest.query(`
      UPDATE employees
      SET department_id = @new_department_id, updated_at = @updated_at
      WHERE id = @employee_id
    `);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'TRANSFER');
    auditRequest.input('table_name', mssql.NVarChar, 'employees');
    auditRequest.input('record_id', mssql.BigInt, employee_id);
    auditRequest.input('detail', mssql.NVarChar, 
      `Transferred employee: ${employeeName} to department: ${newDepartmentName}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(200).json({
      message: 'Chuyển nhân viên sang phòng ban mới thành công'
    });
  } catch (error) {
    console.error('Lỗi khi chuyển nhân viên sang phòng ban khác:', error);
    res.status(500).json({ message: 'Lỗi server khi chuyển nhân viên sang phòng ban khác' });
  }
});

module.exports = router;
