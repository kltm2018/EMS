import express from 'express';
import {
  HandleHRSignup,
  HandleHRVerifyEmail,
  HandleHRResetVerifyEmail,
  HandleHRLogin,
  HandleHRCheck,
  HandleHRLogout,
  HandleHRForgotPassword,
  HandleHRResetPassword,
  HandleHRCheckVerifyEmail
} from '../controllers/HRAuth.controller.js';
import { VerifyHRToken } from '../middlewares/Auth.middleware.js';
import { RoleAuthorization } from '../middlewares/RoleAuth.middleware.js';

const router = express.Router();

// Đăng ký HR (chỉ tạo mới HR-Admin)
router.post("/signup", HandleHRSignup);

// Đăng nhập HR
router.post("/login", HandleHRLogin);

// Đăng xuất HR
router.post("/logout", HandleHRLogout);

// Xác thực email HR
router.post("/verify-email", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleHRVerifyEmail);

// Gửi lại mã xác thực email
router.post("/resend-verify-email", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleHRResetVerifyEmail);

// Kiểm tra trạng thái đăng nhập
router.get("/check-login", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleHRCheck);

// Kiểm tra xác thực email
router.get("/check-verify-email", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleHRCheckVerifyEmail);

// Quên mật khẩu (chỉ khi đã đăng nhập)
router.post("/forgot-password", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleHRForgotPassword);

// Đặt lại mật khẩu bằng token
router.post("/reset-password/:token", HandleHRResetPassword);

export default router;