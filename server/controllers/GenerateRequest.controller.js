import { sql } from '../config/connectMSSQL.js';

// Helper
const isHR = (user) => user.role === 'HR-Admin' || user.role === 'HR-Staff';

// 1. Tạo yêu cầu nội bộ (Employee tự gửi hoặc HR gửi giúp)
export const HandleCreateGenerateRequest = async (req, res) => {
  try {
    let { requesttitle, requestconent, employeeID } = req.body;
    const organizationID = req.user.organization_id;

    // Nếu không phải HR, employeeID = id của mình
    if (!isHR(req.user)) employeeID = req.user.id;

    if (!requesttitle || !requestconent || !employeeID) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    const employeeResult = await sql.query`
      SELECT * FROM employees WHERE id = ${employeeID} AND organization_id = ${organizationID}
    `;
    const employee = employeeResult.recordset[0];
    if (!employee) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" });
    }

    const departmentResult = await sql.query`
      SELECT * FROM departments WHERE id = ${employee.department_id} AND organization_id = ${organizationID}
    `;
    const department = departmentResult.recordset[0];
    if (!department) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phòng ban" });
    }

    const checkRequest = await sql.query`
      SELECT * FROM generate_requests
      WHERE requesttitle = ${requesttitle}
        AND requestconent = ${requestconent}
        AND employee_id = ${employeeID}
        AND department_id = ${employee.department_id}
    `;
    if (checkRequest.recordset.length > 0) {
      return res.status(409).json({ success: false, message: "Yêu cầu đã tồn tại" });
    }

    await sql.query`
      INSERT INTO generate_requests (
        requesttitle, requestconent, employee_id, department_id, organization_id, created_at
      ) VALUES (
        ${requesttitle}, ${requestconent}, ${employeeID}, ${employee.department_id}, ${organizationID}, GETDATE()
      )
    `;

    res.status(200).json({ success: true, message: "Tạo yêu cầu thành công" });
  } catch (error) {
    console.error("Create Request Error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống", error });
  }
};

// 2. HR lấy tất cả yêu cầu nội bộ
export const HandleAllGenerateRequest = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });
    const organizationID = req.user.organization_id;

    const result = await sql.query`
      SELECT r.*, e.firstname, e.lastname, d.name AS department_name
      FROM generate_requests r
      JOIN employees e ON r.employee_id = e.id
      JOIN departments d ON r.department_id = d.id
      WHERE r.organization_id = ${organizationID}
      ORDER BY r.created_at DESC
    `;

    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Fetch All Requests Error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống", error });
  }
};

// 3. Lấy 1 yêu cầu (HR hoặc nhân viên chính chủ)
export const HandleGenerateRequest = async (req, res) => {
  try {
    const { requestID } = req.params;
    const organizationID = req.user.organization_id;

    const result = await sql.query`
      SELECT r.*, e.firstname, e.lastname, d.name AS department_name, e.id as employee_id
      FROM generate_requests r
      JOIN employees e ON r.employee_id = e.id
      JOIN departments d ON r.department_id = d.id
      WHERE r.id = ${requestID} AND r.organization_id = ${organizationID}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
    }

    const request = result.recordset[0];

    if (!isHR(req.user) && request.employee_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Không đủ quyền" });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Fetch Single Request Error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống", error });
  }
};

// 4. HR cập nhật nội dung yêu cầu
export const HandleUpdateGenerateRequest = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });
    const { requestID, requesttitle, requestconent } = req.body;

    await sql.query`
      UPDATE generate_requests
      SET requesttitle = ${requesttitle},
          requestconent = ${requestconent},
          updated_at = GETDATE()
      WHERE id = ${requestID}
    `;

    res.status(200).json({ success: true, message: "Cập nhật yêu cầu thành công" });
  } catch (error) {
    console.error("Update Request Error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống", error });
  }
};

// 5. HR xóa yêu cầu
export const HandleDeleteGenerateRequest = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });
    const { requestID } = req.params;

    await sql.query`
      DELETE FROM generate_requests WHERE id = ${requestID}
    `;

    res.status(200).json({ success: true, message: "Đã xóa yêu cầu" });
  } catch (error) {
    console.error("Delete Request Error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống", error });
  }
};