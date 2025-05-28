import { useAuth } from "../../hooks/useAuth";

export const EmployeeDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="bg-red-500 text-4xl font-bold flex justify-center items-center">
            <p>
                {user?.role === "Employee" || user?.role === "employee_user"
                    ? "Thông tin cá nhân nhân viên"
                    : user?.role === "Manager"
                    ? "Dashboard trưởng phòng"
                    : "This is The Dashboard"
                }
            </p>
        </div>
    );
}