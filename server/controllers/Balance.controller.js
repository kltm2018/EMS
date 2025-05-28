import { sql } from '../config/connectMSSQL.js';

// Nhân viên xem số dư của mình
export const HandleGetBalance = async (req, res) => {
  try {
    const { id: employee_id, role } = req.user;

    // Chỉ cho phép nhân viên xem số dư bản thân
    if (role !== 'Employee' && role !== 'employee_user') {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    const result = await sql.query`
      SELECT balance_type, amount, last_updated
      FROM balances
      WHERE employee_id = ${employee_id}
    `;

    res.status(200).json({
      success: true,
      message: 'Số dư cá nhân',
      data: result.recordset
    });
  } catch (error) {
    console.error('Get Balance Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// HR cập nhật số dư (thêm hoặc trừ)
export const HandleUpdateBalance = async (req, res) => {
  try {
    // Chỉ HR có quyền cập nhật
    if (req.user.role !== "HR-Admin" && req.user.role !== "HR-Staff") {
      return res.status(403).json({ success: false, message: 'Không có quyền cập nhật số dư' });
    }
    const { employee_id, balance_type, amount_change } = req.body;

    if (!employee_id || !balance_type || amount_change === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    // Kiểm tra có tồn tại chưa
    const check = await sql.query`
      SELECT * FROM balances WHERE employee_id = ${employee_id} AND balance_type = ${balance_type}
    `;

    if (check.recordset.length === 0) {
      await sql.query`
        INSERT INTO balances (employee_id, balance_type, amount, last_updated)
        VALUES (${employee_id}, ${balance_type}, ${amount_change}, GETDATE())
      `;
    } else {
      await sql.query`
        UPDATE balances
        SET amount = amount + ${amount_change}, last_updated = GETDATE()
        WHERE employee_id = ${employee_id} AND balance_type = ${balance_type}
      `;
    }

    // Audit log
    await sql.query`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (
        ${req.user.email},
        N'UPDATE',
        N'balances',
        ${employee_id},
        N'Cập nhật số dư: ${balance_type}, thay đổi: ${amount_change}'
      )
    `;

    res.status(200).json({ success: true, message: 'Số dư đã được cập nhật' });
  } catch (error) {
    console.error('Update Balance Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// HR xem số dư của toàn bộ nhân viên trong tổ chức
export const HandleAllEmployeeBalances = async (req, res) => {
  try {
    // Chỉ HR và kế toán có quyền xem toàn bộ
    if (
      req.user.role !== "HR-Admin" &&
      req.user.role !== "HR-Staff" &&
      req.user.role !== "accountant_user"
    ) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }
    const { organization_id } = req.user;

    const result = await sql.query`
      SELECT e.firstname, e.lastname, b.balance_type, b.amount, b.last_updated
      FROM balances b
      JOIN employees e ON b.employee_id = e.id
      WHERE e.organization_id = ${organization_id}
      ORDER BY e.firstname
    `;

    res.status(200).json({
      success: true,
      message: 'Tất cả số dư nhân viên',
      data: result.recordset
    });
  } catch (error) {
    console.error('All Balances Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};