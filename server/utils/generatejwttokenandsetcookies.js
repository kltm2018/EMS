import jwt from 'jsonwebtoken';

/**
 * Sinh JWT và gán cookie cho HR
 * @param {object} res - Đối tượng response Express
 * @param {string|number} hrId - ID HR
 * @param {string} hrRole - Vai trò HR
 * @param {string|number} organizationId - ID tổ chức
 * @param {object} [options] - Tuỳ chọn mở rộng (ví dụ: maxAge)
 */
export const GenerateJwtTokenAndSetCookiesHR = (
  res,
  hrId,
  hrRole,
  organizationId,
  options = {}
) => {
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET chưa được cấu hình!');
    throw new Error('Server config error');
  }
  if (!res || !hrId || !hrRole || !organizationId) {
    throw new Error('Thiếu tham số khi tạo JWT cho HR');
  }

  const token = jwt.sign(
    {
      id: hrId,
      role: hrRole,
      organization_id: organizationId,
    },
    process.env.JWT_SECRET,
    { expiresIn: options.expiresIn || '7d' }
  );

  res.cookie('hr_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: options.maxAge || 7 * 24 * 60 * 60 * 1000, // 7 ngày
    ...options.cookieOptions,
  });
};

/**
 * Sinh JWT và gán cookie cho Employee
 * @param {object} res - Đối tượng response Express
 * @param {string|number} empId - ID Employee
 * @param {string} email - Email Employee
 * @param {string|number} organizationId - ID tổ chức
 * @param {object} [options] - Tuỳ chọn mở rộng (ví dụ: role, maxAge)
 */
export const GenerateJwtTokenAndSetCookiesEmployee = (
  res,
  empId,
  email,
  organizationId,
  options = {}
) => {
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET chưa được cấu hình!');
    throw new Error('Server config error');
  }
  if (!res || !empId || !email || !organizationId) {
    throw new Error('Thiếu tham số khi tạo JWT cho Employee');
  }

  const token = jwt.sign(
    {
      id: empId,
      email,
      role: options.role || 'Employee',
      organization_id: organizationId,
    },
    process.env.JWT_SECRET,
    { expiresIn: options.expiresIn || '7d' }
  );

  res.cookie('employee_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: options.maxAge || 7 * 24 * 60 * 60 * 1000,
    ...options.cookieOptions,
  });
};