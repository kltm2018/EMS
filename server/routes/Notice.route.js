import express from "express"
import { 
  HandleCreateNotice, 
  HandleAllNotices, 
  HandleNotice, 
  HandleUpdateNotice, 
  HandleDeleteNotice 
} from "../controllers/Notice.controller.js"
import { VerifyHRToken } from "../middlewares/Auth.middleware.js"
import { RoleAuthorization } from "../middlewares/RoleAuth.middleware.js"

const router = express.Router()

// Chỉ HR được tạo/cập nhật/xóa thông báo
router.post("/create-notice", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff']), HandleCreateNotice)
router.patch("/update-notice", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff']), HandleUpdateNotice)
router.delete("/delete-notice/:noticeID", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff']), HandleDeleteNotice)

// HR xem tất cả thông báo, nhân viên chỉ xem thông báo được phép (policy trong controller)
router.get("/all", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff', 'employee_user', 'Manager', 'manager_user', 'Employee']), HandleAllNotices)
router.get("/:noticeID", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff', 'employee_user', 'Manager', 'manager_user', 'Employee']), HandleNotice)

export default router;