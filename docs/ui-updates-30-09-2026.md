# Ghi chép Cập nhật Giao diện (30/09/2026)

Tài liệu này ghi nhận các thay đổi, tối ưu hóa và liên kết dữ liệu thực tế cho giao diện Học sinh (Student Dashboard & Timetable) được thực hiện trong phiên làm việc.

## 1. Thời khóa biểu - Checklist Chuẩn bị Ngày mai (`TimetableSidebar.tsx`)
- **Loại bỏ dữ liệu tĩnh (hardcode)**: Không còn sử dụng danh sách các môn mặc định (Toán, Hóa, Sinh...).
- **Tính toán động (Dynamic computation)**: Tự động tính toán xem ngày mai là thứ mấy, từ đó quét trong lịch học (`slots`) để lấy ra danh sách các tiết học của ngày mai.
- **Tương tác**: Cho phép người dùng click đánh dấu hoàn thành (✅) vào checklist cho từng môn học.
- **Trạng thái rỗng**: Nếu ngày mai không có lịch học, hiển thị thông báo "Ngày mai bạn được nghỉ ngơi!".

## 2. Thời khóa biểu - Điều hướng Tuần học (`TimetablePage.tsx` & `TimetableHeader.tsx`)
- **State `weekOffset`**: Thêm biến trạng thái để theo dõi số tuần thay đổi so với tuần hiện tại.
- **Nút tiến/lùi**: Liên kết 2 nút Trái/Phải ở thanh công cụ để dịch chuyển tuần (lùi 1 tuần hoặc tiến 1 tuần).
- **Tiêu đề thông minh**: Chuyển đổi nhãn hiển thị linh hoạt: "Tuần trước", "Tuần này", "Tuần sau", "Tuần tới (+2)"...
- **Đồng bộ cột ngày tháng**: Các cột Thứ Hai đến Chủ Nhật trên lưới thời khóa biểu sẽ tự động dịch chuyển ngày (ví dụ `28/09`) tương ứng với tuần đang được chọn.

## 3. Thời khóa biểu - Chú thích Môn học (`TimetablePage.tsx`)
- **Thu thập danh sách môn tự động**: Quét toàn bộ `slots` của Thời khóa biểu để lọc ra danh sách các môn học độc nhất (unique subjects).
- **Bảng màu động**: Các môn học thực tế có trong TKB của học sinh mới được hiển thị dưới phần chú thích (Legend). Hệ thống tự động gán màu (Toán -> Xanh dương, Hóa -> Cam...) bằng hàm `getSubjectColorClass`.

## 4. Bảng điều khiển (Dashboard) - Đồng bộ Dữ liệu Người dùng
- **Trang chủ (`DashboardPage.tsx`)**: 
  - Gọi `getStoredSession()` để lấy phiên đăng nhập.
  - Thay đổi câu chào mặc định thành: `Chào buổi sáng, {fullName}! 👋` dựa trên tên thật của học sinh.
- **Thanh điều hướng (`StudentHeader.tsx`)**:
  - Tích hợp API `getMyStudentProfile()` để lấy dữ liệu hồ sơ chi tiết.
  - Cập nhật Tên học sinh, Lớp học và Trường học (`className`, `schoolName`).
  - Cập nhật số điểm kinh nghiệm (XP) và Chuỗi ngày học (Streak) trực tiếp từ database thay vì dữ liệu tĩnh.

---
**Trạng thái**: Đã hoàn thành và triển khai lên Docker (Frontend Container Rebuilt).
