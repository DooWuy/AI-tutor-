# Báo Cáo Trạng Thái Các Chức Năng (Feature Status)

Dựa trên yêu cầu gốc trong file `docs/ai.md` (User Story: Luyện tập và Làm Trắc nghiệm), dưới đây là trạng thái hiện tại của các chức năng trong dự án.

> **Cập nhật lần cuối:** 08/10/2026

> **Nghiệm thu T-01..T-03:** Full-stack đã triển khai và kiểm chứng trên Docker với database riêng `quiz_validation_20261008`; unit/integration suite chạy trên `quiz_test_20261008`. Database cũ `ai_tutor_dev` vẫn có lỗi checksum V1 và chưa được nâng cấp/reset. Chi tiết bằng chứng và cách chạy lại: [quiz-implementation-verification.md](quiz-implementation-verification.md).

---

## ✅ CÁC TASK ĐÃ HOÀN THÀNH (DONE)

### 1. Tích hợp AI tạo đề thi cá nhân hóa (AC-03)
- Kết nối thành công với **LangChain4j** và **Vector Database** (PostgreSQL pgvector) qua `CustomPostgresRetriever`.
- AI Agent đã có khả năng dựa vào Cấp học, Môn học, Độ khó và Chủ đề để sinh ra các câu hỏi trắc nghiệm liên quan, không bị giới hạn ở dữ liệu hardcode.

### 2. Hỗ trợ đa dạng định dạng câu hỏi (AC-05)
- Đã cấu hình để hệ thống hỗ trợ 4 dạng câu hỏi:
  - **MULTIPLE_CHOICE:** Chọn 1 đáp án đúng
  - **TRUE_FALSE:** Đúng/Sai
  - **FILL_IN_BLANK:** Điền từ vào chỗ trống
  - **SHORT_ANSWER:** Trả lời tự luận ngắn
- Bổ sung trường `type` vào bảng `question_bank` và `quiz_questions` thông qua Flyway script (`V3__add_question_type.sql`).

### 3. Xem kết quả và giải thích chi tiết của AI (AC-04)
- Đã xây dựng API lấy chi tiết kết quả bài làm `GET /api/v1/student/quiz-attempts/{id}`.
- Trả về danh sách chi tiết từng câu trả lời đúng/sai và phần giải thích rõ ràng từng bước (`explanation`) của AI.

### 4. Xóa/ẩn lịch sử luyện tập cá nhân (AC-07)
- API thực tế là `PATCH /api/v1/student/quiz-attempts/{id}/hide` giúp học sinh ẩn bài AI tự luyện.
- Thay vì xóa cứng, hệ thống đánh dấu `isVisible = false` (Soft Delete) giúp bảo toàn dữ liệu báo cáo Analytics cho giáo viên, và không làm giảm điểm XP của học sinh.

### 5. Chốt chặn bảo vệ tính toàn vẹn của kết quả bài thi (AC-06 - Immutability)
- Hoàn thiện `HistoryImmutabilityController`. 
- Đảm bảo Backend từ chối toàn bộ các request cố tình sửa đổi, ghi đè điểm số hoặc thay đổi đáp án (`PUT/PATCH/DELETE`) sau khi bản ghi kết quả bài làm đã được tạo chính thức.

---

## 🔧 CÁC TASK ĐÃ BỔ SUNG & CHỈNH SỬA TRONG NGÀY 08/10/2026

### 6. Chuyển đổi kiến trúc sang Async/RabbitMQ cho việc sinh đề (Refactoring lớn)
**Vấn đề gốc:** Khi gọi AI (Gemini API) đồng bộ để tạo 20-40 câu hỏi trong một request, backend bị `SocketTimeoutException` vì thời gian phản hồi quá lâu (>60s).

**Giải pháp đã triển khai:**
- **Tạo RabbitMQ Queue mới:** Thêm `quiz.generation.queue` + routing key + binding trong `RabbitMQConfig.java`.
- **Tạo DTO message:** `QuizGenerationMessage.java` — serializable message chứa `quizId`, `subject`, `topic`, `difficulty`, `count`, `gradeLevel`.
- **Tạo Producer:** `QuizGenerationProducer.java` — đẩy message vào RabbitMQ queue.
- **Tạo Consumer:** `QuizGenerationConsumer.java` — lắng nghe queue, xử lý sinh đề nền.
- **Chiến lược sinh đề 3 bước trong Consumer:**
  1. **Tái sử dụng câu hỏi:** Truy vấn `QuestionBankRepository.findRandomByTopicAndDifficulty()` để lấy câu hỏi có sẵn trong ngân hàng.
  2. **Chunking song song:** Chia số câu còn thiếu thành các chunk 5 câu, gọi AI song song bằng `CompletableFuture.supplyAsync()`.
  3. **Gộp kết quả:** Tổng hợp cả câu hỏi cũ + câu hỏi mới sinh, lưu vào `QuizQuestion`.
- **Sửa `StudentQuizService.generateCustomQuiz()`:**
  - Bỏ `@Transactional` khỏi method entry-point để tránh race condition: consumer query Quiz trước khi producer commit xong.
  - Logic chuyển sang: tạo Quiz entity → save → đẩy message vào RabbitMQ → return response ngay lập tức cho client.

**Files đã tạo mới:**
| File | Mô tả |
|------|--------|
| `mq/producer/QuizGenerationProducer.java` | Producer đẩy yêu cầu sinh đề vào RabbitMQ |
| `mq/consumer/QuizGenerationConsumer.java` | Consumer xử lý sinh đề bất đồng bộ |
| `dto/request/QuizGenerationMessage.java` | DTO message truyền qua RabbitMQ |

**Files đã chỉnh sửa:**
| File | Thay đổi |
|------|----------|
| `config/RabbitMQConfig.java` | Thêm `QUIZ_GENERATION_QUEUE`, `QUIZ_GENERATION_ROUTING_KEY`, queue bean & binding |
| `service/StudentQuizService.java` | Bỏ `@Transactional`, chuyển sang gọi `QuizGenerationProducer` thay vì gọi AI trực tiếp |
| `repository/QuestionBankRepository.java` | Thêm `findRandomByTopicAndDifficulty()` native query |

### 7. Fix lỗi WebSocket STOMP — Invalid Destination (Bug Fix)
**Vấn đề:** Sau khi Consumer sinh xong đề, nó gọi `messagingTemplate.convertAndSend("/topic/student/{userId}", ...)`. RabbitMQ STOMP Server từ chối destination này vì `/student/{userId}` không phải topic hợp lệ → trả về ERROR frame → Spring Backend ngắt toàn bộ STOMP Relay → Client bị văng ra, hiển thị lỗi đỏ `Failed to send message to ExecutorSubscribableChannel`.

**Giải pháp:**
- Sửa trong `QuizGenerationConsumer.java` dòng 147:
  ```diff
  - messagingTemplate.convertAndSend("/topic/student/" + quiz.getCreatedBy().getId(), (Object) wsMessage);
  + messagingTemplate.convertAndSendToUser(quiz.getCreatedBy().getUsername(), "/queue/notifications", (Object) wsMessage);
  ```
- Destination mới khớp đúng với kênh mà Frontend đang subscribe trong `useWebSocket.ts`: `client.subscribe('/user/queue/notifications', ...)`.

### 8. Fix lỗi WebSocket CSRF — MissingCsrfTokenException (Bug Fix)
**Vấn đề:** Spring Security 6 mặc định bật `XorCsrfChannelInterceptor` cho WebSocket messaging. Client (browser) không gửi CSRF token khi CONNECT qua STOMP → mọi kết nối WebSocket đều bị reject ngay lập tức → `MissingCsrfTokenException`.

**Triệu chứng trên Frontend Console:**
```
<<< ERROR
message: Failed to send message to ExecutorSubscribableChannel[clientInboundChannel]
```
Và backend log: `User Offline: Disconnected from WebSocket session -> student123` lặp lại liên tục mỗi 5 giây (reconnect loop).

**Giải pháp:**
- Thêm bean `csrfChannelInterceptor` (no-op) vào `WebSocketSecurityConfig.java` để override `XorCsrfChannelInterceptor` mặc định:
  ```java
  @Bean(name = "csrfChannelInterceptor")
  public ChannelInterceptor csrfChannelInterceptor() {
      return new ChannelInterceptor() {};
  }
  ```

**Files đã chỉnh sửa:**
| File | Thay đổi |
|------|----------|
| `security/websocket/WebSocketSecurityConfig.java` | Thêm bean `csrfChannelInterceptor` no-op |
| `exception/WebSocketExceptionHandler.java` | Cải thiện logging: extract root cause thay vì log wrapper exception |

### 9. Cải thiện WebSocketExceptionHandler (Enhancement)
- Sửa `handleClientMessageProcessingError()` để extract `cause` từ wrapper `MessageDeliveryException`.
- Thêm `System.err.println` + `printStackTrace()` để in rõ nguyên nhân gốc ra Docker logs, dễ debug hơn.

---

## ✅ T-01..T-03 ĐÃ TRIỂN KHAI VÀ KIỂM CHỨNG FULL-STACK

Contract đã chốt theo `ai.md`: thang điểm 10, làm tròn một chữ số; 10 XP/câu đúng; level = floor(totalXp / 100) + 1. Làm lại đề được phép nhưng chỉ lần hoàn tất đầu tiên nhận XP, kể cả khi lần đầu đạt 0 điểm. Đây là quyết định của feature này, khác công thức mặc định trong SRS hiện tại.

### T-01. Nộp bài và tự thu khi hết giờ (AC-01)
- [x] `POST /api/v1/student/quiz-attempts/submit` chấm phía server, lưu đủ câu đúng/sai/bỏ trống; payload gồm `draftId` và `answers`.
- [x] Deadline và duration lấy từ server; hết hạn chỉ chấm đáp án đã autosave, bỏ qua snapshot gửi muộn.
- [x] Khóa draft/student và unique `source_draft_id` chống nộp trùng; retry trả lại kết quả đã tạo.
- [x] Scheduler thu draft hết hạn theo batch; đã kiểm chứng cạnh tranh với client và trường hợp không có browser submit.
- [x] Phòng thi bốn dạng câu hỏi, timer, điều hướng, xác nhận nộp; trang kết quả có điểm, số câu đúng, thời gian và explanation.
- [x] Browser tự nộp bài một phút: 1/1 đúng, điểm 10.0, +10 XP, duration 60 giây.

### T-02. Tính toán và cộng điểm thưởng XP (AC-02)
- [x] Cộng XP và tính level cùng transaction với attempt; refresh Student dưới khóa để không mất XP khi hai quiz hoàn tất đồng thời.
- [x] Lần hoàn tất đầu tiên thưởng 10 XP/câu đúng; làm lại không thưởng thêm. Hide lịch sử không giảm XP.
- [x] Browser lượt đầu: 3/4 đúng → 7.5/10, +30 XP, tổng 90 → 120, level 2. Làm lại: 4/4 đúng → 10.0, +0 XP, tổng vẫn 120.
- [x] Header lấy lại profile sau khi có kết quả; không tự tính XP ở frontend.

### T-03. API Lưu nháp bài làm thời gian thực (Auto-save draft - Luồng 2.4)
- [x] `POST /api/v1/student/quiz-attempts/draft` tạo/resume và upsert đáp án; autosave gửi thêm `draftId` để request cũ không tạo lượt làm lại.
- [x] `GET /api/v1/student/quiz-attempts/draft/{id}` khôi phục snapshot/deadline và trả `attemptId` nếu backend đã thu bài.
- [x] Mỗi student/quiz chỉ có một draft đang mở; draft hoàn tất giữ lại để chống retry trùng, draft mới dùng cho lượt làm lại.
- [x] Debounce 500 ms, request lưu tuần tự, retry khi online và định kỳ 5 giây, cache tạm theo draft trong sessionStorage.
- [x] Browser: refresh giữ đáp án/deadline; offline hiển thị chưa lưu; khôi phục mạng giữ câu trả lời và ghi lại lên server.
- [x] Chặn câu hỏi khác quiz, đáp án quá 200 ký tự, option key không tồn tại và autosave sau deadline.

### Thay đổi tương thích cần ghi nhận
- Migration mới V4; V1–V3 giữ nguyên. `completed_at` và partial unique index chỉ khóa draft đang mở để hỗ trợ làm lại.
- Index thưởng XP áp dụng cho attempt mới có `source_draft_id`, bảo toàn fixture/lịch sử cũ có thể đã thưởng nhiều lần; service vẫn xét mọi attempt cũ khi quyết định có thưởng XP hay không.
- Sửa nhầm User.id/Student.id ở history/detail/hide. Trigger cho phép riêng `is_visible: true → false`, vẫn cấm sửa kết quả/đáp án.
- Quiz generation có `PROCESSING/READY/FAILED`; persist bộ câu hỏi và READY trong một transaction, kiểm tra số lượng/đáp án/lời giải trước khi cho làm bài. Danh sách polling không phụ thuộc WebSocket.
- Đợt này không nghiệm thu lại chất lượng Gemini/RAG. WebSocket cũ còn xuất hiện `AccessDenied` trong runtime; task quiz dùng REST/polling nên vẫn hoạt động.

---

## 📊 TỔNG KẾT

| Trạng thái | Số lượng | Danh sách |
|------------|----------|-----------|
| Đã ghi nhận từ trước | 9 | AC-03, AC-05, AC-04, AC-07, AC-06, Async RabbitMQ, Fix STOMP, Fix CSRF, Improve Error Handler |
| ✅ Đã nghiệm thu đợt này | 3 | T-01 (Submit Quiz), T-02 (XP), T-03 (Auto-save Draft) |

**Gate còn mở:** triển khai lên database cũ `ai_tutor_dev` cần xử lý lịch sử/checksum V1 theo phương án giữ dữ liệu. Không sử dụng `flyway repair` hoặc reset volume trong đợt này.
        