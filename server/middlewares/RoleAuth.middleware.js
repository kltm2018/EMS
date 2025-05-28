// Middleware kiểm tra quyền người dùng (case-insensitive + hỗ trợ array hoặc spread)
export const RoleAuthorization = (...allowedRoles) => {
  // Nếu truyền vào mảng duy nhất thì lấy phần tử trong mảng đó
  let flatRoles = allowedRoles.flat();
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: 'Không xác định được vai trò người dùng'
      });
    }

    // So sánh không phân biệt hoa thường
    const isAllowed = flatRoles
      .map(r => r.toLowerCase())
      .includes(userRole.toLowerCase());

    if (!isAllowed) {
      // (Có thể log lại ở đây nếu cần)
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập chức năng này (vai trò yêu cầu: ${flatRoles.join(', ')})`
      });
    }

    next();
  };
};