# S4-US1 — Quản lý quiz và kết quả toàn hệ thống

Ngày 02/11/2026. Phạm vi ADM-401..405 và phần regression kỹ thuật quiz của ADM-412. Các task hồ sơ/học sinh/settings/logs/audit của S4-US2 không được tự đóng trong story này. Story còn Review/QA, không Accepted/Done khi thiếu browser/staging/PO.

## Review và contract quyền (ADM-401)

QuizAccess.require/get/list/statistics/export: Admin xem nội dung mọi owner; Teacher chỉ own quiz. Các mutation QuizManagementService dùng requireLocked: khóa hàng Quiz rồi kiểm tra quyền owner, serialize edit/generate/assign/remove/publish/delete. Không dựa vào route frontend để xác định quyền. GenerationJobService validate quyền quiz trước khi tạo job; poll/job result theo actor ID. Admin không chiếm quyền sở hữu quiz khi sửa hoặc publish.

Ngân hàng câu hỏi ACTIVE là tài nguyên đọc chung cho Admin/Teacher, có thể tái sử dụng vào quiz bằng snapshot. Sửa/xóa/bulk-delete câu hỏi chỉ owner hoặc Admin; đọc PENDING, sửa/xóa/confirm/discard batch cũng bị giới hạn owner/Admin bằng QuestionBankAccess ở HTTP method security. Student không được đọc ngay cả câu ACTIVE. Confirm batch không còn là IDOR do biết batchId. Các service nội bộ vẫn được worker gọi trực tiếp với chính sách quyền tại entry point; không coi các method nội bộ không có principal là API công khai.

Các API shared /quizzes, /question-bank, /teacher/classes giữ tương thích. TeacherClassController cho cả Admin/Teacher: Admin list mọi lớp, Teacher theo assignment; tên prefix /teacher không đồng nghĩa Admin bị cấm. Publish study targets dùng principal; Admin thấy mọi study class ACTIVE, Teacher chỉ own. NotificationLinks.quiz đã phân nhánh ADMIN→/admin/quizzes/{id}, TEACHER→/teacher/quizzes/{id}; useAssessmentBase và editor/list/statistics giữ prefix theo route. Không đổi link notification Student.

## Publish và duyệt AI (ADM-402)

POST /api/v1/quizzes/{id}/publish kiểm tra ít nhất một snapshot câu hỏi, rồi xác thực từng snapshot bằng QuestionContentRules: stem/explanation/difficulty, đáp án thuộc options, options hợp lệ/không trùng keys, single-choice đúng một đáp án và tối thiểu hai phương án; true-false hai phương án; multi-select ít nhất hai đúng và còn phương án sai; fill-blank có correctText. Câu nguồn phải ACTIVE. Null/malformed options và duplicate answer keys bị từ chối. Không tin số câu hỏi hoặc validation FE. Target class/grade/ownership và publish window kế thừa các guard hiện có.

Migration V10 thêm quizzes.review_required=false; AI quiz chưa PUBLISHED hiện có được yêu cầu review, quiz đã publish giữ khả dụng. AI generate mới đặt reviewRequired=true. DTO QuizResponse thêm reviewRequired. POST /quizzes/{id}/review (Admin/owner Teacher) validate snapshots, kiểm tra nội dung được phép sửa rồi lưu reviewRequired=false. UI editor có nút xác nhận “Tôi đã kiểm tra và duyệt câu hỏi AI”; pending guard chống double click. Review chỉ xác nhận phiên bản hiện tại; generate lần nữa yêu cầu review lại. Không tạo cơ chế audit reviewer/time trong story này (thuộc ADM-410).

Không tự ép Student practice AI dùng review Admin; luồng Student sinh bài luyện tập riêng giữ nguyên. Quiz bank ACTIVE đã qua bước duyệt được tái dùng theo snapshot, không bắt duyệt lại chỉ vì source được AI hỗ trợ tạo.

## Bảo toàn bài làm (ADM-403)

Chính sách: không đổi nội dung/cấu hình quiz sau khi có bất kỳ submitted attempt hoặc draft bài làm Student nào (kể cả draft hoàn tất/hết hạn). Áp dụng cho update metadata/timeLimit/maxAttempts/passingScore/subject/grade/lesson, assign/remove/generate và review. Quiz đang PUBLISHED phải chuyển về Draft trước khi sửa; nếu đã có bài làm thì chuyển Draft cũng không mở lại quyền sửa. Admin cần tạo quiz mới nếu muốn nội dung khác. Không tự clone/version/history migration ngoài scope.

Student saveDraft lấy khóa cùng hàng Quiz qua requireQuizLocked; Admin check draft/attempt sau khóa, tránh race “check chưa có attempt rồi sửa” khi Student đang bắt đầu bài. Các handler submit/expiry đọc draft đã tồn tại nên guard giữ bộ câu hỏi gốc. Delete cũng bị chặn nếu có draft hoặc attempt. QuizAccessService read-only content giữ truy vấn thường; đường ghi draft dùng lock trong transaction.

Draft/archive/publish trạng thái và publish targets/window vẫn được thay đổi để quản trị quyền làm bài; không xóa câu hỏi/đáp án/score/XP/attempt lịch sử. Không có UPDATE lịch sử để tính lại điểm. Khi quiz đã có câu hỏi nhưng chưa có bài làm, đổi subject/grade bị chặn đến khi gỡ bộ câu hỏi nhằm tránh gán sai môn/khối.

## Báo cáo phân trang (ADM-404)

GET /api/v1/quizzes/{id}/report?page=1&size=20, page>=1, size 1..50. ApiResponse.data gồm quizId/title/passingScore, attemptCount, averageScore, passingRate, students[], page/size/totalElements/totalPages. students là aggregate theo học sinh (bestScore, attemptCount, lastSubmittedAt, passed), sort lastSubmittedAt DESC rồi studentId; không trả email/address/hash/token. Danh sách học sinh theo page, KPI tính trên toàn quiz. Chỉ tính attempts submitted_at!=null và score!=null; gồm is_visible=false để bảo toàn lịch sử report; không loại user locked/deleted. Điểm raw thang phần trăm như hệ thống quiz hiện có. averageScore null nếu chưa có bài; count=0; passingRate=0 nếu chưa có học sinh.

Dùng SQL COUNT/AVG/GROUP BY/LIMIT/OFFSET, không hydrate toàn bộ attempts để phân trang trong Java. Repeatable-read transaction để summary và page cùng snapshot. Frontend chuyển sang endpoint này; empty/error/retry/loading, reset page khi đổi quiz, bỏ response cũ khi unmount/đổi page. Nếu lỗi tải trang mới, không trình bày hàng cũ như trang mới.

Endpoint /statistics và export.xlsx cũ giữ tương thích, hiện vẫn tải toàn bộ attempts; UI danh sách mới không dùng chúng. Export là đường tải file tùy chọn, không coi là danh sách phân trang. Biểu đồ hardest-questions trên trang mới được bỏ để không dùng endpoint cũ tải vô hạn; không công bố số liệu giả. Có thể mở lại qua aggregate endpoint riêng trong story sau.

## Kiểm chứng kỹ thuật

- QuizManagementServiceTest: fixture publish cập nhật từ mock “count=1 nhưng rows rỗng” sang snapshot hợp lệ; tests quyền lớp, grade, availability window kế thừa; thêm chặn snapshot đáp án sai/unreviewed AI, review thành công, started draft chặn update/delete. Đây là sửa fixture để kiểm tra validation thật, không bỏ assertion lỗi.
- AdminAccountDatabaseTest.quizReportPagesStudentsWithGlobalCountsAndRestrictsOwners dùng PostgreSQL thật, V1..V10, quiz của Teacher A và 23 học sinh có attempt 80 điểm bị ẩn: Admin page 2 size20 có 3 hàng, totalElements=23, attemptCount=23, avg=80, totalPages=2; Teacher B bị cấm. Các fixture ownership document/quiz và race last Admin tiếp tục chạy.
- QuestionBankAccessTest: ACTIVE read shared, PENDING private, mutation owner/Admin, Student bị cấm; bulk không vượt owner.
- HTTP AdminAccountHttpTest bổ sung report 401/403/400, staff review/publish/archive, forbidden owner surfaced. Đây là Spring Security thực với mock service; SQL/ownership thật được kiểm tra riêng ở PostgreSQL test.
- adminQuiz.test.mjs: hai test pass cho report pagination/reset/error/retry/Admin link và review/report auth contract. CI frontend bổ sung test này. Build frontend pass, lint exit 0 còn warning repo; toàn bộ frontend Admin 18/18 pass.
- Migration V10 được chạy trong PostgreSQL test cùng baseline/upgrade V8→latest. NotificationPersistenceIntegrationTest cập nhật expected migration version 9→10; không sửa migration đã phát hành.
- Lần backend đầu thất bại 7 test publish do fixture count=1 nhưng snapshot rỗng; targeted run sau sửa fixture đã BUILD SUCCESSFUL. Full regression: BUILD SUCCESSFUL, 476 tests, 435 pass, 41 skipped, 0 failures. Báo cáo ai-tutor-service/build/reports/tests/test/index.html. Thay đổi validation cuối được chạy lại nhóm QuizManagementServiceTest + QuestionBankAccessTest: 15 tests, 0 failure, BUILD SUCCESSFUL. Frontend build cuối sau cleanup pending guard được xác nhận riêng (không dựa exit code của chuỗi lệnh). Không tính tests skip là đã kiểm chứng.

## Gate còn lại

ADM-405 chỉ xong code review/routes và component tests, chưa có browser E2E Admin create→generate→review→publish→statistics và Teacher regression trên desktop/mobile. ADM-412 còn mở cho Student submit/XP/idempotency runtime, chat/RAG liên quan, remote CI/merge, export OpenAPI từ build staging, migration upgrade dữ liệu đại diện và PO sign-off. Các bài integration bật bằng QUIZ_INTEGRATION không mặc nhiên coi là chạy khi suite skip.

Kịch bản nghiệm thu: Admin tạo quiz có câu bank hợp lệ và quiz AI→xem từng câu→review→publish tới lớp→Student làm/nộp bài→Admin xem report; thử Teacher B sửa/generate/publish/report quiz A, Admin làm tương tự; thử publish 0 câu/sai key/2 đáp án đúng single-choice/PENDING AI; thử sửa/xóa sau Student bắt đầu/nộp; đối chiếu history/score/XP không đổi. Ghi staging URL, commit, CI URL, expected/actual và PO theo mẫu mục 12.

Chưa rebuild Docker đang phục vụ localhost:3000. Để thử source mới: docker compose up -d --build ai-tutor-service ai-tutor-frontend, chờ healthy rồi Ctrl+F5. Migration V10 chỉ thêm trạng thái review, không xóa dữ liệu.
