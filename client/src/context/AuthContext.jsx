import React, { createContext, useState, useEffect, useContext } from 'react';
import { login, getCurrentUser } from '../services/api';

// Tạo context cho xác thực
const AuthContext = createContext();

// Hook tùy chỉnh để sử dụng AuthContext
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kiểm tra xem người dùng đã đăng nhập chưa khi component được mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const { user } = await getCurrentUser();
          setUser(user);
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra đăng nhập:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Hàm đăng nhập
  const loginUser = async (email, password) => {
    try {
      setError(null);
      const data = await login(email, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
      throw err;
    }
  };

  // Hàm đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Giá trị context
  const value = {
    user,
    loading,
    error,
    loginUser,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
