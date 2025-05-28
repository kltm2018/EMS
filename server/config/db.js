const mssql = require('mssql');
require('dotenv').config();

// Cấu hình kết nối SQL Server
const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_HOST,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // Đối với Azure, sử dụng true
    trustServerCertificate: true // Thay đổi thành false nếu sử dụng chứng chỉ SSL
  }
};

// Tạo pool connection để kết nối với SQL Server
const pool = new mssql.ConnectionPool(sqlConfig);
const poolConnect = pool.connect();

// Kiểm tra kết nối
const testConnection = async () => {
  try {
    await poolConnect;
    console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  poolConnect,
  testConnection
};
