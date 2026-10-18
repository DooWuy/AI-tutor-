# Báo Cáo Chi Tiết Các Thay Đổi (Thêm, Sửa, Xóa) - Phiên Làm Việc 18/10/2026

Tài liệu này tổng hợp toàn bộ các thay đổi kiến trúc, tính năng, tối ưu hóa cơ sở dữ liệu, kiểm thử và đóng gói Docker được thực hiện trong phiên làm việc.

---

## I. TỔNG QUAN CÁC MỤC TIÊU ĐÃ HOÀN THÀNH

1. **Tối ưu hóa Database & Repository**:
   - Thêm migration V9 với `pg_trgm` GIN Indexes, Composite Indexes và Partial Indexes cho các thao tác tìm kiếm, lọc, phân trang và sắp xếp.
2. **Bảo mật & Tính năng Đổi Mật Khẩu với OTP**:
   - Tích hợp bước xác thực mã OTP 6 số gửi qua Email trước khi cho phép người dùng đổi mật khẩu.
3. **Bổ sung Toàn Diện Unit Tests**:
   - Viết mới hơn 20 test suite còn thiếu cho Controllers, Services, Security, Exception Handlers và Jobs (nâng tổng số test vượt qua lên 322 tests, đạt 100% pass).
4. **Chuẩn hóa Kiến trúc Backend theo Hướng A (Package by Feature / Sub-Domain)**:
   - Quy hoạch toàn bộ **Service** (cả Interface và Impl) từ cấu trúc phẳng/monolithic vào 10 domain package chuyên biệt.
   - Xóa bỏ hoàn toàn thư mục rỗng `service/impl`.
   - Quy hoạch toàn bộ **DTO Request** và **DTO Response** theo từng domain nghiệp vụ tương ứng, chỉ giữ lại các common wrapper tại thư mục gốc.
   - Cập nhật 100% các Controller, Message Consumer, AI Agent và Unit Tests liên quan.
5. **Đóng gói Docker & Khắc phục Lỗi Runtime**:
   - Sửa lỗi runtime Flyway V9 (`subject_id` -> `subject`) và lỗi Hibernate JPQL `NotificationRepository` (`n.read` -> `n.isRead`).
   - Rebuild image Docker `ai-tutor-service` và kiểm tra hoạt động của toàn bộ hệ sinh thái container (HTTP 200 OK).

---

## II. CHI TIẾT CÁC THAY ĐỔI (THÊM, SỬA, XÓA)

### 1. Tối ưu hóa Database & Repository

#### File Thêm Mới:
- [`src/main/resources/db/migration/V9__performance_trgm_and_partial_indexes.sql`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/resources/db/migration/V9__performance_trgm_and_partial_indexes.sql):
  - Kích hoạt extension `pg_trgm` trên PostgreSQL.
  - Thêm GIN Trigram index trên `users(full_name)`, `users(email)`, `users(username)`, `students(student_code)`, `students(school_name)`.
  - Thêm composite index `users(role, is_deleted, is_active)`, `students(user_id, class_id)`, `students(grade_level)`.
  - Thêm index sắp xếp theo thời gian `notifications(user_id, created_at DESC)`, `chat_messages(chat_session_id, created_at ASC)`, `quiz_attempts(student_id, quiz_id, submitted_at DESC)`.
  - Thêm partial index `notifications(user_id) WHERE is_read = false`.
  - Thêm composite index `quizzes(subject, grade_level, status)`.

#### File Chỉnh Sửa:
- [`src/main/java/com/vn/aitutor/repository/NotificationRepository.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/repository/NotificationRepository.java): Sửa JPQL query `n.read` thành `n.isRead` cho khớp với thuộc tính boolean của entity `Notification`.
- [`src/main/java/com/vn/aitutor/repository/StudentProgressRepository.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/repository/StudentProgressRepository.java): Cập nhật import `StudentProgressResponse` sang package `com.vn.aitutor.dto.response.quiz.*`.

---

### 2. Tính năng Xác Thực OTP qua Mail khi Đổi Mật Khẩu

#### File Thêm Mới:
- [`src/main/java/com/vn/aitutor/security/otp/PasswordChangeOtpCache.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/security/otp/PasswordChangeOtpCache.java): Bộ nhớ đệm quản lý mã OTP 6 số ngẫu nhiên với thời hạn 5 phút, hỗ trợ sinh mã, xác thực và dọn dẹp sau khi dùng.
- [`src/test/java/com/vn/aitutor/security/otp/PasswordChangeOtpCacheTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/security/otp/PasswordChangeOtpCacheTest.java): Unit test cho luồng sinh mã, hết hạn và xác thực OTP.
- [`src/test/java/com/vn/aitutor/service/user/UserPasswordChangeTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/user/UserPasswordChangeTest.java): Unit test toàn diện cho quy trình gửi OTP qua mail và đổi mật khẩu.

#### File Chỉnh Sửa:
- [`src/main/java/com/vn/aitutor/dto/request/user/ChangePasswordRequest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/dto/request/user/ChangePasswordRequest.java): Thêm thuộc tính `@NotBlank String otp`.
- [`src/main/java/com/vn/aitutor/service/user/IUserService.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/user/IUserService.java): Khai báo phương thức `ApiResponse<String> sendChangePasswordOtp()`.
- [`src/main/java/com/vn/aitutor/service/user/UserServiceImpl.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/service/user/UserServiceImpl.java):
  - Triển khai `sendChangePasswordOtp()`: sinh OTP, lưu vào cache và gửi qua `mailService`.
  - Cập nhật `changePassword()`: kiểm tra mã OTP hợp lệ trước khi mã hóa mật khẩu mới.
- [`src/main/java/com/vn/aitutor/controller/UserController.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/main/java/com/vn/aitutor/controller/UserController.java): Bổ sung endpoint `POST /api/v1/users/change-password/send-otp`.

---

### 3. Bổ sung Unit Tests Toàn Diện cho Hệ Thống

#### Danh Sách Test Suites Viết Mới:
1. **Controllers**:
   - [`src/test/java/com/vn/aitutor/controller/AdminStudentControllerTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/controller/AdminStudentControllerTest.java)
   - [`src/test/java/com/vn/aitutor/controller/NotificationControllerTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/controller/NotificationControllerTest.java)
   - [`src/test/java/com/vn/aitutor/controller/ScheduleControllerTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/controller/ScheduleControllerTest.java)
   - [`src/test/java/com/vn/aitutor/controller/StudentProfileControllerTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/controller/StudentProfileControllerTest.java)
   - [`src/test/java/com/vn/aitutor/controller/UserControllerTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/controller/UserControllerTest.java)
2. **Exception Handling**:
   - [`src/test/java/com/vn/aitutor/exception/GlobalExceptionHandlerTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/exception/GlobalExceptionHandlerTest.java)
3. **Security & Principal**:
   - [`src/test/java/com/vn/aitutor/security/principal/UserPrincipalCacheTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/security/principal/UserPrincipalCacheTest.java)
4. **Services & Jobs**:
   - [`src/test/java/com/vn/aitutor/config/ScheduleNotificationJobTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/config/ScheduleNotificationJobTest.java)
   - [`src/test/java/com/vn/aitutor/service/classroom/ScheduleServiceImplTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/classroom/ScheduleServiceImplTest.java)
   - [`src/test/java/com/vn/aitutor/service/classroom/SchoolClassServiceImplTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/classroom/SchoolClassServiceImplTest.java)
   - [`src/test/java/com/vn/aitutor/service/gamification/StreakResetServiceTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/gamification/StreakResetServiceTest.java)
   - [`src/test/java/com/vn/aitutor/service/gamification/XpIntegrityAuditServiceTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/gamification/XpIntegrityAuditServiceTest.java)
   - [`src/test/java/com/vn/aitutor/service/quiz/StudentQuizAttemptServiceImplTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/quiz/StudentQuizAttemptServiceImplTest.java)
   - [`src/test/java/com/vn/aitutor/service/system/CloudinaryServiceImplTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/system/CloudinaryServiceImplTest.java)
   - [`src/test/java/com/vn/aitutor/service/system/MailServiceTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/system/MailServiceTest.java)
   - [`src/test/java/com/vn/aitutor/service/system/NotificationServiceTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/system/NotificationServiceTest.java)
   - [`src/test/java/com/vn/aitutor/service/system/SystemLogServiceImplTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/system/SystemLogServiceImplTest.java)
   - [`src/test/java/com/vn/aitutor/service/user/AuthServiceImplTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/user/AuthServiceImplTest.java)
   - [`src/test/java/com/vn/aitutor/service/user/StudentProfileServiceImplTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/user/StudentProfileServiceImplTest.java)
   - [`src/test/java/com/vn/aitutor/service/workbook/StudentWorkbookTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/service/workbook/StudentWorkbookTest.java)

#### File Chỉnh Sửa Trong Test:
- [`src/test/java/com/vn/aitutor/AiTutorServiceApplicationTests.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/AiTutorServiceApplicationTests.java): Thêm `@EnabledIfEnvironmentVariable(named = "INTEGRATION_TEST", matches = "true")` để không fail khi chạy unit test tự động mà không có Postgres live.
- [`src/test/java/com/vn/aitutor/quiz/QuestionBankWorkbookTest.java`](file:///d:/aaa/AI-tutor-/ai-tutor-service/src/test/java/com/vn/aitutor/quiz/QuestionBankWorkbookTest.java): Chuyển đường dẫn ghi file mẫu từ ổ cứng cứng `d:/AI-tutor-/` sang `build/mixed_test.xlsx`.

---

### 4. Chuẩn hóa Kiến trúc Tầng Service & DTO theo Hướng A (Package by Feature)

#### A. Cấu Trúc Lại Tầng Service (`com.vn.aitutor.service.*`)
Toàn bộ service đã được di dời vào các package sub-domain (Interface và Implementation cùng nằm trong domain module để tăng tính cohesive, dễ bảo trì):

1. **`service.gamification`**:
   - `LeaderboardService.java`, `StreakService.java`, `StreakResetService.java`, `XpAwardService.java`, `XpIntegrityAuditService.java`, `XpAwardResult.java`
2. **`service.chat`**:
   - `IChatService.java`, `ChatServiceImpl.java`, `ChatStreamProcessor.java`, `CustomPostgresRetriever.java`, `ContentSafetyService.java`
3. **`service.classroom`**:
   - `ISchoolClassService.java`, `SchoolClassServiceImpl.java`, `ITeacherStudentService.java`, `TeacherStudentServiceImpl.java`, `IScheduleService.java`, `ScheduleServiceImpl.java`, `TeacherClassService.java`
4. **`service.curriculum`**:
   - `CurriculumService.java`, `BookExtractionService.java`, `BookExtractionTx.java`, `TocAnalysisService.java`, `DocumentLifecycleService.java`, `DocumentStatusService.java`, `DocumentTextExtractor.java`, `DocumentIngestionProcessor.java`, `IDocumentIngestionService.java`, `DocumentIngestionServiceImpl.java`, `ILlamaParseService.java`, `LlamaParseServiceImpl.java`, `ISkillService.java`, `SkillServiceImpl.java`
5. **`service.quiz`**:
   - `IStudentQuizAttemptService.java`, `StudentQuizAttemptServiceImpl.java`, `QuestionBankService.java`, `QuestionComposer.java`, `QuizAccess.java`, `QuizAccessService.java`, `QuizGradingService.java`, `QuizManagementService.java`, `QuizStatisticsService.java`, `QuizSubmissionService.java`, `StudentProgressService.java`, `StudentQuizService.java`
6. **`service.analytics`**:
   - `AnalyticsAccess.java`, `IAlertSettingsService.java`, `AlertSettingsServiceImpl.java`, `IAnalyticsService.java`, `AnalyticsServiceImpl.java`, `IAtRiskService.java`, `AtRiskServiceImpl.java`, `IKnowledgeGapService.java`, `KnowledgeGapServiceImpl.java`, `IParentMessageService.java`, `ParentMessageServiceImpl.java`, `IReportExportService.java`, `ReportExportServiceImpl.java`
7. **`service.system`**:
   - `NotificationService.java`, `ICloudinaryService.java`, `CloudinaryServiceImpl.java`, `IMailService.java`, `MailServiceImpl.java`, `ISystemLogService.java`, `SystemLogServiceImpl.java`, `ISystemSettingsService.java`, `SystemSettingsServiceImpl.java`
8. **`service.user`**:
   - `IAdminStudentService.java`, `AdminStudentServiceImpl.java`, `IAuthService.java`, `AuthServiceImpl.java`, `IStudentProfileService.java`, `StudentProfileServiceImpl.java`, `IUserService.java`, `UserServiceImpl.java`
9. **`service.validator`**:
   - `AvatarUploadValidator.java`, `HistoryGuard.java`, `LearningMaterialValidator.java`
10. **`service.job`**:
    - `GenerationJobService.java`, `GenerationJobStore.java`, `GenerationWorker.java`
11. **`service.workbook`**:
    - `StudentWorkbook.java`

**Thư mục đã xóa**:
- `src/main/java/com/vn/aitutor/service/impl/` (Đã xóa bỏ hoàn toàn vì tất cả Implementation đã chuyển vào sub-domain).
- `src/test/java/com/vn/aitutor/service/impl/` (Đã xóa bỏ hoàn toàn).

---

#### B. Cấu Trúc Lại Tầng DTO Request (`com.vn.aitutor.dto.request.*`)
Không còn bất kỳ file nào nằm rời rạc tại thư mục gốc `dto/request`. Tất cả được phân loại:

1. **`request.analytics`**: `AlertSettingsRequest.java`, `ParentMessageSendRequest.java`
2. **`request.chat`**: `ChatRequest.java`, `ChatSessionUpdateRequest.java`, `ChatStreamRequest.java`
3. **`request.classroom`**: `ScheduleCreateRequest.java`, `ClassAssignmentRequest.java`
4. **`request.curriculum`**: `BookCreateRequest.java`, `BookExtractionMessage.java`, `ChapterCreateRequest.java`, `DocumentIngestionFailureMessage.java`, `DocumentIngestionMessage.java`, `LessonUpsertRequest.java`, `SkillUpsertRequest.java`, `TocApplyRequest.java`
5. **`request.quiz`**: `AIGenerateQuestionRequest.java`, `AssignQuestionsRequest.java`, `BulkDeleteQuestionsRequest.java`, `BulkDeleteRequest.java`, `GenerateQuestionsRequest.java`, `QuestionBankCreateRequest.java`, `QuestionChoiceRequest.java`, `QuestionUpsertRequest.java`, `QuizAnswerRequest.java`, `QuizDraftRequest.java`, `QuizGenerateRequest.java`, `QuizGenerationMessage.java`, `QuizPublishRequest.java`, `QuizSubmitRequest.java`, `QuizUpsertRequest.java`, `StudentQuizGenerateRequest.java`
6. **`request.system`**: `MaintenanceToggleRequest.java`, `SystemSettingsUpdateRequest.java`
7. **`request.user`**: `ChangePasswordRequest.java`, `LoginRequest.java`, `RegisterRequest.java`, `SetupPasswordRequest.java`, `StudentAdminCreateRequest.java`, `StudentAdminUpdateRequest.java`, `StudentProfileUpdateRequest.java`, `UpdateRoleRequest.java`, `UserCreateRequest.java`, `UserUpdateRequest.java`

---

#### C. Cấu Trúc Lại Tầng DTO Response (`com.vn.aitutor.dto.response.*`)

1. **Thư mục gốc (Common Wrappers)**:
   - `ApiResponse.java`
   - `ApiError.java`
   - `PageResponseDTO.java`
   - `JwtErrorResponse.java`
   - `GenerationJobResponse.java`
2. **Sub-domains**:
   - **`response.analytics`** (19 responses): `AlertSettingsUpdateResponse.java`, `AlertSettingsView.java`, `AnalyticsFiltersResponse.java`, `AppliedFiltersDto.java`, `AtRiskListResponse.java`, `AtRiskStudentDto.java`, `ClassAssignmentResponse.java`, `ClassOptionDto.java`, `ClassReportResponse.java`, `DashboardSummaryResponse.java`, `KnowledgeGapItemDto.java`, `KnowledgeGapsResponse.java`, `KpiMetricsDto.java`, `ParentMessageChannelResult.java`, `ParentMessageDraftResponse.java`, `ParentMessageSendResponse.java`, `ScoreTrendPoint.java`, `StudyTimePoint.java`, `SubjectOptionDto.java`
   - **`response.chat`** (3 responses): `ChatMessageResponse.java`, `ChatSessionResponse.java`, `ChatStreamEvent.java`
   - **`response.classroom`** (5 responses): `ScheduleResponse.java`, `ScheduleSlotDto.java`, `TeacherClassResponse.java`, `TeacherClassQuizResponse.java`, `OcrExtractionResponse.java`
   - **`response.curriculum`** (8 responses): `BookResponse.java`, `ChapterResponse.java`, `LessonResponse.java`, `LessonSummaryResponse.java`, `DocumentSummaryResponse.java`, `SkillResponse.java`, `SkillDto.java`, `TocAnalysisResponse.java`
   - **`response.gamification`** (1 response): `LeaderboardResponse.java`
   - **`response.quiz`** (19 responses): `ChoiceResponse.java`, `HardQuestionResponse.java`, `QuestionBankDto.java`, `QuestionBankListResponse.java`, `QuestionBatchResponse.java`, `QuestionImportResponse.java`, `QuestionResponse.java`, `QuizAttemptAnswerDto.java`, `QuizAttemptDetailResponse.java`, `QuizAttemptHistoryResponse.java`, `QuizClassRef.java`, `QuizContentResponse.java`, `QuizDraftResponse.java`, `QuizQuestionResponse.java`, `QuizResponse.java`, `QuizStatisticsResponse.java`, `StudentProgressResponse.java`, `StudentQuizDto.java`, `StudentQuizResultResponse.java`
   - **`response.system`** (3 responses): `MaintenanceStatusResponse.java`, `SystemLogResponse.java`, `SystemSettingResponse.java`
   - **`response.user`** (7 responses): `AuthResponse.java`, `StudentAdminDetailResponse.java`, `StudentAdminListItemResponse.java`, `StudentImportResponse.java`, `StudentProfileResponse.java`, `StudentStatusUpdateResponse.java`, `UserResponse.java`

---

---

### 5. Đóng Gói và Triển Khai Docker

- **Rebuild Image**: Thực hiện `docker compose up -d --build ai-tutor-service`.
- **Trạng Thái Container**:
  - `ai-tutor-service`: Khởi động hoàn tất, kết nối database và chạy migration V1 thành công, lắng nghe tại cổng `8088`.
  - `ai-tutor-postgres`: Healthy tại cổng `5432`.
  - `ai-tutor-rabbitmq`: Healthy tại cổng `5672`, `15672`.
  - `ai-tutor-redis`: Healthy tại cổng `6379`.
  - `ai-tutor-ollama`: Running tại cổng `11434`.
  - `ai-tutor-frontend`: Running tại cổng `3000`.
- **Kiểm thử Endpoint**: `GET http://localhost:8088/v3/api-docs` trả về mã `200 OK`.

---

### 6. Hợp Nhất Cơ Sở Dữ Liệu Flyway (Consolidation into V1)

- **Hợp nhất toàn bộ migration vào duy nhất 1 file `V1__init_schema.sql`**:
  - Gom toàn bộ các bảng, ràng buộc (constraints), trigger bất biến (immutability triggers), và chỉ mục từ các file `V1`, `V2`, `V3`, `V4`, `V8`, `V9`.
  - Bao gồm:
    - Các extension cần thiết: `vector`, `"uuid-ossp"`, `pg_trgm`.
    - Toàn bộ 21 bảng lõi của hệ thống: `users`, `teachers`, `school_classes`, `teacher_class_assignments`, `students`, `password_reset_tokens`, `books`, `chapters`, `lessons`, `documents`, `document_chunks`, `skills`, `lesson_skills`, `question_bank`, `question_choices`, `ai_generation_jobs`, `quizzes`, `quiz_class_assignments`, `quiz_questions`, `quiz_attempt_drafts`, `quiz_attempt_draft_answers`, `quiz_attempts` (với cột & ràng buộc `xp_award_status`, `daily_xp_earned`, `daily_xp_cap`), `quiz_attempt_answers`, `xp_transactions`, `chat_sessions`, `chat_messages`, `calendar_events`, `schedules`, `schedule_slots`, `notifications`, `parent_alert_messages`, `class_alert_settings`, `audit_logs`, `system_settings`, `system_logs`.
    - Triggers & functions kiểm soát lịch sử bất biến: `reject_history_mutation()`, `reject_quiz_result_mutation()`, `trg_xp_transactions_immutable`, `trg_quiz_attempts_immutable`, `trg_quiz_answers_immutable`, `trg_chat_messages_immutable`, `trg_parent_alert_messages_immutable`.
    - Toàn bộ chỉ mục tối ưu hóa hiệu năng cao: GIN Trigram indexes (`idx_users_full_name_trgm`, `idx_users_email_trgm`, `idx_users_username_trgm`, `idx_students_student_code_trgm`, `idx_students_school_name_trgm`), Composite & Partial indexes cho leaderboard, notifications, quiz attempts, class assignments.
  - Xóa bỏ hoàn toàn các file rời rạc: `V2__add_xp_transaction_ledger.sql`, `V3__progress_and_streak_indexes.sql`, `V4__leaderboard_query_indexes.sql`, `V8__quiz_class_assignments.sql`, `V9__performance_trgm_and_partial_indexes.sql`.
  - Khởi tạo lại cơ sở dữ liệu `ai_tutor_dev` sạch sẽ và xác thực Flyway apply thành công v1 trong 0.329s.

---

### 7. Xây Dựng CI/CD Pipeline Chuẩn Doanh Nghiệp (GitHub Actions & Container Registry)

- **Workflow File**: `.github/workflows/deploy.yml`
  - **Cơ chế Trigger & Concurrency**:
    - Tự động trigger khi push vào nhánh `main` (Production) hoặc `staging` (Staging).
    - Tự động chạy CI trên `pull_request` để thẩm định code mà không kích hoạt deployment.
    - Hỗ trợ `workflow_dispatch` (chạy thủ công) cho phép chọn môi trường (`production`/`staging`), chỉ định component (`all`/`backend`/`frontend`), và cờ `skip_tests` trong trường hợp hotfix khẩn cấp.
    - Concurrency control: Tự động hủy PR builds cũ khi có commit mới, đảm bảo tuần tự hóa các đợt deploy Production để tránh race-conditions.
  - **Quality Gates (CI)**:
    - `ci-backend`: Kiểm thử toàn bộ Unit Tests và static checks với JDK 17 (Temurin), Gradle cache tự động và upload artifact báo cáo lỗi khi thất bại.
    - `ci-frontend`: Chạy oxlint linter, TypeScript compiler (`tsc -b`), và build production bundle với Node.js 22.
    - `security-scan`: Quét lỗ hổng bảo mật mã nguồn và dependencies tự động với Trivy (SAST) và xuất báo cáo SARIF cho GitHub Security.
  - **Build & Push Container Images (CD Artifacts)**:
    - Tích hợp GitHub Container Registry (`ghcr.io`) với xác thực an toàn qua `${{ secrets.GITHUB_TOKEN }}`.
    - Docker Buildx đa tầng hỗ trợ GitHub Actions layer caching (`type=gha`), tăng tốc độ build tối đa.
    - Chiến lược gắn tag đa dạng: Semantic commit SHA (`sha-xxxxxxx`), branch tag, và `latest` (cho `main`).
  - **Zero-Downtime Deployment via SSH**:
    - Sử dụng GitHub Environment (`production`/`staging`) hỗ trợ approval gates.
    - Tự động đồng bộ file `docker-compose.prod.yml` lên máy chủ.
    - Kéo image mới từ GHCR, rolling reload container (`docker compose up -d --remove-orphans`), và dọn dẹp ảnh cũ (`docker image prune -f`).
  - **Post-Deployment Automated Smoke Test / Health Check**:
    - Tự động thăm dò Spring Boot Actuator endpoint (`/actuator/health`) với cơ chế retry tối đa 15 lần (90s window).
    - Tự động thăm dò Frontend web application và fail pipeline nếu hệ thống không đạt `HTTP 200`.
  - **Audit & Step Summary**:
    - Xuất bảng báo cáo tổng quan trực quan ngay trên GitHub Actions (`$GITHUB_STEP_SUMMARY`) với đầy đủ commit, image tags, trạng thái từng stage.
- **Production Compose File**: `docker-compose.prod.yml`
  - Chuẩn hóa cấu hình container sử dụng image từ Registry thay vì build từ mã nguồn tại máy chủ.
  - Kích hoạt log rotation (`json-file`, `max-size: 20m/50m`, `max-file: 5`) ngăn ngừa tràn ổ đĩa.
  - Thiết lập health checks, restart policy `always` cho toàn bộ các service: postgres, rabbitmq, redis, ollama, ai-tutor-service, ai-tutor-frontend.

---

## III. KẾT LUẬN & ĐÁNH GIÁ CHẤT LƯỢNG

1. **Tính Toàn Vẹn API**: Giữ nguyên 100% các endpoint URL, tên trường JSON (`@JsonProperty`), kiểu dữ liệu request/response, đảm bảo tương thích hoàn toàn với ứng dụng Frontend mà không gây breaking changes.
2. **Chất Lượng Mã Nguồn**:
   - Loại bỏ hoàn toàn mô hình Monolithic Service cồng kềnh.
   - Codebase có ranh giới module rõ ràng theo Domain-Driven Design (Feature Modules).
   - Bộ kiểm thử tự động đạt 100% tests pass sạch sẽ.
3. **Cơ Sở Dữ Liệu Tối Ưu**: Toàn bộ DDL schema được hợp nhất chuẩn hóa tại `V1__init_schema.sql`, sạch sẽ và không còn các bản vá migration phân mảnh.
4. **Hạ Tầng & Vận Hành Chuẩn Doanh Nghiệp**:
   - Quy trình CI/CD hoàn thiện khép kín từ kiểm thử, quét bảo mật, đóng gói container image, deploy zero-downtime, đến kiểm tra sức khỏe hệ thống tự động.
   - Sẵn sàng triển khai tự động lên các môi trường Staging và Production.

