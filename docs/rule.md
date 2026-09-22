API và quy tắc nghiệp vụ

### API mới

- `GET /api/v1/students/me`
    - Chỉ dành cho `STUDENT`.
    - Xác định tài khoản từ JWT, không nhận `userId` từ client.
    - Trả về:
        - Chỉ đọc: `userId`, `studentId`, `studentCode`, `username`, `email`, `schoolName`, `totalXp`, `currentLevel`, `currentStreak`.
        - Có thể cập nhật: `fullName`, `dateOfBirth`, `gender`, `phoneNumber`, `avatarUrl`, `gradeLevel`, `className`, `studyPreferences`.
- `PATCH /api/v1/students/me`
    - Chỉ cập nhật các trường được phép.
    - Không cập nhật email, username, role, trạng thái tài khoản, mã học sinh, trường học, XP, level hoặc streak.
    - Thực hiện cập nhật `User` và `Student` trong cùng transaction.
- `POST /api/v1/students/me/avatar`
    - `multipart/form-data`, field `file`.
    - Chấp nhận JPEG, PNG hoặc WebP, tối đa 5 MB.
    - Kiểm tra file rỗng, MIME, phần mở rộng và giới hạn kích thước; Cloudinary phải upload dưới `resource_type=image`.
- Giữ các endpoint `/users/{id}` hiện tại cho Admin và tương thích tạm thời; frontend học sinh chỉ dùng `/students/me`.

### Validation

- `fullName`: không rỗng, trim khoảng trắng, tối đa 255 ký tự.
- `dateOfBirth`: không được ở tương lai.
- `phoneNumber`: tùy chọn, đúng định dạng số điện thoại Việt Nam hiện hành của dự án.
- `gradeLevel`: nếu truyền lên phải khác rỗng, tối đa 32 ký tự.
- `className`: tùy chọn, tối đa 64 ký tự.
- `gender`: `MALE`, `FEMALE`, `OTHER`.
- `studyPreferences`: JSON object tối đa 8 KB; chỉ chứa giá trị primitive hoặc mảng primitive, không nhận object lồng tùy ý. Khi được gửi, toàn bộ object cũ được thay thế.
- Trường không xuất hiện trong PATCH được giữ nguyên; chuỗi rỗng cho trường tùy chọn được chuẩn hóa thành `null`.
