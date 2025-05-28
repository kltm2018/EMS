import axios from 'axios';

// Tạo một instance axios dùng cho toàn bộ API, có thể thêm interceptors nếu muốn
export const apiService = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', // Thay đổi biến môi trường phù hợp
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Để gửi cookie JWT qua cross-origin nếu cần
});