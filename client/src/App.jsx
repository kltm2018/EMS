import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Dashboard Component (placeholder)
const Dashboard = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="dashboard">
      <header>
        <h1>EMS Dashboard</h1>
        <div className="user-info">
          <span>Xin chào, {user?.firstname} {user?.lastname}</span>
          <button onClick={logout}>Đăng xuất</button>
        </div>
      </header>
      <main>
        <h2>Chào mừng đến với Hệ thống Quản lý Nhân viên</h2>
        <p>Vai trò của bạn: {user?.role}</p>
        <div className="dashboard-content">
          <p>Nội dung dashboard sẽ được hiển thị ở đây.</p>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
