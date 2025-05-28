import React, { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // user: null nếu chưa đăng nhập
  const [loading, setLoading] = useState(true);

  // Load trạng thái đăng nhập khi app khởi động
  useEffect(() => {
    const saved = localStorage.getItem("auth_user");
    if (saved) {
      setUser(JSON.parse(saved));
      setLoading(false);
    } else {
      // Gọi API kiểm tra trạng thái đăng nhập từ backend
      fetch("http://localhost:5000/api/hr/check", {
        credentials: "include",
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem("auth_user", JSON.stringify(data.user));
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, []);

  // Đăng nhập
  const login = async ({ email, password }) => {
    const res = await fetch("http://localhost:5000/api/hr/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setUser({ ...data.user });
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  };

  // Đăng xuất
  const logout = async () => {
    await fetch("http://localhost:5000/api/hr/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  // Làm mới trạng thái đăng nhập (ví dụ sau khi xác thực email)
  const refresh = async () => {
    setLoading(true);
    fetch("http://localhost:5000/api/hr/check", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        } else {
          setUser(null);
          localStorage.removeItem("auth_user");
        }
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
        localStorage.removeItem("auth_user");
      });
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, logout, refresh, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook sử dụng AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}