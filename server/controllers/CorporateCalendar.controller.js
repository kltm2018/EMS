import { sql } from '../config/connectMSSQL.js';

const isHR = (user) => user.role === 'HR-Admin' || user.role === 'HR-Staff';

// HR tạo sự kiện nội bộ
export const HandleCreateCalendarEvent = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ message: 'Chỉ HR.' });
    const { title, description, date, type } = req.body;
    const { organization_id } = req.user;

    if (!title || !date || !type) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    await sql.query`
      INSERT INTO corporate_calendar (
        organization_id, title, description, date, type, created_at, updated_at
      )
      VALUES (
        ${organization_id}, ${title}, ${description}, ${date}, ${type}, GETDATE(), GETDATE()
      )
    `;

    res.status(201).json({ success: true, message: 'Sự kiện đã được tạo' });
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// Nhân viên xem toàn bộ lịch nội bộ
export const HandleAllCalendarEvents = async (req, res) => {
  try {
    // Mọi người đều xem được lịch sự kiện
    const { organization_id } = req.user;
    const result = await sql.query`
      SELECT id, title, description, date, type
      FROM corporate_calendar
      WHERE organization_id = ${organization_id}
      ORDER BY date ASC
    `;
    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Fetch Calendar Events Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// HR cập nhật sự kiện
export const HandleUpdateCalendarEvent = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ message: 'Chỉ HR.' });
    const { id, title, description, date, type } = req.body;

    await sql.query`
      UPDATE corporate_calendar
      SET title = ${title},
          description = ${description},
          date = ${date},
          type = ${type},
          updated_at = GETDATE()
      WHERE id = ${id}
    `;

    res.status(200).json({ success: true, message: 'Cập nhật sự kiện thành công' });
  } catch (error) {
    console.error('Update Calendar Event Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// HR xóa sự kiện
export const HandleDeleteCalendarEvent = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ message: 'Chỉ HR.' });
    const { id } = req.params;

    await sql.query`
      DELETE FROM corporate_calendar WHERE id = ${id}
    `;

    res.status(200).json({ success: true, message: 'Sự kiện đã được xóa' });
  } catch (error) {
    console.error('Delete Calendar Event Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};