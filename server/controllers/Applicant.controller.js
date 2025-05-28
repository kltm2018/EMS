import { sql } from '../config/connectMSSQL.js';

// Helper: giải mã lương, mã số thuế cho accountant
async function openSymmetricKey() {
  await sql.query`
    OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';
  `;
}
async function closeSymmetricKey() {
  await sql.query`CLOSE SYMMETRIC KEY SymKey_Emp;`;
}

// HR: Xem toàn bộ nhân viên (có lương, mã số thuế)
export const HandleAllEmployees_HR = async (req, res) => {
  try {
    if (req.user.role !== "HR-Admin" && req.user.role !== "HR-Staff")
      return res.status(403).json({ success: false, message: "Không có quyền truy cập" });

    const result = await sql.query`
      SELECT id, code, firstname, lastname, dob, email, department_id, organization_id,
             salary, tax_code, created_at, updated_at
      FROM employees
      ORDER BY created_at DESC
    `;
    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};

// HR: Sửa thông tin bất kỳ nhân viên
export const HandleUpdateEmployee_HR = async (req, res) => {
  try {
    if (req.user.role !== "HR-Admin" && req.user.role !== "HR-Staff")
      return res.status(403).json({ success: false, message: "Không có quyền truy cập" });

    const { employeeId } = req.params;
    const { firstname, lastname, dob, email, department_id, salary, tax_code } = req.body;
    // Giả sử lương, mã số thuế đã mã hóa ở phía client
    await sql.query`
      UPDATE employees SET
        firstname = ${firstname},
        lastname = ${lastname},
        dob = ${dob},
        email = ${email},
        department_id = ${department_id},
        salary = EncryptByKey(Key_GUID('SymKey_Emp'), CAST(${salary} AS NVARCHAR(50))),
        tax_code = EncryptByKey(Key_GUID('SymKey_Emp'), ${tax_code}),
        updated_at = GETDATE()
      WHERE id = ${employeeId}
    `;
    // Audit
    await sql.query`
      INSERT INTO audit_logs([user], action_type, table_name, record_id, detail)
      VALUES (${req.user.email}, N'UPDATE', N'employees', ${employeeId}, N'HR cập nhật thông tin nhân viên')
    `;
    res.status(200).json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};

// Trưởng phòng: Xem tất cả nhân viên cùng phòng (có/không có lương tùy chính sách)
export const HandleManagerEmployees = async (req, res) => {
  try {
    if (req.user.role !== "Manager")
      return res.status(403).json({ success: false, message: "Không có quyền truy cập" });

    // Giả sử req.user.department_id đã có khi xác thực
    const result = await sql.query`
      SELECT id, code, firstname, lastname, dob, email, department_id, organization_id,
             salary, tax_code, created_at, updated_at
      FROM employees
      WHERE department_id = ${req.user.department_id}
    `;
    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};

// Trưởng phòng: Chỉ sửa thông tin bản thân
export const HandleUpdateSelf_Manager = async (req, res) => {
  try {
    if (req.user.role !== "Manager")
      return res.status(403).json({ success: false, message: "Không có quyền cập nhật" });

    const { employeeId } = req.params;
    if (req.user.id != employeeId)
      return res.status(403).json({ success: false, message: "Chỉ được cập nhật thông tin bản thân" });

    const { firstname, lastname, dob, email } = req.body;
    await sql.query`
      UPDATE employees SET
        firstname = ${firstname},
        lastname = ${lastname},
        dob = ${dob},
        email = ${email},
        updated_at = GETDATE()
      WHERE id = ${employeeId}
    `;
    // Audit
    await sql.query`
      INSERT INTO audit_logs([user], action_type, table_name, record_id, detail)
      VALUES (${req.user.email}, N'UPDATE', N'employees', ${employeeId}, N'Trưởng phòng cập nhật thông tin bản thân')
    `;
    res.status(200).json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};

// Nhân viên: Xem thông tin bản thân (không có lương, mã số thuế)
export const HandleSelfEmployee = async (req, res) => {
  try {
    if (req.user.role !== "Employee")
      return res.status(403).json({ success: false, message: "Không có quyền truy cập" });

    const result = await sql.query`
      SELECT id, code, firstname, lastname, dob, email, department_id, organization_id, created_at, updated_at
      FROM employees
      WHERE email = ${req.user.email}
    `;
    res.status(200).json({ success: true, data: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};

// Kế toán: Xem lương và mã số thuế tất cả nhân viên (giải mã lương, thuế)
export const HandleAccountantEmployees = async (req, res) => {
  try {
    if (req.user.role !== "Accountant")
      return res.status(403).json({ success: false, message: "Không có quyền truy cập" });

    await openSymmetricKey();
    const result = await sql.query`
      SELECT id, code, firstname, lastname, 
             CONVERT(NVARCHAR(50), DecryptByKey(salary)) AS salary,
             CONVERT(NVARCHAR(50), DecryptByKey(tax_code)) AS tax_code,
             department_id, organization_id, created_at, updated_at
      FROM employees;
    `;
    await closeSymmetricKey();
    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};

// Ứng viên nộp hồ sơ
export const HandleCreateApplicant = async (req, res) => {
  try {
    const {
      firstname, lastname, email, phone, position_applied, resume_link
    } = req.body;

    if (!firstname || !lastname || !email || !position_applied) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin ứng viên bắt buộc'
      });
    }

    const result = await sql.query`
      INSERT INTO applicants (
        firstname, lastname, email, phone, position_applied, resume_link, applied_at
      )
      VALUES (
        ${firstname}, ${lastname}, ${email}, ${phone},
        ${position_applied}, ${resume_link}, GETDATE()
      )
    `;

    // Audit log
    await sql.query`
      INSERT INTO audit_logs ([user], action_type, table_name, record_id, detail)
      VALUES (
        ${req.user?.email ?? "guest"},
        N'INSERT',
        N'applicants',
        ${result.recordset?.insertId ?? null},
        N'Nộp hồ sơ ứng viên'
      )
    `;

    res.status(201).json({
      success: true,
      message: 'Hồ sơ ứng tuyển đã được gửi thành công'
    });
  } catch (error) {
    console.error('Applicant Submit Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// HR xem danh sách ứng viên
export const HandleAllApplicants = async (req, res) => {
  try {
    // Chỉ HR được xem
    if (req.user.role !== "HR-Admin" && req.user.role !== "HR-Staff") {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }
    const result = await sql.query`
      SELECT id, firstname, lastname, email, position_applied, applied_at
      FROM applicants
      ORDER BY applied_at DESC
    `;
    res.status(200).json({
      success: true,
      message: 'Danh sách ứng viên',
      data: result.recordset
    });
  } catch (error) {
    console.error('Applicant List Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// HR xem chi tiết ứng viên
export const HandleApplicantDetail = async (req, res) => {
  try {
    if (req.user.role !== "HR-Admin" && req.user.role !== "HR-Staff") {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }
    const { applicantId } = req.params;
    const result = await sql.query`
      SELECT * FROM applicants WHERE id = ${applicantId}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Ứng viên không tồn tại' });
    }

    res.status(200).json({
      success: true,
      message: 'Thông tin ứng viên',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Applicant Detail Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
};

// Cập nhật ứng viên
export const HandleUpdateApplicant = async (req, res) => {
  try {
    if (req.user.role !== "HR-Admin" && req.user.role !== "HR-Staff")
      return res.status(403).json({ success: false, message: "Không có quyền truy cập" });

    const { applicantId } = req.params;
    const { firstname, lastname, email, phone, position_applied, resume_link } = req.body;

    // Cập nhật
    await sql.query`
      UPDATE applicants SET
        firstname = ${firstname},
        lastname = ${lastname},
        email = ${email},
        phone = ${phone},
        position_applied = ${position_applied},
        resume_link = ${resume_link}
      WHERE id = ${applicantId}
    `;
    // Audit log
    await sql.query`
      INSERT INTO audit_logs([user], action_type, table_name, record_id, detail)
      VALUES (${req.user.email}, N'UPDATE', N'applicants', ${applicantId}, N'Cập nhật ứng viên')
    `;
    res.status(200).json({ success: true, message: "Cập nhật ứng viên thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: err });
  }
};

// Xóa ứng viên
export const HandleDeleteApplicant = async (req, res) => {
  try {
    if (req.user.role !== "HR-Admin" && req.user.role !== "HR-Staff")
      return res.status(403).json({ success: false, message: "Không có quyền truy cập" });

    const { applicantId } = req.params;

    await sql.query`
      DELETE FROM applicants WHERE id = ${applicantId}
    `;
    // Audit log
    await sql.query`
      INSERT INTO audit_logs([user], action_type, table_name, record_id, detail)
      VALUES (${req.user.email}, N'DELETE', N'applicants', ${applicantId}, N'Xóa ứng viên')
    `;
    res.status(200).json({ success: true, message: "Xóa ứng viên thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: err });
  }
};