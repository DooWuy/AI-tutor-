# Issue 53 - Student Profile Epic

## Mục tiêu

Chuẩn hóa nghiệp vụ hồ sơ học sinh theo SRS MVP và codebase hiện tại, nhưng không mở rộng quá phạm vi demo. Epic này được tách thành các issue con để team implement lần lượt, tránh trộn profile, bảo mật, dashboard và notification vào cùng một task.

## Nguyên tắc phạm vi

- MVP chỉ tập trung vào học sinh xem và cập nhật hồ sơ cá nhân được phép.
- Email đăng nhập thuộc `User`, không cập nhật qua profile học sinh.
- `students.email` hiện có trong database được xem là legacy/deprecated trong MVP. Không xóa column ngay để tránh rủi ro migration và lỗi server.
- Endpoint frontend học sinh nên dùng theo dạng `/students/me`, không truyền `userId` từ client.
- Các endpoint `/users/{id}` hiện có vẫn giữ cho Admin và tương thích tạm thời.
- XP, level, streak chỉ hiển thị, không cho học sinh sửa.
- Notification preferences không thuộc MVP hiện tại.

## Issue 53.1 - Student Profile API: Xem hồ sơ của chính mình

### Mục tiêu

Cho phép học sinh đăng nhập xem hồ sơ cá nhân của chính mình mà không cần truyền `userId` từ client.

### API đề xuất

- `GET /api/v1/students/me`
- Chỉ role `STUDENT` được gọi.
- Backend xác định tài khoản từ JWT/session hiện tại.

### Response data

Trả về dữ liệu tổng hợp từ `User` và `Student`.

Read-only:

- `userId`
- `studentId`
- `studentCode`
- `username`
- `email` lấy từ `User.email`
- `schoolName`
- `totalXp`
- `currentLevel`
- `currentStreak`

Editable fields hiển thị để FE render form:

- `fullName`
- `dateOfBirth`
- `gender`
- `phoneNumber`
- `avatarUrl`
- `gradeLevel`
- `className`
- `studyPreferences`

### Acceptance Criteria

- [x] Student gọi API nhận đúng hồ sơ của chính mình.
- [x] Không nhận `userId`/`studentId` từ request.
- [x] User không phải `STUDENT` bị từ chối theo rule phân quyền.
- [x] Nếu tài khoản student chưa có bản ghi `Student`, trả lỗi nghiệp vụ rõ ràng.
- [x] Response không lấy email từ `students.email`.

### Trạng thái triển khai và kiểm chứng

- [x] `StudentProfileController` và service current-user đã được triển khai.
- [x] `GET /api/v1/students/me` compile thành công và đã kiểm chứng runtime qua Docker.
- [x] Runtime kiểm chứng: không token trả `401`; Student hợp lệ trả `200` và đúng profile.
- [ ] Kiểm thử HTTP tự động trong CI chưa được thêm.

## Issue 53.2 - Student Profile API: Cập nhật hồ sơ được phép

### Mục tiêu

Cho phép học sinh cập nhật các trường hồ sơ cá nhân được phép, đồng thời bảo vệ các trường định danh và tiến độ học tập.

### API đề xuất

- `PATCH /api/v1/students/me`
- Chỉ role `STUDENT`.
- Cập nhật `User` và `Student` trong cùng transaction.

### Trường được cập nhật

- `fullName`
- `dateOfBirth`
- `gender`
- `phoneNumber`
- `gradeLevel`
- `className`
- `studyPreferences`

### Trường không được cập nhật

- `userId`
- `studentId`
- `studentCode`
- `username`
- `email`
- `role`
- `active` / trạng thái tài khoản
- `schoolName`
- `totalXp`
- `currentLevel`
- `currentStreak`

### Validation

- `fullName`: không rỗng sau trim, tối đa 255 ký tự.
- `dateOfBirth`: không được ở tương lai.
- `gender`: `MALE`, `FEMALE`, `OTHER`.
- `phoneNumber`: tùy chọn, theo regex số điện thoại Việt Nam hiện có của dự án.
- `gradeLevel`: nếu gửi lên thì không rỗng, tối đa 32 ký tự.
- `className`: tùy chọn, tối đa 64 ký tự.
- `studyPreferences`: JSON object tối đa 8 KB; chỉ chứa primitive hoặc mảng primitive, không nhận object lồng tùy ý.
- Field không xuất hiện trong PATCH được giữ nguyên.
- Chuỗi rỗng cho field tùy chọn được chuẩn hóa thành `null`.

### Acceptance Criteria

- [x] Student cập nhật được các field trong danh sách cho phép (runtime Docker trả `200`).
- [x] Các field read-only nếu gửi lên bị từ chối với lỗi `400` rõ ràng theo code allowlist.
- [x] Update chạy trong cùng transaction cho `User` và `Student`.
- [x] Response sau update trả về cùng shape với `GET /students/me` theo code mapping.
- [x] Không ghi hoặc cập nhật `students.email`.

### Trạng thái triển khai và kiểm chứng

- [x] Thêm `PATCH /api/v1/students/me` với DTO allowlist và PATCH presence-aware.
- [x] Chuẩn hóa chuỗi tùy chọn rỗng thành `null`; field không gửi được giữ nguyên.
- [x] Validate ngày sinh, số điện thoại, độ dài tên/khối/lớp và `studyPreferences`.
- [x] `./gradlew clean compileJava --no-daemon` đã pass.
- [x] Runtime Docker đã kiểm chứng PATCH `200`, GET sau PATCH giữ dữ liệu, field `email` trả `400`.

## Issue 53.3 - Student Avatar Upload

### Mục tiêu

Cho phép học sinh cập nhật ảnh đại diện của chính mình qua endpoint không cần truyền user id.

### API đề xuất

- `POST /api/v1/students/me/avatar`
- `multipart/form-data`
- Field file: `file`
- Chỉ role `STUDENT`.

### Validation

- File không rỗng.
- Chỉ chấp nhận JPEG, PNG hoặc WebP.
- Tối đa 5 MB.
- Kiểm tra MIME type, phần mở rộng và chữ ký file.
- Cloudinary upload với `resource_type=image`.

### Acceptance Criteria

- [x] Upload thành công trả về profile response có `avatarUrl` mới; runtime Cloudinary đã trả `200`.
- [x] `User.avatarUrl` được cập nhật theo transaction sau upload thành công.
- [x] File sai định dạng/kích thước/MIME/signature trả lỗi validation rõ ràng; runtime file text giả đã trả `400`.
- [x] Không nhận user id; quyền current-user được bảo vệ bằng `ROLE_STUDENT`.

### Trạng thái triển khai và kiểm chứng

- [x] Thêm `POST /api/v1/students/me/avatar` với multipart field `file`.
- [x] Tái sử dụng `AvatarUploadValidator` và Cloudinary `resource_type=image`.
- [x] Endpoint chỉ cho `ROLE_STUDENT` và không nhận user id.
- [x] `AvatarUploadValidatorTest` đã pass.
- [x] Upload Cloudinary HTTP đã kiểm chứng với credential trong `.env.example`.

## Issue 53.4 - Frontend Student Profile Integration

### Mục tiêu

Chuyển màn hình `Student/Profile/ProfilePage.tsx` từ dữ liệu mock/local state sang dùng API profile thật.

### Phạm vi FE

- Tạo service `studentProfileApi`.
- Tạo type cho `StudentProfile`.
- Khi vào `/student/profile`, gọi `GET /api/v1/students/me`.
- Form edit dùng `PATCH /api/v1/students/me`.
- Avatar dùng `POST /api/v1/students/me/avatar`.
- Hiển thị loading, error, empty state cơ bản.
- Phân biệt rõ read-only và editable fields trên UI.

### Acceptance Criteria

- [x] Trang Profile gọi profile thật từ backend khi mở.
- [x] Lưu thay đổi gọi PATCH và render lại dữ liệu mới trong state.
- [x] Read-only fields không có input chỉnh sửa.
- [x] Lỗi API được hiển thị trong trạng thái lỗi của trang.
- [x] Profile chính không còn hard-code `Nguyễn Văn An`, `hocsinh@example.com`, XP/streak mock.

### Trạng thái triển khai và kiểm chứng

- [x] Thêm `studentProfileApi` và type `StudentProfile`.
- [x] Thêm loading, error, saving, upload và empty/error recovery states.
- [x] `npm run build` đã pass (`tsc -b` và `vite build`).
- [x] Dev server phục vụ ứng dụng tại `http://localhost:5173/`.
- [x] Docker FE tại `http://localhost:3000` đã login và upload avatar qua nginx proxy trả `200`.
- [ ] Kiểm thử thao tác UI bằng trình duyệt với phiên đăng nhập thật chưa được tự động hóa.

## Issue 53.5 - Change Password & Security

### Mục tiêu

Tách đổi mật khẩu khỏi profile update để không làm scope profile bị phình.

### API hiện có

- `POST /api/v1/users/change-password`

### Phạm vi

- FE có thể thêm section/tab Bảo mật sau khi profile core hoàn tất.
- Request gồm mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới.
- Backend kiểm tra mật khẩu hiện tại, độ khớp confirm password và encode password mới.

### Acceptance Criteria

- [x] Form gọi `POST /api/v1/users/change-password` với mật khẩu hiện tại, mới và xác nhận.
- [x] Mật khẩu mới và xác nhận phải khớp trước khi gửi request.
- [x] Lỗi backend và lỗi nhập liệu được hiển thị rõ ràng.
- [x] Không ghi hoặc log mật khẩu trong frontend.

### Trạng thái triển khai và kiểm chứng

- [x] Thêm khu vực Bảo mật trong trang Student Profile.
- [x] Dùng `credentials: include` để giữ cookie phiên HttpOnly.
- [x] Khu vực bảo mật mở khi bấm chỉnh sửa hồ sơ và có nút hiện/ẩn cho cả ba ô mật khẩu.
- [x] `npm run build` đã pass.
- [x] HTTP đổi mật khẩu đã kiểm chứng `200` với tài khoản test và đã khôi phục mật khẩu ban đầu.

## Issue 53.6 - Profile Summary Stats / Dashboard Link

### Mục tiêu

Hiển thị thông tin tiến độ học tập ở mức MVP, không xây hệ thống achievement nâng cao trong issue profile.

### Phạm vi MVP

- Hiển thị `totalXp`.
- Hiển thị `currentLevel`.
- Hiển thị `currentStreak`.
- Có thể link sang dashboard học sinh nếu cần xem chi tiết.

### Ngoài phạm vi issue này

- Badge system.
- Biểu đồ thành tích nâng cao.
- Tổng giờ học từ nhiều module.
- Notification worker.

### Acceptance Criteria

- [x] Profile hiển thị `totalXp`, `currentLevel`, `currentStreak` từ API.
- [x] Student không có input chỉnh sửa các giá trị này.
- [x] Giá trị mặc định `0/1/0` được hiển thị an toàn khi backend trả dữ liệu mặc định.

### Trạng thái triển khai và kiểm chứng

- [x] Thêm ba summary cards theo bảng màu Fidelity Modern.
- [x] Thêm link `Mở tổng quan` tới `/student/dashboard`.
- [x] `npm run build` đã pass.

## Backlog sau MVP - Notification Preferences

Phần cài đặt thông báo cá nhân chưa đưa vào MVP vì SRS hiện xem nhắc lịch qua push/email là ngoài phạm vi. Chỉ mở lại khi team đã hoàn thành các luồng Must Have.

### Ý tưởng sau MVP

- Bật/tắt nhắc lịch học.
- Bật/tắt thông báo AI Tutor.
- Bật/tắt báo cáo tuần.
- Chọn kênh nhận thông báo.
- Worker xử lý lịch gửi thông báo.

## Ghi chú kỹ thuật cho Backend

- Nên thêm `StudentController` thay vì mở rộng thêm logic vào `UserController`.
- Nên thêm DTO riêng:
    - `StudentProfileResponse`
    - `StudentProfileUpdateRequest`
- Service nên có method riêng cho current student, ví dụ:
    - `getMyStudentProfile()`
    - `updateMyStudentProfile(request)`
    - `uploadMyAvatar(file)`
- Không xóa ngay `students.email`; trước mắt chỉ không dùng field này trong profile API.
- Sau khi toàn bộ code không còn dùng `students.email`, có thể tạo migration riêng để drop column nếu team muốn làm sạch schema.

## Mapping với SRS MVP

- `FR-PRO-01`: Hồ sơ học sinh liên kết một-một với tài khoản.
- `FR-PRO-02`: Học sinh xem và cập nhật các trường hồ sơ được cho phép.
- `FR-PRO-03`: Hiển thị tổng XP, cấp độ và streak hiện tại.
- `FR-PRO-04`: Email đăng nhập chỉ lưu tại `User`, không dùng `Student.email` trong profile.
- `US-13`: Cập nhật hồ sơ.

## Review MVP và hướng nâng cấp tiếp theo

### Kết luận hiện tại

Issue 53 đã hoàn thành phạm vi MVP backend và frontend: học sinh xem/cập nhật hồ sơ của chính mình, upload avatar, đổi mật khẩu và xem các chỉ số XP/cấp độ/streak. Các API đã được kiểm chứng qua Docker; frontend đã pass `npm run build`; upload avatar qua FE Docker port `3000` đã trả `200` và lưu URL Cloudinary.

Một mục kiểm thử vẫn mở: chưa có bộ kiểm thử trình duyệt tự động cho các thao tác click, form, upload và responsive layout. Đây là khoảng trống kiểm thử, không phải blocker runtime của MVP.

### Nâng cấp nên đưa vào project

- [ ] **E2E frontend:** thêm Playwright cho login, load profile, PATCH, upload avatar, hiện/ẩn mật khẩu, đổi mật khẩu và kiểm tra mobile/desktop.
- [ ] **Nguồn dữ liệu dùng chung:** tạo `StudentProfileContext` hoặc query cache để header và dashboard dùng cùng profile thật; loại bỏ số XP/streak/lớp đang mock ở `StudentHeader` và `DashboardPage`.
- [ ] **Avatar UX:** thêm crop/preview trước upload, hiển thị tiến độ, giới hạn kích thước phía client và giữ avatar cũ nếu upload thất bại.
- [ ] **Bảo mật avatar:** thêm giới hạn tần suất upload, kiểm tra kích thước ảnh sau decode và cơ chế xóa ảnh cũ trên Cloudinary khi thay ảnh.
- [ ] **Đổi mật khẩu:** thêm password strength meter, cảnh báo phiên đăng nhập và yêu cầu đăng nhập lại sau khi đổi mật khẩu nếu chính sách bảo mật yêu cầu.
- [ ] **API regression tests:** thêm MockMvc/service tests cho quyền `STUDENT`, IDOR, PATCH allowlist, transaction rollback và lỗi Cloudinary; đưa vào CI.
- [ ] **Contract/OpenAPI:** mô tả đầy đủ request/response/error của ba endpoint profile trong OpenAPI và cập nhật Postman collection theo contract hiện tại.
- [ ] **Accessibility và polish:** kiểm tra keyboard navigation, focus state, alt text, thông báo cho screen reader và bản dịch thống nhất cho lỗi validation.
- [ ] **Dashboard summary:** thay số liệu mock trên Dashboard bằng API summary thật, sau đó mở rộng chart/achievement thành issue riêng.

### Nguyên tắc cho các issue nâng cấp

- Giữ ownership theo current user; không thêm `userId` vào URL cho luồng self-service.
- Không cho frontend chỉnh sửa email, mã học sinh, trường học hoặc chỉ số tiến độ.
- Không đánh dấu acceptance hoàn tất nếu mới chỉ compile; cần có bằng chứng HTTP hoặc E2E tương ứng.
- Không đưa credential Cloudinary, JWT hoặc database thật vào repository.
