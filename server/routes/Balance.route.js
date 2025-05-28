import express from "express";
import {
  HandleGetBalance,
  HandleUpdateBalance,
  HandleAllEmployeeBalances
} from "../controllers/Balance.controller.js";
import { VerifyHRToken } from "../middlewares/Auth.middleware.js";
import { RoleAuthorization } from "../middlewares/RoleAuth.middleware.js";

const router = express.Router();

// Nhân viên xem số dư của mình (không cần HR)
router.get("/my-balance", HandleGetBalance);

// HR cập nhật số dư cho nhân viên
router.patch("/update-balance", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleUpdateBalance);

// HR và kế toán xem số dư toàn bộ nhân viên trong tổ chức
router.get("/all", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff", "accountant_user"), HandleAllEmployeeBalances);

export default router;