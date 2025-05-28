import express from 'express';
import {
  HandleAllHR,
  HandleDeleteHR,
  HandleHR,
  HandleUpdateHR
} from '../controllers/HR.controller.js';
import { VerifyHRToken } from '../middlewares/Auth.middleware.js';
import { RoleAuthorization } from '../middlewares/RoleAuth.middleware.js';

const router = express.Router();

// Chỉ HR-Admin mới quản lý nhân sự HR
router.get("/all", VerifyHRToken, RoleAuthorization("HR-Admin"), HandleAllHR);

router.get("/:HRID", VerifyHRToken, RoleAuthorization("HR-Admin"), HandleHR);

router.patch("/update-HR", VerifyHRToken, RoleAuthorization("HR-Admin"), HandleUpdateHR);

router.delete("/delete-HR/:HRID", VerifyHRToken, RoleAuthorization("HR-Admin"), HandleDeleteHR);

export default router;