import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HRdashboardSidebar } from "../../components/ui/HRsidebar.jsx";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

export const HRdashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const pathArray = location.pathname.split("/");
    const { user } = useAuth();

    useEffect(() => {
        // Điều hướng vào đúng dashboard theo role
        if (user?.role === "HR-Admin" || user?.role === "HR-Staff") {
            navigate(`/HR/dashboard/employees`);
        } else if (user?.role === "Manager") {
            navigate(`/HR/dashboard/manager`);
        } else if (user?.role === "Accountant") {
            navigate(`/HR/dashboard/accounting`);
        } else if (user?.role === "Employee" || user?.role === "employee_user") {
            navigate(`/HR/dashboard/me`);
        }
    }, [user?.role, navigate]);

    return (
        <div className="HR-dashboard-container flex">
            <div className="HRDashboard-sidebar">
                <SidebarProvider>
                    <HRdashboardSidebar />
                    <div className="sidebar-container min-[250px]:absolute md:relative">
                        <SidebarTrigger />
                    </div>
                </SidebarProvider>
            </div>
            <div className="HRdashboard-container h-screen w-full min-[250px]:mx-1 md:mx-2 flex flex-col">
                <Outlet />
            </div>
        </div>
    );
};