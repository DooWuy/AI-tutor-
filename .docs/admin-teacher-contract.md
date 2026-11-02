# S1-US2 — Teacher invitation contract và evidence

Ngày: 02/11/2026. Trạng thái story: Review/QA, chưa Accepted/Done theo mục 10 của update_admin_feature.md. Task kỹ thuật Done không thay thế deploy/PO sign-off.

## Review S1-US1

Đã rà UserController, UserServiceImpl, UserRepository, JWT/principal, refresh, WebSocket inbound/outbound, giao diện /admin/users, CI và test HTTP/PostgreSQL hiện có. Giữ status idempotent, phân trang/search phía server, ordered locks bảo vệ Admin cuối cùng, soft delete và kiểm tra tài khoản từ DB. Regression bao gồm hai race last-Admin và status lặp.

Khoảng trống phát hiện và sửa khi thêm Teacher: thiếu trang setup-password; link email hard-code; Teacher có thể có credential hoạt động trước setup; chưa có resend/trạng thái mail; DTO thiếu hồ sơ Teacher; cập nhật teaching fields chưa chặn blank; uniqueness email chỉ phân biệt theo chuỗi gốc; lỗi DB có thể lộ chi tiết nội bộ. Guard role transition của S1-US1 được giữ nguyên. ADM-110 còn mở: merged commit/remote CI, staging, browser visual QA và PO.

## Contract

- `POST /api/v1/users/teachers`: Admin only; body gồm username (ASCII chữ/số/_; tối đa 255), email (email hợp lệ; tối đa 255), fullName (bắt buộc; tối đa 255), department và subjectTaught (bắt buộc; tối đa 128), schoolName (tùy chọn, tối đa 255). Không nhận role/password/teacherCode hoặc field ngoài contract. Service cố định TEACHER, tạo đúng User + Teacher + token trong một transaction. Không gán bất kỳ lớp/dữ liệu demo nào.
- `POST /api/v1/users` nhánh TEACHER dùng cùng service và chính sách invitation, password có thể bỏ qua; nhánh Student/Admin giữ yêu cầu password và cách gửi mail cũ.
- Email được trim/lowercase cho account mới. V9 tạo unique expression index `lower(btrim(email))` cho mọi account, kể cả deleted. Conflict trả 409, không lộ SQL/constraint. Username vẫn unique theo quy tắc hiện có (case-sensitive).
- `GET /api/v1/users/accounts?role=TEACHER` và `GET /api/v1/users?role=TEACHER`: paginated; DTO thêm teacherId, teacherCode, department, subjectTaught, schoolName, invitationStatus. List hydrate Teacher bằng một batch query thay vì một query mỗi hàng. `GET /users/{userId}` giữ Admin/owner; không trả hash/token.
- `PUT /users/{userId}`: chỉ các field hồ sơ fullName, dateOfBirth (quá khứ), gender (enum), phoneNumber (số Việt Nam hợp lệ), department, subjectTaught, schoolName. Định danh/quyền/XP/token/assignment ngoài DTO bị 400; gradeLevel/className bị từ chối cho Teacher. Teaching fields được gửi không được blank. Field null được bỏ qua theo contract update hiện có; muốn xóa school/phone gửi chuỗi rỗng. Không chuyển role để tạo hồ sơ.
- `PUT|PATCH /users/{userId}/status {"active":false|true}` giữ contract S1-US1. Setup/resend không sửa active; khóa không xóa User/Teacher/content/history.
- `POST /users/{userId}/invitation/resend`: chỉ Admin; chỉ Teacher chưa setup và chưa deleted; 60 giây tính từ lần yêu cầu gần nhất, kể cả mail fail. Ghi token cũ used + token mới 24h + QUEUED trong một transaction. Đã setup hoặc quá sớm trả 409; không tạo User mới.
- `POST /api/v1/auth/setup-password {token,newPassword}`: kiểm tra token tồn tại/chưa dùng/chưa hết hạn/account chưa deleted; khóa hàng User để serialize với resend/status/setup khác. Cập nhật password hash và COMPLETED, consume token; không tự mở khóa. Chính sách mật khẩu server kế thừa (tối thiểu 6); UI yêu cầu tối thiểu 8. API setup dành cho cả các luồng hiện có.

## Invitation và mail

`null` = account cũ không bị ép setup lại. Account Teacher mới có credential UUID ngẫu nhiên không công bố và invitation `QUEUED`. `UserPrincipal.isEnabled`, login và refresh chặn tài khoản chưa setup; active vẫn là khóa hành chính độc lập.

State: QUEUED → SENT hoặc FAILED; valid setup → COMPLETED. SENT nghĩa SMTP sender đã nhận request gửi, không khẳng định thư đã vào inbox. Email/token không xuất hiện trong response, notice hoặc log do code mới ghi.

QUEUED + token lưu cùng transaction tạo/resend, đóng vai trò durable job. Scheduler quét 10 giây/lần, tối đa 50 hàng, gọi bean transaction riêng để khóa/recheck User rồi gửi. Không gửi trước commit. Rollback tạo tài khoản không để job/orphan. Restart tiếp tục QUEUED. Lỗi SMTP ghi FAILED; Admin sửa cấu hình rồi resend sau cooldown để retry, thay vì tạo lại account. Mail SMTP có timeout cấu hình hiện có. Multi-instance serialize bằng row lock; crash sau SMTP accept nhưng trước DB commit có thể gửi lại cùng link (at-least-once). Không có retry SMTP tự động vô hạn; FAILED cần resend rõ ràng. Lock User tồn tại trong lúc gửi (bị giới hạn bởi SMTP timeout); đây là tradeoff MVP cần theo dõi khi tăng tải.

Frontend /admin/users có filter Teacher, create, load/detail/error/retry, edit, trạng thái invitation riêng, resend/cooldown feedback, refresh hồ sơ, native dialog/focus và field errors. Sau create hiển thị queued, không tuyên bố email đã gửi. List tự refresh khi có QUEUED. Trang public `/setup-password` hỗ trợ password manager/paste, confirm, pending/error/retry, link login.

## Migration và vận hành

- V9 thêm invitation_status, invitation_requested_at, check constraint, queue index và email unique index. Không sửa V1..V8; existing account invitation null giữ truy cập và owner/history.
- Trước upgrade chạy `SELECT lower(btrim(email)), count(*) FROM users GROUP BY lower(btrim(email)) HAVING count(*) > 1;`. Nếu có collision, xử lý định danh với chủ dữ liệu trước khi migrate; migration fail rõ ràng, không tự xóa/gộp account hay history.
- Cấu hình `APP_FRONTEND_URL` theo origin frontend triển khai. Production yêu cầu biến này; giữ secret SMTP trong MAIL_HOST/PORT/USERNAME/PASSWORD. Dùng prod cho staging deploy theo cấu hình hiện có hoặc cấu hình staging datasource riêng; không dùng dev để bootstrap vận hành.
- AnalyticsDemoDataSeeder chỉ dev và loại trừ profile prod/staging, production seed-demo=false. Search fixture email/password/code trong source runtime chỉ thấy tại seeder; service/frontend dùng principal ID và ownership. Không xóa tài khoản demo đã tồn tại. Luồng phân công lớp chính quy và study class riêng giữ nguyên; Teacher mới có empty state “Bạn chưa được phân công lớp nào”.

## Kiểm thử và nghiệm thu

Backend: AdminAccountDatabaseTest dùng PostgreSQL pgvector Testcontainers/Flyway; upgrade V8 → V9 giữ account cũ; hai Teacher riêng; setup/login qua AuthenticationManager thật; pending/locked bị chặn; setup không unlock; duplicate email khác case/race; rollback thiếu teaching field; mail fail/resend/cooldown/rotate token; expired/reused token; update giữ identifiers; ownership document/quiz và lớp rỗng; lock/unlock giữ owner. AdminAccountHttpTest chạy Spring Security thật cho 401/403/400/201 và rejects readonly payload. Auth/mail và toàn bộ suite chạy regression; NotificationPersistenceIntegrationTest cập nhật expected Flyway version từ 8 lên 9.

Frontend: `node --test tests/adminUserApi.test.mjs tests/adminStudentApi.test.mjs tests/adminUsersPage.test.mjs tests/adminTeacher.test.mjs` — 13 pass. Teacher form test tạo hai input khác nhau, validation blank, readonly edit, resend failure/queued và trạng thái locked. Đây là component/API tests, không gọi là browser E2E. `npm run build` pass; lint exit 0 còn warning repo, gồm set-state-in-effect ở các trang fetch dữ liệu. CI thêm adminTeacher test; Backend CI đã chạy toàn bộ Gradle tests.

Kết quả backend cuối cùng: `gradlew.bat test --no-daemon` BUILD SUCCESSFUL; 463 tests, 422 pass, 41 skipped, 0 failure. Riêng AdminAccountDatabaseTest có 7 tests PostgreSQL pass, không skip; gồm migration upgrade, hai race last-Admin và các luồng Teacher mới. Các test skipped của suite không được tính là đã kiểm chứng. Frontend build và lint chạy lại thành công sau thay đổi cuối; 13/13 tests Admin pass. `git diff --check` sạch. Chưa có merged PR/commit, remote CI, staging URL/deploy, mail thật trên staging, browser desktop/mobile visual QA hoặc PO sign-off. ADM-122 và story giữ mở. Không tick các checklist release/PO khi chưa có bằng chứng.

## Kịch bản ADM-122 còn cần thực thi trên môi trường tích hợp

1. Dùng Admin thật tạo Teacher A/B qua /admin/users. Kiểm tra inbox thử nghiệm, queued/sent/failed và resend. Dùng hai link setup riêng; đăng nhập từng Teacher, thử link dùng lại/hết hạn.
2. Mỗi Teacher tạo tài liệu/quiz, kiểm tra owner/list, thử truy cập chéo trả 403; lớp chính quy ban đầu rỗng, study class do Teacher tự tạo là luồng riêng.
3. Admin sửa profile, khóa khi Teacher đang có phiên, thử API/refresh/WebSocket theo S1-US1; setup lúc locked không unlock. Mở khóa và đối chiếu content/history.
4. Chạy visual/keyboard/mobile QA, export `/v3/api-docs` từ build deploy, kiểm tra DTO/routes mới; ghi CI URL, commit, staging URL, thời điểm và người nghiệm thu theo mẫu mục 12.
