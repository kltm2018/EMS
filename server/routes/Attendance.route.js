import express from "express";
import {
  HandleInitializeAttendance,
  HandleAllAttendance,
  HandleAttendance,
  HandleUpdateAttendance,
  HandleDeleteAttendance
} from "../controllers/Attendance.controller.js";
import { VerifyHRToken } from "../middlewares/Auth.middleware.js";
import { RoleAuthorization } from "../middlewares/RoleAuth.middleware.js";

const router = express.Router();

// HR khởi tạo chấm công cho 1 nhân viên
router.post("/initialize", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleInitializeAttendance);

// Xem tất cả bản ghi chấm công trong tổ chức (HR xem tất, Manager chỉ xem phòng mình, Employee chỉ xem bản thân)
// => Kiểm soát chi tiết trong controller, route này mở cho tất cả đã đăng nhập
router.get("/all", HandleAllAttendance);

// Xem chi tiết một bản ghi chấm công (HR, Manager, Employee xem bản thân/phòng mình)
// => Kiểm soát chi tiết trong controller
router.get("/:attendanceID", HandleAttendance);

// HR hoặc chính nhân viên cập nhật trạng thái chấm công
router.patch("/update", HandleUpdateAttendance);

// HR xóa bản ghi chấm công
router.delete("/delete/:attendanceID", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleDeleteAttendance);

export default router;