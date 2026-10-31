# Notification operations runbook

Runbook này dành cho vận hành module notification được mô tả trong
[notification_contract.md](notification_contract.md). Không chạy câu lệnh thay đổi trạng thái
trên production nếu chưa lưu ticket/incident, delivery ID, người thực hiện và kết quả kiểm tra.

## 1. Dashboard và cảnh báo

Prometheus scrape `/actuator/prometheus` bằng access token vận hành. Chỉ `/actuator/health` được mở
cho Docker healthcheck. Các metric không chứa user ID, email, token hoặc nội dung notification:

| Metric | Ý nghĩa |
|---|---|
| `ai_tutor_notification_delivery_current{status="pending"}` | Delivery đang chờ lần gửi tiếp theo |
| `ai_tutor_notification_delivery_current{status="failed"}` | Delivery đã hết số lần thử |
| `ai_tutor_notification_delivery_oldest_pending_seconds` | Tuổi delivery `PENDING`/`PROCESSING` lâu nhất |
| `ai_tutor_notification_delivery_retries_total{channel}` | Số lần đã lên lịch retry theo kênh |
| `ai_tutor_notification_delivery_latency_seconds_*{channel}` | Latency từ lúc lưu notification đến khi transport chấp nhận |

PromQL khuyến nghị:

```promql
ai_tutor_notification_delivery_current{status="failed"} > 0
ai_tutor_notification_delivery_oldest_pending_seconds > 300
sum by (channel) (rate(ai_tutor_notification_delivery_retries_total[10m])) > 0.1
histogram_quantile(0.95,
  sum by (le, channel) (rate(ai_tutor_notification_delivery_latency_seconds_bucket[10m])))
```

Ngưỡng `300s` là cảnh báo ban đầu, cần hiệu chỉnh theo tải staging. Realtime bình thường phải xuất
hiện trong 10 giây. Metric snapshot được cập nhật sau mỗi batch worker; khi
`NOTIFICATION_ENABLED=false`, metric không tiếp tục refresh và dashboard phải hiển thị trạng thái
maintenance riêng.

## 2. Chẩn đoán delivery lỗi

Tìm tổng quan, không đọc title/message/metadata:

```sql
SELECT d.status, d.channel, count(*) AS deliveries,
       min(d.created_at) AS oldest_created_at,
       min(d.next_attempt_at) AS next_attempt_at
FROM notification_deliveries d
GROUP BY d.status, d.channel
ORDER BY d.status, d.channel;

SELECT d.id AS delivery_id, d.notification_id, n.type, n.source_type, n.source_id,
       d.channel, d.status, d.attempt_count, d.next_attempt_at, d.lease_until,
       d.expires_at, d.last_error_code, d.created_at, d.updated_at
FROM notification_deliveries d
JOIN notifications n ON n.id = d.notification_id
WHERE d.status IN ('FAILED', 'PROCESSING')
ORDER BY d.updated_at DESC
LIMIT 100;
```

Đối chiếu log bằng `deliveryId` và `notificationId`. Log worker chỉ ghi ID, channel, error code và
class lỗi; không tăng log level cho token, payload STOMP, email hoặc nội dung notification.

Kiểm tra hạ tầng trước khi requeue:

```powershell
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec rabbitmq rabbitmq-diagnostics -q ping
curl.exe -fsS http://localhost:8088/actuator/health
curl.exe -fsS -H "Authorization: Bearer $env:OPS_ACCESS_TOKEN" `
  http://localhost:8088/actuator/prometheus | Select-String 'ai_tutor_notification_delivery'
```

Với lỗi email, xác nhận DNS/TLS/credential và gửi một email thử bằng tài khoản staging. Với lỗi
WebSocket, xác nhận RabbitMQ STOMP listener `61613`, relay backend và Nginx `/ws` trước khi requeue.

## 3. Requeue một delivery FAILED

Không requeue hàng loạt. Thay `00000000-0000-0000-0000-000000000000` bằng delivery ID từ ticket.
Câu lệnh chỉ cho phép user đang active và reminder còn hợp lệ; quiz không có expiry.

```sql
BEGIN;

SELECT d.id, d.notification_id, n.type, d.channel, d.status, d.attempt_count,
       d.expires_at, d.last_error_code
FROM notification_deliveries d
JOIN notifications n ON n.id = d.notification_id
WHERE d.id = '00000000-0000-0000-0000-000000000000'::uuid
FOR UPDATE OF d;

UPDATE notification_deliveries d
SET status = 'PENDING',
    attempt_count = 0,
    next_attempt_at = now(),
    lease_token = NULL,
    lease_until = NULL,
    last_error_code = NULL,
    sent_at = NULL,
    updated_at = now()
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE d.id = '00000000-0000-0000-0000-000000000000'::uuid
  AND d.notification_id = n.id
  AND d.status = 'FAILED'
  AND u.is_active = TRUE
  AND u.is_deleted = FALSE
  AND (d.expires_at IS NULL OR d.expires_at > now())
  AND (
      n.type <> 'CLASS_REMINDER'
      OR EXISTS (
          SELECT 1
          FROM schedule_slots slot
          JOIN schedules schedule ON schedule.id = slot.schedule_id
          JOIN students student ON student.id = schedule.student_id
          WHERE slot.id = n.source_id
            AND schedule.id::text = n.metadata ->> 'scheduleId'
            AND student.user_id = n.user_id
            AND schedule.is_active = TRUE
            AND NOT (student.study_preferences @> '{"studyReminderEnabled":false}'::jsonb)
            AND n.occurrence_at = d.expires_at
            AND slot.day_of_week = EXTRACT(ISODOW FROM n.occurrence_at
                AT TIME ZONE 'Asia/Ho_Chi_Minh') + 1
            AND n.occurrence_at = (
                (n.occurrence_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + slot.start_time
            ) AT TIME ZONE 'Asia/Ho_Chi_Minh'
      )
  )
RETURNING d.id, d.notification_id, d.channel, d.status, d.next_attempt_at;

-- Phải trả đúng 1 row. Nếu trả 0 row: ROLLBACK và điều tra guard không khớp.
COMMIT;
```

Sau commit, theo dõi row đến `SENT` hoặc retry mới. Email có at-least-once semantics nên phải chấp
nhận khả năng người dùng nhận trùng nếu SMTP đã accept trước khi worker cũ dừng.

## 4. Rollout và rollback

1. Backup database và ghi lại số lượng delivery theo status.
2. Đặt `NOTIFICATION_ENABLED=false`, deploy backend mới để Flyway áp dụng V3 rồi V4 nhưng chưa chạy
   scanner/worker. Xác nhận `flyway_schema_history`, constraint và index.
3. Smoke test REST feed/count/read bằng hai tài khoản để xác nhận ownership.
4. Deploy frontend, đăng nhập lần lượt Student, Teacher và Admin; kiểm tra chuông và chat.
5. Bật RabbitMQ STOMP, SMTP staging và đổi `NOTIFICATION_ENABLED=true`; restart backend.
6. Chạy checklist staging bên dưới và theo dõi metrics/log tối thiểu 15 phút.

Rollback ứng dụng: đặt `NOTIFICATION_ENABLED=false` trước, rollback backend/frontend, không xóa V3/V4
và không xóa notification/delivery. Migration là additive; dữ liệu pending được giữ để phiên bản mới
xử lý tiếp. Không dùng `flyway repair`, không reset volume và không đổi `FAILED` bằng script hàng loạt.

## 5. Staging acceptance

- [ ] Tạo reminder trong 15 phút tới: chuông và email xuất hiện, realtime dưới 10 giây.
- [ ] Logout trước khi worker gửi, đăng nhập lại: notification vẫn có trong REST/feed và chuông.
- [ ] Tắt reminder, đổi giờ, xóa slot và vô hiệu hóa schedule: delivery chưa gửi bị hủy/hết hạn.
- [ ] Kiểm tra `23:45-00:15` và Chủ nhật-Thứ hai bằng clock/data staging kiểm soát.
- [ ] Student quiz success/failure đi tới đúng requester và đúng link.
- [ ] Teacher/Admin job success/failure/recovery đi tới đúng requester và editor.
- [ ] Ngắt RabbitMQ rồi bật lại: WebSocket retry/phục hồi, REST vẫn giữ lịch sử.
- [ ] Ngắt SMTP rồi bật lại: email retry/phục hồi, WebSocket không bị chặn.
- [ ] Hai tài khoản không subscribe/read/mark-read notification của nhau.
- [ ] Smoke test chat send/stream, tạo quiz, lịch học và frontend desktop/mobile.
- [ ] Lưu evidence: thời gian, environment, image SHA, tester, delivery/notification ID và kết quả.

Không đánh dấu staging/production hoàn tất chỉ dựa trên Testcontainers hoặc build local.

## 6. Kiểm tra notification lớp học và broker lỗi

Lọc delivery của luồng enrollment theo source, chỉ lấy ID/trạng thái để tránh đưa nội dung học
sinh vào log vận hành:

```sql
SELECT n.id AS notification_id, d.id AS delivery_id,
       n.type, n.source_type, n.source_id,
       d.channel, d.status, d.attempt_count,
       d.next_attempt_at, d.lease_until, d.last_error_code,
       n.created_at, d.updated_at
FROM notifications n
JOIN notification_deliveries d ON d.notification_id = n.id
WHERE n.source_type = 'STUDY_CLASS_ENROLLMENT'
  AND d.status IN ('PENDING', 'PROCESSING', 'FAILED')
ORDER BY d.updated_at DESC
LIMIT 100;
```

Đối chiếu `source_id` với enrollment trong ticket và kiểm tra recipient bằng user ID đã được
phân quyền; không truy vấn/ghi title, message, email, token hoặc metadata đầy đủ vào incident.

Kịch bản broker outage cho staging:

1. Ghi thời gian bắt đầu, image SHA, enrollment ID và notification/delivery ID; xác nhận row
   enrollment và notification đã commit trong PostgreSQL.
2. Tạm dừng RabbitMQ hoặc STOMP listener, gửi một join/approve thử và xác nhận delivery vẫn
   ở `PENDING`/`PROCESSING` hoặc retry theo `next_attempt_at`, không tạo notification thứ hai.
3. Khôi phục broker, kiểm tra worker chuyển đúng delivery sang `SENT`, rồi xác nhận recipient
   nhận đúng `/user/queue/notifications` trong 10 giây khi WebSocket khỏe.
4. Nếu delivery thành `FAILED`, requeue từng row theo mục 3 sau khi xác minh lease/expiry; không
   reset hàng loạt và không sửa trạng thái enrollment bằng SQL.

Nếu broker không thể khởi động, REST feed vẫn là nguồn lịch sử: lưu notification ID và kết quả
REST, đánh dấu smoke transport là `BLOCKED` thay vì `PASS`, rồi ghi ticket hạ tầng kèm log broker
đã lọc secret.
