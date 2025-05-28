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
 * Lấy toàn bộ bản ghi lương (chỉ dành cho phòng kế toán hoặc HR)
 * - Chỉ HR hoặc kế toán truy cập (kiểm soát ở middleware)
 * - Lương được giải mã
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
 * Lấy lương của một nhân viên (chỉ bản thân xem, hoặc HR/kế toán)
 * - Nhân viên chỉ xem lương của chính mình (kiểm tra email)
 * - HR có thể xem mọi bản ghi
 * - Kế toán có thể xem mọi bản ghi
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
 * - Ghi log audit mỗi lần cập nhật
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

// Kế toán: xem lương, mã số thuế toàn bộ nhân viên
export const HandleAccountantViewSalaries = async (req, res) => {
  try {
    await sql.query`OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';`
    const result = await sql.query`
      SELECT
        e.id, e.code, e.firstname, e.lastname, e.email, e.department_id, e.organization_id,
        CONVERT(NVARCHAR(50), DecryptByKey(e.salary)) AS salary,
        CONVERT(NVARCHAR(50), DecryptByKey(e.tax_code)) AS tax_code,
        e.created_at, e.updated_at
      FROM employees e
    `
    await sql.query`CLOSE SYMMETRIC KEY SymKey_Emp;`
    return res.status(200).json({ success: true, data: result.recordset })
  } catch (error) {
    console.error('Accountant View Salaries Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
};

// Trưởng phòng: xem các nhân viên cùng phòng (có lương, mã số thuế)
export const HandleEmployeesByManager = async (req, res) => {
  try {
    // Giả sử req.user đã có department_id và email
    const { department_id } = req.user
    if (!department_id) {
      return res.status(400).json({ success: false, message: "Department ID is required" })
    }
    await sql.query`OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';`
    const result = await sql.query`
      SELECT
        e.id, e.code, e.firstname, e.lastname, e.email, e.department_id, e.organization_id,
        CONVERT(NVARCHAR(50), DecryptByKey(e.salary)) AS salary,
        CONVERT(NVARCHAR(50), DecryptByKey(e.tax_code)) AS tax_code,
        e.created_at, e.updated_at
      FROM employees e
      WHERE e.department_id = ${department_id}
    `
    await sql.query`CLOSE SYMMETRIC KEY SymKey_Emp;`
    return res.status(200).json({ success: true, data: result.recordset })
  } catch (error) {
    console.error('Manager View Employees Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
};

// Trưởng phòng chỉ được sửa thông tin bản thân
export const HandleManagerUpdateSelf = async (req, res) => {
  try {
    const { id, firstname, lastname, dob, email } = req.body
    const userEmail = req.user.email

    // Chỉ cho phép sửa thông tin bản thân
    const check = await sql.query`
      SELECT * FROM employees WHERE id = ${id} AND email = ${userEmail}
    `
    if (check.recordset.length === 0) {
      return res.status(403).json({ success: false, message: "Bạn chỉ được sửa thông tin của mình" })
    }

    await sql.query`
      UPDATE employees
      SET firstname = ${firstname},
          lastname = ${lastname},
          dob = ${dob},
          email = ${email},
          updated_at = GETDATE()
      WHERE id = ${id}
    `
    return res.status(200).json({ success: true, message: "Cập nhật thông tin thành công" })
  } catch (error) {
    console.error('Manager Update Self Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
};

// Nhân viên chỉ xem thông tin cá nhân (không lương, không mã số thuế)
export const HandleEmployeeByEmployee = async (req, res) => {
  try {
    const userEmail = req.user.email
    const result = await sql.query`
      SELECT id, code, firstname, lastname, dob, email, department_id, organization_id, created_at, updated_at
      FROM employees WHERE email = ${userEmail}
    `
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin" })
    }
    return res.status(200).json({ success: true, data: result.recordset[0] })
  } catch (error) {
    console.error('Employee View Self Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
};

/**
 * HR lấy toàn bộ danh sách nhân viên (không bao gồm lương/mã số thuế)
 */
export const HandleAllEmployees = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT id, code, firstname, lastname, dob, email, department_id, organization_id, created_at, updated_at
      FROM employees
    `
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách nhân viên thành công",
      data: result.recordset
    })
  } catch (error) {
    console.error('All Employees Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * HR lấy toàn bộ danh sách nhân viên (chỉ id và tên) phục vụ autocomplete, select, v.v.
 */
export const HandleAllEmployeesIDS = async (req, res) => {
  try {
    const result = await sql.query`
      SELECT id, code, firstname, lastname
      FROM employees
    `
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách mã nhân viên thành công",
      data: result.recordset
    })
  } catch (error) {
    console.error('All Employees IDS Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * HR cập nhật thông tin nhân viên (không cập nhật lương, mã số thuế tại đây)
 */
export const HandleEmployeeUpdate = async (req, res) => {
  try {
    const {
      id,
      firstname,
      lastname,
      dob,
      email,
      department_id,
      organization_id
    } = req.body
    const user = req.user?.email || 'unknown'

    // Kiểm tra nhân viên tồn tại
    const check = await sql.query`
      SELECT * FROM employees WHERE id = ${id}
    `
    if (check.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" })
    }

    await sql.query`
      UPDATE employees
      SET firstname = ${firstname},
          lastname = ${lastname},
          dob = ${dob},
          email = ${email},
          department_id = ${department_id},
          organization_id = ${organization_id},
          updated_at = GETDATE()
      WHERE id = ${id}
    `

    // Log audit
    await sql.query`
      INSERT INTO audit_logs([user], action_type, table_name, record_id, detail)
      VALUES (${user}, N'UPDATE', N'employees', ${id}, N'Update employee info')
    `

    return res.status(200).json({ success: true, message: "Cập nhật thông tin nhân viên thành công" })
  } catch (error) {
    console.error('Update Employee Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * HR xóa nhân viên
 */
export const HandleEmployeeDelete = async (req, res) => {
  try {
    const { employeeId } = req.params
    const user = req.user?.email || 'unknown'

    // Kiểm tra nhân viên tồn tại
    const check = await sql.query`
      SELECT * FROM employees WHERE id = ${employeeId}
    `
    if (check.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" })
    }

    await sql.query`
      DELETE FROM employees WHERE id = ${employeeId}
    `

    // Log audit
    await sql.query`
      INSERT INTO audit_logs([user], action_type, table_name, record_id, detail)
      VALUES (${user}, N'DELETE', N'employees', ${employeeId}, N'Delete employee')
    `

    return res.status(200).json({ success: true, message: "Xóa nhân viên thành công" })
  } catch (error) {
    console.error('Delete Employee Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * HR lấy thông tin chi tiết một nhân viên (không bao gồm lương, mã số thuế)
 */
export const HandleEmployeeByHR = async (req, res) => {
  try {
    const { employeeId } = req.params
    const result = await sql.query`
      SELECT id, code, firstname, lastname, dob, email, department_id, organization_id, created_at, updated_at
      FROM employees WHERE id = ${employeeId}
    `
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" })
    }
    return res.status(200).json({
      success: true,
      message: "Lấy thông tin nhân viên thành công",
      data: result.recordset[0]
    })
  } catch (error) {
    console.error('Employee By HR Error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
