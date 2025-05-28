require('dotenv').config();

module.exports = {
  development: {
    dialect: process.env.DB_DIALECT || 'mssql',
    dialectModule: require('tedious'),
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 1433,
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    dialectOptions: {
      instanceName: process.env.DB_INSTANCE,
      options: {
        encrypt: true,
        trustServerCertificate: true
      }
    }
  }
};
