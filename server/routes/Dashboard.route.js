import express from "express";
import { HandleDashboard, HandleSalaryStats } from "../controllers/Dashboard.controller.js";
import { VerifyHRToken, VerifyManagerToken, VerifyAccountantToken } from "../middlewares/Auth.middleware.js";

const router = express.Router();

// Dashboard tổng quan: HR, Manager, Accountant đều có thể xem (tuỳ quyền sẽ trả về thông tin khác nhau)
router.get(
  "/dashboard",
  (req, res, next) => {
    // Middleware xác thực động theo loại token
    if (req.cookies.HRtoken) return VerifyhHRToken(req, res, next);
    if (req.cookies.ManagerToken) return VerifyManagerToken(req, res, next);
    if (req.cookies.AccountantToken) return VerifyAccountantToken(req, res, next);
    return res.status(401).json({ success: false, message: "Chưa đăng nhập hoặc không đủ quyền." });
  },
  HandleDashboard
);

// Thống kê lương: chỉ dành cho kế toán
router.get(
  "/salary-stats",
  VerifyAccountantToken,
  HandleSalaryStats
);

export default router;