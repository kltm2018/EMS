import nodemailer from 'nodemailer';
import { VERIFICATION_EMAIL_TEMPLATE, PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE } from "./emailtemplates.js"
import { Emailclient, sender } from "./mailtrap.config.js"

// Cấu hình transporter từ biến môi trường
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Gửi email xác thực tài khoản
export const SendVerificationEmail = async (to, token) => {
  try {
    const info = await transporter.sendMail({
      from: '"HR System" <no-reply@hrsystem.com>',
      to,
      subject: 'Xác thực tài khoản của bạn',
      text: `Mã xác thực của bạn là: ${token}`,
      html: `<p>Chào bạn,</p><p>Mã xác thực tài khoản của bạn là:</p><h2>${token}</h2><p>Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>`
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Send Email Error:', error);
    return { success: false, error };
  }
}

export const SendWelcomeEmail = async (email, firstname, lastname, role) => {
    const receiver = [{ email }]
    if (role == "HR-Admin") {
        try {
            const response = await Emailclient.send({
                from: sender,
                to: receiver,
                template_uuid: "4749eba4-dc99-4658-923e-54ccd0c0b99c",
                template_variables: {
                    "company_info_name": "Your Company Name - [EMS]",
                    "name": `${firstname}${lastname} - HR`
                }
            })
            // console.log("Welcome email sent successfully", response)
            return response.success
        } catch (error) {
            console.log(error.message)
            return false
        }
    }
    else {
        try {
            const response = await Emailclient.send({
                from: sender,
                to: receiver,
                template_uuid: "cf9f23f4-ebfb-4baa-a69e-bcb76487ac24",
                template_variables: {
                    "company_info_name": "Company Name - (EMS)",
                    "name": `${firstname} ${lastname}`,
                }
            })
            // console.log("Welcome email sent successfully", response)
            return response.success
        } catch (error) {
            console.log(error.message)
            return false
        }
    }
}

export const SendForgotPasswordEmail = async (to, token) => {
  try {
    const info = await transporter.sendMail({
      from: '"HR System" <no-reply@hrsystem.com>',
      to,
      subject: 'Khôi phục mật khẩu',
      text: `Mã đặt lại mật khẩu của bạn là: ${token}`,
      html: `<p>Xin chào,</p><p>Mã khôi phục mật khẩu:</p><h2>${token}</h2><p>Vui lòng sử dụng mã này để đặt lại mật khẩu của bạn.</p>`
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('SendForgotPasswordEmail Error:', error);
    return { success: false, error };
  }
}

export const SendResetPasswordConfimation = async (email) => {
    const receiver = [{ email }]
    try {
        const response = await Emailclient.send({
            from: sender,
            to: receiver,
            subject: "Password Reset Successfully",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset Confirmation"
        })
        // console.log("Reset Password confirmation email sent successfully", response)
        return response.success
    } catch (error) {
        console.log(error.message)
        return false
    }
}


// Gửi email đặt lại mật khẩu
export const SendResetPasswordEmail = async (to, token) => {
  try {
    const info = await transporter.sendMail({
      from: '"HR System" <no-reply@hrsystem.com>',
      to,
      subject: 'Khôi phục mật khẩu',
      text: `Mã khôi phục mật khẩu của bạn là: ${token}`,
      html: `<p>Chào bạn,</p><p>Mã khôi phục mật khẩu của bạn là:</p><h2>${token}</h2><p>Vui lòng sử dụng mã này để đặt lại mật khẩu.</p>`
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Reset Password Email Error:', error);
    return { success: false, error };
  }
}