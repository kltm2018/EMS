import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

export function HRdashboardSidebar() {
    // Lấy user và role từ redux (hoặc context nếu app bạn dùng context cho auth)
    const user = useSelector((state) => state.auth.user);

    // Nếu chưa đăng nhập hoặc không có role, không render sidebar chức năng
    if (!user || !user.role) {
        return null;
    }

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-3 p-2">

                            {/* HR: Full quyền */}
                            {(user.role === "HR-Admin" || user.role === "HR-Staff") && (
                                <>
                                    <NavLink to="/HR/dashboard/dashboard-data" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                        <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                            <img src="/../../src/assets/HR-Dashboard/dashboard.png" alt="" className="w-7 ms-2 my-1" />
                                            <span className="text-[16px]">Dashboard</span>
                                        </SidebarMenuItem>
                                    </NavLink>
                                    <NavLink to="/HR/dashboard/employees" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                        <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                            <img src="/../../src/assets/HR-Dashboard/employee-2.png" alt="" className="w-7 ms-2 my-1" />
                                            <span className="text-[16px]">Nhân viên</span>
                                        </SidebarMenuItem>
                                    </NavLink>
                                    <NavLink to="/HR/dashboard/departments" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                        <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                            <img src="/../../src/assets/HR-Dashboard/department.png" alt="" className="w-7 ms-2 my-1" />
                                            <span className="text-[16px]">Phòng ban</span>
                                        </SidebarMenuItem>
                                    </NavLink>
                                    <NavLink to="/HR/dashboard/salaries" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                        <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                            <img src="/../../src/assets/HR-Dashboard/salary.png" alt="" className="w-7 ms-2 my-1" />
                                            <span className="text-[16px]">Lương</span>
                                        </SidebarMenuItem>
                                    </NavLink>
                                    <NavLink to="/HR/dashboard/notices" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                        <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                            <img src="/../../src/assets/HR-Dashboard/notice.png" alt="" className="w-7 ms-2 my-1" />
                                            <span className="text-[16px]">Thông báo</span>
                                        </SidebarMenuItem>
                                    </NavLink>
                                    <NavLink to="/HR/dashboard/leaves" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                        <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                            <img src="/../../src/assets/HR-Dashboard/leave.png" alt="" className="w-7 ms-2 my-1" />
                                            <span className="text-[16px]">Nghỉ phép</span>
                                        </SidebarMenuItem>
                                    </NavLink>
                                    <NavLink to="/HR/dashboard/attendance" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                        <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                            <img src="/../../src/assets/HR-Dashboard/attendance.png" alt="" className="w-7 ms-2 my-1" />
                                            <span className="text-[16px]">Chấm công</span>
                                        </SidebarMenuItem>
                                    </NavLink>
                                    <NavLink to="/HR/dashboard/recruitment" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                        <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                            <img src="/../../src/assets/HR-Dashboard/recruitment.png" alt="" className="w-7 ms-2 my-1" />
                                            <span className="text-[16px]">Tuyển dụng</span>
                                        </SidebarMenuItem>
                                    </NavLink>
                                    <NavLink to="/HR/dashboard/interview-insights" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                        <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                            <img src="/../../src/assets/HR-Dashboard/interview-insights.png" alt="" className="w-7 ms-2 my-1" />
                                            <span className="text-[16px]">Phỏng vấn</span>
                                        </SidebarMenuItem>
                                    </NavLink>
                                    <NavLink to="/HR/dashboard/requests" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                        <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                            <img src="/../../src/assets/HR-Dashboard/request.png" alt="" className="w-7 ms-2 my-1" />
                                            <span className="text-[16px]">Yêu cầu nội bộ</span>
                                        </SidebarMenuItem>
                                    </NavLink>
                                    <NavLink to="/HR/dashboard/hr-profiles" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                        <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                            <img src="/../../src/assets/HR-Dashboard/HR-profiles.png" alt="" className="w-7 ms-2 my-1" />
                                            <span className="text-[16px]">Nhân sự HR</span>
                                        </SidebarMenuItem>
                                    </NavLink>
                                </>
                            )}

                            {/* Trưởng phòng: chỉ xem nhân viên phòng mình, không xem lương các nhân viên khác */}
                            {user.role === "Manager" && (
                                <NavLink to="/manager/employees" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                    <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                        <img src="/../../src/assets/HR-Dashboard/employee-2.png" alt="" className="w-7 ms-2 my-1" />
                                        <span className="text-[16px]">Nhân viên trong phòng</span>
                                    </SidebarMenuItem>
                                </NavLink>
                            )}

                            {/* Nhân viên: chỉ xem được thông tin cá nhân */}
                            {user.role === "Employee" && (
                                <NavLink to="/employee/me" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                    <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                        <img src="/../../src/assets/HR-Dashboard/employee-2.png" alt="" className="w-7 ms-2 my-1" />
                                        <span className="text-[16px]">Thông tin cá nhân</span>
                                    </SidebarMenuItem>
                                </NavLink>
                            )}

                            {/* Kế toán: chỉ xem lương/mã số thuế toàn công ty */}
                            {user.role === "Accountant" && (
                                <NavLink to="/accountant/salary" className={({ isActive }) => isActive ? "bg-blue-200 rounded-lg" : ""}>
                                    <SidebarMenuItem className="flex gap-4 hover:bg-blue-200 rounded-lg">
                                        <img src="/../../src/assets/HR-Dashboard/salary.png" alt="" className="w-7 ms-2 my-1" />
                                        <span className="text-[16px]">Lương & Mã số thuế</span>
                                    </SidebarMenuItem>
                                </NavLink>
                            )}

                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}