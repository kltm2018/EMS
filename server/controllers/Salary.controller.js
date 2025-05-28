import { sql } from '../config/connectMSSQL.js';

/**
 * Tạo lương cho nhân viên (áp dụng mã hóa bằng SYMMETRIC KEY)
 * - Chỉ HR hoặc kế toán mới được phép gọi API này (kiểm soát ở middleware phía ngoài)
 * - Ghi log audit mỗi lần tạo lương
 */
export const HandleCreateSalary = async (req, res) => {
  try {
    const { employeeID, basicpay, bonusePT, deductionPT, duedate, currency } = req.body;
    const user = req.user?.email || 'unknown'; // Lấy thông tin user từ token/middleware

    if (!employeeID || !basicpay || !bonusePT || !deductionPT || !duedate || !currency) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Kiểm tra nhân viên tồn tại
    const empCheck = await sql.query`
      SELECT * FROM employees WHERE id = ${employeeID}
    `;
    if (empCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    const orgID = empCheck.recordset[0].organization_id;

    // Kiểm tra bản ghi lương đã tồn tại chưa
    const salaryCheck = await sql.query`
      SELECT * FROM salaries
      WHERE employee_id = ${employeeID}
        AND basicpay = ${basicpay}
        AND duedate = ${duedate}
    `;
    if (salaryCheck.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This salary record already exists for this employee"
      });
    }

    const bonuses = (basicpay * bonusePT) / 100;
    const deductions = (basicpay * deductionPT) / 100;
    const netpay = (basicpay + bonuses) - deductions;

    // Mở key, thêm lương
    await sql.query`
      OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';

      INSERT INTO salaries (
        employee_id, basicpay, bonuses, deductions, netpay, currency, duedate, organization_id, salary_encrypted
      )
      VALUES (
        ${employeeID}, ${basicpay}, ${bonuses}, ${deductions}, ${netpay}, ${currency}, ${duedate}, ${orgID},
        EncryptByKey(Key_GUID('SymKey_Emp'), CAST(${netpay} AS NVARCHAR(50)))
      );

      CLOSE SYMMETRIC KEY SymKey_Emp;
    `;

    // Ghi log audit
    await sql.query`
      INSERT INTO audit_logs([user], action_type, table_name, record_id, detail)
      VALUES (${user}, N'INSERT', N'salaries', ${employeeID}, N'Create salary record');
    `;

    return res.status(201).json({
      success: true,
      message: "Salary created successfully"
    });
  } catch (error) {
    console.error('Create Salary Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy toàn bộ bản ghi lương (HR/kế toán)
 */
export const HandleAllSalary = async (req, res) => {
  try {
    await sql.query`OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';`;

    const result = await sql.query`
      SELECT s.id, e.code, e.firstname, e.lastname,
             s.basicpay, s.bonuses, s.deductions, s.netpay, s.currency, s.duedate,
             CONVERT(NVARCHAR, DecryptByKey(s.salary_encrypted)) AS decrypted_salary,
             s.created_at
      FROM salaries s
      JOIN employees e ON s.employee_id = e.id
    `;

    await sql.query`CLOSE SYMMETRIC KEY SymKey_Emp;`;

    return res.status(200).json({
      success: true,
      message: "All salary records retrieved successfully",
      data: result.recordset
    });
  } catch (error) {
    console.error('All Salary Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Lấy lương của một nhân viên (chi tiết)
 */
export const HandleSalary = async (req, res) => {
  try {
    const { salaryID } = req.params;
    const user = req.user; // { email, role, id }

    await sql.query`OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';`;

    const result = await sql.query`
      SELECT s.id, e.code, e.firstname, e.lastname, e.email,
             s.basicpay, s.bonuses, s.deductions, s.netpay, s.currency, s.duedate,
             CONVERT(NVARCHAR, DecryptByKey(s.salary_encrypted)) AS decrypted_salary,
             s.created_at
      FROM salaries s
      JOIN employees e ON s.employee_id = e.id
      WHERE s.id = ${salaryID}
    `;

    await sql.query`CLOSE SYMMETRIC KEY SymKey_Emp;`;

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Salary not found" });
    }

    // Kiểm tra quyền truy cập
    const salaryRecord = result.recordset[0];
    if (user.role === 'employee_user' && user.email !== salaryRecord.email) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.status(200).json({
      success: true,
      message: "Salary found",
      data: salaryRecord
    });
  } catch (error) {
    console.error('Get Salary Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Cập nhật lương (chỉ HR hoặc kế toán)
 */
export const HandleUpdateSalary = async (req, res) => {
  try {
    const {
      salaryID,
      basicpay,
      bonusePT,
      deductionPT,
      duedate,
      currency
    } = req.body;
    const user = req.user?.email || 'unknown';

    // Kiểm tra bản ghi lương tồn tại
    const salaryCheck = await sql.query`
      SELECT * FROM salaries WHERE id = ${salaryID}
    `;
    if (salaryCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }

    const bonuses = (basicpay * bonusePT) / 100;
    const deductions = (basicpay * deductionPT) / 100;
    const netpay = (basicpay + bonuses) - deductions;

    await sql.query`
      OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';

      UPDATE salaries
      SET basicpay = ${basicpay},
          bonuses = ${bonuses},
          deductions = ${deductions},
          netpay = ${netpay},
          currency = ${currency},
          duedate = ${duedate},
          salary_encrypted = EncryptByKey(Key_GUID('SymKey_Emp'), CAST(${netpay} AS NVARCHAR(50))),
          updated_at = GETDATE()
      WHERE id = ${salaryID};

      CLOSE SYMMETRIC KEY SymKey_Emp;
    `;

    // Ghi log audit
    await sql.query`
      INSERT INTO audit_logs([user], action_type, table_name, record_id, detail)
      VALUES (${user}, N'UPDATE', N'salaries', ${salaryID}, N'Update salary record');
    `;

    return res.status(200).json({ success: true, message: "Salary updated successfully" });
  } catch (error) {
    console.error('Update Salary Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Xóa bản ghi lương (chỉ HR hoặc kế toán)
 * - Ghi log audit mỗi lần xóa
 */
export const HandleDeleteSalary = async (req, res) => {
  try {
    const { salaryID } = req.params;
    const user = req.user?.email || 'unknown';

    // Kiểm tra bản ghi lương tồn tại
    const salaryCheck = await sql.query`
      SELECT * FROM salaries WHERE id = ${salaryID}
    `;
    if (salaryCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }

    await sql.query`
      DELETE FROM salaries WHERE id = ${salaryID};
    `;

    // Ghi log audit
    await sql.query`
      INSERT INTO audit_logs([user], action_type, table_name, record_id, detail)
      VALUES (${user}, N'DELETE', N'salaries', ${salaryID}, N'Delete salary record');
    `;

    return res.status(200).json({ success: true, message: "Salary record deleted successfully" });
  } catch (error) {
    console.error('Delete Salary Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};