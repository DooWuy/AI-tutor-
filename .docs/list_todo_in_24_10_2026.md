# Tổng hợp công việc ngày 24/10/2026

## Notification realtime cho lớp học

### Đã hoàn thành

- [x] TASK-01 — Mở rộng schema và notification contract.
  - Thêm migration V7 mở rộng `notifications.source_type` với `STUDY_CLASS_ENROLLMENT`.
  - Thêm ba notification type cho yêu cầu, chấp nhận và từ chối tham gia lớp.
  - Tách validation theo nhóm reminder, quiz và study class; study class chỉ dùng WebSocket,
    bắt buộc occurrence từ `requestedAt` và không có expiry.
  - Kiểm chứng migration từ V2 qua V7 và khả năng đọc notification legacy bằng PostgreSQL thật.
- [x] TASK-02 — Xây dựng command và link notification lớp học.
  - Thêm command gửi yêu cầu tới giáo viên và command trả kết quả tới học sinh.
  - Chuẩn hóa metadata, nội dung tiếng Việt, link theo role và event key chống trùng theo chu kỳ.
  - Không đưa email, token hoặc dữ liệu nhạy cảm vào metadata notification.
  - Bổ sung unit test cho recipient, type/source, channel, metadata, link, title/message,
    idempotency và validation các tổ hợp sai.
- [x] TASK-03 — Bổ sung API đọc lớp học cho học sinh.
  - Thêm read model lớp học theo enrollment, không trả thành viên hoặc dữ liệu quản trị.
  - Thêm API danh sách và chi tiết, luôn giới hạn theo student lấy từ principal.
  - Trả `404` khi student không có enrollment, không làm lộ sự tồn tại của class ID.
  - Mở rộng join response bằng `enrollmentId`, `classId`, `requestedAt` và giữ các field cũ.
- [x] TASK-04 — Gắn notification vào transaction join/approve/reject.
  - Join tạo notification cho giáo viên; approve/reject tạo notification cho học sinh.
  - Enrollment và notification/delivery commit hoặc rollback trong cùng transaction.
  - Thêm pessimistic lock theo thứ tự class → enrollment để chặn duplicate và vượt sĩ số.
  - Rejoin sau reject tạo chu kỳ mới với `requestedAt` tăng đơn điệu và xóa `reviewedAt`.

### Kiểm chứng

- [x] Contract + migration integration: `BUILD SUCCESSFUL` trên PostgreSQL Testcontainer.
- [x] Regression notification/WebSocket/generation: 92 tests pass, 0 failed, 0 skipped.
- [x] TASK-03/04 unit, controller và PostgreSQL integration: 34 tests pass, 0 failed, 0 skipped.
- [x] Concurrency: duplicate join chỉ tạo một enrollment/event; hai approve tranh suất cuối chỉ một thành công.
- [x] Atomic rollback: lỗi insert delivery rollback cả join hoặc quyết định approve.
- [x] `git diff --check` không phát hiện lỗi whitespace.

Full backend suite: 427/428 tests pass, 33 skipped. Một lỗi ngoài phạm vi ở
`SampleTextbookSplitTest` do test còn tìm PDF trong `docs/` sau khi worktree chuyển tài liệu sang
`.docs/`; không sửa hoặc hoàn tác thay đổi tài liệu trong TASK-03/04.

### Tiếp theo

- [ ] TASK-05 — Mở rộng contract và API client frontend.
- [ ] TASK-06 — Hoàn thiện giao diện lớp học của học sinh.
- [ ] TASK-07 — Đồng bộ realtime màn hình giáo viên.
