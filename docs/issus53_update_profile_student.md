# Issue 53 - Student Profile View & Update

## Phạm vi

Issue 53 chỉ triển khai hồ sơ học sinh theo `FR-PRO-01..04` và `US-13`.

Giữ trong Issue 53:

- Học sinh xem hồ sơ cá nhân của chính mình qua JWT, không truyền `userId` từ client.
- Học sinh cập nhật các trường hồ sơ được phép.
- Upload avatar.
- Hiển thị email đăng nhập từ `User`.
- Hiển thị XP, level và streak ở chế độ chỉ đọc.

Tách khỏi Issue 53:

- Đổi mật khẩu: tạo issue bảo mật riêng; backend hiện đã có API nhưng SRS chưa chốt yêu cầu rõ.
- Dashboard thống kê: thuộc `FR-REP-01`, triển khai trong feature Dashboard.
- Tổng giờ học, số bài hoàn thành: chưa có nguồn dữ liệu được chốt trong MVP.
- Badge: thuộc phạm vi Won't Have.
- Notification preferences/worker: ngoài phạm vi MVP; reminder qua push/email là Won't Have.

## API contract

Base path: `/api/v1`

Tất cả endpoint dưới đây chỉ dành cho `STUDENT` và dùng JWT hiện tại.

### GET `/students/me`

Trả về hồ sơ học sinh hiện tại.

Response `200`:

```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    "userId": "0d2e3c5b-9a31-42fd-9ab9-3395e46c24d2",
    "studentId": "6b034e44-12b5-42a0-9c37-45e094a71f33",
    "studentCode": "STU-12345678",
    "username": "student123",
    "email": "student123@example.com",
    "schoolName": "High School A",
    "totalXp": 1200,
    "currentLevel": 4,
    "currentStreak": 7,
    "fullName": "Nguyen Van A",
    "dateOfBirth": "2009-05-12",
    "gender": "MALE",
    "phoneNumber": "0987654321",
    "avatarUrl": "https://res.cloudinary.com/demo/image/upload/avatar.webp",
    "gradeLevel": "10",
    "className": "10A1",
    "studyPreferences": {
      "subjects": ["math", "english"],
      "dailyGoalMinutes": 45
    }
  },
  "error": null,
  "timestamp": "2026-09-22T10:00:00"
}
```

### PATCH `/students/me`

Chỉ cập nhật các trường được phép. Trường không xuất hiện được giữ nguyên. Chuỗi rỗng cho trường tùy chọn được chuẩn hóa thành `null`.

Request:

```json
{
  "fullName": "Nguyen Van A",
  "dateOfBirth": "2009-05-12",
  "gender": "MALE",
  "phoneNumber": "0987654321",
  "avatarUrl": "https://res.cloudinary.com/demo/image/upload/avatar.webp",
  "gradeLevel": "10",
  "className": "10A1",
  "studyPreferences": {
    "subjects": ["math", "english"],
    "dailyGoalMinutes": 45,
    "darkMode": true
  }
}
```

Response `200`: giống `GET /students/me`, với dữ liệu mới nhất.

Validation:

- `fullName`: trim khoảng trắng, không rỗng khi gửi, tối đa 255 ký tự.
- `dateOfBirth`: không được ở tương lai.
- `phoneNumber`: tùy chọn, đúng định dạng số điện thoại Việt Nam hiện hành của dự án.
- `gradeLevel`: nếu gửi phải khác rỗng, tối đa 32 ký tự.
- `className`: tùy chọn, tối đa 64 ký tự.
- `gender`: `MALE`, `FEMALE`, `OTHER`.
- `studyPreferences`: JSON object tối đa 8 KB; chỉ chứa primitive hoặc mảng primitive. Khi gửi, toàn bộ object cũ được thay thế.

### POST `/students/me/avatar`

Upload avatar bằng `multipart/form-data`, field `file`.

Request:

```text
POST /api/v1/students/me/avatar
Content-Type: multipart/form-data

file=<avatar.jpg>
```

Response `200`:

```json
{
  "success": true,
  "message": "Tải ảnh đại diện lên thành công",
  "data": "https://res.cloudinary.com/demo/image/upload/ai_tutor_avatars/avatar.jpg",
  "error": null,
  "timestamp": "2026-09-22T10:00:00"
}
```

Validation:

- File không rỗng.
- Chấp nhận JPEG, PNG hoặc WebP.
- Tối đa 5 MB.
- Kiểm tra MIME type và phần mở rộng.
- Cloudinary upload dưới `resource_type=image`.

## Bảng trường

| Field | Nguồn | GET | PATCH | Ghi chú |
| --- | --- | --- | --- | --- |
| `userId` | `users.id` | Read-only | Không | Lấy từ JWT hiện tại |
| `studentId` | `students.id` | Read-only | Không | Hồ sơ one-to-one của user |
| `studentCode` | `students.student_code` | Read-only | Không | Do hệ thống/nhà trường quản lý |
| `username` | `users.username` | Read-only | Không | Không đổi trong Issue 53 |
| `email` | `users.email` | Read-only | Không | Không dùng `students.email` |
| `schoolName` | `students.school_name` | Read-only | Không | Do Admin/nhà trường quản lý |
| `totalXp` | `students.total_xp` | Read-only | Không | Chỉ hiển thị |
| `currentLevel` | `students.current_level` | Read-only | Không | Chỉ hiển thị |
| `currentStreak` | `students.current_streak` | Read-only | Không | Chỉ hiển thị |
| `fullName` | `users.full_name` | Editable | Có | Cập nhật cùng transaction |
| `dateOfBirth` | `users.date_of_birth` | Editable | Có | Không ở tương lai |
| `gender` | `users.gender` | Editable | Có | Enum |
| `phoneNumber` | `users.phone_number` | Editable | Có | Chuỗi rỗng thành `null` |
| `avatarUrl` | `users.avatar_url` | Editable | Có | Có thể cập nhật qua upload avatar |
| `gradeLevel` | `students.grade_level` | Editable | Có | Không rỗng khi gửi |
| `className` | `students.class_name` | Editable | Có | Chuỗi rỗng thành `null` |
| `studyPreferences` | `students.study_preferences` | Editable | Có | Replace toàn bộ object |

## Acceptance criteria

- `GET /api/v1/students/me` chỉ cho phép role `STUDENT` và xác định user từ JWT.
- `PATCH /api/v1/students/me` chỉ cập nhật field editable, không cập nhật email, username, role, trạng thái tài khoản, mã học sinh, trường học, XP, level hoặc streak.
- Cập nhật `User` và `Student` trong cùng transaction.
- `POST /api/v1/students/me/avatar` validate file rỗng, MIME, phần mở rộng, kích thước tối đa 5 MB và upload Cloudinary với `resource_type=image`.
- Email trong response luôn lấy từ `User.email`; database không còn phụ thuộc `students.email`.
- `/users/{id}` hiện tại vẫn giữ cho Admin và tương thích tạm thời; frontend học sinh chỉ dùng `/students/me`.
- OpenAPI runtime qua Springdoc có endpoint `/students/me`, `/students/me/avatar`, request/response schema tương ứng.
- Postman collection có nhóm Student Profile với 3 request tương ứng.


Các task triển khai

 dã xong  1. **PRO-01 — Chuẩn hóa requirement và API contract**
    - Viết lại Issue 53 theo phạm vi đã chốt.
    - Bổ sung acceptance criteria, request/response mẫu và bảng trường editable/read-only.
    - Cập nhật OpenAPI và Postman collection.
    - Ghi rõ dashboard, password, badge và notification thuộc issue khác.

 đã xong 2. **PRO-02 — Đồng bộ database và entity**
    - Tạo Flyway migration tiếp theo để loại bỏ `students.email`.
    - Xóa mapping và toàn bộ logic ghi email vào `Student`; email chỉ lấy từ `User`.
    - Giữ quan hệ one-to-one và unique `students.user_id`.
    - Không dùng `ddl-auto=update`.

3. **PRO-03 — Xây dựng Student Profile backend**
    - Tạo DTO riêng cho response và PATCH request; không tái sử dụng `UserUpdateRequest`.
    - Tạo controller/service dành cho `/students/me`.
    - Truy vấn đồng thời `User` và `Student` từ principal hiện tại.
    - Mapping đầy đủ dữ liệu cá nhân, học tập và tiến độ.
    - Trả `404` nếu tài khoản STUDENT không có bản ghi Student tương ứng.
    - Giữ mọi thay đổi User/Student trong một transaction.

4. **PRO-04 — Hardening avatar upload**
    - Chuyển self-service avatar sang `/students/me/avatar`.
    - Áp dụng allowlist JPEG/PNG/WebP và giới hạn 5 MB ở application config lẫn service validation.
    - Không dùng tên file gốc làm public ID; tiếp tục sinh UUID.
    - Trả URL HTTPS mới trong response và cập nhật `User.avatarUrl`.
    - Không log nội dung file hoặc dữ liệu cá nhân.

5. **PRO-05 — Xây dựng giao diện Student Profile**
    - Điều kiện tiên quyết: frontend phải có login/session, API client, route guard và refresh-token flow; frontend hiện vẫn là Vite starter nên phần nền này phải được merge trước hoặc theo một task phụ thuộc riêng.
    - Tạo trang Profile gồm chế độ xem và form chỉnh sửa.
    - Hiển thị email, mã học sinh, trường, XP, level và streak ở chế độ chỉ đọc.
    - Cho sửa đúng các trường đã chốt và upload/preview avatar.
    - Có loading, empty, validation error, API error, save success và retry state.
    - Sau cập nhật thành công, đồng bộ profile trong auth state/header mà không yêu cầu đăng nhập lại.

6. **PRO-06 — Kiểm thử và tích hợp**
    - Unit test mapper, validation, partial update và giới hạn `studyPreferences`.
    - Service test bảo đảm trường khóa không bị thay đổi và rollback khi cập nhật một trong hai entity thất bại.
    - MockMvc/security test cho unauthenticated `401`, sai role `403`, Student đọc/sửa đúng hồ sơ của mình.
    - Test avatar hợp lệ, file rỗng, sai MIME/phần mở rộng và vượt 5 MB.
    - Repository/migration test trên PostgreSQL sạch, gồm kiểm tra cột email trùng đã được loại bỏ.
    - FE component/API test cho load, edit, validation, upload và error state.
    - E2E: đăng nhập Student → mở Profile → sửa dữ liệu → upload avatar → reload → dữ liệu vẫn chính xác.

## Acceptance criteria

- Học sinh không phải truyền ID và không thể đọc hoặc sửa hồ sơ người khác.
- GET trả đầy đủ dữ liệu từ cả `User` và `Student`.
- PATCH chỉ thay đổi trường được phép; email, role, trạng thái, trường học và tiến độ không đổi.
- Email chỉ tồn tại và được đọc từ bảng `users`.
- Avatar sai định dạng hoặc vượt 5 MB bị từ chối trước khi lưu URL.
- XP, level và streak được hiển thị nhưng không có endpoint cập nhật trong feature này.
- OpenAPI, Postman, migration và toàn bộ test của feature pass.
- Baseline `gradlew test` hiện thất bại vì không kết nối được PostgreSQL; team cần cung cấp test database/Testcontainers trong PRO-06 để test chạy độc lập trong CI.

## Thứ tự và phụ thuộc

1. PRO-01 chốt contract.
2. PRO-02 và PRO-03 triển khai backend; PRO-05 có thể dựng UI bằng mock contract song song.
3. PRO-04 hoàn thiện upload sau khi endpoint `/me` sẵn sàng.
4. PRO-05 tích hợp backend sau khi nền auth frontend hoàn tất.
5. PRO-06 chạy cuối, sửa lỗi tích hợp và nghiệm thu theo `US-13`.
