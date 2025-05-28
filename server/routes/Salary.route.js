import express from 'express'
import { 
  HandleCreateSalary, 
  HandleAllSalary, 
  HandleSalary, 
  HandleUpdateSalary, 
  HandleDeleteSalary 
} from '../controllers/Salary.controller.js'
import { VerifyHRToken } from '../middlewares/Auth.middleware.js'
import { RoleAuthorization } from '../middlewares/RoleAuth.middleware.js'

const router = express.Router()

// Chỉ HR và Kế toán được phép tạo lương (theo chính sách phân quyền)
router.post(
  "/create-salary", 
  VerifyHRToken, 
  RoleAuthorization(['HR-Admin', 'HR-Staff', 'Accountant']), 
  HandleCreateSalary
)

// HR và Kế toán được xem toàn bộ danh sách lương (kể cả đã giải mã)
router.get(
  "/all", 
  VerifyHRToken, 
  RoleAuthorization(['HR-Admin', 'HR-Staff', 'Accountant']), 
  HandleAllSalary
)

// Xem chi tiết lương: 
// - HR, Accountant xem mọi bản ghi 
// - employee_user chỉ xem lương của chính mình (kiểm tra trong controller)
router.get(
  "/:salaryID", 
  VerifyHRToken, 
  RoleAuthorization(['HR-Admin', 'HR-Staff', 'Accountant', 'employee_user']), 
  HandleSalary
)

// HR và Kế toán được phép cập nhật bảng lương
router.patch(
  "/update-salary", 
  VerifyHRToken, 
  RoleAuthorization(['HR-Admin', 'HR-Staff', 'Accountant']), 
  HandleUpdateSalary
)

// HR và Kế toán được phép xóa bản ghi lương
router.delete(
  "/delete-salary/:salaryID", 
  VerifyHRToken, 
  RoleAuthorization(['HR-Admin', 'HR-Staff', 'Accountant']), 
  HandleDeleteSalary
)

export default router