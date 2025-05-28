import express from 'express';
import {
  HandleAllLeaves,
  HandleCreateLeave,
  HandleDeleteLeave,
  HandleLeave,
  HandleUpdateLeaveByEmployee,
  HandleUpdateLeaveByHR
} from '../controllers/Leave.controller.js';

import { VerifyEmployeeToken, VerifyHRToken } from '../middlewares/Auth.middleware.js';
import { RoleAuthorization } from '../middlewares/RoleAuth.middleware.js';

const router = express.Router();

// Nhân viên hoặc HR tạo đơn nghỉ
router.post("/create-leave", VerifyEmployeeToken, HandleCreateLeave);

// HR xem tất cả đơn nghỉ
router.get("/all", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleAllLeaves);

// HR hoặc nhân viên chính chủ xem chi tiết đơn nghỉ
router.get("/:leaveID", VerifyEmployeeToken, HandleLeave);

// Nhân viên cập nhật đơn nghỉ của mình (khi pending)
router.patch("/employee-update-leave", VerifyEmployeeToken, HandleUpdateLeaveByEmployee);

// HR cập nhật trạng thái đơn nghỉ
router.patch("/HR-update-leave", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleUpdateLeaveByHR);

// HR xóa đơn nghỉ
router.delete("/delete-leave/:leaveID", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleDeleteLeave);

export default router;