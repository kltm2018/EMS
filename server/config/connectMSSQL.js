import sql from 'mssql';

const config = {
  user: 'ems_user',
  password: 'StrongPassword123!',
  server: 'localhost',       // hoặc địa chỉ SQL Server
  database: 'employee_management_demo',
  options: {
    encrypt: false,          // true nếu dùng Azure
    trustServerCertificate: true
  },
  instanceName: 'SQLEXPRESS'
};

export async function connectMSSQL() {
  try {
    await sql.connect(config);
    console.log('Connected to SQL Server');
  } catch (err) {
    console.error('SQL Server connection error:', err);
  }
}

export { sql };