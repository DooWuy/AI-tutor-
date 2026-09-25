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

### Quy chu?n Frontend (React & Tailwind)

- **Ki?n tr�c v� Ph�n t�ch Code (Clean Code)**
    - JSX v� CSS (Tailwind classes) ph?i du?c ph�n t�ch r�nh m?ch d? d?m b?o t�nh d? d?c.
    - Kh�ng vi?t chu?i className qu� d�i tr?c ti?p v�o file JSX. Thay v�o d�, gom c�c chu?i className v�o m?t file ri�ng bi?t c� h?u t? .styles.ts (v� d?: LoginPage.styles.ts), export du?i d?ng object ph�n t?ng theo khu v?c giao di?n.
    - Trong file JSX/TSX ch�nh, g?i style ra du?i d?ng: className={styles.khu_vuc.element}.
    - C�c file SVG ho?c do?n code minh h?a HTML qu� d�i ph?i b�c t�ch ra th�nh file component ri�ng (v� d?: LoginBackground.tsx), tuy?t d?i kh�ng hardcode l�m ph�nh to code JSX.

- **C?u tr�c Thu m?c**
    - Trang (Pages) l?n: �?t v�o thu m?c ri�ng theo c?u tr�c src/pages/{PageName}/. File giao di?n ch�nh n?m ? src/pages/{PageName}/{PageName}.tsx.
    - Component con ph? thu?c c?a m?t trang: �?t ? src/pages/{PageName}/components/.
    - Styles c?a trang: �?t ? src/pages/{PageName}/{PageName}.styles.ts.
    - Component d�ng chung (UI elements nhu Button, Card...): �?t ? src/components/.

- **M�u s?c v� Theme (Tailwind)**
    - S? d?ng h? th?ng m� m�u d� du?c t�y ch?nh trong index.css / c?u h�nh Tailwind c?a d? �n (nhu g-surface, 	ext-on-surface, primary, surface-container, error-container, v.v.).
    - Tr�nh d�ng m� hex c?ng (#RRGGBB) n?u kh�ng th?t s? c?n thi?t. Khuy?n kh�ch s? d?ng bi?n c� s?n.
    - Icon: S? d?ng b? icon **Material Symbols Outlined** th�ng qua class material-symbols-outlined.

- **Convention Chung**
    - Format t�n c�c h�m bi?n theo d?ng camelCase, t�n Component d?ng PascalCase.
    - Lu�n d�ng TypeScript (TSX) c� d?nh nghia ki?u r� r�ng.
