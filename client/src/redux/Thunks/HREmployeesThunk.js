import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiService } from "../apis/apiService";
import { HREmployeesPageEndpoints } from "../apis/APIsEndpoints";

// Lấy danh sách nhân viên (HR)
export const HandleGetHREmployees = createAsyncThunk(
    'HandleGetHREmployees',
    async (HREmployeeData, { rejectWithValue }) => {
        try {
            const { apiroute } = HREmployeeData;
            const response = await apiService.get(`${HREmployeesPageEndpoints[apiroute]}`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// Tạo nhân viên mới (HR)
export const HandlePostHREmployees = createAsyncThunk(
    'HandlePostHREmployees',
    async (HREmployeeData, { rejectWithValue }) => {
        try {
            const { apiroute, data } = HREmployeeData;
            const response = await apiService.post(`${HREmployeesPageEndpoints[apiroute]}`, data, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);

// Xóa nhân viên (HR)
export const HandleDeleteHREmployees = createAsyncThunk(
    "HandleDeleteHREmployees",
    async (HREmployeeData, { rejectWithValue }) => {
        try {
            const { apiroute } = HREmployeeData;
            const RouteArray = apiroute.split(".");
            if (RouteArray.length > 0) {
                // Đảm bảo endpoint là function nhận id
                const endpointFunction = HREmployeesPageEndpoints[RouteArray[0]];
                if (typeof endpointFunction === "function") {
                    const response = await apiService.delete(`${endpointFunction(RouteArray[1])}`, {
                        withCredentials: true
                    });
                    return response.data;
                } else {
                    // Nếu không phải function thì trả lỗi đúng
                    return rejectWithValue({ message: "Endpoint không hợp lệ" });
                }
            } else {
                return rejectWithValue({ message: "apiroute không hợp lệ" });
            }
        } catch (error) {
            return rejectWithValue(error.response?.data || error);
        }
    }
);