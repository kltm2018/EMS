import express from 'express';
import {
  HandleCreateCalendarEvent,
  HandleAllCalendarEvents,
  HandleUpdateCalendarEvent,
  HandleDeleteCalendarEvent
} from '../controllers/CorporateCalendar.controller.js';
import { VerifyHRToken } from "../middlewares/Auth.middleware.js";
import { RoleAuthorization } from "../middlewares/RoleAuth.middleware.js";

const router = express.Router();

/**
 * HR tạo, cập nhật, xóa sự kiện nội bộ. Tất cả nhân viên đều được xem lịch.
 */
router.post("/create-event", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleCreateCalendarEvent);
router.patch("/update-event", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleUpdateCalendarEvent);
router.delete("/delete-event/:id", VerifyHRToken, RoleAuthorization("HR-Admin", "HR-Staff"), HandleDeleteCalendarEvent);

/**
 * Mọi đối tượng đăng nhập đều được xem sự kiện nội bộ của tổ chức mình.
 */
router.get("/all", HandleAllCalendarEvents);

export default router;