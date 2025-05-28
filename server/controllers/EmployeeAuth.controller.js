import { sql } from "../config/connectMSSQL.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  GenerateJwtTokenAndSetCookiesEmployee
} from "../utils/generatejwttokenandsetcookies.js";
import { GenerateVerificationToken } from "../utils/generateverificationtoken.js";
import {
  SendVerificationEmail,
  SendResetPasswordEmail
} from "../mailtrap/emails.js";

// Helper: Kiểm tra quyền (tùy chỉnh theo hệ thống của bạn)
const isHR = (user) => user.role === 'HR-Admin' || user.role === 'HR-Staff';

// 1. HR tạo Employee mới (qua bảng employees, có mã hóa lương và mã số thuế mặc định)
export const HandleEmplyoeeSignup = async (req, res) => {
  try {
    if (!isHR(req.user)) return res.status(403).json({ message: "Chỉ HR mới được thêm nhân viên." });

    const { firstname, lastname, dob, email, password, department_id } = req.body;
    const organization_id = req.user.organization_id;

    if (!firstname || !lastname || !dob || !email || !password || !department_id) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = crypto.randomUUID().slice(0, 8);
    const verificationToken = GenerateVerificationToken(6);
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    // Kiểm tra email đã tồn tại chưa
    const check = await sql.query`SELECT * FROM employees WHERE email = ${email}`;
    if (check.recordset.length > 0) {
      return res.status(400).json({ message: "Email đã được đăng ký" });
    }

    // Thêm nhân viên mới, lương và mã số thuế mặc định mã hóa
    await sql.query`
      OPEN SYMMETRIC KEY SymKey_Emp DECRYPTION BY PASSWORD = 'SymKey_Employee@2024!';
      INSERT INTO employees (
        code, firstname, lastname, dob, email, password, department_id, organization_id, salary, tax_code,
        verificationtoken, verificationtokenexpires, is_verified, created_at, updated_at
      )
      VALUES (
        ${code}, ${firstname}, ${lastname}, ${dob}, ${email}, ${hashedPassword},
        ${department_id}, ${organization_id},
        EncryptByKey(Key_GUID('SymKey_Emp'), CAST(0 AS NVARCHAR(50))),
        EncryptByKey(Key_GUID('SymKey_Emp'), N'NONE'),
        ${verificationToken}, ${expires}, 0, GETDATE(), GETDATE()
      );
      CLOSE SYMMETRIC KEY SymKey_Emp;
    `;

    await SendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: "Tạo nhân viên thành công. Đã gửi email xác thực." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 2. Nhân viên xác thực email
export const HandleEmplyoeeVerifyEmail = async (req, res) => {
  try {
    const { email } = req.user;
    const { verificationcode } = req.body;

    const result = await sql.query`
      SELECT * FROM employees WHERE email = ${email}
    `;
    const user = result.recordset[0];
    if (!user || user.verificationtoken !== verificationcode) {
      return res.status(400).json({ message: "Mã xác thực không đúng" });
    }

    if (new Date(user.verificationtokenexpires) < new Date()) {
      return res.status(400).json({ message: "Mã xác thực đã hết hạn" });
    }

    await sql.query`
      UPDATE employees
      SET is_verified = 1,
          verificationtoken = NULL,
          verificationtokenexpires = NULL,
          updated_at = GETDATE()
      WHERE email = ${email}
    `;

    res.status(200).json({ message: "Xác thực email thành công" });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 3. Gửi lại mã xác thực email
export const HandleResetEmplyoeeVerifyEmail = async (req, res) => {
  try {
    const { email } = req.user;
    const code = GenerateVerificationToken(6);
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await sql.query`
      UPDATE employees
      SET verificationtoken = ${code},
          verificationtokenexpires = ${expires}
      WHERE email = ${email}
    `;

    await SendVerificationEmail(email, code);

    res.status(200).json({ message: "Đã gửi lại mã xác thực" });
  } catch (err) {
    console.error("Resend verify error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 4. Đăng nhập (Employee)
export const HandleEmplyoeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await sql.query`
      SELECT * FROM employees WHERE email = ${email}
    `;

    const user = result.recordset[0];
    if (!user) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    if (!user.is_verified) {
      return res.status(403).json({ message: "Tài khoản chưa xác thực email" });
    }

    GenerateJwtTokenAndSetCookiesEmployee(res, user.id, user.email, user.organization_id);

    res.status(200).json({ message: "Đăng nhập thành công" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 5. Đăng xuất (Employee)
export const HandleEmplyoeeLogout = (req, res) => {
  res.clearCookie("employee_token").status(200).json({ message: "Đăng xuất thành công" });
};

// 6. Kiểm tra trạng thái đăng nhập
export const HandleEmployeeCheck = async (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// 7. Kiểm tra xác thực email
export const HandleEmployeeCheckVerifyEmail = async (req, res) => {
  try {
    const { email } = req.user;
    const result = await sql.query`
      SELECT is_verified FROM employees WHERE email = ${email}
    `;
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }
    res.status(200).json({ is_verified: result.recordset[0].is_verified });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 8. Quên mật khẩu (gửi link đặt lại mật khẩu)
export const HandleEmplyoeeForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await sql.query`SELECT * FROM employees WHERE email = ${email}`;
    if (!user.recordset[0]) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await sql.query`
      UPDATE employees
      SET resetpasswordtoken = ${token},
          resetpasswordexpires = ${expires}
      WHERE email = ${email}
    `;

    await SendResetPasswordEmail(email, token);

    res.status(200).json({ message: "Đã gửi link đặt lại mật khẩu" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 9. Đặt lại mật khẩu bằng link token
export const HandleEmplyoeeSetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const result = await sql.query`
      SELECT * FROM employees
      WHERE resetpasswordtoken = ${token}
        AND resetpasswordexpires > GETDATE()
    `;

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: "Token hết hạn hoặc không hợp lệ" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await sql.query`
      UPDATE employees
      SET password = ${hashed},
          resetpasswordtoken = NULL,
          resetpasswordexpires = NULL,
          updated_at = GETDATE()
      WHERE resetpasswordtoken = ${token}
    `;

    res.status(200).json({ message: "Cập nhật mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};