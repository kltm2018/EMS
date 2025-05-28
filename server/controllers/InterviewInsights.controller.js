import { sql } from '../config/connectMSSQL.js';

// Helper
const isHR = (u) => u.role === 'HR-Admin' || u.role === 'HR-Staff';

// 1. Tạo bản ghi phỏng vấn (chỉ HR)
export const HandleCreateInterview = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });

    const { applicantID, interviewerID } = req.body;
    const organizationID = req.user.organization_id;

    if (!applicantID || !interviewerID) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin ứng viên hoặc người phỏng vấn" });
    }

    const check = await sql.query`
      SELECT * FROM interview_insights
      WHERE applicant_id = ${applicantID} AND organization_id = ${organizationID}
    `;
    if (check.recordset.length > 0) {
      return res.status(409).json({ success: false, message: "Ứng viên đã có bản ghi phỏng vấn" });
    }

    await sql.query`
      INSERT INTO interview_insights (
        applicant_id, interviewer_id, organization_id, created_at
      )
      VALUES (
        ${applicantID}, ${interviewerID}, ${organizationID}, GETDATE()
      )
    `;

    res.status(201).json({ success: true, message: "Tạo bản ghi phỏng vấn thành công" });
  } catch (err) {
    console.error("Create Interview Error:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 2. Lấy tất cả bản ghi phỏng vấn (chỉ HR)
export const HandleAllInterviews = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });
    const organizationID = req.user.organization_id;

    const result = await sql.query`
      SELECT i.*, a.firstname AS applicant_firstname, a.lastname AS applicant_lastname,
             hr.firstname AS interviewer_firstname, hr.lastname AS interviewer_lastname
      FROM interview_insights i
      LEFT JOIN applicants a ON i.applicant_id = a.id
      LEFT JOIN human_resources hr ON i.interviewer_id = hr.id
      WHERE i.organization_id = ${organizationID}
      ORDER BY i.created_at DESC
    `;

    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Get Interviews Error:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 3. Lấy chi tiết một bản ghi phỏng vấn (chỉ HR)
export const HandleInterview = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });
    const { interviewID } = req.params;
    const organizationID = req.user.organization_id;

    const result = await sql.query`
      SELECT * FROM interview_insights
      WHERE id = ${interviewID} AND organization_id = ${organizationID}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bản ghi phỏng vấn" });
    }

    res.status(200).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error("Get Interview Error:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 4. Cập nhật bản ghi phỏng vấn (chỉ HR)
export const HandleUpdateInterview = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });
    const { interviewID, UpdatedData } = req.body;

    await sql.query`
      UPDATE interview_insights
      SET 
        notes = ${UpdatedData.notes},
        score = ${UpdatedData.score},
        updated_at = GETDATE()
      WHERE id = ${interviewID}
    `;

    res.status(200).json({ success: true, message: "Cập nhật bản ghi phỏng vấn thành công" });
  } catch (err) {
    console.error("Update Interview Error:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 5. Xóa bản ghi phỏng vấn (chỉ HR)
export const HandleDeleteInterview = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR." });
    const { interviewID } = req.params;

    await sql.query`
      DELETE FROM interview_insights WHERE id = ${interviewID}
    `;

    res.status(200).json({ success: true, message: "Xóa bản ghi phỏng vấn thành công" });
  } catch (err) {
    console.error("Delete Interview Error:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};