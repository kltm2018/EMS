import { createSlice } from "@reduxjs/toolkit";
import {
    fetchAllEmployees,
    fetchEmployeeById,
    fetchSelfEmployee,
    fetchEmployeesByManager,
    fetchEmployeeSalaryByAccountant,
    createNewEmployee,
    updateEmployee,
    deleteEmployee,
    employeeLogin,
    employeeLogout,
    employeeCheck,
    employeeVerifyEmail,
    employeeResendVerifyEmail,
    employeeForgotPassword,
    employeeSetPassword,
    HandleGetEmployees,
    HandlePostEmployees,
    // KHÔNG import HandlePutEmployees, HandlePatchEmployees, HandleDeleteEmployees vì chưa định nghĩa
} from "../Thunks/EmployeeThunk";

const initialState = {
    employees: [],
    employeeDetail: null,
    selfInfo: null,
    employeesByManager: [],
    salaryData: [],
    isAuthenticated: false,
    isVerified: false,
    currentUser: null,
    isLoading: false,
    success: false,
    error: {
        status: false,
        message: null,
        content: null
    }
};

const EmployeeSlice = createSlice({
    name: "employees",
    initialState,
    reducers: {
        resetEmployeeState: (state) => {
            Object.assign(state, initialState);
        }
    },
    extraReducers: (builder) => {
        // HR: Lấy tất cả nhân viên
        builder
            .addCase(fetchAllEmployees.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchAllEmployees.fulfilled, (state, action) => {
                state.isLoading = false;
                state.employees = action.payload?.data || [];
                state.success = true;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(fetchAllEmployees.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            });

        // HR: Lấy chi tiết 1 nhân viên theo ID
        builder
            .addCase(fetchEmployeeById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchEmployeeById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.employeeDetail = action.payload?.data || null;
                state.success = true;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(fetchEmployeeById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            });

        // Employee/Manager: Lấy thông tin cá nhân (chỉ xem bản thân)
        builder
            .addCase(fetchSelfEmployee.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchSelfEmployee.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selfInfo = action.payload?.data || null;
                state.success = true;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(fetchSelfEmployee.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            });

        // Manager: Lấy nhân viên phòng mình
        builder
            .addCase(fetchEmployeesByManager.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchEmployeesByManager.fulfilled, (state, action) => {
                state.isLoading = false;
                state.employeesByManager = action.payload?.data || [];
                state.success = true;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(fetchEmployeesByManager.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            });

        // Accountant: Xem toàn bộ lương/mã số thuế
        builder
            .addCase(fetchEmployeeSalaryByAccountant.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchEmployeeSalaryByAccountant.fulfilled, (state, action) => {
                state.isLoading = false;
                state.salaryData = action.payload?.data || [];
                state.success = true;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(fetchEmployeeSalaryByAccountant.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            });

        // HR: Tạo nhân viên mới
        builder
            .addCase(createNewEmployee.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createNewEmployee.fulfilled, (state, action) => {
                state.isLoading = false;
                state.success = true;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(createNewEmployee.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            });

        // HR/Manager/Employee: Cập nhật thông tin cá nhân
        builder
            .addCase(updateEmployee.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateEmployee.fulfilled, (state, action) => {
                state.isLoading = false;
                state.success = true;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(updateEmployee.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            });

        // HR: Xóa nhân viên
        builder
            .addCase(deleteEmployee.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteEmployee.fulfilled, (state, action) => {
                state.isLoading = false;
                state.success = true;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(deleteEmployee.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            });

        // Đăng nhập, đăng xuất, xác thực, quên mật khẩu, v.v.
        builder
            .addCase(employeeLogin.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(employeeLogin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.currentUser = action.payload;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(employeeLogin.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            })
            .addCase(employeeLogout.fulfilled, (state) => {
                state.isAuthenticated = false;
                state.currentUser = null;
                state.selfInfo = null;
                state.success = false;
            })
            .addCase(employeeCheck.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(employeeCheck.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = action.payload?.success || false;
                state.currentUser = action.payload?.user || null;
            })
            .addCase(employeeCheck.rejected, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.currentUser = null;
            });

        // Xác thực email, gửi lại mã, quên/đặt lại mật khẩu (giữ nguyên logic cũ)
        builder
            .addCase(employeeVerifyEmail.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(employeeVerifyEmail.fulfilled, (state) => {
                state.isLoading = false;
                state.isVerified = true;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(employeeVerifyEmail.rejected, (state, action) => {
                state.isLoading = false;
                state.isVerified = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            })
            .addCase(employeeResendVerifyEmail.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(employeeResendVerifyEmail.fulfilled, (state) => {
                state.isLoading = false;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(employeeResendVerifyEmail.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            })
            .addCase(employeeForgotPassword.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(employeeForgotPassword.fulfilled, (state) => {
                state.isLoading = false;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(employeeForgotPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            })
            .addCase(employeeSetPassword.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(employeeSetPassword.fulfilled, (state) => {
                state.isLoading = false;
                state.error = { status: false, message: null, content: null };
            })
            .addCase(employeeSetPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = { status: true, message: action.error?.message, content: action.error };
            });
    }
});

export const { resetEmployeeState } = EmployeeSlice.actions;
export default EmployeeSlice.reducer;