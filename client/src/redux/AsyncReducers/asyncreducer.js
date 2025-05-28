export const AsyncReducer = (builder, thunk) => {
    builder
        .addCase(thunk.pending, (state) => {
            state.isLoading = true;
            state.error.content = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error.status = false;
            state.data = action.payload;
            if (action.payload && action.payload.resetpassword) {
                state.isAuthenticated = false;
                state.isResetPasswords = action.payload.success;
            }
            else if (action.payload) {
                state.isAuthenticated = action.payload.success;
            }
        })
        .addCase(thunk.rejected, (state, action) => {
            const payload = action.payload || {};
            if (payload.gologin) {
                state.isLoading = false;
                state.error.status = false;
                state.error.message = payload.message;
                state.error.content = payload;
            } else {
                state.isLoading = false;
                state.error.status = true;
                state.error.message = payload.message;
                state.error.content = payload;
            }
        });
};

export const HRAsyncReducer = (builder, thunk) => {
    builder
        .addCase(thunk.pending, (state) => {
            state.isLoading = true;
            state.error.content = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
            const payload = action.payload || {};
            if (payload.type === "signup") {
                state.isSignUp = true;
                state.isLoading = false;
                state.isAuthenticated = true;
                state.isAuthourized = true;
                state.isVerifiedEmailAvailable = true;
                state.error.status = false;
                state.data = payload;
            }
            if (
                payload.type === "checkHR" ||
                payload.type === "HRLogin" ||
                payload.type === "HRforgotpassword"
            ) {
                state.isSignUp = true;
                state.isLoading = false;
                state.isAuthenticated = true;
                state.isAuthourized = true;
                state.error.status = false;
                state.data = payload;
            }
            if (payload.type === "HRverifyemail") {
                state.isSignUp = true;
                state.isLoading = false;
                state.isAuthenticated = true;
                state.isAuthourized = true;
                state.isVerifiedEmailAvailable = false;
                state.isVerified = true;
                state.error.status = false;
                state.data = payload;
            }
            if (payload.type === "HRcodeavailable") {
                state.isSignUp = true;
                state.isLoading = false;
                state.isAuthenticated = true;
                state.isVerified = !!payload.alreadyverified;
                state.isVerifiedEmailAvailable = true;
                state.error.status = false;
                state.data = payload;
            }
            if (payload.resetpassword) {
                state.isSignUp = true;
                state.isLoading = false;
                state.isAuthenticated = false;
                state.isResetPassword = true;
                state.error.status = false;
                state.data = payload;
            }
            if (payload.type === "HRResendVerifyEmail") {
                state.isSignUp = true;
                state.isLoading = false;
                state.isAuthenticated = true;
                state.isVerifiedEmailAvailable = true;
                state.error.status = false;
                state.data = payload;
            }
        })
        .addCase(thunk.rejected, (state, action) => {
            const payload = action.payload || {};
            if (payload.type === "signup") {
                state.isSignUp = false;
                state.isLoading = false;
                state.error.status = true;
                state.error.message = payload.message;
                state.error.content = payload;
            } else if (payload.type === "HRcodeavailable") {
                state.isLoading = false;
                state.isVerified = false;
                state.isVerifiedEmailAvailable = false;
                state.error.status = false;
                state.error.content = payload;
            } else if (payload.gologin) {
                state.isSignUp = false;
                state.isLoading = false;
                state.isAuthenticated = false;
                state.error.status = false;
                state.error.message = payload.message;
                state.error.content = payload;
            } else {
                state.isLoading = false;
                state.error.status = true;
                state.error.message = payload.message;
                state.error.content = payload;
            }
        });
};

export const HRDashboardAsyncReducer = (builder, thunk) => {
    builder
        .addCase(thunk.pending, (state) => {
            state.isLoading = true;
            state.error.content = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error.status = false;
            state.data = action.payload?.data;
            state.success = action.payload?.success;
        })
        .addCase(thunk.rejected, (state, action) => {
            const payload = action.payload || {};
            state.isLoading = false;
            state.error.status = true;
            state.error.message = payload.message;
            state.error.content = payload;
        });
};

export const HREmployeesPageAsyncReducer = (builder, thunk) => {
    builder
        .addCase(thunk.pending, (state) => {
            state.isLoading = true;
            state.error.content = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
            const payload = action.payload || {};
            if (payload.type === "AllEmployees") {
                state.isLoading = false;
                state.error.status = false;
                state.error.message = null;
                state.error.content = null;
                state.data = payload.data;
                state.success = payload.success;
                state.fetchData = false;
            } else if (
                payload.type === "EmployeeCreate" ||
                payload.type === "EmployeeDelete"
            ) {
                state.isLoading = false;
                state.error.status = false;
                state.error.message = null;
                state.error.content = null;
                state.data = payload.data;
                state.success = payload.success;
                state.fetchData = true;
            } else if (payload.type === "GetEmployee") {
                state.isLoading = false;
                state.error.status = false;
                state.error.message = null;
                state.error.content = null;
                state.employeeData = payload.data;
            }
        })
        .addCase(thunk.rejected, (state, action) => {
            const payload = action.payload || {};
            state.isLoading = false;
            state.error.status = true;
            state.error.message = payload.message;
            state.success = payload.success;
            state.error.content = payload;
        });
};

export const HRDepartmentPageAsyncReducer = (builder, thunk) => {
    builder
        .addCase(thunk.pending, (state) => {
            state.isLoading = true;
            state.error.content = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
            const payload = action.payload || {};
            if (payload.type === "AllDepartments") {
                state.isLoading = false;
                state.error.status = false;
                state.error.message = null;
                state.error.content = null;
                state.data = payload.data;
                state.fetchData = false;
                state.success.status = false;
                state.success.message = null;
                state.success.content = null;
            } else if (
                payload.type === "CreateDepartment" ||
                payload.type === "DepartmentDelete" ||
                payload.type === "DepartmentEMUpdate" ||
                payload.type === "RemoveEmployeeDE"
            ) {
                state.isLoading = false;
                state.error.status = false;
                state.error.message = null;
                state.error.content = null;
                state.success.status = payload.success;
                state.success.message = payload.message;
                state.success.content = payload;
                state.fetchData = true;
            } else if (payload.type === "GetDepartment") {
                state.isLoading = false;
                state.error.status = false;
                state.error.message = null;
                state.error.content = null;
                state.departmentData = payload.data;
            }
        })
        .addCase(thunk.rejected, (state, action) => {
            const payload = action.payload || {};
            state.isLoading = false;
            state.error.status = true;
            state.error.message = payload.message;
            state.success = payload.success;
            state.error.content = payload;
        });
};

export const EmployeesIDsAsyncReducer = (builder, thunk) => {
    builder
        .addCase(thunk.pending, (state) => {
            state.isLoading = true;
            state.error.content = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error.message = null;
            state.error.content = null;
            state.error.status = false;
            state.data = action.payload?.data;
        })
        .addCase(thunk.rejected, (state, action) => {
            const payload = action.payload || {};
            state.isLoading = false;
            state.error.status = true;
            state.error.message = payload.message;
            state.error.content = payload;
        });
};