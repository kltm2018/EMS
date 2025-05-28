import express from 'express';
import {
  HandleAllInterviews,
  HandleCreateInterview,
  HandleInterview,
  HandleUpdateInterview,
  HandleDeleteInterview
} from '../controllers/InterviewInsights.controller.js';
import { VerifyHRToken } from '../middlewares/Auth.middleware.js';
import { RoleAuthorization } from '../middlewares/RoleAuth.middleware.js';

const router = express.Router();

// Chỉ HR mới được thao tác phỏng vấn
router.post("/create-interview", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleCreateInterview);

router.get("/all", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleAllInterviews);

router.get("/:interviewID", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleInterview);

router.patch("/update-interview", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleUpdateInterview);

router.delete("/delete-interview/:interviewID", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleDeleteInterview);

export default router;