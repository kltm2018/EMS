const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection } = require('./config/db');

// Cấu hình môi trường
dotenv.config();

// Khởi tạo Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kiểm tra kết nối database
testConnection();

// Routes
app.use('/api/auth', require('./routes/auth'));

// Route mặc định
app.get('/', (req, res) => {
  res.json({ message: 'EMS API Server đang chạy' });
});

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
