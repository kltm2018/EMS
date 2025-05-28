import { createAsyncThunk } from '@reduxjs/toolkit'
import { apiService } from '../apis/apiService'
import { APIsEndpoints } from '../apis/APIsEndpoints.js'

// HR: Lấy tất cả nhân viên
export const fetchAllEmployees = createAsyncThunk(
    "fetchAllEmployees",
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiService.get(APIsEndPoints.GET_ALL_EMPLOYEES, { withCredentials: true });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// HR: Lấy chi tiết 1 nhân viên theo ID
export const fetchEmployeeById = createAsyncThunk(
    "fetchEmployeeById",
    async (employeeId, { rejectWithValue }) => {
        try {
            const response = await apiService.get(`${APIsEndPoints.GET_EMPLOYEE_BY_HR}/${employeeId}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// Employee/Manager: Lấy thông tin cá nhân
export const fetchSelfEmployee = createAsyncThunk(
    "fetchSelfEmployee",
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiService.get(APIsEndPoints.GET_SELF_EMPLOYEE, { withCredentials: true });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// Manager: Lấy nhân viên phòng mình
export const fetchEmployeesByManager = createAsyncThunk(
    "fetchEmployeesByManager",
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiService.get(APIsEndPoints.GET_EMPLOYEES_BY_MANAGER, { withCredentials: true });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// Accountant: Xem lương/mã số thuế
export const fetchEmployeeSalaryByAccountant = createAsyncThunk(
    "fetchEmployeeSalaryByAccountant",
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiService.get(APIsEndPoints.GET_EMPLOYEE_SALARY_BY_ACCOUNTANT, { withCredentials: true });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// HR: Tạo mới nhân viên
export const createNewEmployee = createAsyncThunk(
    "createNewEmployee",
    async (employeeData, { rejectWithValue }) => {
        try {
            const response = await apiService.post(APIsEndPoints.CREATE_EMPLOYEE, employeeData, { withCredentials: true });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// HR/Manager/Employee: Cập nhật thông tin cá nhân
export const updateEmployee = createAsyncThunk(
    "updateEmployee",
    async (updateData, { rejectWithValue }) => {
        try {
            const response = await apiService.patch(APIsEndPoints.UPDATE_EMPLOYEE, updateData, { withCredentials: true });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// HR: Xóa nhân viên
export const deleteEmployee = createAsyncThunk(
    "deleteEmployee",
    async (employeeId, { rejectWithValue }) => {
        try {
            const response = await apiService.delete(`${APIsEndPoints.DELETE_EMPLOYEE}/${employeeId}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// API động GET theo route
export const HandleGetEmployees = createAsyncThunk(
    "handleGetEmployees",
    async (EmployeeData, { rejectWithValue }) => {
        try {
            const { apiroute } = EmployeeData;
            const response = await apiService.get(`${APIsEndPoints[apiroute]}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// API động POST theo route
export const HandlePostEmployees = createAsyncThunk(
    "HandlePostEmployees",
    async (EmployeeData, { rejectWithValue }) => {
        try {
            const { apiroute, data, type } = EmployeeData;
            if (type === "resetpassword") {
                const response = await apiService.post(`${APIsEndPoints.RESET_PASSWORD(apiroute)}`, data, {
                    withCredentials: true
                });
                return response.data;
            } else {
                const response = await apiService.post(`${APIsEndPoints[apiroute]}`, data, {
                    withCredentials: true
                });
                return response.data;
            }
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// ==============================
// ==== AUTHENTICATION THUNKS ====
// ==============================

// Đăng nhập nhân viên
export const employeeLogin = createAsyncThunk(
    "employeeLogin",
    async (loginData, { rejectWithValue }) => {
        try {
            const response = await apiService.post(APIsEndPoints.EMPLOYEE_LOGIN, loginData, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// Đăng xuất nhân viên
export const employeeLogout = createAsyncThunk(
    "employeeLogout",
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiService.post(APIsEndPoints.EMPLOYEE_LOGOUT, {}, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// Kiểm tra phiên đăng nhập (check token/cookie)
export const employeeCheck = createAsyncThunk(
    "employeeCheck",
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiService.get(APIsEndPoints.EMPLOYEE_CHECK, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// Xác minh email nhân viên (verify email)
export const employeeVerifyEmail = createAsyncThunk(
    "employeeVerifyEmail",
    async (verifyData, { rejectWithValue }) => {
        try {
            const response = await apiService.post(APIsEndPoints.EMPLOYEE_VERIFY_EMAIL, verifyData, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// Gửi lại email xác minh (resend verify)
export const employeeResendVerifyEmail = createAsyncThunk(
    "employeeResendVerifyEmail",
    async (resendData, { rejectWithValue }) => {
        try {
            const response = await apiService.post(APIsEndPoints.EMPLOYEE_RESEND_VERIFY_EMAIL, resendData, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// Quên mật khẩu (gửi email đặt lại mật khẩu)
export const employeeForgotPassword = createAsyncThunk(
    "employeeForgotPassword",
    async (forgotData, { rejectWithValue }) => {
        try {
            const response = await apiService.post(APIsEndPoints.EMPLOYEE_FORGOT_PASSWORD, forgotData, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// Đặt lại mật khẩu (reset password)
export const employeeSetPassword = createAsyncThunk(
    "employeeSetPassword",
    async (setPasswordData, { rejectWithValue }) => {
        try {
            const response = await apiService.post(APIsEndPoints.EMPLOYEE_SET_PASSWORD, setPasswordData, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);