import { sql } from '../config/connectMSSQL.js';
import bcrypt from 'bcrypt';

// Helper
const isHRAdmin = (user) => user.role === 'HR-Admin';

// Lấy toàn bộ nhân sự HR trong tổ chức (chỉ HR-Admin)
export const HandleAllHR = async (req, res) => {
  try {
    if (!isHRAdmin(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR-Admin." });
    const organizationID = req.user.organization_id;

    const result = await sql.query`
      SELECT * FROM human_resources WHERE organization_id = ${organizationID}
    `;

    res.status(200).json({
      success: true,
      message: 'All Human Resources Found Successfully',
      data: result.recordset
    });
  } catch (error) {
    console.error('Fetch HR Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// Lấy thông tin chi tiết 1 nhân sự HR theo ID (chỉ HR-Admin)
export const HandleHR = async (req, res) => {
  try {
    if (!isHRAdmin(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR-Admin." });
    const { HRID } = req.params;
    const organizationID = req.user.organization_id;

    const result = await sql.query`
      SELECT * FROM human_resources
      WHERE id = ${HRID} AND organization_id = ${organizationID}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'HR Record Not Found' });
    }

    res.status(200).json({
      success: true,
      message: 'Human Resources Found Successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Fetch HR Detail Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// Cập nhật nhân sự HR (chỉ HR-Admin)
export const HandleUpdateHR = async (req, res) => {
  try {
    if (!isHRAdmin(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR-Admin." });
    const { HRID, Updatedata } = req.body;

    if (!HRID || !Updatedata) {
      return res.status(400).json({ success: false, message: 'Missing HRID or Updatedata' });
    }

    const { firstname, lastname, email, password, role } = Updatedata;

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : null;

    await sql.query`
      UPDATE human_resources
      SET firstname = ${firstname},
          lastname = ${lastname},
          email = ${email},
          password = COALESCE(${hashedPassword}, password),
          role = ${role},
          updated_at = GETDATE()
      WHERE id = ${HRID}
    `;

    res.status(200).json({
      success: true,
      message: 'Human Resources Updated Successfully'
    });
  } catch (error) {
    console.error('Update HR Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// Xóa nhân sự HR (chỉ HR-Admin)
export const HandleDeleteHR = async (req, res) => {
  try {
    if (!isHRAdmin(req.user)) return res.status(403).json({ success: false, message: "Chỉ HR-Admin." });
    const { HRID } = req.params;
    const organizationID = req.user.organization_id;

    const result = await sql.query`
      SELECT * FROM human_resources WHERE id = ${HRID} AND organization_id = ${organizationID}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'HR Record Not Found' });
    }

    await sql.query`
      DELETE FROM human_resources WHERE id = ${HRID}
    `;

    res.status(200).json({ success: true, message: 'Human Resources Deleted Successfully' });
  } catch (error) {
    console.error('Delete HR Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};