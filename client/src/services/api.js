import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Tạo instance axios với URL cơ sở
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Thêm interceptor để gắn token vào header của mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API đăng nhập
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối đến server' };
  }
};

// API đăng ký tài khoản HR
export const registerHR = async (userData) => {
  try {
    const response = await api.post('/auth/register-hr', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối đến server' };
  }
};

// API đăng ký tài khoản nhân viên
export const registerEmployee = async (userData) => {
  try {
    const response = await api.post('/auth/register-employee', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối đến server' };
  }
};

// API đăng ký tài khoản kế toán
export const registerAccountant = async (userData) => {
  try {
    const response = await api.post('/auth/register-accountant', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối đến server' };
  }
};

// API lấy thông tin người dùng hiện tại
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối đến server' };
  }
};

export default api;
