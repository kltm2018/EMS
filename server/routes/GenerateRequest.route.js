import express from 'express';
import {
  HandleAllGenerateRequest,
  HandleCreateGenerateRequest,
  HandleDeleteGenerateRequest,
  HandleGenerateRequest,
  HandleUpdateGenerateRequest,
} from '../controllers/GenerateRequest.controller.js';

import { VerifyEmployeeToken, VerifyHRToken } from '../middlewares/Auth.middleware.js';
import { RoleAuthorization } from '../middlewares/RoleAuth.middleware.js';

const router = express.Router();

// Nhân viên hoặc HR gửi yêu cầu nội bộ
router.post("/create-request", VerifyEmployeeToken, HandleCreateGenerateRequest);

// HR xem tất cả yêu cầu
router.get("/all", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleAllGenerateRequest);

// HR và chính chủ xem chi tiết một yêu cầu
router.get("/:requestID", VerifyEmployeeToken, HandleGenerateRequest);

// HR cập nhật nội dung yêu cầu (chỉ HR)
router.patch("/update-request-content", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleUpdateGenerateRequest);

// HR xóa yêu cầu (chỉ HR)
router.delete("/delete-request/:requestID", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleDeleteGenerateRequest);

export default router;