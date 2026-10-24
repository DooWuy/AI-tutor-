# Notification contract và nền tảng lưu bền vững

Tài liệu triển khai T1–T8 của [notification_implement.md](notification_implement.md),
đối chiếu [SRS](AI_Tutor_SRS_MVP.md) FR-SCH-05. API feed, worker retry, nhắc lịch,
bảo mật subscription, cả hai quiz producers và chuông dùng chung đã triển khai.

## 1. Nghiệp vụ và phân quyền

| Type | Trigger cuối cùng | Người nhận | Delivery | Link |
|---|---|---|---|---|
| `CLASS_REMINDER` | Tiết học còn trong `(now, now + 15 phút]` | User của học sinh sở hữu lịch | `WEBSOCKET`, `EMAIL` | `/student/timetable` |
| `QUIZ_GENERATED` | Tạo quiz thành công | Người yêu cầu tạo quiz | `WEBSOCKET` | Student: `/student/practice/{subject}`; Teacher/Admin: `/{role}/quizzes/{quizId}` |
| `QUIZ_GENERATION_FAILED` | Tạo quiz thất bại cuối cùng | Người yêu cầu tạo quiz | `WEBSOCKET` | Như quiz thành công |
| `STUDY_CLASS_JOIN_REQUESTED` | Học sinh gửi hoặc gửi lại yêu cầu tham gia lớp | User của giáo viên sở hữu lớp | `WEBSOCKET` | `/teacher/study-classes/{classId}` |
| `STUDY_CLASS_JOIN_APPROVED` | Giáo viên chấp nhận yêu cầu | User của học sinh trong enrollment | `WEBSOCKET` | `/student/classes/{classId}` |
| `STUDY_CLASS_JOIN_REJECTED` | Giáo viên từ chối yêu cầu | User của học sinh trong enrollment | `WEBSOCKET` | `/student/classes/{classId}` |

- Tài khoản phải hoạt động, chưa xóa. Học sinh chỉ nhận nhắc từ lịch đang active của mình.
- `studyPreferences.studyReminderEnabled` mặc định bật; giá trị boolean `false` tắt cả
  chuông/email nhắc lịch. Không áp dụng công tắc này cho thông báo kết quả tạo quiz.
- Trước khi tạo và trước khi gửi nhắc lịch, kiểm tra lại user, lịch, slot và công tắc.
  T4/T5 đã thực thi các kiểm tra này; service lưu T2 vẫn là API nội bộ, không thay thế authorization.
- Mọi role chỉ được đọc/đánh dấu đọc notification của chính user đó. Không có API client
  tự tạo notification hoặc tự chọn user nhận. Worker dùng user từ bản ghi đã lưu.
- Các ID/role/subject trong command lấy từ nghiệp vụ backend đã kiểm tra quyền;
  không chấp nhận link tự nhập từ client. Link dựng bởi `NotificationLinks`, encode subject
  thành một path segment bằng UTF-8; không nối subject thô hoặc đưa email/token vào URL.
- Hai PUT đã khóa cập nhật theo user ở T3. T7 khóa subscription theo principal và chủ sở hữu chat.

## 2. Wire contract dùng chung

REST: `ApiResponse<List<NotificationResponse>>` ở GET hiện tại. STOMP user destination:
`/user/queue/notifications`, backend gửi `/queue/notifications` bằng `convertAndSendToUser`.
Mỗi notification đã lưu dùng cùng một DTO cho hai transport:

```json
{
  "id": "f55c52cc-dc81-4c7d-a4ea-c5ec32d5a1c2",
  "type": "CLASS_REMINDER",
  "title": "Sắp đến giờ học: Toán",
  "message": "Bạn có tiết học Toán lúc 07:15. Hãy chuẩn bị nhé!",
  "link": "/student/timetable",
  "isRead": false,
  "createdAt": "2026-10-21T00:00:00Z",
  "metadata": {
    "scheduleId": "dc0537a7-d049-4e2d-a99f-ea53e8672b9b",
    "slotId": "7b41d9f2-9939-4f64-9be8-c13e8aee5127",
    "subject": "Toán",
    "startsAt": "2026-10-21T00:15:00Z",
    "room": "Phòng 202"
  }
}
```

- `id` là ID notification, không phải quiz/slot ID. `isRead` luôn là boolean, không dùng `read`.
- `createdAt`/`startsAt` là ISO-8601 instant UTC. UI chuyển về múi giờ hiển thị.
- `metadata` luôn là JSON object; bản ghi cũ có `{}`. Trường tùy chọn được bỏ khi không có.
- Reminder metadata: `scheduleId`, `slotId`, `subject`, `startsAt`, tùy chọn `room`.
- Quiz metadata: `quizId`, tùy chọn `subject`, và `jobId` khi đi qua generation job.
- Study class metadata chung: `classId`, `enrollmentId`, `className`, `enrollmentStatus`.
  Yêu cầu gửi tới giáo viên có thêm `studentId`, `studentName`; không chứa email.
- Không serialize user, source nội bộ, event key, delivery, lease, email hoặc exception.
- Kiểu thông báo mới dùng `NotificationType`; type của bản ghi cũ giữ nguyên chuỗi để
  tránh lỗi đọc dữ liệu lịch sử. Frontend tiếp tục chấp nhận legacy string trong giai đoạn mở rộng contract.
- `link` của dữ liệu cũ được giữ nguyên, có thể null. Thông báo mới luôn dùng link nội bộ.

Backend contract: `NotificationResponse`. Frontend contract: `src/types/notification.ts`,
được re-export qua service cũ để giữ các import đang sử dụng.

**Sau T6:** nhắc lịch và cả hai luồng quiz đều lưu notification/delivery, worker gửi cùng DTO.
Producer không còn phát signal `{type, quizId}` hoặc JPA entity. Frontend vẫn bỏ qua payload
thiếu contract, kể cả signal từ backend cũ trong thời gian rollout; polling quiz tiếp tục hoạt động.

## 3. Chống trùng và transaction

Command nội bộ tạo bằng `NotificationCommands.classReminder(...)`, `quizResult(...)`,
`studyClassJoinRequested(...)` hoặc `studyClassJoinResult(...)`.

| Nguồn | Event key | Source |
|---|---|---|
| Tiết học lặp theo tuần | `CLASS_REMINDER:{slotId}:{yyyy-MM-dd tại Việt Nam}` | `SCHEDULE_SLOT`, slot ID |
| Quiz học sinh | `{type}:QUIZ:{quizId}` | `QUIZ`, quiz ID |
| Job Teacher/Admin | `{type}:GENERATION_JOB:{jobId}` | `GENERATION_JOB`, job ID |
| Một chu kỳ xin vào lớp | `{type}:{enrollmentId}:{requestedAt}` | `STUDY_CLASS_ENROLLMENT`, enrollment ID |

- Unique `(user_id, event_key)`: cùng event có thể gửi cho nhiều user, mỗi user chỉ có một bản ghi.
- Một slot chỉ nhắc một lần/ngày; không gửi lại nếu đổi giờ sau khi đã tạo reminder ngày đó.
  Delivery chứa giờ cũ bị hủy ở T5 nếu slot đổi giờ. Slot ID mới là một nguồn mới.
- Với enrollment, `requestedAt` được lưu vào `occurrence_at`. Retry cùng type/enrollment/requestedAt
  dùng lại notification cũ; lần xin lại sau khi bị từ chối phải có `requestedAt` mới nên tạo event mới.
- Retry cùng event trả lại DTO ban đầu với `created=false`; không sửa payload, thêm kênh,
  reset attempt hoặc tự đưa delivery thất bại về pending. Command đầu tiên thắng.
- `NotificationCreationService.create` dùng `@Transactional(REQUIRED)`: tham gia transaction
  nghiệp vụ nếu đã có, hoặc mở transaction riêng. Không dùng `REQUIRES_NEW` để tách notification.
- PostgreSQL isolation mặc định **READ COMMITTED**. `INSERT ... ON CONFLICT DO NOTHING`
  chờ transaction thắng; SELECT kế tiếp đọc lại bản ghi đã commit. Không dùng một CTE
  SELECT chung statement vì snapshot có thể không thấy bản ghi thắng khi tranh chấp.
- Unique conflict không được xử lý bằng cách bắt exception JPA/PostgreSQL vì có thể
  làm transaction nghiệp vụ rollback-only. Lỗi thật (FK, JSON, insert delivery...) phải
  propagate và rollback toàn bộ. Caller không được nuốt lỗi để tiếp tục commit nghiệp vụ.
- Recipient phải tồn tại trong DB trước khi ghi JDBC. Nếu tạo User bằng JPA cùng transaction,
  caller cần flush User trước khi gọi service; JDBC không tự flush persistence context.
- Service không gọi WebSocket/SMTP, không chạy worker và không tự kiểm tra thời điểm nhắc.
  Việc chọn trigger/kênh theo nghiệp vụ được thực hiện trước khi gọi service.

## 4. Schema và delivery lifecycle

Flyway `V3__notification_delivery_foundation.sql` chỉ thêm schema; không sửa V1/V2.
Flyway `V7__study_class_notification_contract.sql` chỉ thay check constraint source type để
chấp nhận `STUDY_CLASS_ENROLLMENT`; không sửa hoặc backfill notification/delivery hiện có.

- `notifications`: thêm `event_key`, `source_type`, `source_id`, `occurrence_at`, `metadata` JSONB.
  Bản ghi cũ có source/key null và metadata `{}`, không tự tạo delivery để tránh gửi lại lịch sử.
- `notification_deliveries`: một row/kênh; ID UUID, FK notification `ON DELETE CASCADE`,
  channel/status, `attempt_count`, `next_attempt_at`, `lease_token`, `lease_until`,
  `expires_at`, `last_error_code`, `sent_at`, `created_at`, `updated_at`.
- Delivery mới là `PENDING`, attempt 0, next attempt bằng thời điểm tạo; lease/sent/error null.
  Reminder hết hạn tại `occurrence_at`; quiz và notification enrollment không có expiry.
- Unique `(notification_id, channel)`; check channel/status hợp lệ, attempt không âm;
  chỉ `PROCESSING` có đủ lease token/deadline, chỉ `SENT` có `sent_at`.
- Index: feed `(user_id, created_at DESC, id DESC)`, unread feed partial, pending theo
  next attempt và processing theo lease deadline. Index lịch sử/unread cũ vẫn giữ.
- Không FK source tới slot/quiz/job để lịch sử tồn tại sau khi đối tượng nguồn bị xóa.

Lifecycle dành cho worker T4:

| Trạng thái | Ý nghĩa |
|---|---|
| `PENDING` | Đợi gửi lần đầu hoặc retry đến hạn |
| `PROCESSING` | Đã claim, có token và deadline của lease |
| `SENT` | Transport chấp nhận; không có nghĩa user đã đọc/nhận realtime |
| `FAILED` | Hết số lần thử |
| `CANCELLED` | Nguồn không còn hợp lệ hoặc user đã tắt nhắc |
| `EXPIRED` | Đã qua thời điểm hữu ích để gửi |

Worker T4: quét 5 giây, batch 100, lease 120 giây; claim bằng SKIP LOCKED, gửi ngoài
transaction, cập nhật trạng thái theo lease token. Tối đa 5 lần thử với khoảng retry
1 phút, 5 phút, 15 phút, 1 giờ; timeout SMTP 10 giây. Lease hết hạn được thu hồi.
Một kênh lỗi không chặn kênh khác. Không reset các row đã SENT khi replay event.

Email có ngữ nghĩa ít nhất một lần: worker dừng sau SMTP accept nhưng trước commit trạng thái
có thể dẫn tới email trùng. Notification trong DB là nguồn chính; reconnect/offline đồng bộ
lại từ REST ở T8, không coi STOMP là hàng đợi bền vững cho từng trình duyệt.

## 5. Thời gian, gửi bù và các task còn lại

- Múi giờ nghiệp vụ `Asia/Ho_Chi_Minh`. Code hiện dùng thứ `2..8`, khác SRS `1..7`;
  không đổi schema/ngày của lịch trong T1–T2. Chuyển từ ISO day-of-week bằng `+1` ở biên scheduler.
- T5 chỉ tạo reminder khi `now < startsAt <= now + 15 phút`, kể cả sang ngày kế tiếp.
  Restart còn trước giờ học thì gửi bù; tới/qua giờ học thì không tạo/gửi nữa.
- Tắt nhắc chỉ tác động reminder chưa gửi; không xóa notification lịch sử hoặc thu hồi email.
- T3–T5 đã có pagination/count, ownership update, worker/retry/email sender và scheduler mới.
  T6 có quiz producers; T7/T8 có subscription security, reconnect và chuông chung.
  T9 đã có SMTP test server, metrics và runbook; xác nhận staging/production vẫn còn mở.
- Không backfill reminder/quiz cũ từ dữ liệu lịch sử; không gửi email quiz ở milestone này.

## 6. Kiểm chứng T1–T8

Chạy tại thư mục `ai-tutor-service`:

```powershell
.\gradlew.bat test --tests '*Notification*' --tests '*WebSocket*Test' --tests '*GenerationWorkerTest' --tests '*GenerationJobServiceTest'
```

`NotificationPersistenceIntegrationTest` tự tạo và hủy PostgreSQL pgvector bằng Testcontainers;
cần Docker đang chạy, không dùng database dev/prod. Khi không có Docker test được báo skipped,
không được coi là đã kiểm chứng persistence. Test nâng V1/V2 lên V3 với notification cũ,
validate mapping JPA, rollback caller/insert delivery lỗi, replay trong transaction còn commit được,
concurrent transactions, unique theo người nhận/kênh và FK cascade.

Test cũng kiểm feed/HTTP 400/404, cursor cùng timestamp, unread ngoài trang đang tải,
lease/reclaim/stale token, SKIP LOCKED, hai worker, toàn bộ khoảng retry, lỗi từng kênh,
source bị sửa/xóa/vô hiệu hóa và 105 slot được hai scanner quét đồng thời.

`NotificationContractTest` kiểm JSON `isRead`, metadata/legacy, links theo role/URL encoding,
event keys theo ngày Việt Nam, outcome quiz, giới hạn title và contract enrollment gồm recipient,
type/source/channel, metadata, link, nội dung, event key theo chu kỳ và các tổ hợp bị từ chối.

### Kiểm chứng TASK-01 và TASK-02 ngày 24/10/2026

- `NotificationPersistenceIntegrationTest` nâng database có legacy row từ V2 qua V7 trên
  PostgreSQL Testcontainer, xác nhận đủ 7 migration, legacy type/metadata còn đọc được,
  source `STUDY_CLASS_ENROLLMENT` và `occurrence_at` được lưu, chỉ sinh một delivery WebSocket.
- Lệnh kiểm tra tập trung:
  `./gradlew.bat test --tests '*NotificationContractTest' --tests '*NotificationPersistenceIntegrationTest'`
  — `BUILD SUCCESSFUL`, không skipped.
- Lệnh hồi quy:
  `./gradlew.bat test --tests '*Notification*' --tests '*WebSocket*Test' --tests '*GenerationWorkerTest' --tests '*GenerationJobServiceTest'`
  — 15 test suites, 92 tests pass, 0 failed, 0 errors, 0 skipped.

### Contract TASK-03 và TASK-04

API student đều yêu cầu `ROLE_STUDENT` và resolve student từ principal, không nhận student ID
từ client:

| Endpoint | `ApiResponse.data` | Quy tắc |
|---|---|---|
| `GET /api/v1/student/study-classes` | Mảng class card mới nhất trước | Chỉ enrollment của student hiện tại; gồm trạng thái, overview lớp và quiz đã phát hành |
| `GET /api/v1/student/study-classes/{classId}` | Một enrollment + class overview | Không có enrollment của chính student thì trả `404`, kể cả class ID tồn tại |
| `POST /api/v1/student/study-classes/join` | Kết quả join | Giữ `className`, `classCode`, `status`; thêm `enrollmentId`, `classId`, `requestedAt` |

Read model student gồm `enrollmentId`, `classId`, `className`, `description`, `classCode`,
`teacherName`, `classStatus`, `enrollmentStatus`, `requestedAt`, `reviewedAt`, `startDate`,
`endDate`. Không trả danh sách thành viên, email học sinh khác hoặc dữ liệu quản trị lớp.

Join và action dùng cùng thứ tự khóa: khóa pessimistic `study_classes` trước, sau đó mới đọc/khóa
enrollment. Join khóa theo class code; approve/reject khóa theo class ID rồi khóa enrollment.
Nhờ đó duplicate join được tuần tự hóa, action chỉ chuyển một lần khỏi `PENDING`, và hai approve
tranh suất cuối không thể cùng nhìn thấy sĩ số cũ.

Enrollment được `saveAndFlush` trước khi tạo notification để có ID/FK chắc chắn. Lời gọi
`NotificationCreationService.create` tham gia transaction hiện tại: lỗi insert notification hoặc
delivery rollback cả join/action; transport WebSocket vẫn do worker chạy sau commit nên không nằm
trong transaction HTTP. Lần xin lại sau `REJECTED` xóa `reviewedAt` và đặt `requestedAt` lớn hơn
chu kỳ trước ít nhất một microsecond, kể cả khi clock không tiến, để event key luôn mới.

### Kiểm chứng TASK-03 và TASK-04 ngày 24/10/2026

- Lệnh tập trung:
  `./gradlew.bat test --tests '*StudyClassServiceTest' --tests '*StudentStudyClassControllerTest' --tests '*StudyClassControllerTest' --tests '*StudyClassNotificationIntegrationTest'`
  — 4 suites, 34 tests pass, 0 failed, 0 errors, 0 skipped.
- `StudyClassNotificationIntegrationTest` chạy Flyway V1–V7 và service/repository thật trên
  PostgreSQL Testcontainer; kiểm read model ownership, join + teacher notification, rollback join,
  rollback approve, duplicate join đồng thời, hai approve tranh suất cuối và rejoin sau reject.
- Nhóm lớp học + notification mở rộng cũng `BUILD SUCCESSFUL` với lệnh
  `./gradlew.bat test --tests '*StudyClass*Test' --tests '*StudyClassNotificationIntegrationTest' --tests '*Notification*Test'`.
- Full backend suite chạy 428 tests: 427 pass, 1 lỗi ngoài phạm vi, 33 skipped. Lỗi duy nhất là
  `SampleTextbookSplitTest` vẫn tìm PDF ở `docs/` trong khi worktree hiện đã chuyển tài liệu sang
  `.docs/`; TASK-03/04 không sửa hoặc hoàn tác thay đổi đường dẫn tài liệu này.

`NotificationDeliverySenderTest` kiểm DTO queue cá nhân, địa chỉ email tài khoản,
propagate lỗi SMTP/broker và chặn I/O khi hết lease/deadline. Transport trong integration
test là mock; chưa xác nhận gửi thư thật hoặc độ trễ RabbitMQ/SMTP trên staging (T9).

Chạy tại thư mục `ai-tutor-frontend`:

```powershell
npm.cmd run test:notifications
node --test tests/chatConnection.test.mjs
npm.cmd run build
```

## 7. API T3 và tương thích frontend

| Endpoint | `ApiResponse.data` | Quy tắc |
|---|---|---|
| `GET /api/v1/notifications/feed?cursor&size&unreadOnly` | `{items, nextCursor, unreadCount}` | Mặc định size 20, giới hạn 100; size <= 0 hoặc cursor lỗi trả 400 |
| `GET /api/v1/notifications/unread-count` | `{unreadCount}` | Tổng unread của user, không giới hạn theo trang |
| `GET /api/v1/notifications?limit` | Mảng DTO như cũ | Mặc định 20 khi thiếu/nonpositive, chặn tối đa 100 |
| `PUT /api/v1/notifications/{id}/read` | null | Update theo ID + user; đọc lặp thành công; không tồn tại/khác chủ đều 404 |
| `PUT /api/v1/notifications/read-all` | null | Chỉ tác động unread của user hiện tại |

Cursor là Base64 URL-safe của `ISO-instant|UUID`, giữ độ chính xác microsecond từ DB;
query seek `(created_at, id) < (cursorTime, cursorId)` theo thứ tự giảm dần và lấy size + 1.
`nextCursor=null` khi hết trang. Cursor không mang quyền truy cập: mọi truy vấn luôn lọc user
từ principal. Unread count phản ánh DB lúc đọc, có thể thay đổi giữa các request khi có event mới.

Frontend API đã chuyển sang feed; context lấy badge count từ server, không đếm các item
trong trang đầu. Hai PUT kiểm HTTP status và `success`. T8 merge theo ID, chống response cũ
ghi đè realtime/đã đọc, hủy request khi đổi phiên; tab khác đồng bộ khi focus hoặc polling.

## 8. Cách chạy worker và scheduler T4/T5

- `NotificationDeliveryJob` chạy fixed-delay 5 giây sau mỗi lượt, tối đa 100 delivery/lượt.
  Claim từng row ngay trước xử lý, không giữ 100 lease trong lúc chờ email gửi tuần tự.
- Claim/prepare/outcome là các transaction ngắn `REQUIRES_NEW`; method worker là
  `NOT_SUPPORTED`. Sender đồng bộ chạy ngoài transaction DB và không nuốt exception.
- Attempt tăng khi claim. Crash sau claim được tính là một attempt; sau lần thứ 5 và lease
  hết hạn chuyển FAILED. Chỉ lease token còn hạn được ghi outcome; owner cũ không thể ghi đè.
- Mỗi lượt reconcile tối đa 100 row pending hoặc processing có lease đã hết: quá giờ học
  thành EXPIRED; source/user không hợp lệ thành CANCELLED; hết attempt thành FAILED.
  Reconcile không đợi `next_attempt_at`, không tác động SENT/FAILED/CANCELLED/EXPIRED.
- Chuẩn bị gửi kiểm lại slot còn tồn tại, lịch active, owner, ngày/giờ hiện tại trùng occurrence,
  preferences và tài khoản. Sender kiểm lại deadline/lease ngay trước bắt đầu I/O.
- Việc sửa lịch/tắt nhắc xảy ra sau lần kiểm tra cuối trong khi transport đã bắt đầu không
  thể thu hồi email/message đang gửi; kiểm tra DB và I/O được tách để không giữ lock qua mạng.
- Job nhắc lịch chạy fixed-delay 60 giây, chụp một instant cho cửa sổ 15 phút, chia ngày theo
  múi giờ Việt Nam. Query projection theo ngày/giờ, keyset slot ID, mỗi batch 100, không dùng LAZY.
  Mỗi slot được đọc lại trong transaction trước tạo; SHARE lock nguồn chỉ giữ đến commit.
- Hai job dùng scheduler riêng 2 thread; bean không thay thế scheduler mặc định của ứng dụng.
- V4 thêm index quét `(day_of_week, start_time, id)` và partial expiry; không sửa V1–V3.

| Cấu hình | Mặc định / ý nghĩa |
|---|---|
| `NOTIFICATION_ENABLED` / `app.notification.enabled` | true; false tắt cả hai job, giữ REST và dữ liệu pending |
| `app.notification.delivery-scan-ms` | 5000; delay sau mỗi batch delivery |
| `app.notification.reminder-scan-ms` | 60000; delay sau mỗi lượt quét lịch |
| `RABBITMQ_PORT` | 5672 cho AMQP |
| `RABBITMQ_STOMP_PORT` | 61613 cho STOMP relay; trong Docker backend dùng cổng nội bộ 61613 |
| `spring.mail.properties.mail.smtp.connectiontimeout` | 10000 ms |
| `spring.mail.properties.mail.smtp.timeout` | 10000 ms |
| `spring.mail.properties.mail.smtp.writetimeout` | 10000 ms |

Migration cần chạy trước code mới; Flyway tự áp dụng khi khởi động bình thường. Đặt
`NOTIFICATION_ENABLED=false` trong môi trường backend trước rollout khi cần tạm ngừng gửi,
sau đó bật lại: row pending còn hạn sẽ được gửi, lease cũ tự thu hồi. Tắt job không hủy
I/O đã bắt đầu. Không reset status bằng tay hoặc xóa notification để retry; thao tác requeue
FAILED có kiểm soát sẽ được tài liệu vận hành T9 hướng dẫn.

## 9. WebSocket T7 và frontend T8

- CONNECT xác thực JWT trước Spring Security messaging; principal được giữ trên session.
  User bị vô hiệu hóa không được kết nối. ERROR không chứa token/exception nội bộ.
- Chỉ SUBSCRIBE `/user/queue/notifications` và `/user/queue/chat-sessions/{UUID}/stream`.
  Chat phải thuộc user hiện tại; SEND chỉ được tới `/app/chat-sessions/{UUID}/messages`
  với cùng kiểm tra chủ sở hữu. Các đường dẫn broker thô, user khác và destination còn lại bị chặn.
- Relay encode dấu `/` bên trong tên queue chat thành `%2F` sau khi Spring resolve user
  destination. RabbitMQ STOMP yêu cầu tên queue là một segment; destination công khai của
  frontend và controller chat vẫn giữ nguyên.
- Client lấy token hiện tại trước mỗi lần CONNECT, subscribe trước khi tải lại REST,
  tự reconnect khi ngắt/broker lỗi; cleanup bỏ qua callback cũ. Không log frame STOMP/JWT,
  kể cả dev; dev chỉ log trạng thái kết nối đã rút gọn.
- Store riêng theo account, AbortController và phiên request loại bỏ response cũ sau logout/
  đổi tài khoản hoặc StrictMode cleanup. Callback xử lý từng message, merge theo ID và giữ
  trạng thái đã đọc đã được server xác nhận. Unread count lấy từ REST, không đếm trang.
- Reconnect, focus, visibility và online tải lại feed. Polling 30 giây chỉ khi tab hiển thị
  và STOMP chưa kết nối. Read-all tải lại feed/count để đối chiếu notification đến đồng thời.
- `NotificationBell` dùng chung cho ba header, có tải thêm, retry, loading/empty, focus/Escape,
  đóng khi click ngoài; chỉ điều hướng link nội bộ thuộc role hiện tại sau PUT thành công.
  Browser permission chỉ xin khi bấm nút; thông báo native chỉ hiện khi tab ẩn và đã cấp quyền.
  Polling trạng thái quiz hiện có được giữ nguyên.

`WebSocketBrokerIntegrationTest` chạy JWT ký thật, Nginx với file cấu hình frontend production,
Spring WebSocket/security/controller và RabbitMQ STOMP thật. Chỉ thay địa chỉ upstream Nginx
bằng port Tomcat ngẫu nhiên của test. Kiểm tra hai tài khoản không nghe lén nhau,
SUBSCRIBE/SEND bị chặn, JWT hỏng/refresh token bị từ chối, reconnect, chat hợp lệ và DTO quiz
đầy đủ đi qua `NotificationDeliverySender`.
Test tự skipped nếu Docker không sẵn sàng; phải kiểm tra report, không coi skipped là pass.
Đây là kiểm chứng local, chưa thay thế smoke test production hay SMTP thật ở T9.

Kết quả baseline trước T6 ngày 21/10/2026: 64 test backend pass, không skipped, gồm
31 test PostgreSQL và 3 test RabbitMQ STOMP. Frontend pass 43 test hiện có (26 test
notification); TypeScript/Vite production build thành công. Đã xem fixture desktop,
mobile và dark mode/landscape, gồm phân trang và trạng thái lỗi.

Frontend có 26 test notification cho API/store/connection/provider/bell. Chạy fixture giao diện:

```powershell
npm.cmd run preview:notifications
```

Mở `http://127.0.0.1:5187/tests/fixtures/notification-preview.html` với query tùy chọn
`role=STUDENT|TEACHER|ADMIN`, `theme=dark`, `mode=empty|error|loading`,
`viewport=mobile|landscape`. Fixture dùng dữ liệu tổng hợp và API loopback riêng,
không kết nối tài khoản, RabbitMQ hoặc database thật.

## 10. Transaction kết quả quiz T6

- Học sinh: consumer tạo câu hỏi ngoài transaction ghi kết quả; validate output trước khi lưu.
  Transaction khóa quiz, bỏ qua READY/FAILED, lưu câu hỏi + READY + notification + delivery.
  AI lỗi cuối cùng lưu FAILED + notification + delivery trong một transaction riêng.
  Lỗi DB ở bước ghi kết quả được ném lại cho listener, không bị chuyển thành lỗi AI;
  redelivery sẽ thử lại sau rollback. READY/FAILED đã commit thì xử lý lặp là no-op.
- Teacher/Admin: `GenerationJobStore.markDone/markFailed` khóa job, chỉ chuyển RUNNING.
  Job QUIZ lưu notification trong cùng transaction REQUIRES_NEW của trạng thái job;
  recipient lấy từ `requestedBy`, không lấy từ người tạo quiz. Job BANK không phát notification.
  Hai completion cạnh tranh chỉ có một kết quả thắng; acknowledge không phát thêm notification.
- `GenerationWorker` chỉ bắt lỗi của bước tạo nội dung. Lỗi lưu DONE/notification được propagate,
  không gọi tiếp markFailed; nội dung quiz đã được tạo không bị đổi thành lỗi do transport.
  Job state và notification rollback cùng nhau khi insert notification/delivery thất bại.
  Worker không tự chạy lại AI hoặc đánh dấu DONE khi DB chưa xác nhận.
- Recovery giữ phạm vi hiện tại: RUNNING khi khởi động bị chuyển FAILED; nay khóa và cập nhật
  từng job trong transaction recovery để cùng lưu notification cho QUIZ. Lỗi insert làm rollback
  toàn bộ transaction recovery. Cơ chế xác định job thuộc instance nào/lease AI vẫn ngoài T6.
- Không lưu exception AI vào notification; message dùng template chung. Chỉ WEBSOCKET,
  không email quiz. Retry transport không cập nhật quiz/job và không tạo notification mới.

`QuizNotificationIntegrationTest` chạy producer/store thật trên PostgreSQL: READY/FAILED,
rollback cả câu hỏi/trạng thái/notification khi delivery insert lỗi, redelivery và đồng thời,
requester Teacher/Admin khác creator, recovery, BANK không phát event, acknowledge và retry
broker không làm đổi quiz READY. `GenerationWorkerTest` kiểm riêng lỗi ghi DONE không gọi FAILED.

## 11. Nghiệm thu T7 tại local và giới hạn triển khai

- Compose production đã được render/kiểm tra bằng `docker compose --env-file .env.example -f
  docker-compose.prod.yml config --format json`: backend dùng AMQP 5672, STOMP 61613;
  RabbitMQ bật `rabbitmq_stomp`. Không khởi động hoặc thay đổi dịch vụ production.
- Nginx có route `/ws`, HTTP/1.1 Upgrade/Connection, giữ path và forward header. Test STOMP
  đi qua route này thay vì kết nối thẳng backend; route `/api/` giữ nguyên.
- Notification và chat client suy ra WSS khi API dùng HTTPS; helper chat dừng reconnect nếu
  account ban đầu đã logout/đổi tài khoản, lấy token mới khi refresh và không log frame JWT.
- Local test với profile `prod` không phải rollout thực tế. Chưa xác nhận DNS/TLS, load balancer,
  origin và tài khoản trên host staging/production vì chưa có endpoint kiểm thử được cung cấp.
  Mục nghiệm thu production trong backlog vẫn mở cho bước rollout/smoke test T9.

Kết quả T9 local ngày 23/10/2026:

| Bộ kiểm tra | Kết quả |
|---|---|
| Backend notification/WebSocket + generation worker/service | 88 pass, 0 failed, 0 skipped |
| PostgreSQL persistence/reminder/metrics snapshot | 32 pass |
| PostgreSQL producer quiz/job T6 | 11 pass |
| JWT → Nginx → Spring → RabbitMQ STOMP | 7 pass |
| SMTP Mailpit qua TCP thật | 1 pass |
| Frontend notification + chat connection | 28 pass (26 + 2) |
| Frontend TypeScript/Vite production build | Pass |
| Production Compose render, AMQP/STOMP ports và plugin | Pass |

Các integration test dùng container cô lập và dữ liệu tổng hợp; không gọi AI thật và không sửa
database dev/production. SMTP test gửi vào Mailpit cô lập, không gửi thư ra Internet.

## 12. Vận hành T9

`NotificationDeliveryMetrics` xuất gauge số delivery pending/failed và tuổi pending lâu nhất,
counter retry cùng timer latency theo hai channel có cardinality cố định. Worker refresh snapshot sau
mỗi batch và log `deliveryId`/`notificationId`, không log payload, email hay token. Prometheus đọc tại
`/actuator/prometheus` qua authentication hiện có.

`NotificationSmtpIntegrationTest` gửi email thật qua Mailpit Testcontainer và xác nhận lỗi kết nối
SMTP được propagate. PostgreSQL, RabbitMQ STOMP/Nginx và frontend race/reconnect tiếp tục được kiểm
chứng bởi các bộ test T2-T8.

Quy trình dashboard, chẩn đoán, requeue một row có guard, rollout/rollback và checklist staging nằm
tại [notification_runbook.md](notification_runbook.md). Test local không thay thế xác nhận staging;
các ô rollout/smoke production chỉ được đóng sau khi lưu evidence theo runbook.
