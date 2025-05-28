# Hệ thống Quản lý Nhân viên (EMS)

Hệ thống Quản lý Nhân viên (Employee Management System - EMS) là một ứng dụng web toàn diện được phát triển để giúp các tổ chức quản lý hiệu quả nguồn nhân lực của họ. Hệ thống được xây dựng với các tính năng bảo mật cao, đặc biệt chú trọng đến việc bảo vệ dữ liệu nhạy cảm như thông tin lương và mã số thuế.

## Mục lục

1. [Tổng quan hệ thống](#tổng-quan-hệ-thống)
2. [Cài đặt và thiết lập](#cài-đặt-và-thiết-lập)
3. [Các vai trò người dùng](#các-vai-trò-người-dùng)
4. [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
   - [Đăng nhập và xác thực](#đăng-nhập-và-xác-thực)
   - [Quản lý nhân viên](#quản-lý-nhân-viên)
   - [Quản lý phòng ban](#quản-lý-phòng-ban)
   - [Quản lý lương và chế độ](#quản-lý-lương-và-chế-độ)
   - [Quản lý kỷ luật và thôi việc](#quản-lý-kỷ-luật-và-thôi-việc)
   - [Báo cáo và giám sát](#báo-cáo-và-giám-sát)
5. [Tính năng bảo mật](#tính-năng-bảo-mật)
6. [Xử lý sự cố](#xử-lý-sự-cố)
7. [Phát triển và mở rộng](#phát-triển-và-mở-rộng)

## Tổng quan hệ thống

Hệ thống Quản lý Nhân viên (EMS) được xây dựng trên nền tảng web hiện đại với:

- **Frontend**: ReactJS, Bootstrap
- **Backend**: NodeJS, Express
- **Cơ sở dữ liệu**: SQL Server
- **Xác thực**: JWT (JSON Web Tokens)

Hệ thống hỗ trợ nhiều vai trò người dùng khác nhau, mỗi vai trò có quyền truy cập và thao tác khác nhau:

- **Nhân viên**: Xem thông tin cá nhân, thông tin cơ bản về lương
- **Nhân viên HR**: Quản lý thông tin nhân viên, phòng ban, kỷ luật và thôi việc
- **Kế toán**: Xem và quản lý thông tin lương, thuế
- **Quản trị viên**: Quản lý toàn bộ hệ thống, phân quyền và giám sát

## Cài đặt và thiết lập

### Yêu cầu hệ thống

- Node.js (v14.0.0 trở lên)
- SQL Server (2016 trở lên)
- Trình duyệt web hiện đại (Chrome, Firefox, Edge)

### Cài đặt

1. **Clone dự án từ repository**:
   ```
   git clone <repository-url>
   ```

2. **Cài đặt các dependencies cho backend**:
   ```
   cd server
   npm install
   ```

3. **Cài đặt các dependencies cho frontend**:
   ```
   cd client
   npm install
   ```

4. **Thiết lập cơ sở dữ liệu**:
   - Tạo cơ sở dữ liệu mới trong SQL Server
   - Chạy script `employee_management_demo.sql` để tạo các bảng và dữ liệu mẫu
   - Thiết lập Symmetric Key cho mã hóa dữ liệu:
     ```sql
     CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'YourStrongPassword123!';
     CREATE CERTIFICATE EmpCert WITH SUBJECT = 'Employee Data Protection';
     CREATE SYMMETRIC KEY SymKey_Emp WITH ALGORITHM = AES_256 ENCRYPTION BY CERTIFICATE EmpCert;
     ```

5. **Cấu hình môi trường**:
   - Tạo file `.env` trong thư mục `server` với nội dung:
     ```
     PORT=5000
     JWT_SECRET=your_jwt_secret_key
     JWT_EXPIRES_IN=24h
     
     # SQL Server Configuration
     DB_HOST=localhost\SQLEXPRESS
     DB_USER=your_db_username
     DB_PASSWORD=your_db_password
     DB_NAME=employee_management_demo
     ```

6. **Khởi động ứng dụng**:
   - Khởi động backend:
     ```
     cd server
     npm start
     ```
   - Khởi động frontend:
     ```
     cd client
     npm start
     ```

7. **Truy cập ứng dụng**:
   - Mở trình duyệt và truy cập: `http://localhost:3000`

## Các vai trò người dùng

Hệ thống hỗ trợ các vai trò người dùng sau:

### 1. Nhân viên (Employee)

- Xem thông tin cá nhân
- Xem thông tin cơ bản về lương (không bao gồm thông tin nhạy cảm)
- Cập nhật một số thông tin cá nhân

### 2. Nhân viên HR (Human Resources)

- Tất cả quyền của Nhân viên
- Quản lý thông tin nhân viên (thêm, sửa, xóa)
- Quản lý phòng ban
- Quản lý kỷ luật và thôi việc
- Xem báo cáo audit

### 3. Kế toán (Accountant)

- Tất cả quyền của Nhân viên
- Xem thông tin lương đã giải mã
- Xem mã số thuế đã giải mã
- Tính lương tháng cho nhân viên

### 4. Quản trị viên (Admin)

- Tất cả quyền của HR và Kế toán
- Quản lý người dùng và phân quyền
- Xem và quản lý audit logs
- Cấu hình hệ thống

## Hướng dẫn sử dụng

### Đăng nhập và xác thực

1. **Đăng nhập**:
   - Truy cập trang đăng nhập: `http://localhost:3000/login`
   - Nhập email và mật khẩu
   - Nhấn nút "Đăng nhập"

2. **Đăng ký tài khoản** (nếu được cho phép):
   - Truy cập trang đăng ký: `http://localhost:3000/register`
   - Điền đầy đủ thông tin theo yêu cầu
   - Nhấn nút "Đăng ký"

3. **Đổi mật khẩu**:
   - Đăng nhập vào hệ thống
   - Truy cập trang cá nhân
   - Chọn "Đổi mật khẩu"
   - Nhập mật khẩu cũ và mật khẩu mới
   - Nhấn nút "Cập nhật"

### Quản lý nhân viên

#### Xem danh sách nhân viên

1. Đăng nhập với quyền HR hoặc Admin
2. Truy cập menu "Quản lý nhân viên"
3. Xem danh sách nhân viên với các thông tin cơ bản
4. Sử dụng các bộ lọc để tìm kiếm nhân viên theo tên, phòng ban, v.v.

#### Thêm nhân viên mới

1. Đăng nhập với quyền HR hoặc Admin
2. Truy cập menu "Quản lý nhân viên"
3. Nhấn nút "Thêm nhân viên"
4. Điền đầy đủ thông tin nhân viên
5. Nhấn nút "Lưu" để hoàn tất

#### Cập nhật thông tin nhân viên

1. Đăng nhập với quyền HR hoặc Admin
2. Truy cập menu "Quản lý nhân viên"
3. Tìm nhân viên cần cập nhật và nhấn nút "Sửa"
4. Cập nhật thông tin cần thiết
5. Nhấn nút "Lưu" để hoàn tất

### Quản lý phòng ban

#### Xem danh sách phòng ban

1. Đăng nhập với quyền HR hoặc Admin
2. Truy cập menu "Quản lý phòng ban"
3. Xem danh sách phòng ban với các thông tin cơ bản

#### Thêm phòng ban mới

1. Đăng nhập với quyền HR hoặc Admin
2. Truy cập menu "Quản lý phòng ban"
3. Nhấn nút "Thêm phòng ban"
4. Điền tên và mô tả phòng ban
5. Chọn tổ chức
6. Nhấn nút "Lưu" để hoàn tất

#### Chuyển nhân viên giữa các phòng ban

1. Đăng nhập với quyền HR hoặc Admin
2. Truy cập menu "Quản lý phòng ban"
3. Chọn phòng ban hiện tại của nhân viên
4. Tìm nhân viên cần chuyển và nhấn nút "Chuyển phòng ban"
5. Chọn phòng ban mới
6. Nhấn nút "Lưu" để hoàn tất

### Quản lý lương và chế độ

#### Xem thông tin lương

1. Đăng nhập với quyền Kế toán hoặc HR
2. Truy cập menu "Quản lý lương"
3. Tìm nhân viên cần xem thông tin lương
4. Nhấn vào tên nhân viên để xem chi tiết

#### Cập nhật thông tin lương

1. Đăng nhập với quyền HR
2. Truy cập menu "Quản lý lương"
3. Tìm nhân viên cần cập nhật lương
4. Nhấn nút "Cập nhật lương"
5. Điền thông tin lương mới
6. Nhấn nút "Lưu" để hoàn tất

#### Tính lương tháng

1. Đăng nhập với quyền Kế toán hoặc HR
2. Truy cập menu "Quản lý lương"
3. Nhấn nút "Tính lương tháng"
4. Chọn tháng và năm cần tính lương
5. Nhấn nút "Tính lương" để thực hiện
6. Xem kết quả tính lương cho tất cả nhân viên

### Quản lý kỷ luật và thôi việc

#### Quản lý kỷ luật

1. Đăng nhập với quyền HR
2. Truy cập menu "Quản lý kỷ luật"
3. Xem danh sách kỷ luật hiện có
4. Thêm kỷ luật mới bằng cách nhấn nút "Thêm kỷ luật"
5. Điền thông tin kỷ luật và nhấn "Lưu"

#### Quản lý thôi việc

1. Đăng nhập với quyền HR
2. Truy cập menu "Quản lý thôi việc"
3. Xem danh sách nhân viên đã thôi việc
4. Thêm thôi việc mới bằng cách nhấn nút "Thêm thôi việc"
5. Chọn nhân viên, nhập lý do và ngày thôi việc
6. Nhấn nút "Lưu" để hoàn tất

### Báo cáo và giám sát

#### Xem audit logs

1. Đăng nhập với quyền HR hoặc Admin
2. Truy cập menu "Audit Logs"
3. Xem danh sách các hoạt động trong hệ thống
4. Sử dụng bộ lọc để tìm kiếm theo người dùng, loại hành động, v.v.
5. Xuất báo cáo dưới dạng CSV nếu cần

## Tính năng bảo mật

Hệ thống EMS được trang bị nhiều tính năng bảo mật để bảo vệ dữ liệu nhạy cảm:

### 1. Xác thực và quản lý định danh

- Sử dụng JWT (JSON Web Tokens) cho xác thực
- Mật khẩu được mã hóa bằng bcrypt
- Phiên làm việc có thời hạn

### 2. Kiểm soát truy cập

- Phân quyền theo vai trò (RBAC)
- Kiểm soát truy cập chi tiết đến từng đối tượng
- Row-Level Security cho dữ liệu nhạy cảm

### 3. Mã hóa dữ liệu

- Mã hóa thông tin lương và mã số thuế bằng Symmetric Key trong SQL Server
- Chỉ người dùng có quyền mới có thể xem dữ liệu đã giải mã
- Sử dụng các view bảo mật để kiểm soát truy cập dữ liệu

### 4. Ghi log và giám sát

- Ghi lại tất cả các hoạt động quan trọng trong hệ thống
- Audit logs chi tiết với thông tin người dùng, hành động, thời gian
- Khả năng xuất báo cáo audit để phân tích

## Xử lý sự cố

### Lỗi kết nối cơ sở dữ liệu

1. Kiểm tra thông tin kết nối trong file `.env`
2. Đảm bảo SQL Server đang chạy
3. Kiểm tra tường lửa và cấu hình mạng
4. Xác minh tài khoản SQL Server có quyền truy cập cơ sở dữ liệu

### Lỗi đăng nhập

1. Kiểm tra email và mật khẩu
2. Đảm bảo tài khoản chưa bị khóa
3. Xóa cache trình duyệt và thử lại
4. Liên hệ quản trị viên nếu vẫn gặp vấn đề

### Lỗi khi xem thông tin lương

1. Kiểm tra quyền truy cập của tài khoản
2. Đảm bảo Symmetric Key đã được tạo và mở đúng cách
3. Kiểm tra xem dữ liệu lương đã được mã hóa đúng cách chưa

## Phát triển và mở rộng

### Thêm tính năng mới

Hệ thống được thiết kế theo kiến trúc module, cho phép dễ dàng thêm các tính năng mới:

1. Tạo route mới trong thư mục `server/routes`
2. Tạo controller mới trong thư mục `server/controllers`
3. Thêm component React mới trong thư mục `client/src/components`
4. Cập nhật menu và routing

### Tùy chỉnh giao diện

1. Các file CSS và SCSS được tổ chức trong thư mục `client/src/styles`
2. Thay đổi theme chính trong file `client/src/styles/variables.scss`
3. Tùy chỉnh component trong thư mục tương ứng

### Nâng cấp bảo mật

1. Cập nhật các dependencies thường xuyên
2. Thêm các lớp bảo mật bổ sung như 2FA
3. Tăng cường mã hóa dữ liệu với các thuật toán mạnh hơn

---

© 2025 Hệ thống Quản lý Nhân viên (EMS) | Phiên bản 1.0
