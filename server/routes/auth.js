const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, isHR } = require('../middleware/auth');

// Đăng nhập
router.post('/login', authController.login);

// Đăng ký công khai cho nhân viên (không yêu cầu xác thực)
router.post('/public-register-employee', authController.publicRegisterEmployee);

// Đăng ký tài khoản HR (chỉ HR-Admin mới có quyền)
router.post('/register-hr', authenticateToken, isHR, authController.registerHR);

// Đăng ký tài khoản nhân viên (chỉ HR mới có quyền)
router.post('/register-employee', authenticateToken, isHR, authController.registerEmployee);

// Đăng ký tài khoản kế toán (chỉ HR-Admin mới có quyền)
router.post('/register-accountant', authenticateToken, isHR, authController.registerAccountant);

// Lấy thông tin người dùng hiện tại
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
