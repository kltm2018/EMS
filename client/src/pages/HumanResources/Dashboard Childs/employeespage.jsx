import { ListWrapper, HeadingBar, ListItems, ListContainer } from "../../../components/common/Dashboard/ListDesigns";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HandleGetHREmployees } from "../../../redux/Thunks/HREmployeesThunk.js";
import { Loading } from "../../../components/common/loading.jsx";
import { AddEmployeesDialogBox } from "../../../components/common/Dashboard/dialogboxes.jsx";
import { useAuth } from "../../../hooks/useAuth"; // Giả định có custom hook trả về user

export const HREmployeesPage = () => {
    const dispatch = useDispatch();
    const HREmployeesState = useSelector((state) => state.HREmployeesPageReducer);
    const { user } = useAuth();

    // Tùy quyền, cấu hình cột (HR/Accountant xem lương, Manager/Employee không)
    let table_headings = ["Full Name", "Email", "Department", "Contact Number", "Modify Employee"];
    if (user?.role === "Accountant") {
        table_headings = ["Full Name", "Email", "Department", "Contact Number", "Salary", "Tax Code"];
    } else if (user?.role === "Manager") {
        table_headings = ["Full Name", "Email", "Department", "Contact Number"];
    }

    // Gọi API phù hợp với từng role
    useEffect(() => {
        if (HREmployeesState.fetchData) {
            if (user?.role === "HR-Admin" || user?.role === "HR-Staff") {
                dispatch(HandleGetHREmployees({ apiroute: "/employee/all" }));
            } else if (user?.role === "Manager") {
                dispatch(HandleGetHREmployees({ apiroute: "/employee/by-manager" }));
            } else if (user?.role === "Accountant") {
                dispatch(HandleGetHREmployees({ apiroute: "/employee/salary/accountant" }));
            } else if (user?.role === "Employee" || user?.role === "employee_user") {
                dispatch(HandleGetHREmployees({ apiroute: "/employee/me" }));
            }
        }
    }, [HREmployeesState.fetchData, user?.role, dispatch]);

    useEffect(() => {
        // Gọi lại khi mount
        if (user?.role === "HR-Admin" || user?.role === "HR-Staff") {
            dispatch(HandleGetHREmployees({ apiroute: "/employee/all" }));
        } else if (user?.role === "Manager") {
            dispatch(HandleGetHREmployees({ apiroute: "/employee/by-manager" }));
        } else if (user?.role === "Accountant") {
            dispatch(HandleGetHREmployees({ apiroute: "/employee/salary/accountant" }));
        } else if (user?.role === "Employee" || user?.role === "employee_user") {
            dispatch(HandleGetHREmployees({ apiroute: "/employee/me" }));
        }
    }, [user?.role, dispatch]);

    if (HREmployeesState.isLoading) {
        return (<Loading />);
    }

    return (
        <div className="employee-page-content w-full mx-auto my-10 flex flex-col gap-5 h-[94%]">
            <div className="employees-heading flex justify-between items-center md:pe-5">
                <h1 className="min-[250px]:text-xl md:text-4xl font-bold">Employees</h1>
                {(user?.role === "HR-Admin" || user?.role === "HR-Staff") && (
                    <div className="employee-crate-button">
                        <AddEmployeesDialogBox />
                    </div>
                )}
            </div>
            <div className="employees-data flex flex-col gap-4 md:pe-5 overflow-auto">
                <ListWrapper>
                    <HeadingBar table_layout={`grid-cols-${table_headings.length}`} table_headings={table_headings} />
                </ListWrapper>
                <ListContainer>
                    <ListItems TargetedState={HREmployeesState} userRole={user?.role} />
                </ListContainer>
            </div>
        </div>
    );
};