# Kế Hoạch Triển Khai: Quản Lý Giáo Trình & Tự Động Hóa Ingestion (AI Tutor)

Bản kế hoạch này phân rã các công việc cần làm dựa trên User Story "Quản lý Giáo trình và Tài liệu Học tập" để hoàn thiện hệ thống Backend RAG cho AI Tutor.

---

## Giai đoạn 1: Thiết kế Cơ sở dữ liệu và API Khung (Curriculum Base)
**Mục tiêu:** Xây dựng khung xương giáo trình (Sách -> Chương -> Bài học) để tạo điểm neo ngữ cảnh cho toàn bộ hệ thống RAG.

### 1.1. Cập nhật Database Schema
- **Tạo Entity `Book` (Sách giáo khoa):**
  - Các trường: `id`, `title`, `subject`, `gradeLevel`, `curriculumName` (Cánh Diều, KNTT...), `createdAt`, `updatedAt`.
- **Tạo Entity `Chapter` (Chương học):**
  - Các trường: `id`, `bookId` (Khóa ngoại), `chapterCode`, `title`, `displayOrder`.
- **Tạo Entity `Lesson` (Bài học):**
  - Các trường: `id`, `chapterId` (Khóa ngoại), `lessonCode`, `title`, `displayOrder`.
- **Cập nhật Entity `Document` (Tài liệu):**
  - Thêm khóa ngoại `lessonId` (Nullable - để link tài liệu vào đúng bài học).
  - Thêm trường `documentType` (Lý thuyết, Bài tập, Đề thi).

### 1.2. Phát triển Curriculum CRUD API
- Viết các API RESTful cho Admin thao tác tạo/sửa/xóa Sách, Chương, Bài học.
- **Ràng buộc quan trọng (AC-07):** API Delete Book/Chapter phải kiểm tra và trả về lỗi `HTTP 400 Bad Request` nếu đang tồn tại dữ liệu con bên trong (không cho phép xóa Cascade trực tiếp để tránh mất dữ liệu nhầm lẫn).

---

## Giai đoạn 2: Trí tuệ Nhân tạo Đọc Mục Lục & Cắt PDF (TOC & PDF Splitting)
**Mục tiêu:** Tự động hóa quá trình số hóa sách giáo khoa, giảm 95% thời gian thủ công.

### 2.1. API Đọc Mục Lục bằng AI (TOC Analysis API)
- Tạo Endpoint `POST /api/v1/curriculum/books/{bookId}/analyze-toc` nhận file ảnh (`.jpg`, `.png`).
- Tích hợp **Google Gemini Pro Vision** (vì đang dùng sẵn thư viện Gemini) để truyền hình ảnh mục lục vào.
- Viết Prompt cho AI để trích xuất cấu trúc dạng JSON chuẩn:
  ```json
  [
    {
      "chapterName": "Chương 1: Động lực học",
      "lessons": [
        {"lessonName": "Bài 1: Chuyển động thẳng", "startPage": 5, "endPage": 10},
        {"lessonName": "Bài 2: Gia tốc", "startPage": 11, "endPage": 15}
      ]
    }
  ]
  ```
- Trả về Frontend để Admin xác nhận (Review).

### 2.2. Tích hợp thư viện Cắt PDF (Apache PDFBox)
- Thêm Dependency `org.apache.pdfbox:pdfbox`.
- Xây dựng Utility class `PdfSplitterUtil` chứa hàm nhận vào 1 file PDF gốc và một khoảng trang (`startPage`, `endPage`), đầu ra là 1 file PDF nhỏ.

### 2.3. Khởi chạy luồng "Cắt & Nạp tri thức" (Ingestion Pipeline)
- Tạo Endpoint `POST /api/v1/curriculum/books/{bookId}/extract-and-ingest`.
- Nhận Payload là danh sách các Bài học đã được Admin confirm từ bước 2.1.
- Vòng lặp xử lý ngầm (Background Task):
  1. Dùng `PdfSplitterUtil` cắt file sách thành file PDF nhỏ cho từng bài học.
  2. Lưu file nhỏ lên Cloudinary.
  3. Tạo mới bản ghi `Lesson` (nếu chưa có).
  4. Tạo bản ghi `Document` (gắn vào `Lesson`).
  5. Đẩy message ID của Document vừa tạo vào RabbitMQ Queue (`DOCUMENT_INGESTION_QUEUE`) để chạy luồng Vector hóa đã có sẵn.

---

## Giai đoạn 3: Nâng cấp Độ ổn định và Quản trị Vòng đời Dữ liệu (Stability & Lifecycle)
**Mục tiêu:** Đảm bảo dữ liệu Vector không bị rác (Dirty data) và đồng bộ chặt chẽ với Database.

### 3.1. Quản lý Lỗi & Cấu hình Rollback (AC-04)
- Cập nhật `DocumentIngestionMessageListener.java`:
  - Thêm cấu hình Spring Retry (`@Retryable(maxAttempts = 3)`) cho lời gọi hàm `embeddingModel.embed()`.
  - Khắc phục lỗi Transaction Rollback: Nếu sau 3 lần retry vẫn lỗi, phải vứt lỗi (`throw new IngestionException()`) để Spring `@Transactional` tự động vứt bỏ (Rollback) toàn bộ lệnh `saveAll(chunks)` trong Database, tránh lưu dở dang. Chỉnh sửa trạng thái sang `FAILED` ở tầng ngoài hoặc dùng `TransactionSynchronizationManager`.

### 3.2. Đồng bộ Metadata khi Chỉnh sửa (AC-06)
- Tạo API `PUT /api/v1/documents/{id}/metadata`.
- Khi Admin đổi Môn học / Lớp, thực hiện 2 việc:
  1. Cập nhật bảng `documents`.
  2. Viết câu SQL UPDATE native hoặc dùng Spring Data JPA Update để lặp qua toàn bộ `document_chunks` của tài liệu đó, sửa lại cột `metadata` (JSONB) cho khớp.

### 3.3. Xóa Dữ liệu Sạch Sẽ (Cascade Delete) (AC-05)
- Tạo API `DELETE /api/v1/documents/{id}`.
- Logic thực thi trong 1 `@Transactional`:
  1. Gọi hàm xóa file trên Cloudinary (nếu cần dọn dẹp dung lượng).
  2. `documentChunkRepository.deleteByDocumentId(id)` -> Xóa toàn bộ Vector trong pgvector.
  3. `documentRepository.deleteById(id)`.

### 3.4. Ràng buộc Tải file (AC-01)
- Cấu hình file `application.yml`:
  ```yaml
  spring:
    servlet:
      multipart:
        max-file-size: 50MB
        max-request-size: 55MB
  ```
- Viết Exception Handler ở tầng Controller để trả lỗi "Dung lượng file vượt quá giới hạn 50MB" hiển thị đẹp lên UI.
- Thêm kiểm tra MimeType (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) trước khi đẩy vào Queue.

---

## Giai đoạn 4: Tích hợp Giao diện (Frontend)
*(Các hạng mục cần đội Frontend phối hợp xử lý)*
1. **Curriculum Dashboard:** Màn hình quản lý Cây thư mục Sách -> Chương -> Bài học.
2. **TOC Import Modal:** Giao diện Upload PDF + Ảnh chụp, hiển thị dạng Bảng (Table) kết quả JSON trả về từ AI để cho phép Admin sửa khoảng trang (Page Ranges).
3. **Progress Tracking:** Map SignalR/WebSocket kết nối với luồng Ingestion để hiển thị thanh tiến trình 0-100% sinh động cho từng hàng (Row) bài học.
