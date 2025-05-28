const bcrypt = require('bcrypt');

async function hashPassword() {
  const plainPassword = 'Password123'; // Thay đổi thành mật khẩu bạn muốn sử dụng
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  console.log('Hashed password:', hashedPassword);
}

hashPassword();