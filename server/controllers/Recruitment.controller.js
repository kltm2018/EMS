import { sql } from '../config/connectMSSQL.js';

// Helper
const isHR = (user) => user.role === 'HR-Admin' || user.role === 'HR-Staff';

// Tạo chiến dịch tuyển dụng (chỉ HR)
export const HandleCreateRecruitment = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: 'Chỉ HR.' });

    const { title, description, position, department_id, deadline } = req.body;
    const { organization_id } = req.user;

    if (!title || !position || !department_id || !deadline) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin chiến dịch' });
    }

    await sql.query`
      INSERT INTO recruitment_campaigns (
        title, description, position, department_id, organization_id, deadline, status, created_at, updated_at
      )
      VALUES (
        ${title}, ${description}, ${position}, ${department_id}, ${organization_id},
        ${deadline}, N'Open', GETDATE(), GETDATE()
      )
    `;

    res.status(201).json({ success: true, message: 'Tạo chiến dịch tuyển dụng thành công' });
  } catch (error) {
    console.error('Create Recruitment Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// Gán ứng viên vào chiến dịch (chỉ HR)
export const HandleAssignApplicant = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: 'Chỉ HR.' });

    const { campaign_id, applicant_id } = req.body;

    if (!campaign_id || !applicant_id) {
      return res.status(400).json({ success: false, message: 'Thiếu mã chiến dịch hoặc ứng viên' });
    }

    // Kiểm tra đã tồn tại chưa
    const check = await sql.query`
      SELECT * FROM recruitment_applicants
      WHERE campaign_id = ${campaign_id} AND applicant_id = ${applicant_id}
    `;

    if (check.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Ứng viên đã được gán vào chiến dịch này' });
    }

    await sql.query`
      INSERT INTO recruitment_applicants (campaign_id, applicant_id, assigned_at)
      VALUES (${campaign_id}, ${applicant_id}, GETDATE())
    `;

    res.status(200).json({ success: true, message: 'Gán ứng viên thành công' });
  } catch (error) {
    console.error('Assign Applicant Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// Cập nhật trạng thái chiến dịch (chỉ HR)
export const HandleUpdateRecruitmentStatus = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ success: false, message: 'Chỉ HR.' });

    const { campaign_id, status } = req.body;

    if (!['Open', 'Closed', 'Paused'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    await sql.query`
      UPDATE recruitment_campaigns
      SET status = ${status}, updated_at = GETDATE()
      WHERE id = ${campaign_id}
    `;

    res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    console.error('Update Recruitment Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// Lấy danh sách chiến dịch (HR xem theo tổ chức, nhân viên chỉ xem chiến dịch Open)
export const HandleAllRecruitmentCampaigns = async (req, res) => {
  try {
    const { organization_id, role } = req.user;

    let result;
    if (isHR(req.user)) {
      result = await sql.query`
        SELECT r.id, r.title, r.position, r.status, r.deadline,
               d.name AS department
        FROM recruitment_campaigns r
        JOIN departments d ON r.department_id = d.id
        WHERE r.organization_id = ${organization_id}
        ORDER BY r.created_at DESC
      `;
    } else {
      // Chỉ xem chiến dịch đang mở
      result = await sql.query`
        SELECT r.id, r.title, r.position, r.status, r.deadline,
               d.name AS department
        FROM recruitment_campaigns r
        JOIN departments d ON r.department_id = d.id
        WHERE r.organization_id = ${organization_id} AND r.status = N'Open'
        ORDER BY r.created_at DESC
      `;
    }

    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('List Recruitment Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// Xem chi tiết một chiến dịch (HR hoặc nhân viên cùng tổ chức)
export const HandleRecruitmentDetail = async (req, res) => {
  try {
    const { campaign_id } = req.params;
    const { organization_id } = req.user;

    const result = await sql.query`
      SELECT * FROM recruitment_campaigns WHERE id = ${campaign_id} AND organization_id = ${organization_id}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Chiến dịch không tồn tại' });
    }

    res.status(200).json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Recruitment Detail Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};