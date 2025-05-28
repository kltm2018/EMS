import { sql } from '../config/connectMSSQL.js';

// Helper kiểm tra quyền
const isHR = (user) => user.role === 'HR-Admin' || user.role === 'HR-Staff';
const isEmployee = (user) => user.role === 'Employee' || user.role === 'Manager';

// 1. Tạo yêu cầu nghỉ phép (HR nhập giúp hoặc Employee tự gửi)
export const HandleCreateLeave = async (req, res) => {
  try {
    let { employeeID, startdate, enddate, title, reason } = req.body;
    const organizationID = req.user.organization_id;

    // Nếu employee tự gửi, tự động lấy ID của họ
    if (!isHR(req.user)) employeeID = req.user.id;

    if (!employeeID || !startdate || !enddate || !title || !reason) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin" });
    }

    const checkLeave = await sql.query`
      SELECT * FROM leaves
      WHERE employee_id = ${employeeID}
        AND startdate = ${startdate}
        AND enddate = ${enddate}
    `;
    if (checkLeave.recordset.length > 0) {
      return res.status(400).json({ success: false, message: "Đã tồn tại đơn nghỉ trong khoảng này" });
    }

    await sql.query`
      INSERT INTO leaves (
        employee_id, organization_id, startdate, enddate, title, reason, status, created_at
      ) VALUES (
        ${employeeID}, ${organizationID}, ${startdate}, ${enddate}, ${title}, ${reason}, N'Pending', GETDATE()
      )
    `;

    res.status(200).json({ success: true, message: "Tạo đơn nghỉ thành công" });
  } catch (err) {
    console.error("Create Leave Error:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 2. HR lấy tất cả đơn nghỉ
export const HandleAllLeaves = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR được xem tất cả đơn nghỉ" });
    const orgID = req.user.organization_id;

    const result = await sql.query`
      SELECT l.*, e.firstname, e.lastname, e.department_id
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE l.organization_id = ${orgID}
    `;

    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 3. HR hoặc Employee lấy 1 đơn nghỉ
export const HandleLeave = async (req, res) => {
  try {
    const { leaveID } = req.params;
    const orgID = req.user.organization_id;

    const result = await sql.query`
      SELECT l.*, e.firstname, e.lastname, e.id AS employee_id
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE l.id = ${leaveID} AND l.organization_id = ${orgID}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn nghỉ" });
    }

    const leave = result.recordset[0];

    // Employee chỉ xem được đơn của chính mình
    if (isEmployee(req.user) && leave.employee_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Không đủ quyền" });
    }

    res.status(200).json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 4. Nhân viên cập nhật đơn của chính mình (khi status vẫn là Pending)
export const HandleUpdateLeaveByEmployee = async (req, res) => {
  try {
    const { leaveID, startdate, enddate, title, reason } = req.body;
    const userID = req.user.id;

    const check = await sql.query`
      SELECT * FROM leaves
      WHERE id = ${leaveID} AND employee_id = ${userID} AND status = N'Pending'
    `;

    if (check.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "Không thể cập nhật đơn đã xử lý hoặc không phải đơn của bạn" });
    }

    await sql.query`
      UPDATE leaves
      SET startdate = ${startdate}, enddate = ${enddate}, title = ${title}, reason = ${reason}, updated_at = GETDATE()
      WHERE id = ${leaveID}
    `;

    res.status(200).json({ success: true, message: "Cập nhật đơn nghỉ thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 5. HR cập nhật trạng thái đơn nghỉ
export const HandleUpdateLeaveByHR = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });
    const { leaveID, status } = req.body;
    const orgID = req.user.organization_id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    await sql.query`
      UPDATE leaves
      SET status = ${status}, updated_at = GETDATE()
      WHERE id = ${leaveID} AND organization_id = ${orgID}
    `;

    res.status(200).json({ success: true, message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 6. HR xóa đơn nghỉ
export const HandleDeleteLeave = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });
    const { leaveID } = req.params;

    await sql.query`DELETE FROM leaves WHERE id = ${leaveID}`;

    res.status(200).json({ success: true, message: "Xóa đơn nghỉ thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};