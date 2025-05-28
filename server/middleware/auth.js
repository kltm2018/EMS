const jwt = require('jsonwebtoken');
const { pool, poolConnect } = require('../config/db');
const mssql = require('mssql');

// Middleware để xác thực token JWT
const authenticateToken = async (req, res, next) => {
  try {
    await poolConnect; // Đảm bảo kết nối đã được thiết lập
    
    // Lấy token từ header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
    }

    // Xác thực token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
      }
      
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Lỗi xác thực:', error);
    res.status(500).json({ message: 'Lỗi server khi xác thực' });
  }
};

// Middleware kiểm tra vai trò HR
const isHR = async (req, res, next) => {
  try {
    if (req.user.role !== 'HR-Admin' && req.user.role !== 'HR-Staff') {
      return res.status(403).json({ message: 'Không có quyền truy cập. Yêu cầu vai trò HR.' });
    }
    next();
  } catch (error) {
    console.error('Lỗi kiểm tra vai trò:', error);
    res.status(500).json({ message: 'Lỗi server khi kiểm tra vai trò' });
  }
};

// Middleware kiểm tra vai trò Accountant
const isAccountant = async (req, res, next) => {
  try {
    if (req.user.role !== 'Accountant') {
      return res.status(403).json({ message: 'Không có quyền truy cập. Yêu cầu vai trò Accountant.' });
    }
    next();
  } catch (error) {
    console.error('Lỗi kiểm tra vai trò:', error);
    res.status(500).json({ message: 'Lỗi server khi kiểm tra vai trò' });
  }
};

// Middleware kiểm tra vai trò Employee
const isEmployee = async (req, res, next) => {
  try {
    if (req.user.role !== 'Employee') {
      return res.status(403).json({ message: 'Không có quyền truy cập. Yêu cầu vai trò Employee.' });
    }
    next();
  } catch (error) {
    console.error('Lỗi kiểm tra vai trò:', error);
    res.status(500).json({ message: 'Lỗi server khi kiểm tra vai trò' });
  }
};

module.exports = {
  authenticateToken,
  isHR,
  isAccountant,
  isEmployee
};
