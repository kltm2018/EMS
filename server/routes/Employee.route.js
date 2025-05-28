import express from "express"
import {
  HandleAllEmployees,
  HandleEmployeeUpdate,
  HandleEmployeeDelete,
  HandleEmployeeByHR,
  HandleEmployeeByEmployee,
  HandleAllEmployeesIDS,
  HandleEmployeesByManager,
  HandleManagerUpdateSelf,
  HandleAccountantViewSalaries
} from "../controllers/Employee.controller.js"
import { VerifyHRToken, VerifyEmployeeToken, VerifyManagerToken, VerifyAccountantToken } from "../middlewares/Auth.middleware.js"
import { RoleAuthorization } from "../middlewares/RoleAuth.middleware.js"

const router = express.Router()

// HR xem/sửa/xóa toàn bộ nhân viên (HR-Admin, HR-Staff)
router.get("/all", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff']), HandleAllEmployees)
router.get("/all-employees-ids", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff']), HandleAllEmployeesIDS)
router.patch("/update-employee", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff']), HandleEmployeeUpdate)
router.delete("/delete-employee/:employeeId", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff']), HandleEmployeeDelete)
router.get("/by-HR/:employeeId", VerifyHRToken, RoleAuthorization(['HR-Admin', 'HR-Staff']), HandleEmployeeByHR)

// Nhân viên chỉ xem thông tin cá nhân (không lương, không thuế)
router.get("/by-employee", VerifyEmployeeToken, HandleEmployeeByEmployee)

// Trưởng phòng: xem tất cả nhân viên cùng phòng (bao gồm lương, mã số thuế)
router.get("/by-manager", VerifyManagerToken, HandleEmployeesByManager)
// Chỉ cho phép trưởng phòng sửa thông tin bản thân (phải kiểm tra trong controller)
router.patch("/manager-update-profile", VerifyManagerToken, HandleManagerUpdateSelf)

// Kế toán: chỉ xem bảng lương, mã số thuế toàn bộ nhân viên
router.get("/accountant-salaries", VerifyAccountantToken, HandleAccountantViewSalaries)

export default router;