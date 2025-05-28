import express from "express";
import {
  HandleCreateApplicant,
  HandleAllApplicants,
  HandleApplicantDetail,
  HandleUpdateApplicant,
  HandleDeleteApplicant
} from "../controllers/Applicant.controller.js";
import { VerifyHRToken } from '../middlewares/Auth.middleware.js';
import { RoleAuthorization } from '../middlewares/RoleAuth.middleware.js';

const router = express.Router();

// Ứng viên tự do nộp hồ sơ (không cần xác thực)
router.post("/create-applicant", HandleCreateApplicant);

// HR xem tất cả ứng viên
router.get("/all", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleAllApplicants);

// HR xem chi tiết 1 ứng viên
router.get("/:applicantId", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleApplicantDetail);

// HR cập nhật ứng viên (nếu controller có)
if (typeof HandleUpdateApplicant === 'function') {
  router.patch("/update-applicant/:applicantId", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleUpdateApplicant);
}

// HR xóa ứng viên (nếu controller có)
if (typeof HandleDeleteApplicant === 'function') {
  router.delete("/delete-applicant/:applicantId", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleDeleteApplicant);
}

export default router;