# S2-US1 — Dashboard Admin: contract và kiểm chứng

Ngày 02/11/2026. ADM-201..207: hoàn tất đầu ra kỹ thuật; ADM-208: đang mở cho staging/PO và xác nhận tải HTTP. Story ở Review/QA, chưa đạt DoD release. Quy ước metric dưới đây là baseline triển khai để PO xem xét, không tự xác nhận PO acceptance.

## Metric và phạm vi

Dashboard toàn thời gian, toàn hệ thống, không phụ thuộc role/owner hoặc một page học sinh. Không có filter thời gian trong sprint này; không có biểu đồ tùy chọn. Timezone hiển thị `Asia/Ho_Chi_Minh`; timestamp API UTC ISO-8601. Không chia bucket ngày nên không có cắt ngày; fixture kiểm tra cả 16:59:59Z và 17:00:00Z (ngay trước/sau nửa đêm Việt Nam) đều được tính. Query from/to/range bất kỳ trả 400, tránh client tưởng đã lọc khi server bỏ qua.

| Trường | Quy tắc |
|---|---|
| totalUsers | COUNT users WHERE NOT is_deleted; mọi role, gồm locked và invitation pending. Không suy ra active từ hoạt động; không công bố tỷ lệ active. |
| totalDocuments | Mọi document còn tồn tại, gồm PROCESSING/SUCCESS/FAILED; không loại tài liệu của owner locked/deleted. |
| totalQuizzes | Mọi quiz còn tồn tại, gồm draft/published/archived/inactive, mọi chủ sở hữu. |
| chatCount | COUNT chat_sessions, mọi status, kể cả session rỗng. Không đếm messages/câu trả lời AI. |
| attemptCount | COUNT quiz_attempts có submitted_at; gồm lịch sử is_visible=false và dữ liệu owner đã khóa/xóa mềm. Không tính draft hoặc record chưa nộp; không lọc theo XP award. |
| updatedAt | statement_timestamp() từ DB, thời điểm bắt đầu snapshot của lần truy vấn thành công. Không thay timestamp khi refresh lỗi. |

Ví dụ fixture: 3 users gồm Admin, Teacher locked, Student deleted → totalUsers=2; 3 documents với ba trạng thái → totalDocuments=3; 1 quiz → totalQuizzes=1; 2 chat_sessions ở hai phía nửa đêm Việt Nam → chatCount=2; 2 submitted attempts ẩn + 1 chưa nộp → attemptCount=2. Thêm quiz mới → lần đọc tiếp theo totalQuizzes=2. DB rỗng trả năm số 0.

## API / bảo mật / hiệu lực cập nhật

`GET /api/v1/dashboard/admin`, Admin only, không query params. Response envelope ApiResponse: success=true, data={totalUsers,totalDocuments,totalQuizzes,chatCount,attemptCount,updatedAt}. Response Cache-Control: no-store. Anonymous 401, Student/Teacher 403; filter không hỗ trợ 400; DB failure 500 với thông báo an toàn không lộ connection string/SQL.

Controller có Operation và DTO Schema để springdoc sinh OpenAPI. Endpoint/DTO được kiểm tra qua HTTP security test. Cần export `/v3/api-docs` từ build staging ở ADM-208 để lưu artifact phiên bản triển khai.

Repository dùng JdbcTemplate, một SELECT gồm năm scalar COUNT subqueries, một MVCC statement snapshot. Không joins gây nhân bản, không hydrate entity, không N+1, không đọc danh sách rồi count trong Java/FE. Không cache; mỗi GET sau transaction nghiệp vụ commit phản ánh dữ liệu mới. UI không polling; Admin nhấn Làm mới. Thay đổi xảy ra sau snapshot chỉ xuất hiện ở lần đọc tiếp theo. Aggregate toàn thời gian có chi phí tuyến tính với dữ liệu; không hứa tốc độ độc lập kích thước DB.

## Giao diện

Đã thay dashboard cũ bằng năm KPI thực, giải thích cách tính ngắn gọn, timestamp giờ Việt Nam, loading/empty/error/retry, disable thao tác refresh đang pending, AbortController khi unmount. Refresh lỗi giữ dữ liệu và timestamp cũ kèm nhãn “chưa cập nhật”, không biến lỗi thành 0. API client kiểm tra schema, số nguyên không âm và timestamp; không có fallback 95%/128 hay số giả.

Bỏ biểu đồ hard-code, tăng trưởng, điểm trung bình, streak, chất lượng AI và health/uptime không có nguồn đo. Responsive grid theo theme hiện có; error role=alert, status live, focus-visible, icon trang trí aria-hidden. /admin chuyển tới /admin/dashboard. Links đã có route: users, students, quizzes, settings; không thêm drill-down tài liệu/chat/attempt khi chưa có trang Admin tương ứng. Link tài khoản/quiz là điều hướng quản lý, không giả vờ là danh sách có cùng bộ lọc metric.

## Bằng chứng kỹ thuật

- Backend targeted `gradlew.bat test --no-daemon --tests '*AdminAccountDatabaseTest' --tests '*AdminAccountHttpTest'`: BUILD SUCCESSFUL. PostgreSQL Testcontainers áp dụng V1..V9 và upgrade V8→V9 hiện có. Không có schema/index mới cho dashboard (N/A migration mới).
- `dashboardCountsRealRowsAndFreshChangesWithoutDateOrOwnerFiltering`: DB rỗng, fixture số đếm xác định, locked/deleted, ba trạng thái document, submitted/hidden/unsubmitted attempts, biên nửa đêm Việt Nam và đọc mới sau insert quiz.
- `dashboardSecurityValidationAndFailure`: Spring MVC + Spring Security thực cho 401/403/Admin/400, response fields, no-store và lỗi DB không lộ chi tiết.
- `dashboardQueryPlanAndConcurrentSmokeOnTwentyThousandAccounts`: 20.000 users, ANALYZE và EXPLAIN (ANALYZE, BUFFERS), 20 concurrent repository reads với expected count=20000. Lần chạy đầu: execution 8.647ms; max repository read 60ms; tổng wall 66ms. Full regression cuối: execution 9.431ms; max read 59ms; wall 63ms. PostgreSQL chọn sequential scan users; các bảng khác rỗng trong dataset hiệu năng này. Đây là baseline local cho nhánh accounts, chưa đại diện data volume documents/chat/attempt production hoặc tải HTTP. Không thêm index/cache khi chưa có bằng chứng cần thiết. Log plan nằm trong XML report của test.
- `npm run build`: pass. `npm run lint`: exit 0, vẫn có warnings trong repo, gồm set-state-in-effect ở dashboard fetch effect; không coi lint warning là zero warning.
- `node --test tests/adminDashboard.test.mjs tests/adminTeacher.test.mjs tests/adminUserApi.test.mjs tests/adminStudentApi.test.mjs tests/adminUsersPage.test.mjs`: 15/15 pass. Hai tests mới kiểm tra auth/no-store/cancel/schema/zero/error; render loading→actual counts→refresh failure giữ data/timestamp→retry→zero, timezone và links. Dùng JSDOM, không gọi là browser E2E/visual QA.
- CI frontend thêm adminDashboard.test.mjs; backend pipeline hiện có chạy full Gradle suite. Chưa có remote CI cho commit merge.

Kết quả full backend cuối cùng: BUILD SUCCESSFUL, 466 tests, 425 pass, 41 skipped, 0 failure. Riêng 9 PostgreSQL tests và 7 HTTP tests Admin đều pass, không skip. Báo cáo: ai-tutor-service/build/reports/tests/test/index.html. Các tests skip không được tính là đã kiểm chứng. Không sửa Teacher analytics/Student dashboard/service nghiệp vụ; full regression kiểm tra các service dùng chung.

## ADM-208 và nghiệm thu còn mở

Cần deploy build đã merge lên staging, chạy smoke/load HTTP tối thiểu 20 concurrent với dữ liệu đại diện đủ cả năm bảng, lưu cấu hình máy/dataset/p50/p95/error rate và đối chiếu mục tiêu <2 giây; không suy ra load HTTP đạt từ repository benchmark. Cần browser visual/keyboard/mobile QA, export OpenAPI, CI URL và PO sign-off theo mục 10/12 tài liệu kế hoạch.

Demo staging: reset dataset có expected counts → login Admin/dashboard → Teacher tạo quiz/document và Student tạo chat/nộp attempt → refresh → đối chiếu DB với năm KPI và timestamp; ngắt backend → refresh lỗi phải giữ nhãn cũ → khôi phục → retry thành công. Ghi commit, URL, thời điểm, expected/actual và người xác nhận. Không tick Done story/ADM-208 trước khi có evidence.
