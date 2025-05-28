// Định nghĩa các endpoint đầy đủ cho từng module
export const AuthEndpoints = {
    // Employee Auth
    EMPLOYEE_SIGNUP: "/api/auth/employee/signup",
    EMPLOYEE_LOGIN: "/api/auth/employee/login",
    EMPLOYEE_LOGOUT: "/api/auth/employee/logout",
    EMPLOYEE_VERIFY_EMAIL: "/api/auth/employee/verify-email",
    EMPLOYEE_RESEND_VERIFY_EMAIL: "/api/auth/employee/resend-verify-email",
    EMPLOYEE_CHECK: "/api/auth/employee/check",
    EMPLOYEE_CHECK_VERIFY_EMAIL: "/api/auth/employee/check-verify-email",
    EMPLOYEE_FORGOT_PASSWORD: "/api/auth/employee/forgot-password",
    EMPLOYEE_SET_PASSWORD: (token) => `/api/auth/employee/set-password/${token}`,
  
    // HR Auth
    HR_SIGNUP: "/api/auth/HR/signup",
    HR_LOGIN: "/api/auth/HR/login",
    HR_LOGOUT: "/api/auth/HR/logout",
    HR_VERIFY_EMAIL: "/api/auth/HR/verify-email",
    HR_RESEND_VERIFY_EMAIL: "/api/auth/HR/resend-verify-email",
    HR_CHECK_LOGIN: "/api/auth/HR/check-login",
    HR_CHECK_VERIFY_EMAIL: "/api/auth/HR/check-verify-email",
    HR_FORGOT_PASSWORD: "/api/auth/HR/forgot-password",
    HR_RESET_PASSWORD: (token) => `/api/auth/HR/reset-password/${token}`,
  };
  
 
  export const HRManagementEndpoints = {
    ALL_HR: "/api/v1/HR/all",
    HR_DETAIL: (HRID) => `/api/v1/HR/${HRID}`,
    UPDATE_HR: "/api/v1/HR/update-HR",
    DELETE_HR: (HRID) => `/api/v1/HR/delete-HR/${HRID}`,
  };
  
  export const EmployeeEndpoints = {
    ALL: "/api/v1/employee/all",
    IDS: "/api/v1/employee/ids",
    DELETE: (employeeId) => `/api/v1/employee/delete/${employeeId}`,
    UPDATE: "/api/v1/employee/update",
    BY_HR: (employeeId) => `/api/v1/employee/by-HR/${employeeId}`,
    BY_MANAGER: "/api/v1/employee/by-manager",
    ME: "/api/v1/employee/me",
    SALARY_ACCOUNTANT: "/api/v1/employee/salary/accountant",
  };
  
  export const DepartmentEndpoints = {
    CREATE: "/api/v1/department/create-department",
    ALL: "/api/v1/department/all",
    DETAIL: (departmentID) => `/api/v1/department/${departmentID}`,
    UPDATE: "/api/v1/department/update-department",
    DELETE: (departmentID) => `/api/v1/department/delete-department/${departmentID}`,
  };
  
  export const SalaryEndpoints = {
    CREATE: "/api/v1/salary/create-salary",
    ALL: "/api/v1/salary/all",
    DETAIL: (salaryID) => `/api/v1/salary/${salaryID}`,
    UPDATE: "/api/v1/salary/update-salary",
    DELETE: (salaryID) => `/api/v1/salary/delete-salary/${salaryID}`,
  };
  
  export const LeaveEndpoints = {
    CREATE: "/api/v1/leave/create-leave",
    ALL: "/api/v1/leave/all",
    DETAIL: (leaveID) => `/api/v1/leave/${leaveID}`,
    EMPLOYEE_UPDATE: "/api/v1/leave/employee-update-leave",
    HR_UPDATE: "/api/v1/leave/HR-update-leave",
    DELETE: (leaveID) => `/api/v1/leave/delete-leave/${leaveID}`,
  };
  
  export const NoticeEndpoints = {
    CREATE: "/api/v1/notice/create-notice",
    UPDATE: "/api/v1/notice/update-notice",
    DELETE: (noticeID) => `/api/v1/notice/delete-notice/${noticeID}`,
    ALL: "/api/v1/notice/all",
    DETAIL: (noticeID) => `/api/v1/notice/${noticeID}`,
  };
  
  export const CalendarEndpoints = {
    CREATE_EVENT: "/api/v1/corporate-calendar/create-event",
    UPDATE_EVENT: "/api/v1/corporate-calendar/update-event",
    DELETE_EVENT: (id) => `/api/v1/corporate-calendar/delete-event/${id}`,
    ALL: "/api/v1/corporate-calendar/all",
  };
  
  export const RecruitmentEndpoints = {
    CREATE: "/api/v1/recruitment/create-recruitment",
    ASSIGN_APPLICANT: "/api/v1/recruitment/assign-applicant",
    UPDATE_STATUS: "/api/v1/recruitment/update-status",
    ALL: "/api/v1/recruitment/all",
    DETAIL: (campaign_id) => `/api/v1/recruitment/${campaign_id}`,
  };
  
  export const ApplicantEndpoints = {
    CREATE: "/api/v1/applicant/create-applicant",
    ALL: "/api/v1/applicant/all",
    DETAIL: (applicantId) => `/api/v1/applicant/${applicantId}`,
    UPDATE: (applicantId) => `/api/v1/applicant/update-applicant/${applicantId}`,
    DELETE: (applicantId) => `/api/v1/applicant/delete-applicant/${applicantId}`,
  };
  
  export const InterviewEndpoints = {
    CREATE: "/api/v1/interview-insights/create-interview",
    ALL: "/api/v1/interview-insights/all",
    DETAIL: (interviewID) => `/api/v1/interview-insights/${interviewID}`,
    UPDATE: "/api/v1/interview-insights/update-interview",
    DELETE: (interviewID) => `/api/v1/interview-insights/delete-interview/${interviewID}`,
  };
  
  export const GenerateRequestEndpoints = {
    CREATE: "/api/v1/generate-request/create-request",
    ALL: "/api/v1/generate-request/all",
    DETAIL: (requestID) => `/api/v1/generate-request/${requestID}`,
    UPDATE: "/api/v1/generate-request/update-request-content",
    DELETE: (requestID) => `/api/v1/generate-request/delete-request/${requestID}`,
  };
  
  export const AttendanceEndpoints = {
    INITIALIZE: "/api/v1/attendance/initialize",
    ALL: "/api/v1/attendance/all",
    DETAIL: (attendanceID) => `/api/v1/attendance/${attendanceID}`,
    UPDATE: "/api/v1/attendance/update",
    DELETE: (attendanceID) => `/api/v1/attendance/delete/${attendanceID}`,
  };
  
  export const BalanceEndpoints = {
    MY_BALANCE: "/api/v1/balance/my-balance",
    UPDATE: "/api/v1/balance/update-balance",
    ALL: "/api/v1/balance/all",
  };
  
// APIsEndpoints: Các endpoint xác thực nhân viên
export const APIsEndpoints = {
  LOGIN: "/api/auth/employee/login",
  CHECK_LOGIN: "/api/auth/employee/check-login",
  FORGOT_PASSWORD: "/api/auth/employee/forgot-password",
  RESET_PASSWORD: (token) => `/api/auth/employee/reset-password/${token}`,
  SIGNUP: "/api/auth/employee/signup",
  VERIFY_EMAIL: "/api/auth/employee/verify-email",
  RESEND_VERIFY_EMAIL: "/api/auth/employee/resend-verify-email",
  CHECK_VERIFY_EMAIL: "/api/auth/employee/check-verify-email",
  ME: "/api/v1/employee/me"
};

// HREndpoints: Các endpoint xác thực và thao tác tài khoản HR
export const HREndpoints = {
  SIGNUP: "/api/auth/HR/signup",
  LOGIN: "/api/auth/HR/login",
  CHECK_LOGIN: "/api/auth/HR/check-login",
  VERIFY_EMAIL: "/api/auth/HR/verify-email",
  CHECK_VERIFY_EMAIL: "/api/auth/HR/check-verify-email",
  RESEND_VERIFY_EMAIL: "/api/auth/HR/resend-verify-email",
  FORGOT_PASSWORD: "/api/auth/HR/forgot-password",
  RESET_PASSWORD: (token) => `/api/auth/HR/reset-password/${token}`,
  ALL_HR: "/api/v1/HR/all",
  HR_DETAIL: (HRID) => `/api/v1/HR/${HRID}`,
  UPDATE_HR: "/api/v1/HR/update-HR",
  DELETE_HR: (HRID) => `/api/v1/HR/delete-HR/${HRID}`,
};

// DashboardEndpoints: Các endpoint dashboard
export const DashboardEndpoints = {
  MAIN: "/api/v1/dashboard/main",
  SALARY_STATS: "/api/v1/dashboard/salary-stats",
  HR_DASHBOARD: "/api/v1/dashboard/HR-dashboard"
};

// EmployeesIDsEndpoints: Lấy danh sách mã số nhân viên
export const EmployeesIDsEndpoints = {
  ALL: "/api/v1/employee/ids"
};

// HRDepartmentPageEndpoints: Quản lý phòng ban cho HR
export const HRDepartmentPageEndpoints = {
  ALL: "/api/v1/department/all",
  CREATE: "/api/v1/department/create-department",
  UPDATE: "/api/v1/department/update-department",
  DELETE: (departmentID) => `/api/v1/department/delete-department/${departmentID}`,
  DETAIL: (departmentID) => `/api/v1/department/${departmentID}`,
};

// HREmployeesPageEndpoints: Quản lý nhân viên (HR, trưởng phòng, kế toán)
export const HREmployeesPageEndpoints = {
  ALL: "/api/v1/employee/all",                        // HR xem tất cả nhân viên
  ADDEMPLOYEE: "/api/auth/employee/signup",           // HR thêm nhân viên mới
  GET_ONE: (employeeId) => `/api/v1/employee/by-HR/${employeeId}`, // HR xem chi tiết nhân viên
  DELETE: (employeeId) => `/api/v1/employee/delete/${employeeId}`, // HR xóa nhân viên
  UPDATE: "/api/v1/employee/update",                  // HR cập nhật nhân viên

  BY_MANAGER: "/api/v1/employee/by-manager",          // Trưởng phòng xem nhân viên cùng phòng
  SALARY_ACCOUNTANT: "/api/v1/employee/salary/accountant", // Kế toán xem lương, MST đã giải mã
};