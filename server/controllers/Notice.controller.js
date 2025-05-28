import { sql } from '../config/connectMSSQL.js';

// Helper
const isHR = (user) => user.role === 'HR-Admin' || user.role === 'HR-Staff';

// 1. Tạo thông báo (chỉ HR)
export const HandleCreateNotice = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });

    const { title, content, audience, departmentID, employeeID } = req.body;
    const HRID = req.user.id;
    const organizationID = req.user.organization_id;

    if (!title || !content || !audience) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin" });
    }

    let exists;

    if (audience === "Department-Specific") {
      if (!departmentID) {
        return res.status(400).json({ success: false, message: "Thiếu mã phòng ban" });
      }

      exists = await sql.query`
        SELECT * FROM notices
        WHERE title = ${title} AND content = ${content}
          AND audience = ${audience}
          AND department_id = ${departmentID}
          AND createdby = ${HRID}
      `;

      if (exists.recordset.length > 0) {
        return res.status(400).json({ success: false, message: "Đã tồn tại thông báo cùng nội dung" });
      }

      await sql.query`
        INSERT INTO notices (
          title, content, audience, department_id, createdby, organization_id, created_at
        )
        VALUES (
          ${title}, ${content}, ${audience}, ${departmentID}, ${HRID}, ${organizationID}, GETDATE()
        )
      `;

      return res.status(201).json({ success: true, message: "Tạo thông báo cho phòng ban thành công" });
    }

    if (audience === "Employee-Specific") {
      if (!employeeID) {
        return res.status(400).json({ success: false, message: "Thiếu mã nhân viên" });
      }

      exists = await sql.query`
        SELECT * FROM notices
        WHERE title = ${title} AND content = ${content}
          AND audience = ${audience}
          AND employee_id = ${employeeID}
          AND createdby = ${HRID}
      `;

      if (exists.recordset.length > 0) {
        return res.status(400).json({ success: false, message: "Thông báo đã tồn tại cho nhân viên này" });
      }

      await sql.query`
        INSERT INTO notices (
          title, content, audience, employee_id, createdby, organization_id, created_at
        )
        VALUES (
          ${title}, ${content}, ${audience}, ${employeeID}, ${HRID}, ${organizationID}, GETDATE()
        )
      `;

      return res.status(201).json({ success: true, message: "Tạo thông báo cho nhân viên thành công" });
    }

    return res.status(400).json({ success: false, message: "Kiểu audience không hợp lệ" });
  } catch (error) {
    console.error("Notice create error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 2. Lấy tất cả thông báo (HR theo tổ chức, nhân viên chỉ xem thông báo chung/phòng ban của mình hoặc cho cá nhân họ)
export const HandleAllNotices = async (req, res) => {
  try {
    const orgID = req.user.organization_id;
    const { role, department_id, id } = req.user;

    let result;
    if (isHR(req.user)) {
      result = await sql.query`
        SELECT * FROM notices WHERE organization_id = ${orgID}
        ORDER BY created_at DESC
      `;
    } else {
      // Nhân viên chỉ xem thông báo cho phòng ban mình hoặc cho bản thân
      result = await sql.query`
        SELECT * FROM notices
        WHERE organization_id = ${orgID} AND
          (
            (audience = N'Department-Specific' AND department_id = ${department_id})
            OR (audience = N'Employee-Specific' AND employee_id = ${id})
          )
        ORDER BY created_at DESC
      `;
    }

    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Fetch notices error:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 3. Xem chi tiết thông báo (chỉ HR hoặc người nhận)
export const HandleNotice = async (req, res) => {
  try {
    const { noticeID } = req.params;
    const { role, id, department_id } = req.user;

    const result = await sql.query`
      SELECT * FROM notices WHERE id = ${noticeID}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Thông báo không tồn tại" });
    }

    const notice = result.recordset[0];
    if (!isHR(req.user)) {
      if (
        !(notice.audience === "Department-Specific" && notice.department_id === department_id) &&
        !(notice.audience === "Employee-Specific" && notice.employee_id === id)
      ) {
        return res.status(403).json({ success: false, message: "Không đủ quyền xem thông báo này" });
      }
    }

    res.status(200).json({ success: true, data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 4. HR cập nhật thông báo
export const HandleUpdateNotice = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });

    const { noticeID, title, content } = req.body;

    await sql.query`
      UPDATE notices
      SET title = ${title},
          content = ${content},
          updated_at = GETDATE()
      WHERE id = ${noticeID}
    `;

    res.status(200).json({ success: true, message: "Cập nhật thông báo thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 5. HR xóa thông báo
export const HandleDeleteNotice = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });

    const { noticeID } = req.params;

    await sql.query`DELETE FROM notices WHERE id = ${noticeID}`;

    res.status(200).json({ success: true, message: "Đã xóa thông báo" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};