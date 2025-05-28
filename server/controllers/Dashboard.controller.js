import { sql } from '../config/connectMSSQL.js';

// Hàm kiểm tra quyền truy cập dashboard
const isDashboardAllowed = (user) => ['HR-Admin', 'HR-Staff', 'Manager', 'Accountant'].includes(user.role);

// Dashboard tổng quan cho HR, HR-Staff, Manager, Accountant
export const HandleDashboard = async (req, res) => {
  try {
    if (!isDashboardAllowed(req.user))
      return res.status(403).json({ message: 'Không đủ quyền.' });

    let dashboardQuery = '';
    let params = {};

    // HR hoặc Accountant: xem tổng quan toàn tổ chức
    if (req.user.role === 'HR-Admin' || req.user.role === 'HR-Staff' || req.user.role === 'Accountant') {
      dashboardQuery = `
        SELECT 
          (SELECT COUNT(*) FROM employees WHERE organization_id = @ORGID) AS total_employees,
          (SELECT COUNT(*) FROM departments WHERE organization_id = @ORGID) AS total_departments,
          (SELECT COUNT(*) FROM human_resources WHERE organization_id = @ORGID) AS total_hr,
          (SELECT COUNT(*) FROM accountants WHERE organization_id = @ORGID) AS total_accountants,
          (SELECT COUNT(*) FROM organizations WHERE id = @ORGID) AS total_organizations,
          (SELECT COUNT(*) FROM audit_logs WHERE [action_type] = 'LEAVE' AND [user] LIKE '%') AS total_leaves,
          (SELECT COUNT(*) FROM audit_logs WHERE [action_type] = 'REQUEST' AND [user] LIKE '%') AS total_requests,
          (SELECT COUNT(*) FROM audit_logs WHERE [action_type] = 'NOTICE' AND [user] LIKE '%') AS total_notices
      `;
      params = { ORGID: req.user.organization_id };
    }
    // Manager: chỉ xem phòng ban của mình
    else if (req.user.role === 'Manager') {
      dashboardQuery = `
        SELECT 
          (SELECT COUNT(*) FROM employees WHERE department_id = @DEPTID AND organization_id = @ORGID) AS total_employees,
          (SELECT COUNT(*) FROM departments WHERE id = @DEPTID AND organization_id = @ORGID) AS total_departments,
          (SELECT COUNT(*) FROM human_resources WHERE organization_id = @ORGID) AS total_hr,
          (SELECT COUNT(*) FROM accountants WHERE organization_id = @ORGID) AS total_accountants
      `;
      params = { ORGID: req.user.organization_id, DEPTID: req.user.department_id };
    }

    const result = await sql.query(dashboardQuery, params);
    const data = result.recordset[0];

    // Nếu là Accountant thì trả thêm thống kê lương
    if (req.user.role === 'Accountant') {
      await sql.query`OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';`;
      const salaryStats = await sql.query(`
        SELECT 
          AVG(CAST(DecryptByKey(salary) AS FLOAT)) AS avg_salary,
          MIN(CAST(DecryptByKey(salary) AS FLOAT)) AS min_salary,
          MAX(CAST(DecryptByKey(salary) AS FLOAT)) AS max_salary
        FROM employees WHERE organization_id = @ORGID
      `, { ORGID: req.user.organization_id });
      await sql.query`CLOSE SYMMETRIC KEY SymKey_Emp;`;
      data.salary_stats = salaryStats.recordset[0];
    }

    res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};

// Lấy thống kê lương (chỉ kế toán, hoặc có thể dùng riêng nếu muốn)
export const HandleSalaryStats = async (req, res) => {
  try {
    if (req.user.role !== 'Accountant')
      return res.status(403).json({ message: 'Chỉ kế toán.' });

    await sql.query`OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';`;
    const result = await sql.query(`
      SELECT 
        AVG(CAST(DecryptByKey(salary) AS FLOAT)) AS avg_salary,
        MIN(CAST(DecryptByKey(salary) AS FLOAT)) AS min_salary,
        MAX(CAST(DecryptByKey(salary) AS FLOAT)) AS max_salary
      FROM employees WHERE organization_id = @ORGID
    `, { ORGID: req.user.organization_id });
    await sql.query`CLOSE SYMMETRIC KEY SymKey_Emp;`;

    res.status(200).json({
      success: true,
      message: "Salary stats fetched successfully",
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Salary Stats Error:', error);
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};