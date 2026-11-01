# Tài Liệu Luồng Chức Năng Hệ Thống (Functional Flow Documentation) - AI Tutor Service

Tài liệu này tổng hợp toàn bộ luồng hoạt động (functional workflows), kiến trúc dữ liệu và tương tác giữa các thành phần trong dự án **`ai-tutor-service`** (Spring Boot 3.x, PostgreSQL pgvector, Redis, RabbitMQ, LangChain4j, Gemini/Ollama).

---

## 1. Tổng Quan Kiến Trúc Toàn Cục (System Architecture)

```mermaid
flowchart TD
    subgraph Clients["Tầng Client & Người Dùng"]
        Student["Học sinh (Web / Mobile)"]
        Teacher["Giáo viên (Web Dashboard)"]
        Admin["Quản trị viên (Admin Portal)"]
    end

    subgraph Gateway_Security["Tầng Bảo Mật & Kết Nối (Security & Transport)"]
        JWT["Spring Security + JWT Authentication"]
        RateLimit["Rate Limiting Filter (Bucket4j / Redis)"]
        WS_STOMP["WebSocket / STOMP Relay (RabbitMQ)"]
        SSE["Server-Sent Events (SSE Streaming)"]
    end

    subgraph Core_Services["Tầng Dịch Vụ Nghiệp Vụ (Application Services)"]
        AuthSvc["Auth & User Profile Service"]
        ChatSvc["Chat & Content Safety Service"]
        CurriculumSvc["Curriculum & Ingestion Service"]
        QuizSvc["Quiz & Question Bank Service"]
        GamificationSvc["Gamification (XP, Streak, Leaderboard)"]
        AnalyticsSvc["Analytics, At-Risk & Pedagogy Advisor"]
        NotifSvc["Notification & Delivery Engine"]
    end

    subgraph Background_Workers["Tầng Xử Lý Nền (Background Workers & Jobs)"]
        IngestWorker["Document Ingestion Processor"]
        GenWorker["AI Question Generation Worker"]
        CronJobs["Schedulers (Streak, Quiz Expiry, At-Risk, Notif Delivery)"]
    end

    subgraph Data_AI_Layer["Hạ Tầng Dữ Liệu & AI"]
        Postgres[("PostgreSQL 16 + pgvector<br/>(Dữ liệu quan hệ + Vector SGK)")]
        Redis[("Redis 7.2<br/>(Cache, Token Blacklist, Lock)")]
        RabbitMQ["RabbitMQ 3.13<br/>(STOMP Broker & Message Queue)"]
        Cloudinary["Cloudinary<br/>(Lưu trữ File & Avatar)"]
        LLM_APIs["AI APIs (Google Gemini / Ollama / OpenAI)"]
    end

    Clients --> Gateway_Security
    Gateway_Security --> Core_Services
    Core_Services --> Background_Workers
    Core_Services --> Data_AI_Layer
    Background_Workers --> Data_AI_Layer
```

---

## 2. Chi Tiết Luồng Từng Chức Năng

### Chức Năng 1: Xác Thực & Quản Lý Phiên (Authentication & Token Rotation)

- **Mục đích:** Xử lý đăng ký, đăng nhập an toàn với cơ chế JWT kép: Access Token trong HTTP Authorization Header và Refresh Token trong `HttpOnly Cookie`. Áp dụng cơ chế xoay vòng token (Token Rotation) và blacklist token trên Redis khi đăng xuất.
- **Mã nguồn liên quan:**
  - Controller: [`AuthController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/AuthController.java)
  - Service: [`AuthServiceImpl.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/user/AuthServiceImpl.java)
  - Security/JWT: [`JwtProvider.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/security/jwt/JwtProvider.java), [`RefreshTokenService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/security/jwt/RefreshTokenService.java), [`TokenBlacklistService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/security/jwt/TokenBlacklistService.java)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client (Web / App)
    participant AuthCtrl as AuthController
    participant AuthSvc as AuthServiceImpl
    participant SecMgr as AuthenticationManager
    participant Jwt as JwtProvider
    participant Redis as Redis Cache
    participant DB as PostgreSQL (users)

    Note over Client, DB: Luồng Đăng Nhập (Login)
    Client->>AuthCtrl: POST /api/v1/auth/login (username, password)
    AuthCtrl->>SecMgr: Xác thực thông tin đăng nhập
    SecMgr->>DB: Kiểm tra tài khoản & BCrypt password
    DB-->>SecMgr: User info (Active, Role)
    SecMgr-->>AuthSvc: Authentication Success
    AuthSvc->>Jwt: Sinh Access Token (hạn ngắn: 15p)
    AuthSvc->>Jwt: Sinh Refresh Token (hạn dài: 7 ngày)
    AuthSvc->>Redis: Lưu Refresh Token (Key: user_id:token)
    AuthSvc-->>AuthCtrl: AuthResponseDTO
    AuthCtrl-->>Client: Trả Access Token trong Body + Refresh Token trong HttpOnly Cookie

    Note over Client, DB: Luồng Làm Mới Token (Refresh Token Rotation)
    Client->>AuthCtrl: POST /api/v1/auth/refresh (Cookie: refreshToken)
    AuthCtrl->>AuthSvc: refreshToken(cookieValue)
    AuthSvc->>Jwt: Validate chữ ký JWT Refresh Token
    AuthSvc->>Redis: Kiểm tra token có tồn tại trong Redis không?
    alt Token không hợp lệ / Đã bị thu hồi
        Redis-->>AuthSvc: Không tìm thấy
        AuthSvc-->>Client: 401 Unauthorized (Bắt buộc đăng nhập lại)
    else Token hợp lệ
        AuthSvc->>Redis: Xóa Refresh Token cũ (Chống tái sử dụng)
        AuthSvc->>Jwt: Tạo cặp Access Token & Refresh Token MỚI
        AuthSvc->>Redis: Lưu Refresh Token mới
        AuthSvc-->>Client: Cập nhật Access Token mới + Cookie mới
    end
```

---

### Chức Năng 2: Nạp & Vector Hóa Tài Liệu Giáo Trình (Curriculum & RAG Ingestion Pipeline)

- **Mục đích:** Xử lý file PDF sách giáo khoa tải lên từ Admin/Giáo viên. Tự động bóc tách bằng LlamaParse, phân đoạn thông minh bảo toàn công thức Toán dạng LaTeX, tạo vector embeddings theo batch và lưu vào `pgvector`. Đồng thời phân tích mục lục (TOC) để tạo cấu trúc: Sách -> Chương -> Bài -> Kỹ năng.
- **Mã nguồn liên quan:**
  - Controller: [`AdminDocumentController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/AdminDocumentController.java)
  - Processor: [`DocumentIngestionProcessor.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/curriculum/DocumentIngestionProcessor.java)
  - Splitter: [`LatexAwareSplitter.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/curriculum/LatexAwareSplitter.java)
  - Parser/TOC: [`BookExtractionService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/curriculum/BookExtractionService.java), [`TocAnalysisService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/curriculum/TocAnalysisService.java)
  - Embedding: [`ChunkEmbeddingService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/ai/client/ChunkEmbeddingService.java)

```mermaid
flowchart TD
    A["Admin / Giáo viên tải lên PDF SGK"] --> B["AdminDocumentController: Upload file"]
    B --> C["Upload lên Cloudinary lấy public URL"]
    C --> D["Tạo bản ghi Document (Status = PENDING)"]
    D --> E["Kích hoạt DocumentIngestionProcessor ngầm"]
    
    subgraph Ingestion_Pipeline["Ingestion Pipeline"]
        E --> F["DocumentTextExtractor: Bóc tách văn bản (LlamaParse / PDFBox)"]
        F --> G["LatexAwareSplitter: Cắt nhỏ đoạn (bảo toàn công thức toán $...$)"]
        G --> H["ChunkEmbeddingService: Gửi batch 100 chunks đến Gemini / OpenAI / Ollama"]
        H --> I["Nhận danh sách float[] vector embeddings"]
        I --> J["Lưu DocumentChunk vào PostgreSQL (pgvector cột embedding)"]
        J --> K["TocAnalysisService: Đọc mục lục, tạo quan hệ Book -> Chapter -> Lesson -> Skills"]
        K --> L["Cập nhật Document (Status = COMPLETED)"]
    end

    Ingestion_Pipeline -.->|"Gửi tiến độ 0% -> 10% -> 40% -> 100% qua WebSocket STOMP"| M["Client Dashboard (Real-time Progress Bar)"]
```

---

### Chức Năng 3: Gia Sư AI Tương Tác Trực Tuyến (RAG AI Chatbot Streaming)

- **Mục đích:** Cung cấp trải nghiệm hỏi đáp học tập thời gian thực với Gia sư AI. Hệ thống tích hợp bộ lọc an toàn nội dung (`ContentSafetyService`), trích xuất tri thức bám sát SGK từ `pgvector` thông qua ngữ cảnh lớp/môn của học sinh, và stream phản hồi theo token kèm trích dẫn tài liệu tham khảo.
- **Mã nguồn liên quan:**
  - Controller: [`ChatController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/ChatController.java), [`ChatWebSocketController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/ChatWebSocketController.java)
  - Processor: [`ChatStreamProcessor.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/chat/ChatStreamProcessor.java)
  - Guardrail: [`ContentSafetyService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/chat/ContentSafetyService.java)
  - RAG Retriever: [`CustomPostgresRetriever.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/chat/CustomPostgresRetriever.java)
  - AI Agent: [`AiTutorChatAgent.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/ai/agent/AiTutorChatAgent.java)

```mermaid
flowchart TD
    Start["Học sinh gửi tin nhắn qua SSE (/stream) hoặc STOMP WebSocket"] --> SaveUserMsg["Lưu ChatMessage (Sender = STUDENT)"]
    SaveUserMsg --> SafetyCheck{"ContentSafetyService:<br/>Kiểm duyệt an toàn nội dung?"}
    
    SafetyCheck -- "Vi phạm (Độc hại, bạo lực, gian lận)" --> UnsafeFlow["1. Ghi AuditLog vi phạm<br/>2. Lấy Rejection Message mẫu an toàn<br/>3. Lưu ChatMessage (Sender = AI)<br/>4. Phát Token từ chối về Client & Kết thúc"]
    
    SafetyCheck -- "Hợp lệ" --> ContextSetup["Thiết lập RagContextHolder (Subject, GradeLevel của Học sinh)"]
    ContextSetup --> Vectorize["Tạo Vector câu hỏi bằng ChunkEmbeddingService"]
    Vectorize --> SimilaritySearch["CustomPostgresRetriever: Tìm kiếm cosine similarity trên document_chunks (Top 5 chunks)"]
    SimilaritySearch --> BuildPrompt["Ghép Prompt: Tri thức SGK chuẩn + Ngữ cảnh sư phạm + Lịch sử hội thoại"]
    BuildPrompt --> LLMCall["Gọi Gemini / Ollama qua LangChain4j Agent"]
    LLMCall --> StreamTokens["Stream từng Token về Client qua SSE / WebSocket"]
    StreamTokens --> SaveAIMsg["Lưu ChatMessage (Sender = AI kèm Citation Links nguồn SGK)"]
    SaveAIMsg --> EndStream["Gửi Event DONE báo hoàn thành"]
```

---

### Chức Năng 4: Sinh Đề Tự Động & Quản Lý Ngân Hàng Câu Hỏi (AI Question Bank)

- **Mục đích:** Giáo viên yêu cầu sinh câu hỏi trắc nghiệm hoặc tự luận theo bài học và ma trận độ khó. Tác vụ được đưa vào hàng đợi xử lý bất đồng bộ (Async Worker), gọi LLM sinh câu hỏi có cấu trúc, tự động điền vào Ngân hàng đề thi và cho phép gán đề thi cho lớp học.
- **Mã nguồn liên quan:**
  - Controller: [`GenerationJobController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/GenerationJobController.java), [`QuestionBankController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/QuestionBankController.java)
  - Worker: [`GenerationWorker.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/job/GenerationWorker.java), [`GenerationJobService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/job/GenerationJobService.java)
  - Agent: [`GeminiQuestionGeneratorAgent.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/ai/agent/GeminiQuestionGeneratorAgent.java)
  - Services: [`QuestionBankService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/quiz/QuestionBankService.java), [`QuizManagementService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/quiz/QuizManagementService.java)

```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Giáo viên
    participant JobCtrl as GenerationJobController
    participant Store as GenerationJobStore
    participant Worker as GenerationWorker (@Async)
    participant Agent as GeminiQuestionGeneratorAgent
    participant BankSvc as QuestionBankService
    participant DB as PostgreSQL

    Teacher->>JobCtrl: POST /api/v1/jobs/generate-questions (lessonId, count, difficulty)
    JobCtrl->>Store: Tạo bản ghi ai_generation_jobs (Status = PENDING)
    JobCtrl-->>Teacher: Trả về 202 Accepted + jobId
    JobCtrl->>Worker: Kích hoạt run(jobId) trên executor riêng
    
    Worker->>Store: Cập nhật job (Status = PROCESSING)
    Worker->>BankSvc: Chuẩn bị kiến thức bài học (Lesson, Skills)
    BankSvc->>Agent: Gọi AI Prompt sinh câu hỏi định dạng JSON chuẩn
    Agent-->>BankSvc: Trả về danh sách câu hỏi + phương án lựa chọn + giải thích
    BankSvc->>DB: Lưu vào bảng question_bank & question_choices
    Worker->>Store: Cập nhật job (Status = COMPLETED, resultBatchId)
    
    loop Polling hoặc WebSocket
        Teacher->>JobCtrl: GET /api/v1/jobs/{jobId}
        JobCtrl-->>Teacher: Trả về Status = COMPLETED & Danh sách câu hỏi sinh ra
    end
```

---

### Chức Năng 5: Chu Trình Làm Bài Kiểm Tra & Chấm Điểm (Quiz Lifecycle & Auto-Grading)

- **Mục đích:** Đảm bảo tính trung thực và toàn vẹn khi học sinh làm bài: kiểm tra khung thời gian xuất bản (`PublishWindow`), tạo bản nháp lưu đáp án theo thời gian thực (tránh mất bài khi mất mạng), tự động thu bài khi hết giờ (`QuizExpiryJob`) và chấm điểm tức thời.
- **Mã nguồn liên quan:**
  - Controller: [`StudentQuizAttemptController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/StudentQuizAttemptController.java)
  - Service: [`QuizSubmissionService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/quiz/QuizSubmissionService.java), [`QuizGradingService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/quiz/QuizGradingService.java), [`QuizAccessService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/quiz/QuizAccessService.java)
  - Expiry Job: [`QuizExpiryJob.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/config/QuizExpiryJob.java)

```mermaid
flowchart TD
    A["Học sinh mở bài kiểm tra"] --> B["Kiểm tra PublishWindow (available_from <= NOW <= available_until)"]
    B --> C["Tạo QuizAttemptDraft (started_at = NOW, expires_at = started_at + time_limit)"]
    C --> D["Học sinh chọn đáp án từng câu"]
    D --> E["Auto-save nháp: QuizAttemptDraftAnswer (Upsert định kỳ)"]
    
    E --> Decision{"Hành động tiếp theo?"}
    
    Decision -- "Học sinh bấm 'Nộp bài'" --> SubmitProc["QuizSubmissionService: Nhận nộp bài"]
    Decision -- "Hết giờ (Client đóng tab hoặc hết pin)" --> ExpiryCron["QuizExpiryJob quét định kỳ phát hiện draft quá hạn -> Tự động thu bài"]
    
    SubmitProc & ExpiryCron --> LockStudent["Khóa Pessimistic Lock trên học sinh (Chống race-condition)"]
    LockStudent --> Grade["QuizGradingService: Chấm điểm dựa trên đáp án đúng trong DB"]
    Grade --> CalcScore["Tính điểm Score (thang 10) & Số câu đúng (correct_count)"]
    CalcScore --> CreateAttempt["Lưu bản ghi chính thức: QuizAttempt & QuizAttemptAnswers"]
    CreateAttempt --> CloseDraft["Cập nhật Draft (completed_at = NOW)"]
    CloseDraft --> TriggerGamification["Kích hoạt Luồng Gamification (Thưởng XP & Chuỗi Streak)"]
    TriggerGamification --> ReturnResult["Trả bảng điểm & Lời giải chi tiết cho Học sinh"]
```

---

### Chức Năng 6: Hệ Thống Động Lực Học Tập & Gamification (XP, Streak, Leaderboard)

- **Mục đích:** Thúc đẩy thói quen học tập hàng ngày của học sinh qua hệ thống điểm kinh nghiệm XP (chỉ thưởng lần đầu làm bài để chống gian lận), duy trì chuỗi học liên tục (Daily Streak), tự động reset lúc 00:00 và xếp hạng cạnh tranh.
- **Mã nguồn liên quan:**
  - Controller: [`LeaderboardController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/LeaderboardController.java)
  - Gamification Services: [`XpAwardService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/gamification/XpAwardService.java), [`StreakService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/gamification/StreakService.java), [`LeaderboardService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/gamification/LeaderboardService.java)
  - Audit/Reset Job: [`StreakResetJob.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/config/StreakResetJob.java), [`XpIntegrityAuditService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/gamification/XpIntegrityAuditService.java)

```mermaid
flowchart TD
    subgraph XPAward["1. Luồng Cộng XP"]
        A["Nộp bài Quiz hoàn tất"] --> B{"Học sinh đã từng nộp bài này trước đây chưa?"}
        B -- "Làm lần đầu" --> C["Cộng 100% XP (Số câu đúng * 10 XP)"]
        B -- "Làm lại để luyện tập" --> D["Không cộng dồn XP (0 XP) để chống gian lận"]
        C --> E["Ghi log vào bảng xp_transactions"]
        E --> F["Cộng tổng XP cho Student & Cập nhật Level"]
    end

    subgraph StreakMgmt["2. Luồng Quản Lý Streak"]
        A --> G["StreakService: So sánh ngày nộp bài với last_activity_date"]
        G --> H{"Hôm nay đã ghi nhận streak chưa?"}
        H -- "Đã học hôm nay rồi" --> I["Giữ nguyên streak_count"]
        H -- "Hôm qua có học, hôm nay học tiếp" --> J["streak_count = streak_count + 1"]
        H -- "Bỏ lỡ ngày hôm qua (Ngắt quãng)" --> K["streak_count được tính lại = 1"]
        J & K --> L["Cập nhật last_activity_date = NOW"]
        
        M["StreakResetJob: Cron Job chạy lúc 00:05 mỗi ngày"] --> N["Tìm học sinh không có hoạt động trong ngày hôm qua"]
        N --> O["Reset streak_count = 0"]
    end

    subgraph LeaderboardView["3. Bảng Xếp Hạng"]
        P["User truy cập Bảng xếp hạng"] --> Q["LeaderboardService: Truy vấn phân trang theo XP"]
        Q --> R["Bộ lọc: Theo Lớp học / Khối lớp / Toàn trường & Theo Tuần / Tháng / Mọi lúc"]
    end

    XPAward --> LeaderboardView
```

---

### Chức Năng 7: Phân Tích Lỗ Hổng Kiến Thức, Cảnh Báo Sớm & Cố Vấn Sư Phạm (Analytics & AI Pedagogy)

- **Mục đích:** Tự động tính toán mức độ thành thạo từng kỹ năng/chuyên đề dựa trên lịch sử làm bài. Phát hiện học sinh có nguy cơ tụt lại phía sau (At-risk), gọi AI cố vấn sư phạm (`GeminiPedagogyAdvisor`) để gợi ý lộ trình cải thiện và soạn thư tự động gửi phụ huynh.
- **Mã nguồn liên quan:**
  - Controller: [`AnalyticsController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/AnalyticsController.java)
  - Jobs: [`KnowledgeGapAnalysisJob.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/config/KnowledgeGapAnalysisJob.java), [`AtRiskScanJob.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/config/AtRiskScanJob.java)
  - Services: [`KnowledgeGapServiceImpl.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/analytics/KnowledgeGapServiceImpl.java), [`AtRiskServiceImpl.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/analytics/AtRiskServiceImpl.java), [`ParentMessageServiceImpl.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/analytics/ParentMessageServiceImpl.java), [`ReportExportServiceImpl.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/analytics/ReportExportServiceImpl.java)
  - AI Advisor: [`GeminiPedagogyAdvisor.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/ai/advisor/GeminiPedagogyAdvisor.java)

```mermaid
flowchart TD
    Trigger["Job định kỳ HOẶC Giáo viên bấm 'Phân tích'"] --> FetchData["Lấy toàn bộ kết quả bài tập của Lớp / Học sinh"]
    
    subgraph GapAnalysis["Phân Tích Lỗ Hổng (Knowledge Gap)"]
        FetchData --> CalcMastery["Tính tỷ lệ trả lời đúng theo từng Kỹ năng (Skill Mastery %)"]
        CalcMastery --> IdentifyGap["Xác định kỹ năng yếu: Mastery < 60%"]
        IdentifyGap --> RankGap["Xếp hạng mức độ nghiêm trọng (RankedGap)"]
        RankGap --> AIAdvisor["GeminiPedagogyAdvisor: Đọc lỗ hổng -> Sinh lời khuyên sư phạm cho giáo viên"]
    end

    subgraph AtRiskDetection["Phát Hiện Nguy Cơ (At-Risk Classifier)"]
        FetchData --> CheckMetrics["Kiểm tra chỉ số: Điểm trung bình < Ngưỡng, Mất chuỗi Streak, Quá hạn nộp bài"]
        CheckMetrics --> ClassifyRisk{"Phân loại cấp độ nguy cơ"}
        ClassifyRisk -- "Nghiêm trọng" --> HighRisk["Gán nhãn HIGH_RISK"]
        ClassifyRisk -- "Cần chú ý" --> MediumRisk["Gán nhãn MEDIUM_RISK"]
        HighRisk & MediumRisk --> ParentAlert["ParentMessageComposer: Soạn tin nhắn tự động gửi phụ huynh"]
    end

    GapAnalysis & AtRiskDetection --> ExportReport["ReportExportServiceImpl: Xuất file Excel / PDF báo cáo học tập cho nhà trường"]
```

---

### Chức Năng 8: Động Cơ Gửi Thông Báo Đa Kênh Tin Cậy (Notification Engine)

- **Mục đích:** Xử lý gửi thông báo nhắc lịch học trước giờ lên lớp, thông báo kết quả thi, cảnh báo phụ huynh qua WebSocket (In-App) và Email (SMTP). Thiết kế theo mô hình `Claim & Lease Lock` đảm bảo không bao giờ gửi lặp thông báo khi triển khai nhiều pod/instance.
- **Mã nguồn liên quan:**
  - Controller: [`NotificationController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/NotificationController.java)
  - Reminder: [`ClassReminderService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/system/notification/ClassReminderService.java), [`ScheduleNotificationJob.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/config/ScheduleNotificationJob.java)
  - Delivery: [`NotificationDeliveryJob.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/config/NotificationDeliveryJob.java), [`NotificationDeliverySender.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/system/notification/NotificationDeliverySender.java), [`NotificationDeliveryStore.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/system/notification/NotificationDeliveryStore.java)

```mermaid
sequenceDiagram
    autonumber
    participant Event as Sự kiện (Nhắc lịch học / Cảnh báo điểm)
    participant DB as PostgreSQL (notifications & notification_deliveries)
    participant DeliveryJob as NotificationDeliveryJob (Cron định kỳ)
    participant Sender as NotificationDeliverySender
    participant WS as WebSocket Broker (STOMP)
    participant SMTP as JavaMailSender (Email)

    Event->>DB: Tạo bản ghi notifications + notification_deliveries (Status = PENDING)
    
    loop Mỗi 30 giây
        DeliveryJob->>DB: Claim batch thông báo cần gửi (Ghi nhận lease_until để khóa bản ghi)
        DB-->>DeliveryJob: Danh sách PreparedDelivery được cấp quyền xử lý
        
        alt Kênh WEBSOCKET (In-App)
            DeliveryJob->>Sender: send(WEBSOCKET)
            Sender->>WS: Gửi payload tới /user/{username}/queue/notifications
            Sender-->>DeliveryJob: Thành công
        else Kênh EMAIL (Nhắc lịch học / Báo cáo)
            DeliveryJob->>Sender: send(EMAIL)
            Sender->>SMTP: Gửi email qua Gmail SMTP Server
            Sender-->>DeliveryJob: Thành công
        end
        
        DeliveryJob->>DB: Cập nhật notification_deliveries (Status = SENT, sent_at = NOW)
    end
```

---

### Chức Năng 9: Quản Lý Lớp Học & Tự Động Giải Tán (Classroom Lifecycle)

- **Mục đích:** Quản lý hai loại hình lớp: Lớp trường học chính khóa (`SchoolClass`) và Lớp học nhóm ngắn hạn (`StudyClass`). Cung cấp mã tham gia lớp (Enrollment code), phân công bài tập, và định kỳ giải tán lớp học nhóm đã hết hạn.
- **Mã nguồn liên quan:**
  - Controller: [`StudyClassController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/StudyClassController.java), [`TeacherClassController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/TeacherClassController.java), [`ClassAssignmentController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/ClassAssignmentController.java)
  - Dissolve Job: [`StudyClassDissolveJob.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/config/StudyClassDissolveJob.java)

```mermaid
flowchart TD
    subgraph ClassTypes["1. Khởi Tạo & Ghi Danh Lớp"]
        A["Admin tạo Lớp trường học (SchoolClass)"] --> B["Phân công giáo viên chủ nhiệm & giáo viên bộ môn"]
        C["Giáo viên / Học sinh tạo Lớp học nhóm (StudyClass)"] --> D["Học sinh nhập mã tham gia (Enrollment Code)"]
        D --> E["Lưu bản ghi study_class_enrollments"]
    end

    subgraph Operation["2. Hoạt Động Trong Lớp"]
        E & B --> F["Gán bài tập Quiz cho Lớp (quiz_class_assignments / quiz_study_class_assignments)"]
        F --> G["Thiết lập Thời khóa biểu & Lịch học định kỳ (schedules & schedule_slots)"]
    end

    subgraph DissolveJob["3. Vòng Đời Kết Thúc Lớp Học Nhóm"]
        H["StudyClassDissolveJob: Cron Job chạy lúc 01:00 hàng ngày"] --> I{"Kiểm tra study_classes:<br/>NOW > end_date VÀ status = ACTIVE?"}
        I -- "Có lớp hết hạn" --> J["Cập nhật status = DISSOLVED (Giải tán lớp)"]
        J --> K["Lưu vết lịch sử học tập (Không xóa dữ liệu học sinh)"]
        J --> L["Gửi thông báo tới các thành viên lớp"]
    end

    ClassTypes --> Operation
```

