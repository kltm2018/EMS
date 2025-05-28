import express from 'express'
import { 
  HandleCreateRecruitment, 
  HandleAllRecruitmentCampaigns, 
  HandleRecruitmentDetail, 
  HandleUpdateRecruitmentStatus, 
  HandleAssignApplicant 
} from '../controllers/Recruitment.controller.js'
import { VerifyHRToken } from '../middlewares/Auth.middleware.js'
import { RoleAuthorization } from '../middlewares/RoleAuth.middleware.js'

const router = express.Router()

// Chỉ HR mới được tạo, cập nhật, gán ứng viên, thay đổi trạng thái
router.post("/create-recruitment", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff']), HandleCreateRecruitment)
router.post("/assign-applicant", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff']), HandleAssignApplicant)
router.patch("/update-status", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff']), HandleUpdateRecruitmentStatus)

// HR xem tất cả; nhân viên chỉ xem chiến dịch đang mở (policy trong controller)
router.get("/all", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff', 'employee_user', 'Employee']), HandleAllRecruitmentCampaigns)
router.get("/:campaign_id", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff', 'employee_user', 'Employee']), HandleRecruitmentDetail)

export default router;