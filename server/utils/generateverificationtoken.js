// Sinh mã xác thực ngẫu nhiên với độ dài cụ thể, chỉ gồm chữ hoa và số
export const GenerateVerificationToken = (length = 6) => {
  // Đảm bảo length là số dương, tối thiểu 1 và tối đa 32 ký tự
  const tokenLength = Math.max(1, Math.min(Number(length) || 6, 32));
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';

  for (let i = 0; i < tokenLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters[randomIndex];
  }

  return token;
};