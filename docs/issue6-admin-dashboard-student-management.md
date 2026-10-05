# Issue 6 - Admin Dashboard: Student Management

## 1. Mục tiêu

Chuẩn hóa và triển khai màn hình quản lý học sinh cho AI Tutor theo SRS hiện tại và codebase đang có.

Admin cần xem, tìm kiếm, lọc, tạo, cập nhật, khóa/mở khóa và xem chi tiết hồ sơ học sinh. Giáo viên chỉ được xem học sinh thuộc lớp mình được phân công khi chức năng được mở cho Teacher. Hệ thống phải dùng dữ liệu hiện có từ `users`, `students`, `school_classes`, `teacher_class_assignments`, `quiz_attempts`, `chat_sessions`, `schedules` và các API analytics đã có.

## 2. Căn cứ SRS

Issue này liên kết trực tiếp với các yêu cầu trong `AI_Tutor_SRS_MVP.md`:

| SRS ID | Nội dung liên quan | Áp dụng trong issue |
|---|---|---|
| FR-AUTH-04 | Phân quyền API và giao diện theo `STUDENT`, `TEACHER`, `ADMIN` | Bắt buộc |
| FR-AUTH-05 | Admin xem danh sách, tìm kiếm và khóa/mở khóa tài khoản | Bắt buộc |
| FR-PRO-01 | Hồ sơ học sinh liên kết một-một với tài khoản | Bắt buộc |
| FR-PRO-02 | Học sinh cập nhật trường hồ sơ được phép | Không thay thế luồng tự cập nhật |
| FR-PRO-03 | Hiển thị XP, level, streak | Bắt buộc ở danh sách/chi tiết |
| FR-PRO-04 | Email đăng nhập lưu ở `User`, không lặp lại trong profile mới | Không tạo thêm email nghiệp vụ mới |
| FR-REP-03 | Admin dashboard hiển thị số liệu tổng quan | Tái sử dụng dữ liệu tổng hợp nếu cần |
| FR-REP-04 | Giáo viên/Admin xem kết quả theo quiz | Hiển thị tóm tắt học tập trong chi tiết |
| NFR-SEC-02 | Endpoint nghiệp vụ xác thực và kiểm tra quyền server-side | Bắt buộc |
| NFR-SEC-08 | Kiểm tra ownership để tránh IDOR | Bắt buộc |
| NFR-PERF-03 | Danh sách có phân trang, mặc định 20-50 bản ghi/trang | Bắt buộc |

## 3. Phạm vi chuẩn hóa

### 3.1. Must Have cho issue này

- Admin xem danh sách học sinh từ dữ liệu `users.role = STUDENT` liên kết `students`.
- Danh sách có phân trang, tìm kiếm và lọc theo trạng thái tài khoản, khối lớp, lớp, trường, mã học sinh.
- Bảng hiển thị tối thiểu: avatar, họ tên, email, mã học sinh, trường, khối, lớp, XP, level, streak, trạng thái, ngày tạo, hành động.
- Admin tạo học sinh mới bằng form thủ công.
- Khi tạo học sinh:
  - tạo `User` role `STUDENT`;
  - tạo `Student` liên kết 1-1;
  - dùng `student_code` unique;
  - nếu có `className`, liên kết hoặc tạo `SchoolClass` thông qua logic hiện có;
  - gửi email thiết lập mật khẩu theo luồng `PasswordResetToken` hiện tại.
- Admin cập nhật các trường được phép: `fullName`, `dateOfBirth`, `gender`, `phoneNumber`, `schoolName`, `gradeLevel`, `className`.
- Không cho sửa trực tiếp `email`, `username`, `role`, `studentCode` trong form chỉnh sửa học sinh của issue này.
- Admin khóa/mở khóa tài khoản bằng `users.is_active`.
- Tài khoản bị khóa không đăng nhập được vì auth hiện tại chỉ tìm user active.
- Admin xem trang chi tiết học sinh với thông tin cá nhân, XP/streak, lớp, lịch học và tóm tắt hoạt động học tập.
- Xóa trong issue này là soft delete qua `users.is_deleted = true`; không hard delete dữ liệu học tập.
- UI có loading, empty, error, validation error và confirm cho thao tác khóa/xóa.

### 3.2. Should Have nếu đủ thời gian

- Teacher xem danh sách học sinh thuộc các lớp trong `teacher_class_assignments`.
- Teacher xem chi tiết học sinh thuộc lớp mình phụ trách hoặc được phân công.
- Tích hợp quick link sang analytics theo `classId`/`studentId` nếu dữ liệu có sẵn.
- Debounce tìm kiếm 300ms ở frontend.
- Export danh sách đang lọc ra CSV đơn giản ở frontend.

### 3.3. Không thuộc phạm vi issue này

- Super Admin, MASTER role, multi-tenant toàn quốc.
- Import Excel hàng loạt.
- Hard delete `User`/`Student`.
- Force logout realtime toàn bộ session đã phát hành token.
- Mobile App.
- Badge/shop/gamification nâng cao.
- AI tự tổng hợp knowledge gaps theo từng hồ sơ nếu endpoint chi tiết chưa có sẵn.
- Bảng trường học riêng hoặc quản lý tổ chức/trường độc lập.

Các phần trên có thể tách thành issue/epic sau, vì SRS hiện tại không đặt chúng là Must Have cho Student Management baseline.

## 4. Hiện trạng codebase

### 4.1. Backend hiện có

- `UserController`:
  - `GET /api/v1/users?role=&search=&page=&size=`
  - `GET /api/v1/users/{id}`
  - `POST /api/v1/users`
  - `PUT /api/v1/users/{id}`
  - `PATCH /api/v1/users/{id}/status`
  - `DELETE /api/v1/users/{id}` soft delete
- `StudentProfileController`:
  - `GET /api/v1/students/me`
  - `PATCH /api/v1/students/me`
  - `POST /api/v1/students/me/avatar`
- `AnalyticsController` đã có API cho Teacher/Admin theo lớp: filters, summary, gaps, report, at-risk.
- `UserServiceImpl.createProfile` đã tạo `Student` khi `role = STUDENT`, sinh `studentCode`, liên kết lớp và gửi email setup.
- `UserServiceImpl.updateStatus` toggle `is_active`.
- `UserServiceImpl.deleteProfile` soft delete bằng `isDeleted`.

### 4.2. Schema hiện có

- `users`: `id`, `username`, `email`, `password_hash`, `full_name`, `date_of_birth`, `phone_number`, `avatar_url`, `gender`, `role`, `is_active`, `is_deleted`, `created_at`, `updated_at`.
- `students`: `id`, `user_id`, `student_code`, `grade_level`, `class_name`, `class_id`, `school_name`, `email`, `address`, `total_xp`, `current_level`, `current_streak`, `longest_streak`, `last_activity_date`, `study_preferences`, `parent_name`, `parent_email`, `parent_phone`.
- `school_classes`: `id`, `name`, `grade_level`, `school_name`, `academic_year`, `homeroom_teacher_id`.
- `teacher_class_assignments`: phân quyền Teacher theo lớp.
- `quiz_attempts`, `chat_sessions`, `schedules`: dùng để kiểm tra/tổng hợp hoạt động.

### 4.3. Frontend hiện có

- React + TypeScript + Vite.
- Route hiện có: `/student/*`, `/teacher/*`; chưa có Admin layout/page riêng.
- Service hiện có: `authApi`, `studentProfileApi`, `analyticsApi`, `scheduleApi`, `notificationApi`.
- Cần bổ sung Admin layout, route và service riêng cho student management.

## 5. User Story

Là Admin, tôi muốn quản lý danh sách và hồ sơ học sinh từ Admin Dashboard để hỗ trợ vận hành tài khoản, theo dõi thông tin học tập cơ bản và xử lý khóa/mở khóa tài khoản đúng quyền.

Là Teacher, tôi muốn xem danh sách học sinh trong lớp mình được phân công để theo dõi thông tin học tập cơ bản mà không truy cập dữ liệu ngoài phạm vi lớp.

## 6. Luồng người dùng

### 6.1. Danh sách học sinh

1. Admin đăng nhập.
2. Admin mở `/admin/students`.
3. FE gọi API danh sách học sinh với phân trang và filter.
4. Hệ thống hiển thị bảng học sinh.
5. Admin tìm kiếm theo tên, email, username hoặc mã học sinh.
6. Admin lọc theo trạng thái, trường, khối, lớp.
7. Admin chọn hành động: xem chi tiết, chỉnh sửa, khóa/mở khóa, xóa mềm.

### 6.2. Tạo học sinh thủ công

1. Admin chọn "Thêm học sinh".
2. Form yêu cầu: username, email, fullName, password hoặc cơ chế mật khẩu tạm, schoolName, gradeLevel.
3. Form tùy chọn: className, phoneNumber, dateOfBirth, gender.
4. Backend validate unique `username`, `email`, `studentCode`.
5. Backend tạo `User`, tạo `Student`, tạo token thiết lập mật khẩu và gửi email.
6. FE đóng modal, hiển thị toast thành công và reload trang hiện tại.

### 6.3. Cập nhật học sinh

1. Admin chọn "Chỉnh sửa".
2. Form hiển thị dữ liệu hiện có.
3. Các trường định danh `email`, `username`, `studentCode`, `role` ở chế độ readonly.
4. Admin cập nhật trường được phép.
5. Backend cập nhật `users` và `students`; nếu `className` thay đổi, cập nhật `class_id` theo `SchoolClassService`.
6. FE reload bản ghi sau khi lưu.

### 6.4. Khóa/mở khóa tài khoản

1. Admin chọn khóa hoặc mở khóa.
2. FE hiển thị hộp thoại xác nhận.
3. Backend toggle `users.is_active`.
4. Tài khoản bị khóa không thể đăng nhập lại.
5. FE cập nhật trạng thái trong bảng.

### 6.5. Xem chi tiết hồ sơ

1. Admin mở `/admin/students/:studentId`.
2. Backend trả về thông tin từ `Student` và `User`.
3. Backend bổ sung số liệu tóm tắt nếu có: số quiz attempts, điểm gần nhất/trung bình, số chat sessions, lịch học hiện tại, `lastActivityDate`.
4. FE hiển thị các tab:
   - Thông tin tài khoản và hồ sơ.
   - Học tập: XP, level, streak, quiz summary.
   - Lớp và lịch học.
5. Nếu dữ liệu tóm tắt chưa có, tab hiển thị empty state rõ ràng.

### 6.6. Xóa mềm học sinh

1. Admin chọn "Xóa".
2. FE xác nhận đây là xóa mềm tài khoản khỏi danh sách vận hành.
3. Backend set `users.is_deleted = true`.
4. Không xóa `students`, `quiz_attempts`, `chat_sessions`, `schedules`.
5. Danh sách mặc định không hiển thị tài khoản đã xóa mềm.

## 7. API đề xuất

Có thể mở rộng `UserController`, nhưng nên tạo controller chuyên biệt để response đúng nghiệp vụ và tránh làm nặng API user chung.

### 7.1. Admin Student API

Base path đề xuất: `/api/v1/admin/students`

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| GET | `/api/v1/admin/students` | ADMIN | Danh sách học sinh có filter/pagination/sort |
| GET | `/api/v1/admin/students/{studentId}` | ADMIN | Chi tiết học sinh theo `students.id` |
| POST | `/api/v1/admin/students` | ADMIN | Tạo học sinh thủ công |
| PUT | `/api/v1/admin/students/{studentId}` | ADMIN | Cập nhật hồ sơ học sinh |
| PATCH | `/api/v1/admin/students/{studentId}/status` | ADMIN | Khóa/mở khóa user liên kết |
| DELETE | `/api/v1/admin/students/{studentId}` | ADMIN | Soft delete user liên kết |

Query cho danh sách:

| Tham số | Kiểu | Ghi chú |
|---|---|---|
| `search` | string | Tìm theo `fullName`, `email`, `username`, `studentCode` |
| `active` | boolean | `true`, `false`, hoặc bỏ trống |
| `gradeLevel` | string | Lọc theo khối |
| `schoolName` | string | Lọc theo trường |
| `classId` | UUID | Lọc theo lớp |
| `page` | int | 1-based, mặc định 1 |
| `size` | int | mặc định 20, tối đa 50 |
| `sort` | string | `fullName`, `createdAt`, `totalXp`, `lastActivityDate` |
| `direction` | string | `asc` hoặc `desc` |

### 7.2. Teacher Student API, nếu triển khai Should Have

Base path đề xuất: `/api/v1/teacher/students`

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| GET | `/api/v1/teacher/students` | TEACHER | Danh sách học sinh trong lớp được phân công |
| GET | `/api/v1/teacher/students/{studentId}` | TEACHER | Chi tiết học sinh nếu thuộc lớp được phân công |

Teacher API bắt buộc kiểm tra `teacher_class_assignments`; không chỉ dựa vào dữ liệu filter từ client.

## 8. DTO đề xuất

### 8.1. `StudentAdminListItemResponse`

```json
{
  "studentId": "uuid",
  "userId": "uuid",
  "studentCode": "STU-ABCD1234",
  "username": "nguyenvana",
  "email": "a@example.com",
  "fullName": "Nguyen Van A",
  "phoneNumber": "0900000000",
  "avatarUrl": null,
  "gender": "OTHER",
  "dateOfBirth": "2010-01-01",
  "schoolName": "THCS A",
  "gradeLevel": "8",
  "classId": "uuid",
  "className": "8A1",
  "totalXp": 120,
  "currentLevel": 2,
  "currentStreak": 3,
  "lastActivityDate": "2026-09-30T10:00:00Z",
  "active": true,
  "createdAt": "2026-09-01T10:00:00Z",
  "updatedAt": "2026-09-10T10:00:00Z"
}
```

### 8.2. `StudentAdminDetailResponse`

Bao gồm toàn bộ trường của list item và thêm:

- `longestStreak`
- `address`
- `studyPreferences`
- `parentName`, `parentEmail`, `parentPhone`
- `quizAttemptCount`
- `averageScore`
- `lastQuizSubmittedAt`
- `chatSessionCount`
- `scheduleCount`

### 8.3. `StudentAdminCreateRequest`

| Trường | Bắt buộc | Validate |
|---|---:|---|
| `username` | Có | Unique, chữ/số/gạch dưới |
| `email` | Có | Unique, email |
| `password` | Có trong code hiện tại | Theo policy hiện có |
| `fullName` | Có | Không rỗng, tối đa 255 |
| `schoolName` | Có | Không rỗng với học sinh |
| `gradeLevel` | Có | Không rỗng, tối đa 32 |
| `className` | Không | Tối đa 64 |
| `phoneNumber` | Không | Theo regex hiện có |
| `dateOfBirth` | Không | Không ở tương lai |
| `gender` | Không | `MALE`, `FEMALE`, `OTHER` |

### 8.4. `StudentAdminUpdateRequest`

Chỉ cho phép:

- `fullName`
- `dateOfBirth`
- `gender`
- `phoneNumber`
- `schoolName`
- `gradeLevel`
- `className`
- `address`
- `parentName`
- `parentEmail`
- `parentPhone`
- `studyPreferences`

Không nhận `email`, `username`, `role`, `studentCode`, `totalXp`, `currentLevel`, `currentStreak` từ request cập nhật hồ sơ quản trị.

## 9. Acceptance Criteria

### AC-01 - Danh sách học sinh đúng dữ liệu và phân trang

Given Admin đã đăng nhập  
When Admin mở `/admin/students`  
Then hệ thống hiển thị danh sách học sinh từ `users.role = STUDENT`, không gồm user `is_deleted = true`, có phân trang mặc định 20 bản ghi/trang.

### AC-02 - Tìm kiếm và filter

Given có nhiều học sinh trong hệ thống  
When Admin tìm theo tên/email/username/studentCode hoặc lọc theo trạng thái, trường, khối, lớp  
Then backend trả đúng dữ liệu theo filter và không lọc ở frontend trên toàn bộ dataset.

### AC-03 - Tạo học sinh thủ công

Given Admin nhập form hợp lệ  
When Admin lưu  
Then hệ thống tạo `User` role `STUDENT`, tạo `Student`, sinh hoặc ghi nhận `studentCode` unique, liên kết lớp nếu có và gửi email setup mật khẩu theo luồng hiện có.

### AC-04 - Validate unique

Given username hoặc email đã tồn tại  
When Admin tạo học sinh mới  
Then backend trả lỗi conflict rõ ràng và FE hiển thị lỗi ở form.

### AC-05 - Cập nhật hồ sơ không sửa định danh

Given Admin mở form chỉnh sửa  
When Admin cập nhật các trường được phép  
Then dữ liệu `users`/`students` được cập nhật; `email`, `username`, `role`, `studentCode` không bị thay đổi.

### AC-06 - Khóa/mở khóa tài khoản

Given học sinh đang active  
When Admin khóa tài khoản  
Then `users.is_active = false`, danh sách cập nhật trạng thái và học sinh không đăng nhập được ở lần login tiếp theo.

### AC-07 - Xóa mềm

Given học sinh có hoặc chưa có lịch sử học tập  
When Admin xóa học sinh  
Then hệ thống set `users.is_deleted = true`, không xóa dữ liệu lịch sử và danh sách mặc định không hiển thị học sinh đó.

### AC-08 - Chi tiết học sinh

Given Admin mở chi tiết học sinh hợp lệ  
When API trả dữ liệu  
Then UI hiển thị thông tin cá nhân, lớp, XP, level, streak và summary học tập nếu có; nếu không có dữ liệu thì hiển thị empty state.

### AC-09 - RBAC và IDOR

Given người dùng không phải Admin gọi API admin  
When request tới `/api/v1/admin/students/**`  
Then backend trả `403`. Nếu triển khai Teacher API, Teacher chỉ xem được học sinh trong lớp được phân công.

### AC-10 - Responsive và trạng thái UI

Given Admin dùng màn hình desktop hoặc tablet  
When xem bảng học sinh  
Then bảng không vỡ layout, có horizontal scroll khi thiếu chiều ngang, các nút thao tác không đè nhau và có loading/error/empty state.

## 10. Task breakdown để implement

### Task 1 - Backend: DTO và contract

- [x] Đã hoàn thành trong codebase hiện tại.

- Tạo package DTO cho admin student:
  - `StudentAdminListItemResponse`
  - `StudentAdminDetailResponse`
  - `StudentAdminCreateRequest`
  - `StudentAdminUpdateRequest`
  - `StudentStatusUpdateResponse` nếu cần
- Chuẩn hóa response theo `ApiResponse` và `PageResponseDTO` hiện có.
- Thêm validation annotation cho create/update request.
- Không trả trực tiếp JPA entity ra API.

### Task 2 - Backend: Repository query cho danh sách

- [x] Đã hoàn thành trong codebase hiện tại.

- Bổ sung query trong `StudentRepository` hoặc tạo custom repository/specification.
- Query join `students`, `users`, `school_classes`.
- Hỗ trợ filter: `search`, `active`, `gradeLevel`, `schoolName`, `classId`.
- Hỗ trợ sort: `fullName`, `createdAt`, `totalXp`, `lastActivityDate`.
- Chỉ lấy `users.is_deleted = false`.
- Thêm giới hạn `size <= 50`.
- Cân nhắc index bổ sung nếu query chậm:
  - `students(student_code)`
  - `students(grade_level)`
  - `students(school_name)`
  - `students(class_id)`
  - `users(role, is_deleted, is_active)`

### Task 3 - Backend: AdminStudentService

- [x] Đã hoàn thành trong codebase hiện tại.

- Tạo `IAdminStudentService` và `AdminStudentServiceImpl`.
- Implement:
  - `searchStudents(...)`
  - `getStudentDetail(studentId)`
  - `createStudent(request)`
  - `updateStudent(studentId, request)`
  - `toggleStudentStatus(studentId)`
  - `softDeleteStudent(studentId)`
- Tái sử dụng logic hiện có từ `UserServiceImpl` khi hợp lý, nhưng tránh duplicate validate/phân quyền.
- Với create:
  - validate unique username/email;
  - tạo `User`;
  - tạo `Student`;
  - gọi `schoolClassService.findOrCreate(...)` khi có class;
  - tạo password setup token và gửi email như flow hiện tại.
- Với update:
  - không cập nhật email/username/role/studentCode;
  - cập nhật `class_id` khi đổi lớp.
- Với delete:
  - chỉ set `user.isDeleted = true`.

### Task 4 - Backend: AdminStudentController

- [x] Đã hoàn thành trong codebase hiện tại.

- Tạo `AdminStudentController` với base path `/api/v1/admin/students`.
- Áp dụng `@PreAuthorize("hasAuthority('ROLE_ADMIN')")` ở class hoặc method.
- Map đầy đủ endpoint ở mục 7.1.
- Chuẩn hóa mã lỗi:
  - `400` validation fail;
  - `403` không đúng quyền;
  - `404` không tìm thấy student/user;
  - `409` trùng username/email/studentCode.

### Task 5 - Backend: Detail summary học tập

- [x] Đã hoàn thành aggregate queries, không load toàn bộ history vào memory.

- Bổ sung repository query đếm/tóm tắt:
  - `quizAttemptCount`
  - `averageScore`
  - `lastQuizSubmittedAt`
  - `chatSessionCount`
  - `scheduleCount`
- Không đọc toàn bộ history vào memory.
- Nếu dữ liệu null, trả `0` hoặc `null` nhất quán để FE render empty state.

### Task 6 - Backend: Teacher read-only API, nếu triển khai Should Have

- [x] Đã triển khai read-only API và kiểm tra ownership theo lớp được phân công.

- Tạo `/api/v1/teacher/students`.
- Dùng `TeacherClassAssignmentRepository` để xác định `classId` Teacher được phép xem.
- Search/list chỉ trong các lớp đó.
- Detail phải kiểm tra student thuộc lớp được phân công.
- Không cho Teacher tạo/sửa/khóa/xóa học sinh.

### Task 7 - Backend: Tests

- [x] Đã thêm unit tests cho service admin và kiểm tra Teacher ngoài lớp.
- Lưu ý: chạy test hiện bị chặn bởi lỗi compile có sẵn trong `PdfReportWriterTest` (`org.apache.pdfbox.Loader` không tương thích PDFBox hiện tại).

- Unit test service create/update/status/delete.
- Repository/integration test cho filter/search/pagination.
- Security test:
  - Student gọi admin API nhận `403`;
  - Teacher gọi admin API nhận `403`;
  - Admin gọi thành công;
  - Teacher detail ngoài lớp nhận `403` nếu có Teacher API.
- Test soft delete không xóa attempt/chat/schedule.
- Test active=false không login được nếu chưa có test auth tương ứng.

### Task 8 - Frontend: Admin layout và routing

- [x] Đã implement layout, navigation và route guard ADMIN.
- [x] `/admin` chuyển sang `/admin/students`; có route dashboard và detail theo `studentId`.
- [x] Sidebar responsive, header tài khoản/đăng xuất; menu chưa triển khai hiển thị không khả dụng, không dẫn tới route trống.

- Tạo `AdminLayout` tương tự pattern `TeacherLayout`.
- Thêm route:
  - `/admin`
  - `/admin/students`
  - `/admin/students/:studentId`
- Thêm sidebar item "Quản lý học sinh".
- Bổ sung route guard theo `user.role === 'ADMIN'` nếu chưa có.

### Task 9 - Frontend: API service và types

- [x] Đã implement đủ 6 hàm API và types theo controller/DTO hiện tại.
- [x] Dùng `VITE_API_BASE_URL`, cookie `credentials: include`, giữ lỗi HTTP/field errors và hỗ trợ hủy request list.
- [x] Phân biệt list trả `PageResponseDTO` trực tiếp với detail/mutations trả `ApiResponse<T>`.

- Tạo `src/services/adminStudentApi.ts`.
- Tạo `src/types/adminStudent.ts`.
- Implement:
  - `fetchStudents(params)`
  - `fetchStudentDetail(studentId)`
  - `createStudent(payload)`
  - `updateStudent(studentId, payload)`
  - `toggleStudentStatus(studentId)`
  - `deleteStudent(studentId)`
- Dùng `VITE_API_BASE_URL` giống service hiện có.
- Xử lý lỗi `ApiResponse.error` nhất quán.

### Task 10 - Frontend: Student Management list page

- [x] Đã implement `StudentManagementPage.tsx`, nối route `/admin/students` với API thật.
- [x] Search debounce 300ms; filter active/grade/school/class; sort theo 4 trường backend hỗ trợ. Filter/sort/đổi size đưa page về 1.
- [x] Table đủ thông tin theo UI/UX, avatar fallback, status badge có text, ngày theo `vi-VN`, pagination server-side 10/20/50 (mặc định 20).
- [x] Skeleton 6 dòng, empty state phân biệt chưa có dữ liệu/không có kết quả, inline error và retry; hủy request cũ để tránh kết quả đến muộn ghi đè.
- [x] Responsive toolbar và bảng cuộn ngang có focus bàn phím, scrollbar riêng cho bảng.
- [x] Có icon view/edit/lock-unlock/delete với accessible label và tooltip; view mở route detail đã có. Nút tạo/edit/lock/delete **disabled** kèm lý do, chờ Tasks 11–12; detail chỉ có shell chờ Task 13.

- Tạo `src/pages/Admin/Students/StudentManagementPage.tsx`.
- UI gồm:
  - header/title;
  - search input debounce 300ms;
  - filter active/grade/school/class;
  - table;
  - pagination;
  - action buttons view/edit/lock/delete.
- Bảng có responsive horizontal scroll.
- Loading skeleton hoặc spinner.
- Empty state khi không có dữ liệu.
- Error state có nút retry.

#### Ghi nhận triển khai và kiểm tra Tasks 8–10 (2026-10-04)

- Mẫu Stitch: [AI Tutor - Quản lý Học sinh (Admin Portal)](https://stitch.withgoogle.com/projects/10845677445363578156), screen `bdf4952b907d464f8ca49e23d6c2eb79`. Tham chiếu HTML qua Stitch connector; dùng Inter, surface `#f9f9ff`, primary action `#1275e2`, error `#ba1a1a`, radius 8px và nhịp spacing 8px theo `DESIGN.md`.
- Không đưa số liệu KPI mẫu, Super Admin, import Excel hay thao tác ngoài scope của frame vào sản phẩm.
- Bộ lọc lớp lấy danh sách đầy đủ từ `/api/v1/analytics/filters` (ADMIN được backend trả toàn bộ lớp), gửi `classId` UUID sang API students. Có loading/error/retry riêng cho bộ lọc lớp.
- Bộ lọc trường dùng ô nhập debounce 300ms, gửi `schoolName` sang backend. Backend chưa có API danh mục trường; không suy ra danh mục toàn hệ thống từ một trang students hoặc hardcode trường mẫu.
- [x] `npm run build` thành công; có cảnh báo bundle >500 kB.
- [x] `npm run lint` thành công, chỉ còn warning trong các phần Student/Teacher có sẵn.
- [x] `node --test tests/adminStudentApi.test.mjs`: 8/8 pass, kiểm tra query Unicode/active=false/page 1-based, response envelopes, 6 hàm API, cookie credentials, field errors, 401/403, lỗi mạng và request cancellation bằng transport stub.
- [x] Kiểm tra lại sau khi bật Docker Desktop (2026-10-04): `docker compose up -d --build ai-tutor-service ai-tutor-frontend` thành công; 5 services running, PostgreSQL/Redis/RabbitMQ healthy; backend OpenAPI trả HTTP 200. Backend image dùng `bootJar -x test`, không xác nhận backend test suite.
- [x] Xác minh qua Nginx `http://localhost:3000`: Admin login 200; list page 1/page 2 trả 20 dòng mỗi trang, tổng 41 học sinh; `active=false` trả 0 dòng; khối 9 trả 1 dòng; tìm mã `STU-12A1-40` trả 1 dòng; analytics filters trả 2 lớp; API Admin không đăng nhập trả 401.
- [x] Browser với dữ liệu Docker thật: route Admin chưa đăng nhập chuyển về login; Admin login thành công; list hiển thị 41 học sinh; Trang sau hiển thị `21–40 / 41`, page 2/3; tìm không có kết quả hiển thị đúng empty state, đưa page về 1; lọc khối 9 hiển thị 1 học sinh; reset khôi phục 41 học sinh.
- [x] Kiểm tra screenshot và DOM tại 1024×768, 390×844: document không tràn ngang (`scrollWidth` bằng viewport); bảng có vùng cuộn ngang riêng (table 1180px, vùng hiển thị 702px/356px). Mobile drawer mở/đóng thành công. Khôi phục viewport mặc định và giữ tab danh sách mở cho người dùng.
- [ ] Task 14 E2E đầy đủ vẫn mở: chưa nghiệm thu CRUD/status/delete/detail do Tasks 11–13 chưa implement; chưa xác minh bằng browser toàn bộ tổ hợp filter/sort và lỗi mạng/retry. Kiểm tra smoke trên không thay thế E2E toàn issue.
- Tasks 11–14 vẫn mở; checklist Tasks 8–10 xác nhận phạm vi code, không đồng nghĩa toàn bộ Issue 6 đạt Definition of Done.

### Task 11 - Frontend: Create/Edit modal

- [x] Đã implement `AddStudentModal.tsx` và `EditStudentModal.tsx` theo Section 5.2 và 5.3 của `issue6-admin-student-management-ui-ux-requirements.md`.
- [x] Create modal chia nhóm: Tài khoản (username, email, password), Cá nhân (họ tên, phone, ngày sinh, giới tính), Lớp học (trường, khối, lớp). Validation client-side + backend field errors (duplicate username/email).
- [x] Edit modal hiển thị readonly có visual xám nhạt cho định danh (`username`, `email`, `studentCode`) với helper text `Thông tin định danh không chỉnh sửa tại đây.`; cho phép sửa thông tin hồ sơ/lớp/phụ huynh.

### Task 12 - Frontend: Status và soft delete flow

- [x] Đã implement `LockUnlockDialog.tsx` và `DeleteConfirmDialog.tsx` theo Section 5.5 và 5.6.
- [x] Text xác nhận khóa/mở khóa và xóa mềm bảo toàn dữ liệu báo cáo chuẩn theo tài liệu.
- [x] Cập nhật danh sách/chi tiết mượt mà sau khi thao tác thành công, không reload toàn trang, hiển thị toast feedback.

### Task 13 - Frontend: Student detail page

- [x] Đã hoàn thiện `AdminStudentDetailShell.tsx` thành trang chi tiết học sinh đầy đủ theo Section 5.4.
- [x] Top bar: Quay lại, Tên, Status badge, Action buttons (Chỉnh sửa, Khóa/Mở khóa).
- [x] Profile summary band & KPI row: Tổng XP, Level, Streak hiện tại, Hoạt động gần đây.
- [x] 4 Tabs chi tiết: `Hồ sơ`, `Học tập`, `Lớp & lịch học`, `Hoạt động` kèm empty states chuẩn theo yêu cầu.


### Task 14 - QA/E2E checklist

- Admin xem danh sách, phân trang và tìm kiếm.
- Admin tạo học sinh mới thành công.
- Tạo trùng username/email bị chặn.
- Admin cập nhật hồ sơ không đổi email/studentCode.
- Admin khóa tài khoản, học sinh không login được.
- Admin xóa mềm, học sinh biến khỏi danh sách mặc định.
- Student/Teacher không truy cập được `/admin/students`.
- UI không vỡ ở 1024px và 390px.

## 11. Gợi ý thứ tự triển khai

1. Backend DTO + query danh sách.
2. Backend controller/service cho list/detail.
3. Backend create/update/status/soft delete.
4. Backend tests cho RBAC và nghiệp vụ chính.
5. Frontend admin route/layout/service/types.
6. Frontend list page.
7. Frontend create/edit/status/delete.
8. Frontend detail page.
9. QA smoke test end-to-end.

## 12. Definition of Done

- API admin student đã có OpenAPI/Swagger hoặc mô tả contract rõ.
- Backend build và test pass.
- FE build pass.
- Không trả entity trực tiếp từ controller.
- Toàn bộ endpoint kiểm tra role server-side.
- Danh sách có phân trang server-side.
- Thao tác khóa/xóa có confirm.
- Xóa chỉ là soft delete.
- Acceptance Criteria từ AC-01 đến AC-10 đã được kiểm tra.
- Tài liệu issue này phản ánh đúng scope đã implement; nếu có phần Should Have chưa làm, ghi rõ chuyển sang issue sau.

## 13. Tài liệu UI/UX liên quan

Yêu cầu màn hình và tính năng cho đội thiết kế UI/UX nằm tại:

- `docs/issue6-admin-student-management-ui-ux-requirements.md`
