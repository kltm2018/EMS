// audit_log.js - Hệ thống ghi log và giám sát
const express = require('express');
const router = express.Router();
const { pool, poolConnect } = require('../config/db');
const mssql = require('mssql');
const { authenticateToken, isHR, isAdmin } = require('../middleware/auth');

// Lấy danh sách audit logs (chỉ HR và Admin mới có quyền)
router.get('/', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    
    // Kiểm tra quyền truy cập
    if (!req.user.role.includes('HR') && !req.user.role.includes('Admin')) {
      return res.status(403).json({ message: 'Không có quyền truy cập audit logs' });
    }
    
    // Lấy các tham số lọc từ query
    const { 
      user, 
      action_type, 
      table_name, 
      start_date, 
      end_date, 
      limit = 100, 
      offset = 0 
    } = req.query;
    
    // Xây dựng câu truy vấn với các điều kiện lọc
    let query = `
      SELECT 
        id,
        [user],
        action_type,
        table_name,
        record_id,
        access_time,
        detail
      FROM audit_logs
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (user) {
      query += ` AND [user] LIKE @user`;
      queryParams.push({ name: 'user', value: `%${user}%`, type: mssql.NVarChar });
    }
    
    if (action_type) {
      query += ` AND action_type = @action_type`;
      queryParams.push({ name: 'action_type', value: action_type, type: mssql.NVarChar });
    }
    
    if (table_name) {
      query += ` AND table_name = @table_name`;
      queryParams.push({ name: 'table_name', value: table_name, type: mssql.NVarChar });
    }
    
    if (start_date) {
      query += ` AND access_time >= @start_date`;
      queryParams.push({ name: 'start_date', value: new Date(start_date), type: mssql.DateTime });
    }
    
    if (end_date) {
      query += ` AND access_time <= @end_date`;
      queryParams.push({ name: 'end_date', value: new Date(end_date), type: mssql.DateTime });
    }
    
    // Thêm sắp xếp và phân trang
    query += ` ORDER BY access_time DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
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
      FROM audit_logs
      WHERE 1=1
    `;
    
    if (user) countQuery += ` AND [user] LIKE @user`;
    if (action_type) countQuery += ` AND action_type = @action_type`;
    if (table_name) countQuery += ` AND table_name = @table_name`;
    if (start_date) countQuery += ` AND access_time >= @start_date`;
    if (end_date) countQuery += ` AND access_time <= @end_date`;
    
    const countRequest = pool.request();
    
    // Thêm các tham số vào request đếm
    queryParams.forEach(param => {
      if (param.name !== 'offset' && param.name !== 'limit') {
        countRequest.input(param.name, param.type, param.value);
      }
    });
    
    const countResult = await countRequest.query(countQuery);
    
    // Ghi log audit cho việc xem audit logs
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'VIEW');
    auditRequest.input('table_name', mssql.NVarChar, 'audit_logs');
    auditRequest.input('record_id', mssql.BigInt, 0);
    auditRequest.input('detail', mssql.NVarChar, 
      `Viewed audit logs with filters: ${JSON.stringify(req.query)}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(200).json({
      logs: result.recordset,
      total: countResult.recordset[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Lỗi khi lấy audit logs:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy audit logs' });
  }
});

// Lấy chi tiết một audit log (chỉ HR và Admin mới có quyền)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    
    // Kiểm tra quyền truy cập
    if (!req.user.role.includes('HR') && !req.user.role.includes('Admin')) {
      return res.status(403).json({ message: 'Không có quyền truy cập audit logs' });
    }
    
    const logId = req.params.id;
    
    // Lấy thông tin chi tiết của log
    const request = pool.request();
    request.input('id', mssql.BigInt, logId);
    
    const result = await request.query(`
      SELECT 
        id,
        [user],
        action_type,
        table_name,
        record_id,
        access_time,
        detail
      FROM audit_logs
      WHERE id = @id
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy audit log' });
    }
    
    // Nếu log liên quan đến một bản ghi cụ thể, lấy thêm thông tin của bản ghi đó
    const log = result.recordset[0];
    
    if (log.record_id > 0 && log.table_name) {
      try {
        const recordRequest = pool.request();
        recordRequest.input('id', mssql.BigInt, log.record_id);
        
        // Tùy thuộc vào bảng, lấy thông tin phù hợp
        let recordQuery = '';
        
        switch (log.table_name.toLowerCase()) {
          case 'employees':
            recordQuery = `
              SELECT id, code, firstname, lastname, email, department_id, organization_id
              FROM employees
              WHERE id = @id
            `;
            break;
          case 'departments':
            recordQuery = `
              SELECT id, name, description, organization_id
              FROM departments
              WHERE id = @id
            `;
            break;
          case 'employee_salaries':
            recordQuery = `
              SELECT id, employee_id, basic_salary, salary_coefficient, 
                     social_insurance, health_insurance, unemployment_insurance, 
                     allowance, income_tax
              FROM employee_salaries
              WHERE employee_id = @id
            `;
            break;
          // Thêm các trường hợp khác nếu cần
        }
        
        if (recordQuery) {
          const recordResult = await recordRequest.query(recordQuery);
          if (recordResult.recordset.length > 0) {
            log.record_details = recordResult.recordset[0];
          }
        }
      } catch (recordError) {
        console.error('Lỗi khi lấy thông tin bản ghi liên quan:', recordError);
        // Không trả về lỗi, chỉ bỏ qua thông tin bản ghi liên quan
      }
    }
    
    // Ghi log audit cho việc xem chi tiết audit log
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'VIEW');
    auditRequest.input('table_name', mssql.NVarChar, 'audit_logs');
    auditRequest.input('record_id', mssql.BigInt, logId);
    auditRequest.input('detail', mssql.NVarChar, `Viewed audit log details for log ID: ${logId}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    res.status(200).json({ log });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết audit log:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết audit log' });
  }
});

// Xuất audit logs ra file (chỉ HR và Admin mới có quyền)
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    await poolConnect;
    
    // Kiểm tra quyền truy cập
    if (!req.user.role.includes('HR') && !req.user.role.includes('Admin')) {
      return res.status(403).json({ message: 'Không có quyền xuất audit logs' });
    }
    
    // Lấy các tham số lọc từ query
    const { 
      user, 
      action_type, 
      table_name, 
      start_date, 
      end_date
    } = req.query;
    
    // Xây dựng câu truy vấn với các điều kiện lọc
    let query = `
      SELECT 
        id,
        [user],
        action_type,
        table_name,
        record_id,
        access_time,
        detail
      FROM audit_logs
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (user) {
      query += ` AND [user] LIKE @user`;
      queryParams.push({ name: 'user', value: `%${user}%`, type: mssql.NVarChar });
    }
    
    if (action_type) {
      query += ` AND action_type = @action_type`;
      queryParams.push({ name: 'action_type', value: action_type, type: mssql.NVarChar });
    }
    
    if (table_name) {
      query += ` AND table_name = @table_name`;
      queryParams.push({ name: 'table_name', value: table_name, type: mssql.NVarChar });
    }
    
    if (start_date) {
      query += ` AND access_time >= @start_date`;
      queryParams.push({ name: 'start_date', value: new Date(start_date), type: mssql.DateTime });
    }
    
    if (end_date) {
      query += ` AND access_time <= @end_date`;
      queryParams.push({ name: 'end_date', value: new Date(end_date), type: mssql.DateTime });
    }
    
    // Thêm sắp xếp
    query += ` ORDER BY access_time DESC`;
    
    // Thực hiện truy vấn
    const request = pool.request();
    
    // Thêm các tham số vào request
    queryParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    
    // Chuyển đổi kết quả thành CSV
    let csv = 'ID,User,Action Type,Table Name,Record ID,Access Time,Detail\n';
    
    result.recordset.forEach(log => {
      // Xử lý các trường có thể chứa dấu phẩy hoặc dấu nháy kép
      const formatField = (field) => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      };
      
      csv += [
        log.id,
        formatField(log.user),
        formatField(log.action_type),
        formatField(log.table_name),
        log.record_id,
        formatField(new Date(log.access_time).toISOString()),
        formatField(log.detail)
      ].join(',') + '\n';
    });
    
    // Ghi log audit cho việc xuất audit logs
    const auditRequest = pool.request();
    auditRequest.input('user', mssql.NVarChar, req.user.email);
    auditRequest.input('action_type', mssql.NVarChar, 'EXPORT');
    auditRequest.input('table_name', mssql.NVarChar, 'audit_logs');
    auditRequest.input('record_id', mssql.BigInt, 0);
    auditRequest.input('detail', mssql.NVarChar, 
      `Exported audit logs to CSV with filters: ${JSON.stringify(req.query)}`);
    
    await auditRequest.query(`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (@user, @action_type, @table_name, @record_id, @detail)
    `);
    
    // Thiết lập header cho response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    
    res.status(200).send(csv);
  } catch (error) {
    console.error('Lỗi khi xuất audit logs:', error);
    res.status(500).json({ message: 'Lỗi server khi xuất audit logs' });
  }
});

module.exports = router;
