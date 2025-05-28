import mssql from 'mssql';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { GenerateJwtTokenAndSetCookiesHR } from "../utils/generatejwttokenandsetcookies.js";
import { SendVerificationEmail, SendWelcomeEmail, SendForgotPasswordEmail, SendResetPasswordConfimation } from "../mailtrap/emails.js";
import { GenerateVerificationToken } from "../utils/generateverificationtoken.js";

// Thiết lập kết nối SQL Server
const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: 'employee_management_demo',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// ============= Đăng ký HR (Chỉ HR-Admin/phòng nhân sự) ============
export const HandleHRSignup = async (req, res) => {
    try {
        const pool = await mssql.connect(sqlConfig);
        const { firstname, lastname, email, password, contactnumber, organization_name, organization_description, organization_url, organization_mail, department_id } = req.body;

        // Kiểm tra đủ thông tin
        if (!firstname || !lastname || !email || !password || !contactnumber || !organization_name || !organization_description || !organization_url || !organization_mail || !department_id) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Kiểm tra tồn tại tổ chức
        let orgResult = await pool.request()
            .input('name', mssql.NVarChar, organization_name)
            .input('url', mssql.NVarChar, organization_url)
            .input('mail', mssql.NVarChar, organization_mail)
            .query('SELECT * FROM organizations WHERE name=@name AND organization_url=@url AND organization_mail=@mail');
        let org = orgResult.recordset[0];

        // Kiểm tra email HR đã tồn tại
        let hrResult = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM human_resources WHERE email=@email');
        if (hrResult.recordset.length > 0) {
            return res.status(400).json({ success: false, message: "HR already exists, please login or use different email" });
        }

        // Chỉ 1 HR-Admin/phòng nhân sự cho mỗi tổ chức
        if (org) {
            let adminHR = await pool.request()
                .input('orgid', mssql.BigInt, org.id)
                .query("SELECT * FROM human_resources WHERE organization_id=@orgid AND role='HR-Admin'");
            if (adminHR.recordset.length > 0) {
                return res.status(400).json({ success: false, message: "HR-Admin already exists for this organization" });
            }
        }

        // Nếu chưa có tổ chức thì tạo mới
        let organization_id = org ? org.id : null;
        if (!org) {
            let orgInsert = await pool.request()
                .input('name', mssql.NVarChar, organization_name)
                .input('description', mssql.NVarChar, organization_description)
                .input('url', mssql.NVarChar, organization_url)
                .input('mail', mssql.NVarChar, organization_mail)
                .query('INSERT INTO organizations (name, description, organization_url, organization_mail) OUTPUT INSERTED.id VALUES (@name,@description,@url,@mail)');
            organization_id = orgInsert.recordset[0].id;
        }

        // Kiểm tra phòng ban hợp lệ
        let deptResult = await pool.request()
            .input('deptid', mssql.BigInt, department_id)
            .input('orgid', mssql.BigInt, organization_id)
            .query('SELECT * FROM departments WHERE id=@deptid AND organization_id=@orgid');
        if (deptResult.recordset.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid department for this organization" });
        }

        const hashedpassword = await bcrypt.hash(password, 10);
        const verificationcode = GenerateVerificationToken(6);

        // Tạo HR-Admin
        let hrInsert = await pool.request()
            .input('firstname', mssql.NVarChar, firstname)
            .input('lastname', mssql.NVarChar, lastname)
            .input('email', mssql.NVarChar, email)
            .input('password', mssql.NVarChar, hashedpassword)
            .input('role', mssql.NVarChar, 'HR-Admin')
            .input('department_id', mssql.BigInt, department_id)
            .input('organization_id', mssql.BigInt, organization_id)
            .input('verificationtoken', mssql.NVarChar, verificationcode)
            .input('verificationexpires', mssql.DateTime, new Date(Date.now() + 5 * 60 * 1000))
            .query(`INSERT INTO human_resources 
                (firstname, lastname, email, [password], [role], department_id, organization_id, verificationtoken, updated_at, created_at)
                OUTPUT INSERTED.id VALUES (@firstname,@lastname,@email,@password,@role,@department_id,@organization_id,@verificationtoken,GETDATE(),GETDATE())`);
        const HRid = hrInsert.recordset[0].id;

        // Gửi email xác thực
        await SendVerificationEmail(email, verificationcode);

        GenerateJwtTokenAndSetCookiesHR(res, HRid, 'HR-Admin', organization_id);
        return res.status(201).json({
            success: true,
            message: "HR Registered Successfully",
            VerificationEmailStatus: true,
            HRid: HRid
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============= Xác thực email HR ============
export const HandleHRVerifyEmail = async (req, res) => {
    const { verificationcode } = req.body;
    try {
        const pool = await mssql.connect(sqlConfig);
        let hrResult = await pool.request()
            .input('verificationtoken', mssql.NVarChar, verificationcode)
            .query('SELECT * FROM human_resources WHERE verificationtoken=@verificationtoken AND verificationtoken IS NOT NULL AND verificationtoken <> \'\' AND verificationtokenexpires > GETDATE()');
        const HR = hrResult.recordset[0];
        if (!HR) {
            return res.status(401).json({ success: false, message: "Invalid or expired verification code" });
        }
        await pool.request()
            .input('id', mssql.BigInt, HR.id)
            .query('UPDATE human_resources SET isverified=1, verificationtoken=NULL, verificationtokenexpires=NULL WHERE id=@id');
        await SendWelcomeEmail(HR.email, HR.firstname, HR.lastname, HR.role);
        return res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============ Đăng nhập HR ============
export const HandleHRLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await mssql.connect(sqlConfig);
        let hrResult = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM human_resources WHERE email=@email');
        const HR = hrResult.recordset[0];
        if (!HR) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, HR.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        GenerateJwtTokenAndSetCookiesHR(res, HR.id, HR.role, HR.organization_id);
        await pool.request()
            .input('id', mssql.BigInt, HR.id)
            .query('UPDATE human_resources SET updated_at=GETDATE() WHERE id=@id');
        return res.status(200).json({ success: true, message: "HR Login successful" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============ Đăng xuất HR ============
export const HandleHRLogout = async (req, res) => {
    try {
        res.clearCookie("HRtoken");
        return res.status(200).json({ success: true, message: "HR logged out successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// ============ Kiểm tra trạng thái đăng nhập HR ============
export const HandleHRCheck = async (req, res) => {
    try {
        const pool = await mssql.connect(sqlConfig);
        let hrResult = await pool.request()
            .input('id', mssql.BigInt, req.HRid)
            .input('orgid', mssql.BigInt, req.ORGID)
            .query('SELECT * FROM human_resources WHERE id=@id AND organization_id=@orgid');
        if (!hrResult.recordset[0]) {
            return res.status(404).json({ success: false, message: "HR not found" });
        }
        return res.status(200).json({ success: true, message: "HR already logged in" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============ Quên mật khẩu HR ============
export const HandleHRForgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const pool = await mssql.connect(sqlConfig);
        let hrResult = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM human_resources WHERE email=@email');
        const HR = hrResult.recordset[0];
        if (!HR) {
            return res.status(404).json({ success: false, message: "HR email does not exist" });
        }
        const resetToken = crypto.randomBytes(25).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
        await pool.request()
            .input('id', mssql.BigInt, HR.id)
            .input('resetToken', mssql.NVarChar, resetToken)
            .input('expires', mssql.DateTime, resetTokenExpires)
            .query('UPDATE human_resources SET resetpasswordtoken=@resetToken, resetpasswordexpires=@expires WHERE id=@id');
        const URL = `${process.env.CLIENT_URL}/auth/HR/resetpassword/${resetToken}`;
        await SendForgotPasswordEmail(email, URL);
        return res.status(200).json({ success: true, message: "Reset password email sent" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============ Đặt lại mật khẩu HR ============
export const HandleHRResetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        if (req.cookies.HRtoken) res.clearCookie("HRtoken");
        const pool = await mssql.connect(sqlConfig);
        let hrResult = await pool.request()
            .input('token', mssql.NVarChar, token)
            .query('SELECT * FROM human_resources WHERE resetpasswordtoken=@token AND resetpasswordexpires > GETDATE()');
        const HR = hrResult.recordset[0];
        if (!HR) {
            return res.status(401).json({ success: false, message: "Invalid or expired reset password token" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.request()
            .input('id', mssql.BigInt, HR.id)
            .input('password', mssql.NVarChar, hashedPassword)
            .query('UPDATE human_resources SET [password]=@password, resetpasswordtoken=NULL, resetpasswordexpires=NULL WHERE id=@id');
        await SendResetPasswordConfimation(HR.email);
        return res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============ Gửi lại email xác thực ============
export const HandleHRResetVerifyEmail = async (req, res) => {
    const { email } = req.body;
    try {
        const pool = await mssql.connect(sqlConfig);
        let hrResult = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM human_resources WHERE email=@email');
        const HR = hrResult.recordset[0];
        if (!HR) {
            return res.status(404).json({ success: false, message: "HR email does not exist" });
        }
        if (HR.isverified) {
            return res.status(400).json({ success: false, message: "HR email already verified" });
        }
        const verificationcode = GenerateVerificationToken(6);
        await pool.request()
            .input('id', mssql.BigInt, HR.id)
            .input('code', mssql.NVarChar, verificationcode)
            .query('UPDATE human_resources SET verificationtoken=@code, verificationtokenexpires=DATEADD(MINUTE,5,GETDATE()) WHERE id=@id');
        await SendVerificationEmail(email, verificationcode);
        return res.status(200).json({ success: true, message: "Verification email sent" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============ Kiểm tra trạng thái xác thực email ============
export const HandleHRCheckVerifyEmail = async (req, res) => {
    try {
        const pool = await mssql.connect(sqlConfig);
        let hrResult = await pool.request()
            .input('id', mssql.BigInt, req.HRid)
            .query('SELECT * FROM human_resources WHERE id=@id');
        const HR = hrResult.recordset[0];
        if (!HR) {
            return res.status(404).json({ success: false, message: "HR not found" });
        }
        if (HR.isverified) {
            return res.status(200).json({ success: true, message: "HR already verified", alreadyverified: true });
        }
        if (HR.verificationtoken && HR.verificationtokenexpires > new Date()) {
            return res.status(200).json({ success: true, message: "Verification code is still valid" });
        }
        return res.status(404).json({ success: false, message: "Invalid or expired verification code" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============ HR: Xem/sửa toàn bộ nhân viên (trừ tài khoản phòng ban khác) ============
export const HRGetAllEmployees = async (req, res) => {
    try {
        const pool = await mssql.connect(sqlConfig);
        let hrResult = await pool.request()
            .input('id', mssql.BigInt, req.HRid)
            .query('SELECT * FROM human_resources WHERE id=@id');
        const HR = hrResult.recordset[0];
        if (!HR || (HR.role !== 'HR-Admin' && HR.role !== 'HR-Staff')) {
            return res.status(403).json({ success: false, message: "Forbidden! No permission." });
        }
        // HR được xem toàn bộ nhân viên trong tổ chức
        let employees = await pool.request()
            .input('orgid', mssql.BigInt, HR.organization_id)
            .query('SELECT id, code, firstname, lastname, dob, email, department_id, organization_id, created_at, updated_at FROM employees WHERE organization_id=@orgid');
        return res.status(200).json({ success: true, employees: employees.recordset });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============ Trưởng phòng: chỉ xem nhân viên cùng phòng, chỉ sửa thông tin bản thân ============
export const ManagerViewEmployeesInDepartment = async (req, res) => {
    try {
        const pool = await mssql.connect(sqlConfig);
        // Giả định req.email là email đăng nhập trưởng phòng
        const { email } = req;
        let result = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM v_manager_employees WHERE email=@email');
        return res.status(200).json({ success: true, employees: result.recordset });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const ManagerUpdateSelfProfile = async (req, res) => {
    try {
        const pool = await mssql.connect(sqlConfig);
        const { EmpID, Firstname, Lastname, DOB, Email } = req.body;
        // Chỉ cho phép sửa thông tin bản thân qua stored procedure
        await pool.request()
            .input('EmpID', mssql.BigInt, EmpID)
            .input('Firstname', mssql.NVarChar, Firstname)
            .input('Lastname', mssql.NVarChar, Lastname)
            .input('DOB', mssql.Date, DOB)
            .input('Email', mssql.NVarChar, Email)
            .execute('sp_update_manager_profile');
        return res.status(200).json({ success: true, message: "Profile updated (self)" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============ Nhân viên: chỉ xem thông tin bản thân, không xem lương/mã số thuế người khác ============
export const EmployeeViewSelf = async (req, res) => {
    try {
        const pool = await mssql.connect(sqlConfig);
        // Giả định req.email là email đăng nhập nhân viên
        const { email } = req;
        let result = await pool.request()
            .input('email', mssql.NVarChar, email)
            .query('SELECT * FROM v_employee_self WHERE email=@email');
        return res.status(200).json({ success: true, employee: result.recordset[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============ Kế toán: xem lương, mã số thuế toàn bộ nhân viên (giải mã) ============
export const AccountantViewEmployeesSalaryAndTax = async (req, res) => {
    try {
        const pool = await mssql.connect(sqlConfig);
        // Trước khi gọi hàm này, phải mở symmetric key ở phía SQL session!
        let result = await pool.request().query('SELECT * FROM v_accountant_employees');
        return res.status(200).json({ success: true, employees: result.recordset });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};