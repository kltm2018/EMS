import express from "express";
import {
  HandleEmplyoeeLogin,
  HandleEmplyoeeLogout,
  HandleEmplyoeeSignup,
  HandleEmplyoeeVerifyEmail,
  HandleResetEmplyoeeVerifyEmail,
  HandleEmployeeCheck,
  HandleEmployeeCheckVerifyEmail,
  HandleEmplyoeeForgotPassword,
  HandleEmplyoeeSetPassword
} from "../controllers/EmployeeAuth.controller.js";
import { VerifyEmployeeToken } from "../middlewares/Auth.middleware.js";

const router = express.Router();

/**
 * Đăng ký (do HR tạo), đăng nhập, xác thực, quên mật khẩu, đăng xuất cho employee.
 */
router.post("/signup", HandleEmplyoeeSignup); // Chỉ HR gọi, kiểm tra trong controller
router.post("/login", HandleEmplyoeeLogin);
router.post("/logout", HandleEmplyoeeLogout);

router.post("/verify-email", VerifyEmployeeToken, HandleEmplyoeeVerifyEmail);
router.post("/resend-verify-email", VerifyEmployeeToken, HandleResetEmplyoeeVerifyEmail);

router.get("/check", VerifyEmployeeToken, HandleEmployeeCheck);
router.get("/check-verify-email", VerifyEmployeeToken, HandleEmployeeCheckVerifyEmail);

router.post("/forgot-password", HandleEmplyoeeForgotPassword);
router.post("/set-password/:token", HandleEmplyoeeSetPassword);

export default router;