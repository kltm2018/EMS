import { sql } from "../config/connectMSSQL.js";

// 1. Khởi tạo chấm công cho nhân viên (Chỉ HR)
export const HandleInitializeAttendance = async (req, res) => {
  try {
    if (req.user.role !== "HR-Admin" && req.user.role !== "HR-Staff") {
      return res.status(403).json({ success: false, message: "Chỉ HR được phép khởi tạo chấm công" });
    }
    const { employeeID } = req.body;
    const organizationID = req.user.organization_id;

    if (!employeeID) {
      return res.status(400).json({ success: false, message: "Missing employee ID" });
    }

    const employeeRes = await sql.query`
      SELECT * FROM employees WHERE id = ${employeeID} AND organization_id = ${organizationID}
    `;
    if (employeeRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const attendanceRes = await sql.query`
      SELECT * FROM attendance WHERE employee_id = ${employeeID}
    `;
    if (attendanceRes.recordset.length > 0) {
      return res.status(400).json({ success: false, message: "Attendance already initialized" });
    }

    await sql.query`
      INSERT INTO attendance (employee_id, organization_id, status, created_at)
      VALUES (${employeeID}, ${organizationID}, N'Not Specified', GETDATE())
    `;

    // Audit log
    await sql.query`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (${req.user.email}, N'INSERT', N'attendance', ${employeeID}, N'Khởi tạo chấm công')
    `;

    res.status(200).json({ success: true, message: "Attendance initialized" });
  } catch (err) {
    console.error("Initialize Attendance Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error", err });
  }
};

// 2. Lấy tất cả bản ghi chấm công
export const HandleAllAttendance = async (req, res) => {
  try {
    const organizationID = req.user.organization_id;

    // HR: xem tất cả, trưởng phòng chỉ xem nhân viên cùng phòng, nhân viên chỉ xem mình
    let sqlQuery = `
      SELECT a.id, a.employee_id, a.status, a.checkin_time, a.checkout_time, e.firstname, e.lastname, e.department_id
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.organization_id = ${organizationID}
    `;
    if (req.user.role === "Manager" || req.user.role === "manager_user") {
      sqlQuery += ` AND e.department_id = ${req.user.department_id} `;
    } else if (req.user.role === "Employee" || req.user.role === "employee_user") {
      sqlQuery += ` AND a.employee_id = ${req.user.id} `;
    }

    const result = await sql.query([sqlQuery]);

    res.status(200).json({ success: true, message: "All attendance fetched", data: result.recordset });
  } catch (err) {
    console.error("Fetch All Attendance Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 3. Lấy chấm công theo ID
export const HandleAttendance = async (req, res) => {
  try {
    const { attendanceID } = req.params;
    const organizationID = req.user.organization_id;

    let query = `
      SELECT a.id, a.status, a.checkin_time, a.checkout_time, a.employee_id,
             e.firstname, e.lastname, e.department_id
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.id = ${attendanceID} AND a.organization_id = ${organizationID}
    `;

    // Phân quyền chi tiết
    if (req.user.role === "Manager" || req.user.role === "manager_user") {
      query += ` AND e.department_id = ${req.user.department_id} `;
    } else if (req.user.role === "Employee" || req.user.role === "employee_user") {
      query += ` AND a.employee_id = ${req.user.id} `;
    }

    const result = await sql.query([query]);
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Attendance not found" });
    }

    res.status(200).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error("Fetch Attendance Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 4. Cập nhật chấm công (Chỉ HR hoặc bản thân)
export const HandleUpdateAttendance = async (req, res) => {
  try {
    const { attendanceID, status } = req.body;

    // Chỉ HR hoặc chính chủ được cập nhật
    let canUpdate = false;
    if (req.user.role === "HR-Admin" || req.user.role === "HR-Staff") {
      canUpdate = true;
    } else {
      // Kiểm tra có phải bản thân không
      const result = await sql.query`
        SELECT * FROM attendance WHERE id = ${attendanceID} AND employee_id = ${req.user.id}
      `;
      if (result.recordset.length > 0) canUpdate = true;
    }
    if (!canUpdate) {
      return res.status(403).json({ success: false, message: "Không có quyền cập nhật chấm công" });
    }

    await sql.query`
      UPDATE attendance
      SET status = ${status}, updated_at = GETDATE()
      WHERE id = ${attendanceID}
    `;

    await sql.query`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (${req.user.email}, N'UPDATE', N'attendance', ${attendanceID}, N'Cập nhật trạng thái chấm công')
    `;

    res.status(200).json({ success: true, message: "Attendance updated" });
  } catch (err) {
    console.error("Update Attendance Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 5. Xóa chấm công (Chỉ HR)
export const HandleDeleteAttendance = async (req, res) => {
  try {
    if (req.user.role !== "HR-Admin" && req.user.role !== "HR-Staff") {
      return res.status(403).json({ success: false, message: "Chỉ HR mới được xóa chấm công" });
    }
    const { attendanceID } = req.params;

    await sql.query`
      DELETE FROM attendance WHERE id = ${attendanceID}
    `;

    await sql.query`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (${req.user.email}, N'DELETE', N'attendance', ${attendanceID}, N'Xóa bản ghi chấm công')
    `;

    res.status(200).json({ success: true, message: "Attendance deleted" });
  } catch (err) {
    console.error("Delete Attendance Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};