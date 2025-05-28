import { sql } from '../config/connectMSSQL.js';

const isHR = (user) => user.role === 'HR-Admin' || user.role === 'HR-Staff';

// 1. Tạo phòng ban mới (HR)
export const HandleCreateDepartment = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ message: 'Chỉ HR mới được phép tạo phòng ban.' });
    const { name, description } = req.body;
    const organizationID = req.user.organization_id;

    if (!name || !description) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin phòng ban" });
    }

    const check = await sql.query`
      SELECT * FROM departments WHERE name = ${name} AND organization_id = ${organizationID}
    `;
    if (check.recordset.length > 0) {
      return res.status(400).json({ success: false, message: "Phòng ban đã tồn tại" });
    }

    await sql.query`
      INSERT INTO departments (name, description, organization_id, created_at)
      VALUES (${name}, ${description}, ${organizationID}, GETDATE())
    `;

    res.status(201).json({ success: true, message: "Tạo phòng ban thành công" });
  } catch (err) {
    console.error("Create Department Error:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 2. Lấy tất cả phòng ban theo tổ chức (HR, Manager)
export const HandleAllDepartments = async (req, res) => {
  try {
    if (!isHR(req.user) && req.user.role !== 'Manager')
      return res.status(403).json({ message: 'Chỉ HR hoặc trưởng phòng.' });

    const organizationID = req.user.organization_id;

    const result = await sql.query`
      SELECT d.*, COUNT(e.id) AS total_employees
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      WHERE d.organization_id = ${organizationID}
      GROUP BY d.id, d.name, d.description, d.organization_id, d.created_at
    `;

    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 3. Lấy thông tin một phòng ban (HR, Manager)
export const HandleDepartment = async (req, res) => {
  try {
    if (!isHR(req.user) && req.user.role !== 'Manager')
      return res.status(403).json({ message: 'Chỉ HR hoặc trưởng phòng.' });

    const { departmentID } = req.params;
    const organizationID = req.user.organization_id;

    const result = await sql.query`
      SELECT * FROM departments
      WHERE id = ${departmentID} AND organization_id = ${organizationID}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Phòng ban không tồn tại" });
    }

    res.status(200).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 4. Cập nhật phòng ban và danh sách nhân viên (Chỉ HR)
export const HandleUpdateDepartment = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ message: 'Chỉ HR.' });
    const { departmentID, name, description, employeeIDs } = req.body;
    const organizationID = req.user.organization_id;

    await sql.query`
      UPDATE departments
      SET name = ${name}, description = ${description}, updated_at = GETDATE()
      WHERE id = ${departmentID} AND organization_id = ${organizationID}
    `;

    // Gán lại danh sách nhân viên
    if (Array.isArray(employeeIDs)) {
      for (const empID of employeeIDs) {
        await sql.query`
          UPDATE employees
          SET department_id = ${departmentID}
          WHERE id = ${empID} AND organization_id = ${organizationID}
        `;
      }
    }

    res.status(200).json({ success: true, message: "Cập nhật phòng ban thành công" });
  } catch (err) {
    console.error("Update Department Error:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// 5. Xóa phòng ban (Chỉ HR)
export const HandleDeleteDepartment = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ message: 'Chỉ HR.' });
    const { departmentID } = req.params;
    const organizationID = req.user.organization_id;

    await sql.query`
      DELETE FROM departments
      WHERE id = ${departmentID} AND organization_id = ${organizationID}
    `;

    res.status(200).json({ success: true, message: "Đã xóa phòng ban" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};