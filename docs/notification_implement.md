# Hoàn thiện notification: nhắc lịch học và kết quả tạo quiz

## 1. Mục tiêu và phạm vi đã chốt

Xây dựng notification thành một module trong Spring Boot hiện tại, dùng PostgreSQL để lưu thông báo và tác vụ gửi, RabbitMQ STOMP cho realtime, SMTP cho email.

Căn cứ [SRS](C:/Users/doquo/IdeaProjects/AI-tutor-/docs/AI_Tutor_SRS_MVP.md): FR-SCH-05 yêu cầu nhắc lịch qua push/email; tài liệu chưa định nghĩa chi tiết độ bền gửi, retry và thông báo quiz. Các quy tắc dưới đây là phần bổ sung đã thống nhất cho đợt này.

| Nghiệp vụ | Người nhận | Kênh | Điều kiện |
|---|---|---|---|
| Nhắc tiết học | Học sinh sở hữu lịch | Chuông, realtime, email | Lịch đang active, bật nhắc; trước giờ học 15 phút |
| Tạo quiz thành công | Người yêu cầu tạo | Chuông, realtime | Quiz/job chuyển sang thành công |
| Tạo quiz thất bại | Người yêu cầu tạo | Chuông, realtime | Quiz/job chuyển sang thất bại cuối cùng |

- Giữ một công tắc bật/tắt nhắc lịch hiện tại; mặc định bật.
- Gửi bù nhắc lịch sau restart nếu tiết học chưa bắt đầu.
- Browser notification chỉ hoạt động khi ứng dụng còn chạy, người dùng đã cấp quyền.
- Lịch cá nhân, Web Push khi đóng tab, thông báo ngân hàng câu hỏi/tài liệu/giao bài và phụ huynh thuộc milestone tiếp theo.

## 2. Thiết kế cần thống nhất trong code

**Luồng xử lý**

`Nghiệp vụ → transaction lưu notification + delivery → commit → worker gửi từng kênh`

- Notification trong DB là nguồn dữ liệu chính; WebSocket hỗ trợ cập nhật nhanh.
- Một notification chỉ được tạo một lần cho cùng sự kiện/người nhận.
- Delivery có retry riêng theo kênh; lỗi SMTP không chặn WebSocket và ngược lại.
- Không giữ transaction DB trong lúc gọi SMTP hoặc gửi qua broker.
- Email dùng cơ chế gửi ít nhất một lần: vẫn có khả năng trùng nếu SMTP nhận email nhưng worker dừng trước khi ghi trạng thái thành công.

**Contract**

- DTO notification dùng thống nhất cho REST và WebSocket: `id`, `type`, `title`, `message`, `link`, `isRead`, `createdAt`, `metadata`.
- Chốt ba loại: `CLASS_REMINDER`, `QUIZ_GENERATED`, `QUIZ_GENERATION_FAILED`.
- Giữ queue `/user/queue/notifications`; thay payload quiz rời rạc hiện tại bằng DTO đầy đủ.
- Chuông dùng chung cho Student, Teacher và Admin.
- Giữ quy ước thứ `2..8` của codebase trong đợt này; ghi rõ sai khác với SRS `1..7`, tránh đổi dữ liệu lịch ngoài phạm vi.

## 3. Backlog triển khai theo thứ tự

### T1 — Chốt đặc tả và contract

- [x] Bổ sung tài liệu notification: ma trận nghiệp vụ, quy tắc gửi bù, retry, bật/tắt và phân quyền.
- [x] Định nghĩa DTO, enum, metadata và link điều hướng theo vai trò.
- [x] Nhắc lịch dẫn về `/student/timetable`; quiz học sinh về trang luyện tập theo môn; Teacher/Admin về editor của quiz.
- [x] Link được xây dựng phía backend từ dữ liệu nghiệp vụ và URL-encode tham số.

**Nghiệm thu:**
- [x] REST, WebSocket và frontend dùng cùng contract; không trả JPA entity trực tiếp.

Chi tiết: [notification_contract.md](notification_contract.md). GET hiện tại và payload nhắc lịch
đã dùng DTO; frontend dùng type tương ứng. T6 thay producer quiz cũ bằng notification
được lưu bền vững; T8 kiểm tra payload trước khi đưa vào chuông.

### T2 — Migration và nền tảng lưu bền vững

- [x] Thêm migration Flyway mới; giữ nguyên migration đã tồn tại.
- [x] Bổ sung vào notification: khóa sự kiện chống trùng, nguồn sự kiện và thời điểm tiết học nếu có. Notification cũ vẫn đọc được.
- [x] Thêm bảng delivery chứa notification, kênh, trạng thái, số lần thử, thời điểm thử tiếp theo, lease, thời hạn gửi và mã lỗi.
- [x] Unique theo người nhận/khóa sự kiện và notification/kênh; thêm index phục vụ truy vấn pending, lịch sử và unread.
- [x] Service tạo notification và delivery trong cùng transaction; xử lý trùng bằng cơ chế insert có kiểm soát, không làm hỏng transaction nghiệp vụ.

**Nghiệm thu:**
- [x] Rollback không để lại notification/delivery; hai tiến trình xử lý cùng sự kiện vẫn chỉ tạo một notification.

Kiểm chứng bằng PostgreSQL Testcontainers: nâng V2 có dữ liệu cũ lên V3, rollback nghiệp vụ,
lỗi insert delivery, replay không phá transaction, và 6 transaction đồng thời. Service mới
đã được nối với scheduler/worker ở T4/T5 và cả hai quiz producers ở T6.

### T3 — API lịch sử và trạng thái đã đọc

- [x] Thêm `GET /api/v1/notifications/feed?cursor&size&unreadOnly`, trả `items`, `nextCursor`, `unreadCount` trong `ApiResponse`.
- [x] Cursor dựa trên `(createdAt, id)` giảm dần; mặc định 20, tối đa 100 phần tử.
- [x] Thêm `GET /api/v1/notifications/unread-count`.
- [x] Giữ GET cũ để tương thích, nhưng giới hạn mặc định 20/tối đa 100; frontend chuyển sang feed.
- [x] Giữ hai PUT đánh dấu đọc hiện tại; cập nhật theo cả notification ID và user ID. ID không tồn tại hoặc không thuộc người gọi đều trả `404`; đọc lại vẫn thành công.
- [x] Unread count tính từ DB, không phụ thuộc số phần tử đang tải trên giao diện.

**Nghiệm thu:**
- [x] Không đọc/sửa được notification người khác; dữ liệu lịch sử lớn không gây tải toàn bộ DB.

### T4 — Worker gửi và retry

- [x] Worker claim delivery bằng `FOR UPDATE SKIP LOCKED`, lưu lease rồi gửi ngoài transaction.
- [x] Mặc định quét mỗi 5 giây, batch 100, lease 120 giây; lease hết hạn được thu hồi sau restart.
- [x] Tối đa 5 lần gửi, retry sau 1 phút, 5 phút, 15 phút và 1 giờ; hết lượt chuyển `FAILED`.
- [x] Tách sender email notification khỏi hàm mail hiện tại đang `@Async` và nuốt exception; sender mới phải trả lỗi cho worker. Giữ các luồng email tài khoản đang dùng.
- [x] Đặt timeout SMTP 10 giây cho connect/read/write.
- [x] Delivery nhắc lịch hết hạn tại giờ bắt đầu; không gửi email/realtime nhắc học sau thời điểm đó. Notification đã lưu vẫn là lịch sử.
- [x] Gửi WebSocket thành công không đồng nghĩa người dùng đã nhận; người offline lấy lại bằng REST.

**Nghiệm thu:**
- [x] Broker/SMTP lỗi không làm mất notification, không chặn kênh khác; restart khôi phục delivery đang xử lý.

Mỗi lượt xử lý tối đa 100 delivery nhưng claim từng row ngay trước khi gửi để tránh lease
hết hạn trong lúc chờ các email trước đó. Scheduler notification riêng, không thay scheduler mặc định.
Integration test dùng PostgreSQL thật và mô phỏng transport lỗi; kiểm thử với dịch vụ
RabbitMQ/SMTP triển khai thực tế và đo độ trễ staging tiếp tục ở T9.

### T5 — Viết lại job nhắc lịch

- [x] Inject `Clock`, dùng `Asia/Ho_Chi_Minh`; lấy ngày/giờ từ cùng một thời điểm.
- [x] Quét các tiết có giờ bắt đầu trong `(now, now + 15 phút]`, gồm cả ngày kế tiếp khi qua nửa đêm; bỏ điều kiện khớp đúng một phút hiện tại.
- [x] Query theo batch với projection/fetch phù hợp, không để quan hệ `LAZY` thoát ra ngoài transaction.
- [x] Chống trùng theo `slotId + ngày diễn ra tiết học`; mỗi tiết chỉ nhắc một lần trong ngày.
- [x] Kiểm tra lịch active, user còn hoạt động và `studyReminderEnabled` trước khi tạo, đồng thời kiểm tra lại trước khi gửi delivery đang chờ.
- [x] Hủy delivery cũ nếu tiết đã bị xóa, đổi giờ hoặc lịch bị vô hiệu hóa; không thu hồi thông báo/email đã gửi.
- [x] Nội dung gửi bù dùng giờ bắt đầu thực tế, không luôn ghi “sau 15 phút”.

**Nghiệm thu:**
- [x] Nhắc đúng qua nửa đêm/cuối tuần, gửi bù trước giờ học, chạy nhiều instance không tạo trùng.

V4 chỉ thêm index phục vụ quét slot và expiry. Test bao gồm 105 slot qua nhiều batch và
hai scanner chạy đồng thời; reminder quá hạn/đã hủy không được tạo lại cùng slot/ngày.

### T6 — Tích hợp cả hai luồng tạo quiz

- [x] Với học sinh: lưu notification trong cùng transaction cập nhật kết quả của RabbitMQ consumer.
- [x] Với Teacher/Admin: lưu notification khi `GenerationJobStore` chuyển job loại `QUIZ` sang `DONE` hoặc `FAILED`, bao gồm nhánh recovery đánh dấu thất bại.
- [x] Người nhận là người yêu cầu; dùng `quizId + kết quả` cho luồng học sinh, `jobId + kết quả` cho luồng Teacher/Admin.
- [x] Bỏ lệnh push payload `{type, quizId}` hiện tại; mọi lần gửi đi qua delivery worker.
- [x] Lỗi gửi notification không được đổi quiz đã thành công thành thất bại; lỗi lưu notification phải rollback transaction chuyển trạng thái tương ứng.
- [x] Không gửi email quiz; không thông báo mỗi lần retry trung gian.

**Nghiệm thu:**
- [x] Thành công/thất bại đều có notification đúng người; redelivery không tạo trùng; không ảnh hưởng acknowledge job hiện tại.

`QuizNotificationIntegrationTest` dùng PostgreSQL thật: producer transaction, rollback khi
insert delivery lỗi, redelivery/concurrent delivery, requester khác người tạo quiz,
job DONE/FAILED/recovery, acknowledge và kênh WEBSOCKET duy nhất. Lỗi ghi kết quả thành công
không đi vào nhánh bắt lỗi AI; lỗi transport chỉ retry delivery.

### T7 — Sửa hạ tầng WebSocket và bảo mật

- [x] Tách `RABBITMQ_PORT=5672` và `RABBITMQ_STOMP_PORT=61613` trong backend, Docker và cấu hình mẫu.
- [x] Giới hạn subscribe vào queue notification cá nhân và stream chat cá nhân hiện dùng; chặn subscribe trực tiếp `/queue/**`, `/topic/**` và đường dẫn user tùy ý.
- [x] Giữ các destination gửi chat hợp lệ; bổ sung kiểm thử tránh regression.
- [x] Frontend xử lý disconnect/reconnect, cập nhật token khi kết nối lại và chỉ log debug ở môi trường dev.

**Nghiệm thu:**
- [x] Local: JWT thật qua Nginx production config → Spring STOMP → RabbitMQ; queue cách ly,
  chặn SUBSCRIBE/SEND trái phép, chat hợp lệ, reconnect và payload DTO đầy đủ.
- [x] Cấu hình Compose tách cổng, bật STOMP plugin; Nginx proxy `/ws` với HTTP Upgrade.
- [ ] Production kết nối đúng STOMP; không nghe lén queue; chat hiện tại tiếp tục hoạt động.

Phần tách cổng được thực hiện sớm cùng T4 vì relay production đang dùng nhầm cổng AMQP.
T7 bổ sung xác thực CONNECT trước interceptor bảo mật, giữ principal cho các frame tiếp theo,
kiểm tra chủ sở hữu chat khi SUBSCRIBE/SEND và mặc định từ chối destination khác.
Đã thêm test relay RabbitMQ STOMP và Nginx bằng Testcontainers, JWT ký thật, profile `prod`.
Nginx trước đây thiếu route `/ws`, nay đã bổ sung. Helper chat dùng token mới khi reconnect,
dừng khi logout/đổi tài khoản và suy ra WSS từ HTTPS. Nghiệm thu trên host production
vẫn để mở đến khi có endpoint/tài khoản kiểm thử và rollout (T9); không coi container local
là môi trường production đã triển khai.

### T8 — Frontend và chuông dùng chung

- [x] Thay `any` bằng DTO/event có kiểm tra dữ liệu; bỏ qua payload hỏng hoặc không đúng contract.
- [x] Nhận message bằng callback, không dùng một `lastMessage` làm hàng đợi sự kiện.
- [x] Merge theo ID, chống trùng, không để response fetch cũ ghi đè message vừa nhận.
- [x] Tải lại feed/count khi reconnect hoặc quay lại tab; khi mất kết nối, polling mỗi 30 giây lúc tab đang hiển thị.
- [x] Xóa state khi logout/đổi tài khoản; hủy hoặc bỏ qua request của phiên cũ.
- [x] API PUT kiểm tra HTTP status và `success`; chỉ cập nhật đã đọc khi server xác nhận, lỗi hiển thị để thử lại.
- [x] Chuông có loading/error/empty, tải thêm, đọc một/tất cả và điều hướng đúng vai trò.
- [x] Browser permission chỉ xin sau thao tác người dùng; quyền bị từ chối không ảnh hưởng chuông/email.
- [x] Giữ polling quiz hiện có; notification không thay thế nguồn trạng thái quiz.

**Nghiệm thu:**
- [x] Không xuất hiện thông báo rỗng, unread không sai do phân trang, không lẫn dữ liệu giữa tài khoản.

Chuông dùng chung cho Student/Teacher/Admin. Test bao gồm payload lỗi, burst/replay,
race REST/realtime/count, StrictMode, đổi tài khoản, PUT lỗi, link khác role, focus bàn phím
và quyền browser. Fixture riêng kiểm tra responsive/dark mode, không dùng tài khoản thật.

### T9 — Kiểm thử, vận hành và phát hành

- [x] Bổ sung integration test với PostgreSQL thật qua Testcontainers; kiểm thử STOMP qua RabbitMQ và email qua SMTP thử nghiệm.
- [x] Thêm test frontend cho API, merge/dedup, race fetch/realtime, reconnect và đổi tài khoản.
- [x] Metrics: số delivery pending/failed, tuổi pending lâu nhất, số retry và độ trễ gửi; log theo notification/delivery ID, không log token hoặc nội dung nhạy cảm.
- [x] Có runbook truy vấn lỗi và đưa delivery `FAILED` trở lại `PENDING` có kiểm soát; không thêm API retry công khai.
- [ ] Triển khai migration tương thích trước, sau đó backend và frontend; tắt worker bằng cấu hình khi cần rollback, giữ dữ liệu để xử lý tiếp.

**Thứ tự phụ thuộc:** T1 → T2 → T3/T4 → T5/T6 → T7/T8 → T9. Mỗi task kèm test tương ứng ngay khi triển khai.

## 4. Tiêu chí hoàn thành

- [x] Pass các test notification/WebSocket hiện có và bộ test mới.
- [ ] Kiểm chứng rollback, hai worker đồng thời, lease hết hạn, restart, broker/SMTP ngừng và phục hồi.
- [x] Kiểm chứng giờ `23:45–00:15`, Chủ nhật–thứ Hai, bật/tắt nhắc, đổi/xóa lịch và tiết đã bắt đầu.
- [x] Kiểm chứng cả hai luồng quiz: thành công, thất bại, xử lý lặp và đúng người nhận.
- [x] Kiểm chứng REST/JSON có trường `isRead` đúng contract, phân quyền khác tài khoản và bảo mật subscription.
- [ ] Trên staging: notification xuất hiện trong chuông khi offline rồi đăng nhập lại; realtime bình thường cập nhật trong 10 giây sau khi lưu.
- [ ] Frontend build thành công; smoke test chat, tạo quiz và lịch học không có regression.

Đợt này bảo đảm module notification và worker an toàn khi nhiều instance cùng chạy; việc thiết kế lại toàn bộ cơ chế chạy/recovery của AI generation là công việc riêng.
