# Kế hoạch hoàn thiện Admin theo SRS

Ngày lập: 02/11/2026. Baseline: [AI_Tutor_SRS_MVP.md](AI_Tutor_SRS_MVP.md), phiên bản 2.0.

Cập nhật phạm vi: Admin tạo và quản lý tài khoản Teacher theo yêu cầu bổ sung ngày 02/11/2026. Đây là chức năng bắt buộc của milestone Admin đang lập kế hoạch; phần tạo Teacher là yêu cầu bổ sung cụ thể hóa quản lý tài khoản, không tự gán là AC nguyên bản của FR-AUTH-05.

## 1. Mục tiêu và cách quản lý

Hoàn thiện các luồng Admin để đáp ứng yêu cầu chức năng, phi chức năng, Definition of Done (mục 14.2) và điều kiện nghiệm thu phát hành (mục 15.3) của SRS. Có màn hình hoặc có API chưa đồng nghĩa với Done: mỗi story cần được kiểm thử, triển khai tích hợp và xác nhận nghiệm thu.

- Mỗi mã task bên dưới có thể tạo thành một issue; dùng checkbox để theo dõi.
- Vai trò: BE = Backend, FE = Frontend, AI = AI/RAG, QA = kiểm thử, DO = DevOps, PO = người đại diện nghiệm thu.
- Trạng thái gợi ý: Todo → In progress → Review → QA → Accepted/Done. Chỉ tick task khi có bằng chứng tương ứng.
- Mỗi issue ghi: FR/US liên quan, người phụ trách, phụ thuộc, Acceptance Criteria (AC), PR/commit, kết quả kiểm thử, môi trường và người nghiệm thu.
- Task kế thừa code có sẵn vẫn phải kiểm tra trước khi đánh dấu hoàn tất; không triển khai lại chỉ vì tên endpoint khác API tham chiếu trong SRS.

## 2. Hiện trạng làm cơ sở lập kế hoạch

Đánh giá từ source code; chưa xác nhận build, runtime, staging hoặc PO acceptance trong lần lập kế hoạch này.

| Nhóm | Đã có | Công việc còn lại |
|---|---|---|
| Tài khoản | `UserController` có list/search theo role, create/update, status, role và soft delete | UI `/admin/users` đang placeholder; bổ sung bảo vệ Admin cuối cùng, kiểm tra nhất quán hồ sơ theo role và phiên đăng nhập |
| Giáo viên | `UserServiceImpl.createProfile` đã tạo User TEACHER + Teacher, sinh teacherCode và gửi email setup; entity Teacher có user_id/teacher_code unique | Thiếu UI tạo/quản lý, DTO chi tiết Teacher; cần hoàn thiện invitation/activation và kiểm chứng nhiều Teacher độc lập với seed demo |
| Học sinh | Admin Student API, list/detail/form/confirm dialog, test service/controller/API client; Backend có import Excel | Kiểm tra AC thực tế, quyền, lỗi/empty, định danh, bảo toàn lịch sử; import không bắt buộc phải mở UI trong đợt này |
| Dashboard | Có trang Admin; chỉ lấy danh sách 10 học sinh, nhiều KPI/biểu đồ hard-code | Aggregate toàn hệ thống, định nghĩa metric, dữ liệu thật, error/empty/retry, kiểm tra hiệu năng |
| Tài liệu | `DocumentController` và `DocumentLifecycleService` đã list/update metadata/delete, Admin được quản lý mọi tài liệu; có API ingest PDF | Route/UI Admin chưa có; kiểm tra phân trang, metadata, trạng thái xử lý, validation và toàn vẹn RAG |
| Quiz/câu hỏi | Có route và màn hình dùng chung cho Admin/Teacher, editor/publish/statistics | Xác nhận quyền Admin trên nội dung mọi chủ sở hữu; phân trang kết quả, validation publish, bảo vệ lịch sử |
| Settings/logs | Có màn hình và API settings, maintenance, logs | Kiểm tra secret, hiệu lực cấu hình, log nhạy cảm, quyền và khả năng chẩn đoán |
| DoD phát hành | Có migration, Docker và hạ tầng test trong repo | Thu thập bằng chứng CI, database sạch, E2E, staging, backup/restore và PO sign-off |

Lưu ý điều chỉnh từ review trước: không coi Backend tài liệu là chưa tồn tại; ưu tiên mở rộng API hiện có. Đổi route mặc định `/admin` sang dashboard là cải thiện điều hướng, không phải một AC bắt buộc độc lập của SRS.

## 3. Phạm vi và truy vết yêu cầu

| Yêu cầu SRS | Kết quả cần đạt trong phạm vi Admin | Sprint |
|---|---|---|
| FR-AUTH-01..06; US-01, US-02 | Xác thực/phân quyền, list/search/khóa/mở khóa mọi role, không làm mất Admin hoạt động cuối cùng | 1, 5 |
| Yêu cầu bổ sung Admin tạo/quản lý Teacher; liên quan mục 3.3, FR-AUTH-04,05, US-02 | Admin tạo tài khoản và hồ sơ Teacher, xem/sửa thông tin cho phép, khóa/mở khóa; giáo viên mới đăng nhập bằng tài khoản riêng | 1, regression 4, nghiệm thu 5 |
| FR-PRO-01..04 | Luồng quản lý học sinh không làm sai quan hệ User/Student, email, XP, level, streak | 1, 4 |
| FR-REP-03; US-12 | Tổng user, tài liệu, quiz, lượt chat và attempt từ dữ liệu thật | 2 |
| FR-DOC-01..06; US-06 | Admin upload, xem trạng thái, quản lý mọi tài liệu; chỉ SUCCESS được retrieval | 3 |
| FR-QUIZ-01..04; US-07 | Admin tạo/sửa/publish nội dung hợp lệ, quản lý quiz mọi chủ sở hữu | 4 |
| FR-REP-04; US-14 | Kết quả mọi quiz, số lượt làm/điểm trung bình, danh sách có phân trang | 4 |
| Ma trận quyền mục 3.4 | Kiểm tra cập nhật hồ sơ cá nhân Admin và quyền xem XP/leaderboard đã được mô tả | 4 |
| NFR-PERF-01,03,04 | CRUD mục tiêu <2 giây, danh sách phân trang 20–50 bản ghi, tải tối thiểu 20 người đồng thời | Xuyên suốt, xác nhận 5 |
| NFR-SEC-01..08 | Server-side RBAC/ownership, secret env/store, upload an toàn, không lộ thông tin, HTTPS/CORS | Xuyên suốt |
| Mục 11.3..11.6 | Toàn vẹn dữ liệu, responsive và các UI state, OpenAPI, traceId, logging/health | Xuyên suốt |
| Mục 14.2, 15.3, 20 | Merge/build/test/migration/OpenAPI/staging/PO và kịch bản nghiệm thu | Mỗi sprint; gate cuối ở 5 |

FR-REP-02 và dashboard Teacher nằm ngoài phần triển khai mới của kế hoạch này, nhưng phải regression nếu sửa service dùng chung. Các luồng Student/Teacher liên quan tài liệu, quiz, XP và chat cũng cần regression.

Phân loại phạm vi:

- **Bắt buộc SRS:** các yêu cầu Must và NFR áp dụng, AC user story tương ứng.
- **Cải thiện để vận hành:** thao tác status idempotent, audit thao tác quản trị, loại bỏ thông tin sức khỏe hệ thống giả. Được đưa vào sprint vì liên quan trực tiếp độ tin cậy của Admin, không gán thành FR mới của SRS.
- **Mở rộng tùy chọn:** restore tài khoản, retry tài liệu trên UI, bulk action, export quản trị nâng cao, MFA, Super Admin, multi-tenant. Chỉ kéo vào release sau khi thống nhất phạm vi; không dùng để trì hoãn nghiệm thu Must.

## 4. Tổng quan sprint

Giả định mỗi sprint 2 tuần, team 4 người theo SRS; đây là dự kiến năng lực, chưa phải cam kết ngày phát hành. Nếu một người triển khai, giữ thứ tự phụ thuộc và điều chỉnh thời lượng theo velocity. Không chốt lịch theo ngày trước khi thống nhất nguồn lực.

| Sprint | Mục tiêu | Kết quả demo | Phụ thuộc |
|---|---|---|---|
| 1 | Tài khoản và nền tảng an toàn | Admin quản lý user ba role, khóa/mở khóa đúng, không mất Admin cuối cùng | Contract và dữ liệu test |
| 2 | Dashboard số liệu thật | KPI đúng DB, refresh/error/empty hoạt động | Quy ước user/status từ sprint 1 |
| 3 | Quản lý tài liệu/RAG | Admin quản lý tài liệu mọi Teacher và theo dõi xử lý | Auth và contract tài liệu |
| 4 | Hoàn thiện luồng quản trị dùng chung | Quiz/kết quả, học sinh, hồ sơ Admin, settings/logs đạt AC | Sprint 1–3; giữ regression Teacher/Student |
| 5 | Nghiệm thu phát hành | CI xanh, migration sạch, E2E/load test, staging, backup/restore và PO sign-off | Toàn bộ Must đã qua QA |

Các task thiết kế contract/test plan được làm đầu sprint; QA/DevOps tham gia từ sprint 1, không dồn toàn bộ kiểm thử/deploy vào sprint 5. Story không qua exit gate được chuyển tiếp công khai, không tick Done để đóng sprint.

Sprint 1 được bổ sung luồng Teacher ở mục 5.1, bao gồm demo tạo Teacher mới → thiết lập mật khẩu → đăng nhập → Admin quản lý. Nếu vượt capacity 2 tuần, tách thành Sprint 1A (ADM-101..110) và Sprint 1B (ADM-111..122) trước Sprint 2; khi đó tổng kế hoạch là 6 vòng sprint, dự kiến 12 tuần với team giả định. Không âm thầm giữ ước lượng cũ sau khi tăng phạm vi.

## 5. Sprint 1 — Tài khoản người dùng và bảo mật

Tiến độ triển khai S1-US1: ADM-101..109 đã có implementation và kiểm thử kỹ thuật tương ứng; xem [contract và chính sách phiên](admin-account-contract.md). Checkbox task dưới đây phản ánh đầu ra kỹ thuật đã hoàn thành, không thay cho Done của story theo mục 10: story còn chờ merged commit/remote CI, staging, visual QA trên trình duyệt và PO acceptance. ADM-110 vẫn mở cho các đầu ra này; không tự xác nhận nghiệm thu sản phẩm.

Bằng chứng kỹ thuật: Backend full `gradlew.bat test` đã pass; Testcontainers áp dụng V1–V8 trên PostgreSQL sạch, search/status và hai race lock/delete pass; HTTP RBAC/validation/conflict pass; 11 frontend API/component tests pass; frontend production build pass. Lint chạy thành công nhưng còn warning, gồm warning set-state-in-effect ở page mới. WebSocket broker trực tiếp đã pass; chế độ nginx proxy trên Docker Windows bị HTTP upgrade timeout và cần kiểm tra lại trên staging (không coi là pass). Các kiểm tra cuối sau cleanup được ghi trong contract.

Story S1-US1: Là Admin, tôi muốn tìm và khóa/mở khóa tài khoản của mọi role để kiểm soát truy cập. Liên kết FR-AUTH-03..06, US-01, US-02, NFR-SEC-02,08.

| Task | Phụ trách | Công việc và đầu ra kiểm chứng |
|---|---|---|
| [x] ADM-101 — **Done** | BE + FE + QA | Contract `/users/accounts` và status được ghi tại `admin-account-contract.md`; DTO an toàn, ma trận quyền qua HTTP tests, dataset ba role và PostgreSQL fixture |
| [x] ADM-102 — **Done** | BE | List/query có role/status/search, pagination 1-based mặc định 20/tối đa 50, sort whitelist và ID tiebreaker; lọc server-side, loại deleted; kiểm thử DB thật |
| [x] ADM-103 — **Done** | BE | PUT/PATCH status nhận `{active: boolean}`; client học sinh và Postman đã cập nhật; endpoint không còn toggle; kiểm thử retry và thiếu body |
| [x] ADM-104 — **Done** | BE | Guard Admin cuối cùng cho lock/delete bằng transaction + ordered row locks; đổi role khác trả 409 để bảo toàn profile; hai race PostgreSQL pass |
| [x] ADM-105 — **Done** | BE | DB authoritative ở mỗi authentication, kiểm tra enabled; refresh từ chối account khóa/xóa, WebSocket recheck inbound và chặn outbound subscription cũ; chính sách phiên và giới hạn được ghi trong contract |
| [x] ADM-106 — **Done** | FE | `/admin/users` và menu hoạt động; API client, responsive list, debounce 300ms, role/status/sort, pagination/reset, loading/empty/error/retry; build và component/API tests pass |
| [x] ADM-107 — **Done** | FE | Native dialog có focus/keyboard, confirm trạng thái đích, disable + pending guard chống double-click; hiển thị lỗi, reload sau thành công; component test pass |
| [x] ADM-108 — **Done** | BE + QA | Rà nhánh tạo/update profile hiện có, soft delete giữ history; chặn đổi role khác khi chưa có quy trình chuyển profile. Không mở UI create/role/delete trong S1-US1; tạo Teacher ở S1-US2 |
| [x] ADM-109 — **Done** | QA | HTTP Spring Security tests 401/403/Admin/400/409; service tests, DB search/deleted/retry và race last-Admin trên PostgreSQL qua Testcontainers; không chỉ assert annotation |
| [ ] ADM-110 | DO + BE | Cập nhật OpenAPI; đưa build/test liên quan vào CI, deploy tích hợp bằng migration có version; chuẩn bị seed ba role và lưu kết quả demo/PO acceptance |

Chi tiết ADM-110: route/DTO đã được khai báo để springdoc sinh OpenAPI; CI đã bổ sung frontend Admin tests (Backend tests đã có); PostgreSQL test fixture/migration sạch đã chạy. Chưa có remote CI của commit đã merge, staging deployment, browser visual QA và PO sign-off. Không cần schema migration mới cho story này.

AC/exit gate:

- Admin tìm được tài khoản Student/Teacher/Admin từ dữ liệu thật và phân trang đúng.
- Khóa/mở khóa có confirm; gửi lại cùng trạng thái không làm đổi kết quả; user khóa không login được.
- Trường hợp tài khoản bị khóa giữa phiên có kết quả đúng chính sách đã chốt, kèm kiểm thử API và kênh realtime liên quan.
- Không thể vô hiệu hóa Admin hoạt động cuối cùng, kể cả request đồng thời hoặc qua endpoint khác.
- Non-admin bị chặn ở server; UI xử lý đủ các state; story đã triển khai tích hợp và PO xác nhận.

### 5.1. Bổ sung bắt buộc — Admin tạo và quản lý Teacher

**Khả thi với codebase hiện tại:** không cần đổi kiến trúc hoặc tạo hệ thống đăng nhập riêng. Tái sử dụng `UserController` (`POST/GET/PUT /api/v1/users`, endpoint status) và `UserServiceImpl`. Nhánh `role = TEACHER` đã tạo hồ sơ Teacher trong service có transaction, sinh mã `TEA-*` và token setup hết hạn sau 24 giờ. `Teacher` liên kết 1-1 với `User`; các service lớp học/analytics tra hồ sơ bằng user ID hiện tại.

Tài khoản `teacher.demo@aitutor.vn` hiện diện trong `AnalyticsDemoDataSeeder`, giới hạn bởi profile `dev` và `app.analytics.seed-demo=true`. Điều này chứng minh có tài khoản fixture cố định, chưa chứng minh toàn bộ ứng dụng bị giới hạn chỉ một Teacher. Cần kiểm chứng runtime nhiều tài khoản và tìm mọi phụ thuộc demo trước khi nghiệm thu.

Các khoảng trống cần xử lý:

- `UserCreateRequest` đang bắt buộc password dù sau đó gửi email setup; cần thống nhất một luồng invitation rõ ràng.
- `UserResponse` hiện chỉ chứa thông tin User, chưa có teacherId/teacherCode/department/subjectTaught/schoolName để điền form chi tiết giáo viên.
- Có cập nhật nhánh Teacher trong `updateProfile`, nhưng cần validation theo role và kiểm thử field được sửa.
- Teacher mới không mặc nhiên có phân công lớp; không sao chép assignment hoặc dữ liệu từ Teacher demo.

Tiến độ 02/11/2026: **ADM-111..121 Done ở mức đầu ra kỹ thuật**, có contract, implementation và test tương ứng tại [admin-teacher-contract.md](admin-teacher-contract.md). **ADM-122 còn mở**, story ở Review/QA vì chưa có browser E2E/visual QA, merged commit/remote CI, staging và PO sign-off theo mục 10. Không đánh dấu story Accepted/Done khi chưa đạt các gate này.

**Story S1-US2:** Là Admin, tôi muốn tạo tài khoản giáo viên, xem/sửa hồ sơ và khóa/mở khóa tài khoản đó để mỗi giáo viên sử dụng danh tính riêng, không dùng chung tài khoản demo.

Luồng nghiệm thu: Admin → Tài khoản người dùng → bộ lọc Teacher → Thêm giáo viên → nhập form → tạo tài khoản/hồ sơ → email setup → giáo viên đặt mật khẩu → đăng nhập Teacher → Admin xem/sửa/khóa/mở khóa.

| Task | Phụ trách | Công việc và đầu ra kiểm chứng |
|---|---|---|
| [x] ADM-111 — **Done** | BE + FE + QA | Chốt contract Teacher: username, email, fullName, department, subjectTaught bắt buộc; schoolName theo quy tắc sản phẩm; teacherCode sinh phía server. Trên luồng tạo giáo viên, role cố định TEACHER; validate phía server, không tin hidden field của FE |
| [x] ADM-112 — **Done** | BE | Hoàn thiện create bằng service dùng chung hoặc DTO chuyên biệt tái sử dụng service; tạo đúng 1 User TEACHER + 1 Teacher trong transaction. Normalize email và kiểm tra uniqueness không phân biệt hoa/thường theo BR-01; xử lý conflict khi tạo đồng thời, không để orphan User/Teacher |
| [x] ADM-113 — **Done** | BE + FE | Chuẩn hóa invitation: Admin không cần đặt/biết mật khẩu Teacher; server sinh credential ngẫu nhiên không công bố, chỉ cho login sau khi setup thành công. Theo dõi invitation riêng với trạng thái khóa quản trị, tránh setup tự mở khóa Teacher đang bị Admin khóa. Giữ tương thích các luồng Student/Admin hiện có |
| [x] ADM-114 — **Done** | BE + DO | Hoàn thiện gửi lại email setup chỉ cho tài khoản chưa hoàn tất setup; token hết hạn/dùng lại bị từ chối, resend vô hiệu token cũ và có giới hạn tần suất. Chốt gửi mail sau commit và cơ chế retry phù hợp; mail lỗi có trạng thái/feedback, không báo đã gửi khi thất bại hoặc tạo tài khoản trùng khi retry |
| [x] ADM-115 — **Done** | BE | Bổ sung DTO list/detail Teacher hoặc projection cho `/users?role=TEACHER` và user detail, chứa teacherId/teacherCode/thông tin giảng dạy. Rà query N+1 và quyền; không trả password hash/setup token. Thêm schema/migration chỉ khi trạng thái invitation hoặc index/constraint thực sự cần |
| [x] ADM-116 — **Done** | BE + QA | Validate update Teacher: fullName, dateOfBirth, gender, phoneNumber, department, subjectTaught, schoolName; email/username/teacherCode/role readonly trong form này. Không cho ghi XP/quyền/phân công lớp qua payload hồ sơ. Không chuyển role trực tiếp để thay cho việc tạo Teacher |
| [x] ADM-117 — **Done** | FE | Bổ sung tab/filter Teacher trong `/admin/users`, list/detail và nút Thêm giáo viên; form create/edit và validation từng field; hiển thị invitation pending/đã setup/gửi lỗi theo contract, cùng trạng thái khóa riêng; loading/empty/error/retry và thao tác gửi lại email |
| [x] ADM-118 — **Done** | BE + FE + QA | Tái dùng status idempotent ADM-103 và cơ chế phiên ADM-105 cho Teacher; confirm khóa/mở khóa, giữ nguyên lớp/tài liệu/quiz/lịch sử. Xóa mềm nếu mở UI phải giữ dữ liệu và nêu rõ tác động; không bắt buộc hard delete/restore trong story này |
| [x] ADM-119 — **Done** | BE + FE + QA | Kiểm tra Teacher mới chưa có class assignment: hiển thị chưa có lớp/chưa được phân công, không lỗi 500 và không nhận quyền lớp demo. Phân biệt lớp chính quy với study class do Teacher tự tạo; quản lý phân công lớp bằng Admin là story riêng nếu chọn triển khai |
| [x] ADM-120 — **Done** | BE + QA | Integration với hai Teacher A/B mới tạo: account setup/login, profile 1-1, owner tài liệu/quiz, class scope, Student/Teacher không tạo được Teacher qua API Admin. Kiểm tra duplicate email khác hoa/thường, invalid field, transaction rollback, hết hạn/token dùng lại, resend và mail failure |
| [x] ADM-121 — **Done** | DO + QA | Rà phụ thuộc email/username/ID fixture trong service/frontend/seeder; tắt seed demo ở staging/production, không dùng mật khẩu demo để bootstrap vận hành. Giữ nguyên owner/history của dữ liệu cũ; tài khoản demo đã tồn tại được xử lý riêng sau khi có Teacher thật và kiểm tra quyền, không tự xóa |
| [ ] ADM-122 | QA + DO + PO | E2E Admin tạo Teacher → nhận mail ở môi trường kiểm thử → setup → Teacher login → tạo tài liệu/quiz trong scope riêng → Admin sửa/khóa/mở khóa. Cập nhật OpenAPI, CI, migration sạch/upgrade nếu có và PO sign-off theo DoD mục 10 |

Phụ thuộc triển khai: ADM-101/102 → ADM-111/112/115/116; ADM-113 → ADM-114 và UI invitation ADM-117; ADM-103/105 → ADM-118; các nhánh hoàn thành → ADM-120..122. FE có thể làm form theo contract trước khi Backend hoàn tất.

AC bắt buộc của S1-US2:

1. Admin tạo được ít nhất hai Teacher riêng biệt qua giao diện; mỗi tài khoản có role TEACHER, teacherCode unique và đúng một hồ sơ Teacher.
2. Tên đăng nhập/email trùng hoặc dữ liệu giảng dạy thiếu bị từ chối rõ ràng; không tạo bản ghi dở dang.
3. Teacher hoàn tất email setup và login bằng tài khoản riêng; không được login bằng credential nội bộ chưa setup. Token hết hạn/đã dùng không dùng lại được; mail lỗi có thể khắc phục mà không tạo user mới.
4. Admin tìm/lọc/xem/sửa được hồ sơ Teacher; các định danh/quyền readonly không bị đổi bằng payload ngoài UI.
5. Admin khóa/mở khóa đúng trạng thái; Teacher bị khóa không login, phiên đang có tuân thủ ADM-105; setup/resend không bypass khóa quản trị.
6. Teacher mới không được xem dữ liệu riêng của Teacher khác; không có lớp hiển thị empty state, không tự gán lớp demo.
7. Các dữ liệu/lịch sử đã tạo không mất khi khóa tài khoản; không ảnh hưởng Teacher hiện có.
8. Unit/integration/E2E cần thiết pass, OpenAPI cập nhật, deploy tích hợp và PO nghiệm thu. Tất cả task vẫn áp dụng checklist DoD chung.

Phạm vi chưa bao gồm: tự đăng ký Teacher công khai, duyệt chứng chỉ giáo viên, import Teacher hàng loạt, chuyển ownership hàng loạt hoặc xây hệ thống phân công giáo viên–lớp mới. Những phần này cần story/AC riêng nếu được yêu cầu.

## 6. Sprint 2 — Dashboard Admin từ dữ liệu thật

Story S2-US1: Là Admin, tôi muốn xem số liệu toàn hệ thống để theo dõi hoạt động. Liên kết FR-REP-03, US-12, NFR-PERF-01,03,04.

Tiến độ 02/11/2026: **ADM-201..207 Done ở mức đầu ra kỹ thuật**; quy ước metric, API và kiểm chứng được ghi tại [admin-dashboard-contract.md](admin-dashboard-contract.md). Metric dùng baseline triển khai toàn thời gian, chờ PO xem xét khi nghiệm thu. **ADM-208 còn mở** cho staging, tải HTTP, OpenAPI artifact, browser QA và PO; story chưa Accepted/Done theo mục 10.


| Task | Phụ trách | Công việc và đầu ra kiểm chứng |
|---|---|---|
| [x] ADM-201 — **Done** | BE + QA + PO | Chốt metric: user có loại deleted không, active là trạng thái tài khoản hay có hoạt động, chat đếm session hay message, attempt bao gồm trạng thái nào. Chốt timezone Asia/Ho_Chi_Minh và khoảng ngày; ghi ví dụ dữ liệu → kết quả |
| [x] ADM-202 — **Done** | BE + FE | Chốt API tổng quan, ưu tiên `/api/v1/dashboard/admin` theo SRS; DTO có totalUsers/totalDocuments/totalQuizzes/chatCount/attemptCount và thời điểm cập nhật. Filter thời gian phải chỉ rõ áp dụng cho KPI nào |
| [x] ADM-203 — **Done** | BE | Implement aggregate count/query trực tiếp tại DB, không suy ra tổng từ page học sinh; query/DTO/projection riêng, tránh N+1 và không trả entity; bảo vệ ROLE_ADMIN |
| [x] ADM-204 — **Done** | BE | Kiểm tra query plan với dữ liệu mẫu đủ lớn; thêm index qua migration nếu cần. Đo trước khi thêm cache; nếu cache, phải có TTL/invalidation và thời điểm cập nhật rõ |
| [x] ADM-205 — **Done** | FE | Tích hợp API, xóa KPI/biểu đồ/tỷ lệ hard-code, bỏ fallback 95%; các chỉ số mở rộng chưa có dữ liệu phải ẩn hoặc ghi không khả dụng. Không hiển thị uptime 99.9% hay “hoạt động tối ưu” khi chưa có nguồn đo |
| [x] ADM-206 — **Done** | FE | Loading/empty/error/retry, refresh và timestamp; lỗi refresh không làm dữ liệu cũ được hiểu là dữ liệu mới. Điều hướng `/admin` về dashboard nếu chốt UX; kiểm tra link drill-down |
| [x] ADM-207 — **Done** | QA + BE | Seed dữ liệu có expected count, đối chiếu API/DB/UI; test DB rỗng, account deleted/locked, biên ngày, query thời gian không hợp lệ, 401/403 và lỗi backend |
| [ ] ADM-208 | DO + QA | Smoke/load test ban đầu, OpenAPI, CI và staging; demo tạo quiz/chat/attempt mới rồi dashboard phản ánh đúng trong giới hạn cập nhật đã công bố |

AC/exit gate: đủ năm nhóm số liệu FR-REP-03, đúng dataset kiểm thử, không chứa số giả; database rỗng hiển thị 0; lỗi hiển thị rõ; dashboard đạt mục tiêu hiệu năng đã đo và qua PO acceptance trên môi trường tích hợp.

Biểu đồ xu hướng là tùy chọn. Nếu giữ biểu đồ hiện tại, phải có dữ liệu thật và định nghĩa khoảng thời gian; nếu không, bỏ khỏi release. Không bắt buộc bổ sung XP/cost/quality score để hoàn thành US-12.

## 7. Sprint 3 — Quản lý tài liệu và trạng thái RAG

Story S3-US1: Là Admin, tôi muốn quản lý tài liệu của mọi người tạo và biết trạng thái xử lý để bảo đảm nguồn học liệu dùng được. Liên kết FR-DOC-01..06, US-06, BR-06, NFR-SEC-04,08 và mục 11.3.

Tiến độ 02/11/2026: xem [contract và bằng chứng S3-US1](admin-document-contract.md). ADM-301/302/303/305/306/307 hoàn tất đầu ra kỹ thuật; ADM-304 có recovery implementation nhưng còn kiểm chứng crash/restart; ADM-308 và ADM-309 còn mở cho integration/E2E, staging và PO. Story chưa Accepted/Done theo mục 10.


| Task | Phụ trách | Công việc và đầu ra kiểm chứng |
|---|---|---|
| [x] ADM-301 — **Done** | BE + FE + AI | Rà `DocumentController`, `DocumentLifecycleService`, ingest PDF và curriculum/book APIs. Chốt phần tái sử dụng, contract metadata/status; không tạo bộ CRUD song song chỉ để đổi prefix `/admin` |
| [x] ADM-302 — **Done** | BE | Bổ sung pagination/filter cần thiết cho list tài liệu: tên, người tạo, môn, khối, trạng thái. DTO đủ filename/size/type/subject/grade/creator/status/createdAt; chẩn đoán lỗi không lộ secret/stacktrace cho client |
| [x] ADM-303 — **Done** | BE + AI | Kiểm tra upload loại/kích thước/tên file; trả document ID để theo dõi; lifecycle PROCESSING → SUCCESS/FAILED; failure giữ tài liệu gốc hợp lệ và trạng thái/lỗi có thể chẩn đoán |
| [ ] ADM-304 | BE + AI | Kiểm tra ingestion trùng/request lặp, exception/timeout và restart worker; tránh document ở PROCESSING vô thời hạn. Chốt cơ chế phục hồi job theo hạ tầng hiện có |
| [x] ADM-305 — **Done** | BE + AI | Xác nhận retrieval chỉ dùng SUCCESS; metadata filter đồng bộ khi sửa; xóa không để vector tiếp tục được truy xuất; kiểm tra citation/lịch sử khi tài liệu đã xóa và lỗi xóa file ngoài DB |
| [x] ADM-306 — **Done** | FE | Tạo `/admin/documents`, bật menu, list/filter/pagination và form upload; ưu tiên tái dùng component Teacher có kiểm tra đường dẫn/phân quyền |
| [x] ADM-307 — **Done** | FE | Hiển thị tiến độ/trạng thái, lỗi an toàn, creator và metadata; polling có hủy khi rời trang; form sửa phân loại và confirm xóa; loading/empty/error/retry |
| [ ] ADM-308 | QA + AI | Integration upload → chunk → retrieval; tài liệu SUCCESS có thể truy xuất, FAILED/PROCESSING không được dùng; Teacher A không sửa/xóa tài liệu Teacher B, Admin làm được; regression Teacher |
| [ ] ADM-309 | DO + QA | Test migration/index mới trên DB sạch và DB có dữ liệu; OpenAPI, CI/staging, chuẩn bị PDF hợp lệ/sai/vượt dung lượng; demo và PO acceptance |

AC/exit gate:

- Admin upload và theo dõi tài liệu bằng chính tài khoản Admin; xem/sửa/xóa được tài liệu của Teacher khác đúng contract.
- Danh sách phân trang; metadata đủ FR-DOC-02; có ba trạng thái và lỗi xử lý rõ ràng.
- Upload không hợp lệ bị từ chối; retrieval không dùng document chưa SUCCESS hoặc đã bị xóa.
- Lỗi LLM/embedding/storage không crash ứng dụng hoặc làm mất tài liệu gốc hợp lệ; đã kiểm thử quyền và toàn vẹn dữ liệu.

Retry tài liệu bằng nút trên UI là Should/extension; chỉ thêm sau khi đã có quy tắc xóa chunk cũ, chống job trùng và phục hồi an toàn. OCR/ảnh/bảng phức tạp không phải Must để đóng sprint này.

## 8. Sprint 4 — Hoàn thiện quiz, học sinh và công cụ vận hành

Story S4-US1: Admin quản lý quiz và kết quả mọi chủ sở hữu. Story S4-US2: Admin sử dụng các luồng hồ sơ/học sinh/cấu hình/logs an toàn. Liên kết FR-QUIZ-01..04, FR-REP-04, US-07, US-14, FR-PRO-01..04, mục 3.4 và NFR-SEC-03,05.

| Task | Phụ trách | Công việc và đầu ra kiểm chứng |
|---|---|---|
| [ ] ADM-401 | BE + QA | Kiểm tra service quản lý quiz, question bank, generation và statistics: Admin truy cập mọi quiz, Teacher chỉ đúng ownership. Không suy luận quyền chỉ từ route dùng chung |
| [ ] ADM-402 | BE + FE | Hoàn thiện create/edit/publish/archive theo code hiện có; chặn publish thiếu câu hỏi/đáp án không hợp lệ; bản single-choice đúng 1 đáp án, tối thiểu 2 phương án; câu AI cần được duyệt trước khi kích hoạt |
| [ ] ADM-403 | BE | Chốt hành vi sửa/xóa quiz đã có attempt: bảo toàn câu hỏi/điểm/XP và lịch sử. Áp dụng guard hoặc versioning theo thiết kế hiện có, không làm đổi kết quả đã nộp |
| [ ] ADM-404 | BE + FE | Kết quả quiz: lượt làm, điểm trung bình, danh sách phân trang, empty/error/retry; Admin xem được quiz của nhiều Teacher; chỉ trả dữ liệu cá nhân cần thiết |
| [ ] ADM-405 | FE + QA | Kiểm tra editor/publish target/notification link trong ngữ cảnh `/admin`; không điều hướng sang Teacher hoặc gọi API bị từ chối ngoài dự kiến; regression cả hai role |
| [ ] ADM-406 | BE + FE + QA | Regression Student Management: search/filter/sort/pagination, create setup password, edit định danh được phép, detail XP/streak, khóa/xóa mềm giữ history. Kiểm tra import Backend hiện có không bị hỏng; UI import không bắt buộc mới |
| [ ] ADM-407 | BE + FE | Kiểm tra hồ sơ cá nhân Admin và luồng đổi mật khẩu đã có API; bổ sung lối truy cập UI nếu thiếu theo ma trận quyền. Kiểm tra quyền xem leaderboard/XP, không lộ email/địa chỉ nhạy cảm |
| [ ] ADM-408 | BE + DO + FE | Rà settings AI: secret chỉ env/secret store theo NFR-SEC-03; API không trả giá trị secret và log không ghi secret. UI chỉ thể hiện trạng thái đã cấu hình; không hứa “hot-reload” cho setting không có consumer áp dụng thật |
| [ ] ADM-409 | BE + FE + QA | Test maintenance bật/tắt, bảo toàn đường truy cập Admin để tắt bảo trì; rà quyền logs/purge, giới hạn input và log redaction. Kiểm tra request lỗi có traceId để tra cứu |
| [ ] ADM-410 | BE + QA | Bổ sung audit thao tác quan trọng: khóa/xóa/đổi role, xóa tài liệu, publish quiz, thay cấu hình/maintenance. Lưu actor/action/target/time/result/traceId và diff đã loại secret; audit phải đủ để truy vết, không chứa PII thừa |
| [ ] ADM-411 | QA + FE | Kiểm tra desktop/mobile web, navigation, form validation, confirm, keyboard focus và loading/empty/error/retry ở toàn bộ màn hình Admin |
| [ ] ADM-412 | DO + QA | Regression Student quiz submit/XP/idempotency, Teacher ownership và chat/RAG; cập nhật OpenAPI, CI/staging và PO acceptance các story |

AC/exit gate: Admin hoàn thành create → edit → publish → xem kết quả quiz của mình và của Teacher; quiz sai bị chặn; lịch sử bài làm không đổi. Học sinh, hồ sơ Admin, settings/logs hoạt động theo quyền; không còn số liệu/trạng thái giả hay secret trong payload/log; UI đạt yêu cầu mục 11.4.

Nếu thời lượng vượt capacity, tách S4-US1 và S4-US2 thành hai sprint kế tiếp; không bỏ các điều kiện bảo mật/NFR để giữ lịch dự kiến.

## 9. Sprint 5 — Kiểm thử tích hợp và nghiệm thu phát hành

Liên kết mục 14.2, 15, 16 và 20; đây là gate phát hành sau các exit gate từng sprint.

| Task | Phụ trách | Công việc và đầu ra kiểm chứng |
|---|---|---|
| [ ] ADM-501 | QA + PO | Lập ma trận FR/US → issue → AC → test case → evidence; ghi rõ Must/Should/deferred. Mọi Must chưa Done phải có quyết định điều chỉnh baseline được ghi nhận |
| [ ] ADM-502 | QA + BE | Integration HTTP với security thực: ba role, anonymous, token hết hạn, khóa giữa phiên, IDOR bằng đổi ID, Admin cuối cùng và request đồng thời. Kiểm tra toàn bộ endpoint Admin, kể cả endpoint shared |
| [ ] ADM-503 | QA + FE | E2E browser: login Admin → users search/pagination/lock/unlock → students detail/edit → dashboard → upload/status tài liệu → quiz publish → statistics; ghi kết quả pass/fail và ảnh/log khi lỗi |
| [ ] ADM-511 | QA + PO | Regression S1-US2 trên staging với ít nhất hai Teacher tạo bằng UI Admin, không dựa seed; nghiệm thu invitation/setup/login, edit/status, ownership, empty class và xử lý mail lỗi; liên kết evidence ADM-120..122 |
| [ ] ADM-504 | QA + DO | Chạy kịch bản mục 20 SRS xuyên role: Teacher upload/publish, Student chat có citation/làm quiz/nhận XP, Admin thấy số liệu thay đổi; dữ liệu kỳ vọng cố định, có thể reset môi trường test |
| [ ] ADM-505 | BE + DO | Flyway trên PostgreSQL sạch và upgrade từ snapshot trước release; không sửa migration đã áp dụng; xác nhận ddl-auto không dùng update trên môi trường chung; lưu log migration và kiểm tra dữ liệu cũ |
| [ ] ADM-506 | QA + DO | Load test tối thiểu 20 người đồng thời cho luồng Admin và API thường: báo cáo dataset, cấu hình máy, tỷ lệ lỗi, thời gian phản hồi. CRUD mục tiêu <2 giây theo SRS; thống nhất cách đo trước test, không chỉ đo local một request |
| [ ] ADM-507 | BE + QA | Kiểm tra API AI liên quan mục tiêu <15 giây và UI đang xử lý; thử timeout provider để chứng minh backend vẫn phục vụ API khác; ghi giới hạn và quyết định xử lý khi không đạt |
| [ ] ADM-508 | DO | Kiểm tra HTTPS, CORS origin theo môi trường, secrets, health app/DB và log correlation; backup định kỳ và trước release; diễn tập restore trên DB riêng, khởi động lại và smoke test, ghi thời gian phục hồi |
| [ ] ADM-509 | DO + BE + FE | Pipeline build/test liên quan toàn bộ Admin, lint và build FE; deploy staging từ commit đã kiểm chứng. Xuất OpenAPI đúng phiên bản và hướng dẫn start/restart/rollback ứng dụng có lưu ý migration |
| [ ] ADM-510 | QA + PO | Triage lỗi: không còn Critical/Blocker; không còn High chưa có phương án theo mục 15.3. PO nghiệm thu từng story và release; ghi môi trường, commit, ngày, người xác nhận và vấn đề còn lại |

AC/exit gate: tất cả checklist mục 10–12 dưới đây có evidence; release được PO chấp thuận trên môi trường tích hợp. Build/test xanh ở máy cá nhân chưa đủ để đóng gate.

## 10. Definition of Done áp dụng cho từng story

Checklist này lấy từ mục 14.2 SRS; dùng cho mọi sprint, không chỉ sprint cuối.

- [ ] Code đã review/merge và build thành công; liên kết PR và commit.
- [ ] Migration liên quan chạy thành công trên database mới; nếu không thay schema, ghi N/A cùng bằng chứng baseline chạy sạch.
- [ ] OpenAPI được cập nhật và khớp request/response thực tế khi API thay đổi.
- [ ] Unit/integration test cần thiết đã pass; kiểm thử các rủi ro thực tế thay vì chỉ đối chiếu annotation hoặc mock happy path.
- [ ] FE có loading, empty, error, retry; form có validation gần field; khóa/xóa có confirm.
- [ ] Từng Acceptance Criterion đã được kiểm tra và có kết quả.
- [ ] Không còn Critical/Blocker thuộc story.
- [ ] Đã deploy môi trường tích hợp; PO/người đại diện xác nhận, có ngày và commit.

## 11. Bộ ca nghiệm thu tối thiểu

| Mã | Tình huống | Kết quả kỳ vọng |
|---|---|---|
| AT-01 | Anonymous/Student/Teacher gọi endpoint Admin | 401/403 đúng; không rò dữ liệu hoặc tạo side effect |
| AT-02 | Admin list user ba role, search/filter/pagination | Đúng dữ liệu toàn hệ thống; không chỉ lọc một page ở FE |
| AT-03 | Khóa user, thử login/token cũ/refresh/WebSocket | Không login mới; các phiên cũ tuân thủ chính sách vô hiệu hóa đã chốt |
| AT-04 | Khóa/xóa/hạ role Admin cuối cùng; hai request đồng thời | Không có trạng thái hệ thống mất toàn bộ Admin hoạt động |
| AT-05 | Gửi lại cùng request đặt status | Trạng thái giữ đúng giá trị đích |
| AT-06 | Dashboard với dataset biết trước và database rỗng | Count đúng; rỗng là 0; không dùng số giả |
| AT-07 | Dashboard API lỗi/refresh lỗi | Thông báo và retry rõ; không giả vờ dữ liệu mới đã tải |
| AT-08 | Upload hợp lệ/sai định dạng/vượt dung lượng, provider timeout | Trạng thái/validation đúng; failure giữ file gốc hợp lệ; backend tiếp tục phục vụ |
| AT-09 | Document PROCESSING/FAILED/xóa hoặc sửa metadata | Retrieval và metadata đúng quy tắc; không trả vector đã bị loại |
| AT-10 | Teacher A sửa/xóa tài liệu/quiz Teacher B; Admin làm tương tự | Teacher bị từ chối; Admin được phép theo lifecycle |
| AT-11 | Publish quiz sai đáp án hoặc thiếu câu hỏi | Backend chặn; FE hiển thị lý do; không publish qua gọi API trực tiếp |
| AT-12 | Admin xem statistics quiz Teacher khác; Student gọi report | Admin xem đủ count/average/page; Student bị từ chối |
| AT-13 | Sửa/xóa quiz có attempt, soft delete học sinh | Không mất/sửa history điểm/XP; báo cáo giữ đúng quy tắc đã chốt |
| AT-14 | Settings/logs/audit/maintenance | Không lộ secret/PII thừa; truy vết được thao tác; Admin tắt được maintenance |
| AT-15 | Mobile web và trạng thái form/API | Không vỡ layout; thao tác được; loading/empty/error/retry/confirm đầy đủ |
| AT-16 | Flyway sạch/upgrade, backup/restore và tải 20 người | Có log thành công, dữ liệu đúng và báo cáo hiệu năng |
| AT-17 | Demo xuyên role theo mục 20 SRS | Admin thấy hoạt động mới sau Teacher/Student, trong khoảng cập nhật đã chốt |
| AT-18 | Admin tạo hai Teacher bằng UI, setup password và login | Hai User/Teacher độc lập, mã unique, email setup hợp lệ; không dùng credential demo |
| AT-19 | Teacher invitation pending/hết hạn/đã dùng/resend/mail lỗi | Không login trước setup; xử lý token đúng, không tạo user trùng; invitation không bỏ qua khóa của Admin |
| AT-20 | Admin quản lý Teacher, Teacher mới chưa có lớp và truy cập chéo | List/detail/edit/status đúng; dữ liệu giảng dạy được bảo toàn; empty state và ownership đúng |

## 12. Bằng chứng và gate phát hành

Mỗi story dùng mẫu:

```text
Story/Task:
FR/US:
PR / merged commit:
CI / build / test:
Migration sạch / upgrade:
OpenAPI version:
AC / Test case / kết quả:
Staging URL / thời điểm deploy:
PO / ngày xác nhận:
Vấn đề còn lại / quyết định phạm vi:
```

Gate phát hành theo mục 15.3:

- [ ] 100% Must của milestone Done hoặc có quyết định điều chỉnh baseline được ghi nhận.
- [ ] Toàn bộ luồng nghiệp vụ chính pass, bao gồm tác động tới Student/Teacher.
- [ ] Không có Critical/Blocker; High có phương án xử lý được chấp thuận nếu còn.
- [ ] Có tài khoản kiểm thử, dữ liệu mẫu, tài liệu RAG và kịch bản demo.
- [ ] Có backup database, restore đã diễn tập và hướng dẫn start/restart.
- [ ] PO xác nhận release trên môi trường tích hợp, đúng commit đã kiểm thử.

## 13. Backlog mở rộng sau baseline

| Mã | Feature | Điều kiện trước khi triển khai |
|---|---|---|
| ADM-X01 | Restore user/nhật ký tài khoản đã xóa | Chốt unique email/username, retention và quan hệ hồ sơ |
| ADM-X02 | Retry/reprocess tài liệu qua UI | Job idempotent, chống xử lý đồng thời, chính sách thay chunk/version |
| ADM-X03 | Bulk lock/import/export trên UI | Preview, giới hạn batch, partial failure, audit, quyền dữ liệu |
| ADM-X04 | Báo cáo quản trị PDF/Excel nâng cao | Chốt bộ lọc, dataset và dữ liệu cá nhân được xuất; FR-REP-05 là Should |
| ADM-X05 | Dashboard chi phí/chất lượng AI, cảnh báo nâng cao | Có telemetry và định nghĩa metric đo được |
| ADM-X06 | MFA, Super Admin/RBAC chi tiết, multi-tenant | Quyết định sản phẩm và thay đổi SRS theo mục 19 |

Không tự đưa các feature này thành điều kiện bắt buộc của Admin MVP. Nếu được chọn cho milestone phát hành, bổ sung story/AC, đánh giá phụ thuộc và áp dụng cùng DoD.
