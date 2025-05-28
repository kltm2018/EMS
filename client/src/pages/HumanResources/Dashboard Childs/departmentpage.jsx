import { HRDepartmentTabs } from "../../../components/common/Dashboard/departmenttabs"
import { useAuth } from "../../../hooks/useAuth"
import { CreateDepartmentDialogBox } from "../../../components/common/Dashboard/dialogboxes"

export const HRDepartmentPage = () => {
    const { user } = useAuth();

    return (
        <div className="department-container mt-5 min-[250px]:mx-1 sm:mx-2 w-auto flex flex-col gap-3 h-[97%]">
            <div className="deaprtment-heading flex justify-between items-center min-[250px]:flex-col min-[250px]:gap-2 min-[400px]:flex-row">
                <h1 className="min-[250px]:text-2xl md:text-4xl font-bold">
                    Departments
                </h1>
                {(user?.role === "HR-Admin" || user?.role === "HR-Staff") && (
                    <CreateDepartmentDialogBox />
                )}
            </div>
            <HRDepartmentTabs userRole={user?.role} />
        </div>
    )
}