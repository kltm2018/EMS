import * as React from "react"

// Cấu trúc user mẫu: { id, email, role, organization_id, ... }
const AuthContext = React.createContext()

export function AuthProvider({ children }) {
  // user: null nếu chưa đăng nhập, object nếu đã đăng nhập
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  // Khi khởi tạo: thử lấy trạng thái đăng nhập từ localStorage hoặc gọi API
  React.useEffect(() => {
    // Ưu tiên lấy từ localStorage cho nhanh (nếu có)
    const savedUser = localStorage.getItem("auth_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setLoading(false)
    } else {
      // Có thể gọi API /api/hr/check hoặc /api/employee/check tùy theo hệ thống backend
      fetch("http://localhost:5000/api/hr/check", {
        credentials: "include",
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.user) {
            setUser(data.user)
            localStorage.setItem("auth_user", JSON.stringify(data.user))
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [])

  // Hàm đăng nhập
  const login = async ({ email, password }) => {
    // Đổi endpoint nếu là employee
    const res = await fetch("http://localhost:5000/api/hr/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    })
    const data = await res.json()
    if (res.ok && data.success) {
      // Chỉnh lại các trường nếu backend trả kiểu khác
      setUser({ ...data.user })
      localStorage.setItem("auth_user", JSON.stringify(data.user))
      return { success: true }
    } else {
      return { success: false, message: data.message }
    }
  }

  // Hàm đăng xuất
  const logout = async () => {
    await fetch("http://localhost:5000/api/hr/logout", {
      method: "POST",
      credentials: "include",
    })
    setUser(null)
    localStorage.removeItem("auth_user")
  }

  // Hàm check xác thực lại, dùng sau khi đổi mật khẩu, xác thực email, v.v.
  const refresh = async () => {
    setLoading(true)
    fetch("http://localhost:5000/api/hr/check", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.user) {
          setUser(data.user)
          localStorage.setItem("auth_user", JSON.stringify(data.user))
        } else {
          setUser(null)
          localStorage.removeItem("auth_user")
        }
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
        localStorage.removeItem("auth_user")
      })
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, refresh, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook sử dụng AuthContext, đồng bộ với style của use-toast, use-mobile
export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}