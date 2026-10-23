# SRS — Lớp học của giáo viên (`/teacher/classes`)

## 1. Mục tiêu

Giáo viên mở **Lớp học của tôi** để xem các lớp mình được phân công, sĩ số, hồ sơ học tập ở mức đọc, và các đề đã phát hành cho từng lớp.

Đề tạo ở Quiz Management, khi phát hành, được giao cho một hoặc nhiều lớp giáo viên chọn. Học sinh chỉ thấy và chỉ làm được đề chính thức đã giao cho đúng lớp của mình.

Tài khoản học sinh, khóa/mở khóa, chuyển lớp và tạo lớp vẫn thuộc Admin.

## 2. Căn cứ

| Nguồn | Nội dung dùng cho màn này |
|---|---|
| SRS MVP, mục 3.2 | Giáo viên tạo và quản lý quiz của mình, không đổi vai trò tài khoản |
| SRS MVP, FR-QUIZ | Giáo viên phát hành quiz; học sinh làm quiz phù hợp với mình |
| Issue 6 | Giáo viên chỉ xem học sinh trong `teacher_class_assignments` |
| Sidebar giáo viên | Mục **Lớp học của tôi** trỏ tới `/teacher/classes` |

## 3. Actor

| Actor | Việc được làm |
|---|---|
| Giáo viên | Xem lớp mình được phân công, xem sĩ số và hồ sơ đọc, phát hành đề của mình vào các lớp đó |
| Admin | Xem mọi lớp ở `/teacher/classes` (chỉ đọc). Phát hành đề vào bất kỳ lớp nào cùng khối |
| Học sinh | Thấy đề chính thức đã giao cho `students.class_id` của mình. Đề tự luyện AI không đổi |
| Hệ thống | Giữ dòng gán đề–lớp khi lưu trữ hoặc đưa đề về nháp |

## 4. Use case

### UC-01 Xem danh sách lớp

Là giáo viên, tôi muốn thấy các lớp tôi được phân công để biết mình đang phụ trách những đâu.

1. Giáo viên mở `/teacher/classes`.
2. Hệ thống lấy các dòng `teacher_class_assignments` của giáo viên đó.
3. Mỗi lớp hiện một lần, kể cả khi có nhiều môn phân công.
4. Thẻ lớp gồm tên, khối, năm học, trường, môn, cờ chủ nhiệm và sĩ số.
5. Nếu chưa được phân công lớp nào, trang báo “Bạn chưa được phân công lớp nào.”

Admin thấy mọi lớp trong `school_classes`.

### UC-02 Xem sĩ số một lớp

Là giáo viên, tôi muốn mở một lớp và xem danh sách học sinh.

1. Giáo viên chọn một lớp.
2. Hệ thống kiểm tra phân công. Không có lớp thì 404. Giáo viên không được phân công thì 403.
3. Trang `/teacher/classes/{classId}` liệt kê học sinh chưa bị xóa mềm, có phân trang (mặc định 20, tối đa 50).
4. Cột: họ tên, mã học sinh, email, XP, level, streak, lần hoạt động gần nhất, trạng thái tài khoản.
5. Lớp chưa có học sinh thì báo “Lớp chưa có học sinh.”

### UC-03 Tìm học sinh trong lớp

1. Giáo viên gõ họ tên, email, username hoặc mã học sinh.
2. Giao diện chờ 300ms rồi gọi lại API.
3. Kết quả chỉ nằm trong lớp đang mở.
4. Không khớp thì báo “Không có học sinh phù hợp.”

Có thể sắp xếp theo tên, XP hoặc lần hoạt động gần nhất.

### UC-04 Xem hồ sơ đọc

1. Giáo viên mở `/teacher/classes/{classId}/students/{studentId}`.
2. Học sinh phải thuộc một lớp giáo viên được phân công. Ngoài lớp thì 403.
3. Trang hiện thông tin lớp, XP, level, streak, số lượt làm quiz, điểm trung bình và lần nộp gần nhất.
4. Không có nút tạo, sửa, khóa, xóa hoặc chuyển lớp.

Admin mở cùng đường dẫn thì dùng API hồ sơ admin, vẫn không có nút sửa trên trang này.

### UC-05 Xem đề đã phát hành cho lớp

1. Trong trang lớp, khối “Đề đã phát hành” liệt kê đề `PUBLISHED` có dòng gán tới lớp đó.
2. Giáo viên chỉ thấy đề do mình tạo. Admin thấy mọi đề của lớp.
3. Mỗi đề có link sang thống kê `/teacher/quizzes/{quizId}/statistics`.
4. Chưa có đề thì báo “Chưa có đề nào được phát hành cho lớp này.”
5. Trang có link sang bảng phân tích lớp.

### UC-06 Phát hành đề cho lớp được chọn

1. Ở `/teacher/quizzes` hoặc trang soạn đề, giáo viên bấm **Phát hành**.
2. Hộp thoại liệt kê các lớp giáo viên được phân công và cùng khối với đề. Có thể chọn nhiều lớp.
3. Xác nhận gửi `classIds`. Đề phải có ít nhất một câu hỏi.
4. Hệ thống thay toàn bộ dòng gán của đề bằng tập lớp vừa gửi, rồi đặt `PUBLISHED` và `is_active = true`.
5. Danh sách đề hiện tên các lớp đang được giao.
6. Đề đã phát hành có nút **Đổi lớp**. Mở lại hộp thoại với các lớp đang chọn.

Admin thấy mọi lớp cùng khối, không cần có dòng phân công.

### UC-07 Học sinh chỉ làm đề của lớp mình

1. Học sinh mở đề được giao theo môn.
2. Hệ thống chỉ trả đề `PUBLISHED`, đang active, `generation_status = READY`, và có `quiz_class_assignments.class_id` bằng lớp của học sinh.
3. Học sinh chưa có `class_id` không thấy đề chính thức.
4. Mở đề bằng UUID khi đề không được giao cho lớp của mình thì 403.
5. Đề tự luyện do chính học sinh tạo vẫn ở tab luyện tập cá nhân và không đi qua bảng gán lớp.

### UC-08 Chặn xem ngoài phân công

Giáo viên gọi API lớp, sĩ số hoặc hồ sơ của lớp không có trong `teacher_class_assignments` thì nhận 403. Bộ lọc do client gửi không được dùng làm căn cứ quyền.

### UC-09 Chặn phát hành sai lớp

| Tình huống | Kết quả |
|---|---|
| Không chọn lớp | 400, “Chọn ít nhất một lớp để phát hành” |
| Đề chưa có câu hỏi | 400, “Đề thi cần ít nhất một câu hỏi trước khi phát hành” |
| Lớp không tồn tại | 404 |
| Giáo viên không được phân công lớp đó | 403 |
| Khối lớp khác khối của đề | 400, “Lớp không cùng khối với đề thi” |
| Giáo viên phát hành đề người khác tạo | 403, luật sở hữu đề hiện có |

### UC-10 Lưu trữ hoặc đưa về nháp

1. Lưu trữ hoặc đưa về nháp đổi trạng thái đề, không xóa dòng gán.
2. Học sinh không còn thấy đề đó.
3. Phát hành lại dùng tập lớp gửi trong request, thay tập cũ.

## 5. Yêu cầu chức năng

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-CLS-01 | Giáo viên xem các lớp trong `teacher_class_assignments` | Must |
| FR-CLS-02 | Admin xem mọi lớp ở cùng trang, chỉ đọc | Must |
| FR-CLS-03 | Sĩ số một lớp có tìm kiếm, sắp xếp và phân trang | Must |
| FR-CLS-04 | Hồ sơ học sinh trên trang lớp là đọc | Must |
| FR-CLS-05 | Phát hành đề bắt buộc chọn ít nhất một lớp cùng khối | Must |
| FR-CLS-06 | Học sinh chỉ thấy và chỉ mở đề chính thức đã gán cho lớp mình | Must |
| FR-CLS-07 | Lưu trữ hoặc về nháp giữ dòng gán nhưng ẩn đề với học sinh | Must |
| FR-CLS-08 | Đề `PUBLISHED` đã có trước migration được gán vào mọi lớp cùng khối | Must |
| FR-CLS-09 | Giáo viên không tạo, sửa, khóa, xóa học sinh và không tạo lớp nhà trường | Must |

## 6. Dữ liệu

Bảng mới `quiz_class_assignments`:

| Cột | Ý nghĩa |
|---|---|
| `id` | Khóa chính UUID |
| `quiz_id` | Đề, xóa đề thì xóa dòng gán |
| `class_id` | Lớp, xóa lớp thì xóa dòng gán |
| `assigned_by_id` | Người phát hành |
| `assigned_at` | Thời điểm gán |

Unique `(quiz_id, class_id)`.

Bảng `quiz_class_assignments` nằm trong `V1__init_schema.sql`. Đề published không có lớp cùng khối sẽ không hiện với học sinh cho đến khi được phát hành lại.

## 7. API

Envelope `ApiResponse` (`success`, `message`, `data`), trừ danh sách học sinh cũ vốn trả thẳng `PageResponseDTO`.

| Method | Đường dẫn | Quyền | Việc |
|---|---|---|---|
| GET | `/api/v1/teacher/classes` | TEACHER, ADMIN | Danh sách lớp |
| GET | `/api/v1/teacher/classes/{classId}` | TEACHER, ADMIN | Một lớp |
| GET | `/api/v1/teacher/classes/{classId}/students` | TEACHER, ADMIN | Sĩ số |
| GET | `/api/v1/teacher/classes/{classId}/quizzes` | TEACHER, ADMIN | Đề đã phát hành cho lớp |
| GET | `/api/v1/teacher/students?classId=` | TEACHER | Sĩ số; `classId` tùy chọn, ngoài phân công thì 403 |
| GET | `/api/v1/teacher/students/{studentId}` | TEACHER | Hồ sơ nếu học sinh thuộc lớp được phân công |
| POST | `/api/v1/quizzes/{quizId}/publish` | TEACHER, ADMIN | Body `{ "classIds": ["uuid"] }` |

Mỗi lớp trả về: `id`, `name`, `gradeLevel`, `schoolName`, `academicYear`, `subject`, `isHomeroom`, `studentCount`. Nhiều môn của cùng một giáo viên trên một lớp được gộp thành một dòng.

Sĩ số dùng query `search`, `page` (từ 1), `size` (tối đa 50), `sort` (`fullName`, `createdAt`, `totalXp`, `lastActivityDate`), `direction`.

Đề của lớp trả về: `id`, `title`, `subject`, `gradeLevel`, `questionCount`, `attemptCount`, `timeLimitMinutes`.

`QuizResponse` thêm `classes: [{ id, name, gradeLevel }]`.

Học sinh: `GET /api/v1/student/quizzes/assigned` chỉ còn đề có dòng gán đúng lớp. `QuizAccessService` từ chối đề chính thức không được giao cho lớp đó.

## 8. Giao diện

| Đường dẫn | Nội dung |
|---|---|
| `/teacher/classes` | Thẻ các lớp |
| `/teacher/classes/{classId}` | Sĩ số và đề đã phát hành |
| `/teacher/classes/{classId}/students/{studentId}` | Hồ sơ đọc |
| Quiz Management | Hộp thoại chọn lớp khi phát hành hoặc đổi lớp |

Desktop dùng bảng. Màn hẹp dùng thẻ. Chữ trên trang là tiếng Việt.

## 9. Tiêu chí nghiệm thu

| ID | Điều kiện đạt |
|---|---|
| AC-01 | Giáo viên demo thấy lớp được phân công, mở được sĩ số và một hồ sơ không có nút sửa |
| AC-02 | Giáo viên không đọc được lớp hoặc học sinh ngoài phân công |
| AC-03 | Phát hành không chọn lớp, chọn lớp ngoài phân công hoặc khác khối thì bị từ chối và đề không sang `PUBLISHED` |
| AC-04 | Phát hành hợp lệ làm đề xuất hiện ở trang lớp và ở mục đề được giao của học sinh lớp đó |
| AC-05 | Học sinh lớp khác, hoặc học sinh chưa có lớp, không thấy đề đó và không mở được bằng UUID |
| AC-06 | Lưu trữ hoặc về nháp làm đề biến khỏi học sinh nhưng lần phát hành sau vẫn mở lại được các lớp đã chọn |
| AC-07 | Đề AI do học sinh tự tạo không bị yêu cầu gán lớp |

## 10. Ngoài phạm vi

- Tạo, sửa, xóa lớp nhà trường. Lớp học thêm của giáo viên nằm ở mục 11.
- Ghi danh hoặc chuyển `students.class_id`. Tạo hoặc khóa tài khoản học sinh.
- Cảnh báo phụ huynh và ngưỡng at-risk (đã có ở Analytics).
- Đề tự luyện AI của học sinh.
- Sửa câu hỏi của đề đã có bài làm.

## 11. Lớp học thêm

Lớp nhà trường ở các mục trên vẫn chỉ đọc. Lớp học thêm là bảng `study_classes` và `study_class_enrollments`, migration `V2__study_classes.sql`. Giáo viên tạo tối đa 4 lớp `ACTIVE`. Lớp được phân công không tính vào 4. Hết `end_date` hoặc bấm giải tán thì lớp thành `DISSOLVED` và không sửa lại.

Học sinh xin vào bằng mã 6 ký tự. Duyệt hoặc từ chối không đổi `students.class_id`.

Phát hành đề cho lớp học thêm dùng bảng `quiz_study_class_assignments`, migration `V5__quiz_study_class_assignments.sql`. Một lần phát hành gửi cả `classIds` và `studyClassIds`; danh sách nào bỏ trống thì gỡ các lớp thuộc danh sách đó. Cùng lần phát hành có thể gửi `availableFrom` và `availableUntil` (timestamptz, migration `V6__quiz_availability_window.sql`). Bỏ trống nghĩa là mở ngay và không khóa giờ. Nếu có cả hai mốc thì mốc kết thúc phải sau mốc bắt đầu. Học sinh chỉ tạo bài làm mới khi thời điểm hiện tại nằm trong khoảng đó. Bài đã nộp vẫn xem được câu hỏi, đáp án của học sinh và đáp án đúng sau khi hết giờ. Lớp nhà trường vẫn phải cùng khối và nằm trong phân công. Lớp học thêm phải còn `ACTIVE`. Giáo viên chỉ phát hành cho lớp học thêm của mình. Admin phát hành cho mọi lớp học thêm đang hoạt động. Học sinh thấy đề khi đã được duyệt và lớp còn hoạt động, kể cả khi chưa có lớp nhà trường hoặc khác khối. Lớp đã giải tán không còn đưa đề cho học sinh. Dữ liệu phân tích của lớp học thêm tính trên mọi hoạt động của học sinh đã duyệt, dùng ngưỡng cảnh báo mặc định và chưa gửi tin phụ huynh.

| Method | Đường dẫn | Việc |
|---|---|---|
| GET | `/api/v1/teacher/study-classes` | Danh sách, lọc `status` và `keyword` |
| POST | `/api/v1/teacher/study-classes` | Tạo lớp |
| GET | `/api/v1/teacher/study-classes/{id}` | Chi tiết và học sinh đã duyệt |
| PUT | `/api/v1/teacher/study-classes/{id}` | Sửa khi còn hoạt động |
| POST | `/api/v1/teacher/study-classes/{id}/dissolve` | Giải tán |
| GET | `/api/v1/teacher/study-classes/{id}/students` | Sĩ số đã duyệt, tìm kiếm và phân trang |
| GET | `/api/v1/teacher/study-classes/{id}/students/{studentId}` | Hồ sơ học sinh chỉ đọc |
| GET | `/api/v1/teacher/study-classes/{id}/quizzes` | Đề đã phát hành cho lớp |
| GET | `/api/v1/teacher/study-classes/{id}/requests` | Yêu cầu chờ |
| POST | `/api/v1/teacher/study-classes/{id}/requests/{requestId}/action` | `approve` hoặc `reject` |
| GET | `/api/v1/student/study-classes` | Lớp đã xin vào, đang chờ hoặc đã tham gia |
| GET | `/api/v1/student/study-classes/school-class` | Lớp nhà trường học sinh đang học |
| GET | `/api/v1/student/study-classes/quizzes` | Đề giáo viên đã và đang phát hành cho lớp của học sinh |
| POST | `/api/v1/student/study-classes/join` | Xin vào bằng mã lớp |
| GET | `/api/v1/quizzes/publish-study-classes` | Lớp học thêm đang hoạt động mà người dùng được phát hành |
| POST | `/api/v1/quizzes/{id}/publish` | Thêm `studyClassIds` bên cạnh `classIds` |

Giao diện: khối lớp học thêm trên `/teacher/classes`, chi tiết `/teacher/study-classes/{id}` có sĩ số, hồ sơ học sinh và đề đã phát hành, phân tích tại `/teacher/analytics?classId=`. Modal phát hành có ngày giờ bắt đầu và kết thúc. Học sinh mở `/student/classes`: tab Lớp học xem lớp đang học, tab Đề thi xem đề đã và đang phát hành, làm bài trong khung giờ và xem bài đã nộp.
