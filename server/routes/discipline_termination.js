// discipline_termination.js - Quản lý kỷ luật và thôi việc
const express = require('express');
const router = express.Router();
const { pool, poolConnect } = require('../config/db');
const mssql = require('mssql');
const { authenticateToken, isHR } = require('../middleware/auth');

// Lấy danh sách kỷ luật (chỉ HR mới có quyền)
router.get('/discipline', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    
    // Lấy các tham số lọc từ query
    const { employee_id, month, year, limit = 100, offset = 0 } = req.query;
    
    // Xây dựng câu truy vấn với các điều kiện lọc
    let query = `
      SELECT 
        d.id,
        d.employee_id,
        e.code as employee_code,
        e.firstname,
        e.lastname,
        d.reason,
        d.penalty_amount,
        d.discipline_month,
        d.created_at,
        d.updated_at
      FROM disciplines d
      JOIN employees e ON d.employee_id = e.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (employee_id) {
      query += ` AND d.employee_id = @employee_id`;
      queryParams.push({ name: 'employee_id', value: employee_id, type: mssql.BigInt });
    }
    
    if (month) {
      query += ` AND MONTH(d.discipline_month) = @month`;
      queryParams.push({ name: 'month', value: parseInt(month), type: mssql.Int });
    }
    
    if (year) {
      query += ` AND YEAR(d.discipline_month) = @year`;
      queryParams.push({ name: 'year', value: parseInt(year), type: mssql.Int });
    }
    
    // Thêm sắp xếp và phân trang
    query += ` ORDER BY d.discipline_month DESC, e.lastname, e.firstname OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    queryParams.push({ name: 'offset', value: parseInt(offset), type: mssql.Int });
    queryParams.push({ name: 'limit', value: parseInt(limit), type: mssql.Int });
    
    // Thực hiện truy vấn
    const request = pool.request();
    
    // Thêm các tham số vào request
    queryParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    
    // Đếm tổng số bản ghi (không có phân trang)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM disciplines d
      JOIN employees e ON d.employee_id = e.id
      WHERE 1=1
    `;
    
    if (employee_id) countQuery += ` AND d.employee_id = @employee_id`;
    if (month) countQuery += ` AND MONTH(d.discipline_month) = @month`;
    if (year) countQuery += ` AND YEAR(d.discipline_month) = @year`;
    
    const countRequest = pool.request();
    
    // Thêm các tham số vào request đếm
    queryParams.forEach(param => {
      if (param.name !== 'offset' && param.name !== 'limit') {
        countRequest.input(param.name, param.type, param.value);
      }
    });
    
    const countResult = await countRequest.query(countQuery);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'VIEW');
    auditRequest.input('table_name', mssql.NVarChar, 'disciplines');
    auditRequest.input('record_id', mssql.BigInt, 0);
    auditRequest.input('detail', mssql.NVarChar, 
      `Viewed discipline records with filters: ${JSON.stringify(req.query)}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(200).json({
      disciplines: result.recordset,
      total: countResult.recordset[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách kỷ luật:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách kỷ luật' });
  }
});

// Thêm kỷ luật mới (chỉ HR mới có quyền)
router.post('/discipline', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    const { employee_id, reason, penalty_amount, discipline_month } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!employee_id || !reason || penalty_amount === undefined || !discipline_month) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin kỷ luật' });
    }
    
    // Kiểm tra nhân viên tồn tại
    const checkRequest = pool.request();
    checkRequest.input('id', mssql.BigInt, employee_id);
    
    const employeeResult = await checkRequest.query(`
      SELECT id, code, firstname, lastname 
      FROM employees 
      WHERE id = @id
    `);
    
    if (employeeResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    
    const employeeName = `${employeeResult.recordset[0].lastname} ${employeeResult.recordset[0].firstname}`;
    
    // Thêm kỷ luật mới
    const insertRequest = pool.request();
    insertRequest.input('employee_id', mssql.BigInt, employee_id);
    insertRequest.input('reason', mssql.NVarChar, reason);
    insertRequest.input('penalty_amount', mssql.Int, penalty_amount);
    insertRequest.input('discipline_month', mssql.Date, new Date(discipline_month));
    
    const result = await insertRequest.query(`
      INSERT INTO disciplines (employee_id, reason, penalty_amount, discipline_month)
      VALUES (@employee_id, @reason, @penalty_amount, @discipline_month);
      SELECT SCOPE_IDENTITY() AS id;
    `);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'CREATE');
    auditRequest.input('table_name', mssql.NVarChar, 'disciplines');
    auditRequest.input('record_id', mssql.BigInt, result.recordset[0].id);
    auditRequest.input('detail', mssql.NVarChar, 
      `Created discipline record for employee: ${employeeName}, Reason: ${reason}, Amount: ${penalty_amount}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(201).json({
      message: 'Thêm kỷ luật thành công',
      discipline_id: result.recordset[0].id
    });
  } catch (error) {
    console.error('Lỗi khi thêm kỷ luật:', error);
    res.status(500).json({ message: 'Lỗi server khi thêm kỷ luật' });
  }
});

// Cập nhật kỷ luật (chỉ HR mới có quyền)
router.put('/discipline/:id', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    const disciplineId = req.params.id;
    const { reason, penalty_amount, discipline_month } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!reason || penalty_amount === undefined || !discipline_month) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin kỷ luật' });
    }
    
    // Kiểm tra kỷ luật tồn tại
    const checkRequest = pool.request();
    checkRequest.input('id', mssql.BigInt, disciplineId);
    
    const disciplineResult = await checkRequest.query(`
      SELECT d.id, d.employee_id, e.firstname, e.lastname
      FROM disciplines d
      JOIN employees e ON d.employee_id = e.id
      WHERE d.id = @id
    `);
    
    if (disciplineResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy kỷ luật' });
    }
    
    const employeeName = `${disciplineResult.recordset[0].lastname} ${disciplineResult.recordset[0].firstname}`;
    
    // Cập nhật kỷ luật
    const updateRequest = pool.request();
    updateRequest.input('id', mssql.BigInt, disciplineId);
    updateRequest.input('reason', mssql.NVarChar, reason);
    updateRequest.input('penalty_amount', mssql.Int, penalty_amount);
    updateRequest.input('discipline_month', mssql.Date, new Date(discipline_month));
    updateRequest.input('updated_at', mssql.DateTime, new Date());
    
    await updateRequest.query(`
      UPDATE disciplines
      SET reason = @reason, 
          penalty_amount = @penalty_amount, 
          discipline_month = @discipline_month,
          updated_at = @updated_at
      WHERE id = @id
    `);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'UPDATE');
    auditRequest.input('table_name', mssql.NVarChar, 'disciplines');
    auditRequest.input('record_id', mssql.BigInt, disciplineId);
    auditRequest.input('detail', mssql.NVarChar, 
      `Updated discipline record for employee: ${employeeName}, Reason: ${reason}, Amount: ${penalty_amount}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(200).json({
      message: 'Cập nhật kỷ luật thành công'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật kỷ luật:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật kỷ luật' });
  }
});

// Xóa kỷ luật (chỉ HR mới có quyền)
router.delete('/discipline/:id', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    const disciplineId = req.params.id;
    
    // Kiểm tra kỷ luật tồn tại
    const checkRequest = pool.request();
    checkRequest.input('id', mssql.BigInt, disciplineId);
    
    const disciplineResult = await checkRequest.query(`
      SELECT d.id, d.employee_id, e.firstname, e.lastname, d.reason
      FROM disciplines d
      JOIN employees e ON d.employee_id = e.id
      WHERE d.id = @id
    `);
    
    if (disciplineResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy kỷ luật' });
    }
    
    const employeeName = `${disciplineResult.recordset[0].lastname} ${disciplineResult.recordset[0].firstname}`;
    const reason = disciplineResult.recordset[0].reason;
    
    // Xóa kỷ luật
    const deleteRequest = pool.request();
    deleteRequest.input('id', mssql.BigInt, disciplineId);
    
    await deleteRequest.query(`
      DELETE FROM disciplines WHERE id = @id
    `);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'DELETE');
    auditRequest.input('table_name', mssql.NVarChar, 'disciplines');
    auditRequest.input('record_id', mssql.BigInt, disciplineId);
    auditRequest.input('detail', mssql.NVarChar, 
      `Deleted discipline record for employee: ${employeeName}, Reason: ${reason}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(200).json({
      message: 'Xóa kỷ luật thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa kỷ luật:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa kỷ luật' });
  }
});

// Lấy danh sách thôi việc (chỉ HR mới có quyền)
router.get('/termination', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    
    // Lấy các tham số lọc từ query
    const { employee_id, start_date, end_date, limit = 100, offset = 0 } = req.query;
    
    // Xây dựng câu truy vấn với các điều kiện lọc
    let query = `
      SELECT 
        t.id,
        t.employee_id,
        e.code as employee_code,
        e.firstname,
        e.lastname,
        t.reason,
        t.termination_date,
        t.created_at,
        t.updated_at
      FROM terminations t
      JOIN employees e ON t.employee_id = e.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (employee_id) {
      query += ` AND t.employee_id = @employee_id`;
      queryParams.push({ name: 'employee_id', value: employee_id, type: mssql.BigInt });
    }
    
    if (start_date) {
      query += ` AND t.termination_date >= @start_date`;
      queryParams.push({ name: 'start_date', value: new Date(start_date), type: mssql.Date });
    }
    
    if (end_date) {
      query += ` AND t.termination_date <= @end_date`;
      queryParams.push({ name: 'end_date', value: new Date(end_date), type: mssql.Date });
    }
    
    // Thêm sắp xếp và phân trang
    query += ` ORDER BY t.termination_date DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    queryParams.push({ name: 'offset', value: parseInt(offset), type: mssql.Int });
    queryParams.push({ name: 'limit', value: parseInt(limit), type: mssql.Int });
    
    // Thực hiện truy vấn
    const request = pool.request();
    
    // Thêm các tham số vào request
    queryParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    
    // Đếm tổng số bản ghi (không có phân trang)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM terminations t
      JOIN employees e ON t.employee_id = e.id
      WHERE 1=1
    `;
    
    if (employee_id) countQuery += ` AND t.employee_id = @employee_id`;
    if (start_date) countQuery += ` AND t.termination_date >= @start_date`;
    if (end_date) countQuery += ` AND t.termination_date <= @end_date`;
    
    const countRequest = pool.request();
    
    // Thêm các tham số vào request đếm
    queryParams.forEach(param => {
      if (param.name !== 'offset' && param.name !== 'limit') {
        countRequest.input(param.name, param.type, param.value);
      }
    });
    
    const countResult = await countRequest.query(countQuery);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'VIEW');
    auditRequest.input('table_name', mssql.NVarChar, 'terminations');
    auditRequest.input('record_id', mssql.BigInt, 0);
    auditRequest.input('detail', mssql.NVarChar, 
      `Viewed termination records with filters: ${JSON.stringify(req.query)}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(200).json({
      terminations: result.recordset,
      total: countResult.recordset[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thôi việc:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách thôi việc' });
  }
});

// Thêm thôi việc mới (chỉ HR mới có quyền)
router.post('/termination', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    const { employee_id, reason, termination_date } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!employee_id || !reason || !termination_date) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin thôi việc' });
    }
    
    // Kiểm tra nhân viên tồn tại
    const checkRequest = pool.request();
    checkRequest.input('id', mssql.BigInt, employee_id);
    
    const employeeResult = await checkRequest.query(`
      SELECT id, code, firstname, lastname, status
      FROM employees 
      WHERE id = @id
    `);
    
    if (employeeResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    
    // Kiểm tra nhân viên đã thôi việc chưa
    if (employeeResult.recordset[0].status === 0) {
      return res.status(400).json({ message: 'Nhân viên này đã thôi việc' });
    }
    
    const employeeName = `${employeeResult.recordset[0].lastname} ${employeeResult.recordset[0].firstname}`;
    
    // Bắt đầu transaction
    const transaction = new mssql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Thêm thôi việc mới
      const insertRequest = new mssql.Request(transaction);
      insertRequest.input('employee_id', mssql.BigInt, employee_id);
      insertRequest.input('reason', mssql.NVarChar, reason);
      insertRequest.input('termination_date', mssql.Date, new Date(termination_date));
      
      const result = await insertRequest.query(`
        INSERT INTO terminations (employee_id, reason, termination_date)
        VALUES (@employee_id, @reason, @termination_date);
        SELECT SCOPE_IDENTITY() AS id;
      `);
      
      // Cập nhật trạng thái nhân viên
      const updateRequest = new mssql.Request(transaction);
      updateRequest.input('employee_id', mssql.BigInt, employee_id);
      updateRequest.input('updated_at', mssql.DateTime, new Date());
      
      await updateRequest.query(`
        UPDATE employees
        SET status = 0, updated_at = @updated_at
        WHERE id = @employee_id
      `);
      
      // Commit transaction
      await transaction.commit();
      
      // Ghi log audit
      const auditRequest = pool.request();
      auditRequest.input('user', mssql.NVarChar, req.user.email);
      auditRequest.input('action_type', mssql.NVarChar, 'CREATE');
      auditRequest.input('table_name', mssql.NVarChar, 'terminations');
      auditRequest.input('record_id', mssql.BigInt, result.recordset[0].id);
      auditRequest.input('detail', mssql.NVarChar, 
        `Created termination record for employee: ${employeeName}, Reason: ${reason}, Date: ${termination_date}`);
      
      await auditRequest.query(`
        INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
        VALUES (@user, @action_type, @table_name, @record_id, @detail)
      `);
      
      res.status(201).json({
        message: 'Thêm thôi việc thành công',
        termination_id: result.recordset[0].id
      });
    } catch (transactionError) {
      // Rollback transaction nếu có lỗi
      await transaction.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error('Lỗi khi thêm thôi việc:', error);
    res.status(500).json({ message: 'Lỗi server khi thêm thôi việc' });
  }
});

// Cập nhật thôi việc (chỉ HR mới có quyền)
router.put('/termination/:id', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    const terminationId = req.params.id;
    const { reason, termination_date } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!reason || !termination_date) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin thôi việc' });
    }
    
    // Kiểm tra thôi việc tồn tại
    const checkRequest = pool.request();
    checkRequest.input('id', mssql.BigInt, terminationId);
    
    const terminationResult = await checkRequest.query(`
      SELECT t.id, t.employee_id, e.firstname, e.lastname
      FROM terminations t
      JOIN employees e ON t.employee_id = e.id
      WHERE t.id = @id
    `);
    
    if (terminationResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thôi việc' });
    }
    
    const employeeName = `${terminationResult.recordset[0].lastname} ${terminationResult.recordset[0].firstname}`;
    
    // Cập nhật thôi việc
    const updateRequest = pool.request();
    updateRequest.input('id', mssql.BigInt, terminationId);
    updateRequest.input('reason', mssql.NVarChar, reason);
    updateRequest.input('termination_date', mssql.Date, new Date(termination_date));
    updateRequest.input('updated_at', mssql.DateTime, new Date());
    
    await updateRequest.query(`
      UPDATE terminations
      SET reason = @reason, 
          termination_date = @termination_date,
          updated_at = @updated_at
      WHERE id = @id
    `);
    
    // Ghi log audit
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'UPDATE');
    auditRequest.input('table_name', mssql.NVarChar, 'terminations');
    auditRequest.input('record_id', mssql.BigInt, terminationId);
    auditRequest.input('detail', mssql.NVarChar, 
      `Updated termination record for employee: ${employeeName}, Reason: ${reason}, Date: ${termination_date}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(200).json({
      message: 'Cập nhật thôi việc thành công'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật thôi việc:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật thôi việc' });
  }
});

// Hủy thôi việc (chỉ HR mới có quyền)
router.post('/termination/:id/cancel', authenticateToken, isHR, async (req, res) => {
  try {
    await poolConnect;
    const terminationId = req.params.id;
    
    // Kiểm tra thôi việc tồn tại
    const checkRequest = pool.request();
    checkRequest.input('id', mssql.BigInt, terminationId);
    
    const terminationResult = await checkRequest.query(`
      SELECT t.id, t.employee_id, e.firstname, e.lastname
      FROM terminations t
      JOIN employees e ON t.employee_id = e.id
      WHERE t.id = @id
    `);
    
    if (terminationResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thôi việc' });
    }
    
    const employeeId = terminationResult.recordset[0].employee_id;
    const employeeName = `${terminationResult.recordset[0].lastname} ${terminationResult.recordset[0].firstname}`;
    
    // Bắt đầu transaction
    const transaction = new mssql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Xóa thôi việc
      const deleteRequest = new mssql.Request(transaction);
      deleteRequest.input('id', mssql.BigInt, terminationId);
      
      await deleteRequest.query(`
        DELETE FROM terminations WHERE id = @id
      `);
      
      // Cập nhật trạng thái nhân viên
      const updateRequest = new mssql.Request(transaction);
      updateRequest.input('employee_id', mssql.BigInt, employeeId);
      updateRequest.input('updated_at', mssql.DateTime, new Date());
      
      await updateRequest.query(`
        UPDATE employees
        SET status = 1, updated_at = @updated_at
        WHERE id = @employee_id
      `);
      
      // Commit transaction
      await transaction.commit();
      
      // Ghi log audit
      const auditRequest = pool.request();
      auditRequest.input('user', mssql.NVarChar, req.user.email);
      auditRequest.input('action_type', mssql.NVarChar, 'CANCEL');
      auditRequest.input('table_name', mssql.NVarChar, 'terminations');
      auditRequest.input('record_id', mssql.BigInt, terminationId);
      auditRequest.input('detail', mssql.NVarChar, 
        `Cancelled termination record for employee: ${employeeName}`);
      
      await auditRequest.query(`
        INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
        VALUES (@user, @action_type, @table_name, @record_id, @detail)
      `);
      
      res.status(200).json({
        message: 'Hủy thôi việc thành công'
      });
    } catch (transactionError) {
      // Rollback transaction nếu có lỗi
      await transaction.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error('Lỗi khi hủy thôi việc:', error);
    res.status(500).json({ message: 'Lỗi server khi hủy thôi việc' });
  }
});

module.exports = router;
