# Login/register 502 trên Docker local — 25/10/2026

## Nguyên nhân đã tái hiện

- Nginx `localhost:3000` trả 502 vì container backend đã thoát với exit code 1.
- Hibernate `ddl-auto=validate` báo thiếu bảng `quiz_study_class_assignments`.
- Database cũ đã ghi nhận V5 là `study class notification contract`, trong khi source hiện tại dùng V5 để tạo bảng giao bài cho lớp học. Flyway thấy database ở V7 nên không chạy lại V5.
- Sau khi khởi động được, test logout/login liên tiếp phát hiện JWT trùng nhau trong cùng giây. Token mới trùng token đã bị blacklist làm request tiếp theo nhận 401.

## Bản sửa

- Thêm V8 để tạo bảng và index còn thiếu bằng `IF NOT EXISTS`; chạy được trên cả database cũ lẫn database cài mới. Giữ nguyên lịch sử migration và dữ liệu hiện có.
- Thêm `jti` ngẫu nhiên cho access token và refresh token để mỗi lần phát hành/rotation có token riêng.
- Compose local chờ backend healthy trước khi chạy frontend.
- Readiness kiểm tra `readinessState,db,redis,rabbit`. SMTP không chặn auth vì gửi thư chào mừng là tác vụ bất đồng bộ. Endpoint health tổng vẫn phản ánh lỗi SMTP nếu cấu hình mail sai.
- Nginx dùng Docker DNS resolver để cập nhật IP backend sau khi recreate.
- Runtime backend cài rõ dependency curl cho healthcheck; frontend production dùng wget có sẵn trong image Alpine.

## Chạy và kiểm chứng

```powershell
docker compose build ai-tutor-service ai-tutor-frontend
docker compose up -d ai-tutor-service ai-tutor-frontend
docker compose ps
curl.exe http://localhost:8088/actuator/health/readiness
```

```powershell
cd ai-tutor-service
.\gradlew.bat test --tests '*QuizStudyClassAssignmentMigrationTest' --tests '*JwtProviderTest' --tests '*AuthServiceImplTest'
```

```powershell
cd ai-tutor-frontend
npm run test:auth
node tests/auth-smoke.mjs
```

Smoke test gọi API qua Nginx cổng 3000, kiểm tra đăng ký, cookie, profile được bảo vệ, trùng tài khoản, dữ liệu sai, mật khẩu sai, đăng nhập bằng email/username, logout và refresh. Mỗi lần chạy tạo một tài khoản QA có prefix `qa_auth_` và in userId để dễ nhận diện.

Không đổi `ddl-auto` sang `update`, không xóa volume, không sửa/xóa lịch sử Flyway để xử lý sự cố này. Tránh thay nội dung migration đã phát hành; các thay đổi schema tiếp theo cần version mới.

## Kết quả xác minh trên máy local

- Backend được rebuild/recreate và ở trạng thái healthy; frontend tiếp tục proxy được sau khi backend recreate mà không cần restart Nginx.
- Admin mẫu đăng nhập qua cổng 3000 trả 200.
- Smoke test qua cổng 3000: 14/14 kiểm tra đạt.
- Backend: 6 test AuthService, 2 test migration, 1 test JWT và 1 test notification migration đạt, không bị skip.
- Frontend: 5/5 test auth đạt; image production build thành công.
- Cấu hình Compose local/production, `nginx -t` và `git diff --check` đều đạt.
- Đã xóa đúng 3 tài khoản QA được tạo trong phiên debug này. Database vẫn có 45 tài khoản như trước nâng cấp.
- SMTP local vẫn báo thông tin xác thực Gmail không hợp lệ; gửi thư chào mừng cần cấu hình mail hợp lệ để hoạt động. Lỗi mail không chặn đăng ký/đăng nhập.
