# Nâng cấp realtime cho luồng tham gia lớp học

## Tóm tắt

Hoàn thiện luồng tối thiểu end-to-end:

1. Học sinh gửi yêu cầu vào lớp.
2. Giáo viên nhận notification realtime và màn hình yêu cầu tự cập nhật.
3. Giáo viên chấp nhận hoặc từ chối.
4. Học sinh nhận kết quả realtime, trạng thái lớp tự cập nhật và có thể mở trang lớp.
5. Khi người dùng offline, notification vẫn được lưu trong PostgreSQL và đồng bộ lại khi đăng nhập/reconnect.

Tái sử dụng pipeline notification hiện có: PostgreSQL → delivery worker → `/user/queue/notifications`. Không tạo WebSocket topic hoặc hệ thống realtime riêng.

## Contract Và API

- Thêm các loại notification:
    - `STUDY_CLASS_JOIN_REQUESTED`
    - `STUDY_CLASS_JOIN_APPROVED`
    - `STUDY_CLASS_JOIN_REJECTED`
- Thêm source type `STUDY_CLASS_ENROLLMENT`; migration mới cập nhật check constraint của `notifications.source_type`.
- Các notification này chỉ dùng kênh `WEBSOCKET`, không gửi email.
- Metadata chuẩn gồm: `classId`, `enrollmentId`, `className`, `enrollmentStatus`; thông báo cho giáo viên có thêm `studentId`, `studentName`.
- Link:
    - Giáo viên: `/teacher/study-classes/{classId}`
    - Học sinh: `/student/classes/{classId}`
- Event key chống trùng chứa type, enrollment ID và `requestedAt`. Một lần gửi lại sau khi bị từ chối được coi là chu kỳ mới và tạo notification mới.

Bổ sung API học sinh:

- `GET /api/v1/student/study-classes`: trả các enrollment của chính học sinh, mới nhất trước.
- `GET /api/v1/student/study-classes/{classId}`: trả lớp thuộc enrollment của học sinh; lớp không thuộc học sinh trả `404`.
- Kết quả gồm `enrollmentId`, `classId`, `className`, `description`, `classCode`, `teacherName`, `classStatus`, `enrollmentStatus`, `requestedAt`, `reviewedAt`, `startDate`, `endDate`.
- Response của `POST /student/study-classes/join` được bổ sung `enrollmentId`, `classId`, `requestedAt`; giữ nguyên các field hiện tại để tương thích.

## Thay Đổi Triển Khai

- Trong transaction `join`, lưu enrollment rồi tạo notification cho user của giáo viên. Lỗi ghi notification làm rollback yêu cầu; lỗi transport sau commit không rollback nghiệp vụ.
- Trong transaction duyệt/từ chối, cập nhật enrollment rồi tạo notification kết quả cho user của học sinh.
- Khóa lớp khi xử lý join/approve để:
    - Hai request join đồng thời không tạo enrollment trùng.
    - Hai lượt approve đồng thời không thể vượt `maxStudents`.
    - Một yêu cầu chỉ được chuyển khỏi `PENDING` đúng một lần.
- Delivery worker hiện quét mỗi 5 giây, giữ mục tiêu notification realtime dưới 10 giây khi WebSocket/RabbitMQ hoạt động.
- Frontend tiếp tục coi REST là nguồn dữ liệu chính. Notification chỉ là tín hiệu để màn hình gọi lại API, không dùng metadata để tự quyết định quyền thành viên.
- Trang giáo viên tự tải lại pending request và số lượng thành viên khi nhận `STUDY_CLASS_JOIN_REQUESTED`.
- Nâng cấp `/student/classes` thành trang gồm form nhập mã và các nhóm `Đã tham gia`, `Đang chờ`, `Đã từ chối`.
- Thêm `/student/classes/:classId` làm giao diện lớp tối thiểu: thông tin lớp, giáo viên, thời hạn và trạng thái enrollment. Nội dung học tập, chat và bài tập lớp chưa nằm trong đợt này.
- Khi nhận approved/rejected notification, trang học sinh đang mở tự tải lại; chuông, unread count và toast vẫn hoạt động qua `NotificationProvider`.
- Cập nhật notification contract, runbook và SRS lớp học với các type, metadata, API và kịch bản QA mới.

## Danh Sách Task Triển Khai

Các task được sắp theo dependency. Không bắt đầu phần realtime UI trước khi contract backend và API học sinh đã ổn định.

### TASK-01 — Mở rộng schema và notification contract

**Mục tiêu:** Cho phép notification sử dụng enrollment làm nguồn sự kiện mà không phá vỡ dữ liệu notification hiện có.

- [x] Tạo migration Flyway kế tiếp để thêm `STUDY_CLASS_ENROLLMENT` vào check constraint `notifications.source_type`.
- [x] Migration chỉ thay đổi constraint, không xóa hoặc cập nhật các notification/delivery đã tồn tại.
- [x] Thêm `STUDY_CLASS_JOIN_REQUESTED`, `STUDY_CLASS_JOIN_APPROVED`, `STUDY_CLASS_JOIN_REJECTED` vào `NotificationType`.
- [x] Thêm `STUDY_CLASS_ENROLLMENT` vào `NotificationSourceType`.
- [x] Cập nhật validation của `NotificationCommand` theo từng nhóm notification; ba type mới chỉ chấp nhận `WEBSOCKET`, không có `expiresAt`.
- [x] Bổ sung test migration từ schema hiện tại và test các tổ hợp type/source/channel hợp lệ, không hợp lệ.
- [x] **Hoàn thành khi:** ứng dụng khởi động được trên database đã có V1–V4 và toàn bộ notification cũ vẫn đọc được.

### TASK-02 — Xây dựng command và link notification lớp học

**Mục tiêu:** Chuẩn hóa nội dung, metadata, link và khóa chống trùng cho toàn bộ sự kiện enrollment.

- [x] Thêm factory command cho yêu cầu gia nhập gửi tới user của giáo viên.
- [x] Thêm factory command cho kết quả `APPROVED` và `REJECTED` gửi tới user của học sinh.
- [x] Chuẩn hóa metadata chung: `classId`, `enrollmentId`, `className`, `enrollmentStatus`.
- [x] Notification của giáo viên có thêm `studentId`, `studentName`; không đưa email hoặc dữ liệu nhạy cảm vào metadata/log.
- [x] Thêm link builder `/teacher/study-classes/{classId}` và `/student/classes/{classId}`.
- [x] Tạo event key từ notification type, enrollment ID và `requestedAt`; retry cùng sự kiện trả về cùng key, lần xin lại sau khi bị từ chối có key mới.
- [x] Viết unit test kiểm tra title/message tiếng Việt, recipient, metadata, link, channel và event key.
- [x] **Hoàn thành khi:** ba command tạo ra payload đúng contract và có tính idempotent cho cùng một chu kỳ xin vào lớp.

### TASK-03 — Bổ sung API đọc lớp học cho học sinh

**Mục tiêu:** Cung cấp nguồn dữ liệu authoritative để học sinh xem yêu cầu và lớp đã được duyệt.

- [x] Tạo response DTO với các field đã chốt: `enrollmentId`, `classId`, `className`, `description`, `classCode`, `teacherName`, `classStatus`, `enrollmentStatus`, `requestedAt`, `reviewedAt`, `startDate`, `endDate`.
- [x] Thêm repository query lấy enrollment theo student hiện tại, sắp xếp `requestedAt DESC` và fetch đủ class/teacher/user để tránh N+1.
- [x] Triển khai `GET /api/v1/student/study-classes` chỉ trả enrollment của học sinh đăng nhập.
- [x] Triển khai `GET /api/v1/student/study-classes/{classId}`; trả `404` nếu học sinh không có enrollment tương ứng để không làm lộ lớp.
- [x] Bổ sung `enrollmentId`, `classId`, `requestedAt` vào response của API join mà không đổi các field cũ.
- [x] Không trả danh sách thành viên khác hoặc thông tin quản trị của lớp cho học sinh.
- [x] Viết controller/service/security test cho danh sách, chi tiết, dữ liệu rỗng và truy cập chéo tài khoản.
- [x] **Hoàn thành khi:** student có thể tải lại trang và dựng chính xác trạng thái lớp hoàn toàn từ REST.

### TASK-04 — Gắn notification vào transaction join/approve/reject

**Mục tiêu:** Enrollment và notification luôn nhất quán, kể cả khi request lặp hoặc có thao tác đồng thời.

- [x] Inject `NotificationCreationService` vào nghiệp vụ lớp học và tạo notification teacher trong transaction `join`.
- [x] Tạo notification student trong cùng transaction chuyển trạng thái sang `APPROVED` hoặc `REJECTED`.
- [x] Đảm bảo lỗi ghi notification rollback thay đổi enrollment; lỗi gửi WebSocket sau commit không rollback nghiệp vụ.
- [x] Khóa bản ghi lớp khi join và approve để tuần tự hóa thao tác theo lớp.
- [x] Khóa enrollment khi xử lý action để chỉ một request được chuyển khỏi `PENDING`.
- [x] Với hai lượt approve tranh suất cuối, chỉ lượt hợp lệ thành công và `approvedCount` không vượt `maxStudents`.
- [x] Với hai lượt join đồng thời cùng student/class, chỉ có một enrollment và một notification; request còn lại nhận conflict nghiệp vụ thay vì lỗi database thô.
- [x] Giữ hành vi cho phép student xin lại sau `REJECTED`, đồng thời cập nhật `requestedAt`, xóa `reviewedAt` và tạo chu kỳ notification mới.
- [x] **Hoàn thành khi:** mọi thay đổi enrollment có notification tương ứng hoặc rollback toàn bộ, không phát sinh trạng thái nửa vời.

### TASK-05 — Mở rộng contract và API client frontend

**Mục tiêu:** Frontend hiểu được notification và response lớp học mới với validation an toàn.

- [ ] Mở rộng `NotificationType` và `NotificationMetadata` cho ba type cùng các field enrollment mới.
- [ ] Validation UUID cho `classId`, `enrollmentId`, `studentId`; validation chuỗi cho class/student name và enrollment status.
- [ ] Giữ quy tắc link nội bộ theo role để teacher không điều hướng vào route student và ngược lại.
- [ ] Bổ sung type `StudentStudyClass` và mở rộng `StudyClassJoinResult` theo response backend.
- [ ] Thêm API client cho danh sách và chi tiết lớp của học sinh, tái sử dụng error handling hiện có.
- [ ] Bổ sung test parsing payload hợp lệ, metadata lỗi, link sai role và response API lỗi.
- [ ] **Hoàn thành khi:** TypeScript build thành công và payload sai không thể cập nhật notification store hoặc điều hướng người dùng.

### TASK-06 — Hoàn thiện giao diện lớp học của học sinh

**Mục tiêu:** Sau khi được duyệt, học sinh có một màn hình thực sự để xem và mở lớp.

- [ ] Nâng cấp `/student/classes` để giữ form nhập mã và hiển thị ba nhóm `Đã tham gia`, `Đang chờ`, `Đã từ chối`.
- [ ] Sau khi join thành công, refresh danh sách từ server và hiển thị trạng thái `PENDING`; ngăn gửi lặp khi request đang chạy.
- [ ] Thêm route `/student/classes/:classId` và trang chi tiết tối thiểu cho class overview, giáo viên, ngày bắt đầu/kết thúc và trạng thái enrollment.
- [ ] Chỉ trạng thái `APPROVED` được trình bày như lớp có thể truy cập; `PENDING` và `REJECTED` có thông điệp trạng thái rõ ràng.
- [ ] Khi nhận `STUDY_CLASS_JOIN_APPROVED` hoặc `STUDY_CLASS_JOIN_REJECTED`, refetch REST thay vì tin trực tiếp metadata notification.
- [ ] Chống refetch lặp khi notification cũ được load lại hoặc đánh dấu đã đọc; mỗi notification ID chỉ kích hoạt một lần trong vòng đời màn hình.
- [ ] Hoàn thiện loading, empty, error/retry, mobile và keyboard focus states.
- [ ] **Hoàn thành khi:** student thấy trạng thái đổi mà không reload thủ công và click notification mở đúng lớp thuộc tài khoản đó.

### TASK-07 — Đồng bộ realtime màn hình giáo viên

**Mục tiêu:** Giáo viên thấy yêu cầu mới ngay cả khi đang mở danh sách hoặc chi tiết lớp.

- [ ] Tại danh sách lớp học thêm, nhận `STUDY_CLASS_JOIN_REQUESTED` thì refetch pending count của lớp liên quan.
- [ ] Tại chi tiết lớp, refetch class detail và pending requests khi notification có `classId` khớp route hiện tại.
- [ ] Không refetch do notification của lớp khác hoặc do cùng notification được replay từ REST/STOMP.
- [ ] Khi teacher approve/reject, disable action đang xử lý để tránh double-submit và cập nhật dữ liệu từ response/refetch ngay sau thành công.
- [ ] Giữ toast, notification bell và unread count dùng chung qua `NotificationProvider`; không tạo STOMP connection thứ hai ở page.
- [ ] Thêm trạng thái lỗi có thể retry nếu refetch realtime thất bại, không xóa dữ liệu lớp đang hiển thị.
- [ ] **Hoàn thành khi:** yêu cầu join mới xuất hiện ở màn hình teacher và số đếm được cập nhật trong tối đa 10 giây khi WebSocket khỏe.

### TASK-08 — Kiểm thử tích hợp, bảo mật và hồi quy

**Mục tiêu:** Chứng minh luồng quan trọng hoạt động đúng trên database và transport thực, không chỉ qua mock.

- [ ] Unit test đầy đủ các nhánh join, approve, reject, duplicate, class full, dissolved và unauthorized.
- [ ] Testcontainers PostgreSQL kiểm tra enrollment + notification + delivery cùng commit hoặc cùng rollback.
- [ ] Viết concurrency test cho duplicate join và hai approve tranh suất cuối.
- [ ] Kiểm tra rejoin sau reject sinh notification mới nhưng retry/redelivery cùng sự kiện không tạo trùng.
- [ ] WebSocket integration test xác nhận payload đến đúng `/user/queue/notifications` của recipient và tài khoản khác không subscribe được.
- [ ] Frontend test xác nhận toast chỉ hiện một lần, unread count đúng và page refetch theo đúng type/class ID.
- [ ] Chạy toàn bộ backend test, `npm.cmd run test:notifications`, frontend build và lint; ghi lại mọi lỗi hồi quy ngoài phạm vi.
- [ ] **Hoàn thành khi:** tất cả test bắt buộc pass và không làm hỏng reminder/quiz notification hiện có.

### TASK-09 — Tài liệu, vận hành và QA end-to-end

**Mục tiêu:** Đưa feature vào trạng thái có thể review, deploy và xác minh trên staging.

- [ ] Cập nhật `notification_contract.md` với event matrix, metadata, link, event key và delivery channel mới.
- [ ] Cập nhật `teacher-classes-srs.md` với hai API student và hành vi giao diện mới.
- [ ] Cập nhật `notification_runbook.md` với truy vấn kiểm tra delivery theo source `STUDY_CLASS_ENROLLMENT` và kịch bản broker lỗi.
- [ ] Chuẩn bị hai tài khoản test teacher/student và một lớp còn chỗ trên staging.
- [ ] Xác minh join → teacher nhận thông báo/màn hình cập nhật trong tối đa 10 giây.
- [ ] Xác minh approve và reject → student nhận đúng nội dung, trạng thái và link.
- [ ] Xác minh student offline vẫn lấy được notification bằng REST sau login/reconnect.
- [ ] Tạm ngắt RabbitMQ để xác nhận enrollment vẫn commit, notification không mất và delivery retry sau khi broker phục hồi.
- [ ] Lưu evidence gồm thời gian, notification ID, delivery ID, enrollment ID, tester và kết quả; không lưu token hoặc dữ liệu nhạy cảm.
- [ ] **Hoàn thành khi:** toàn bộ acceptance scenario đạt trên staging và checklist QA được ký xác nhận.

## Kiểm Thử Và Nghiệm Thu

- Unit test command factory: đúng người nhận, type, link, metadata, channel và event key.
- Service test: join tạo notification cho đúng giáo viên; approve/reject tạo notification cho đúng học sinh; các nhánh lỗi không tạo notification.
- PostgreSQL integration test:
    - Enrollment và notification cùng commit hoặc cùng rollback.
    - Hai join đồng thời chỉ tạo một enrollment và một notification.
    - Hai approve cạnh tranh suất cuối không làm vượt sĩ số.
    - Học sinh gửi lại sau khi bị từ chối tạo một chu kỳ notification mới.
- Security test: học sinh không đọc được enrollment/lớp của người khác; giáo viên khác không được xử lý yêu cầu.
- Frontend test: validation metadata mới, link theo role, chuyển trạng thái realtime và không nhân đôi toast khi STOMP phát lại.
- QA hai tài khoản:
    - Student join → teacher nhận toast/chuông và danh sách tự cập nhật trong tối đa 10 giây.
    - Teacher approve/reject → student nhận kết quả và màn hình tự đổi trạng thái.
    - Student offline vẫn thấy notification và trạng thái đúng sau khi đăng nhập lại.
    - RabbitMQ tạm ngắt không làm mất notification; REST vẫn trả lịch sử.
- Chạy backend tests, frontend notification tests, TypeScript build và lint trước khi bàn giao.

## Giả Định

- Nhánh hiện tại `upgrade/notification_class` đã tách từ `master`, nơi notification foundation đã được merge qua PR #23; không tách tiếp từ `feature/notification-implement`.
- Giữ nguyên các thay đổi chưa commit ở Dashboard và tài liệu QA.
- “Vào lớp” trong đợt này là xem lớp và trạng thái thành viên; không bao gồm workspace nội dung học tập đầy đủ.
- Realtime dưới 10 giây áp dụng khi kết nối WebSocket khỏe; khi offline sẽ đồng bộ lúc reconnect/focus hoặc qua polling fallback.
