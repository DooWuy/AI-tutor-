# AI Tutor Backend - Project Overview

Đây là tài liệu tổng hợp cấu trúc, công nghệ và các tính năng đã được triển khai của dự án Backend hệ thống AI Tutor. Mục tiêu của hệ thống là cung cấp một nền tảng gia sư AI thông minh phục vụ học sinh tiểu học và trung học, kết hợp kiến trúc RAG (Retrieval-Augmented Generation) để bám sát chương trình giảng dạy.

## 1. Công nghệ sử dụng (Tech Stack)
- **Ngôn ngữ & Framework:** Java 17, Spring Boot 3.x
- **Cơ sở dữ liệu chính & Vector DB:** PostgreSQL kết hợp extension `pgvector` (Lưu trữ dữ liệu quan hệ và vector nhúng tài liệu giáo khoa).
- **Bộ nhớ đệm (Cache) & Quản lý phiên:** Redis (Lưu trữ Refresh Token, tối ưu tốc độ và dùng cho Rate Limiting/Caching AI sau này).
- **Hàng đợi tin nhắn (Message Broker):** RabbitMQ.
- **Bảo mật:** Spring Security, JWT (JSON Web Tokens).
- **Triển khai (Deployment):** Docker & Docker Compose, tích hợp hệ thống Database Migration bằng Flyway.

## 2. Cấu trúc và Kiến trúc hệ thống
Hệ thống được thiết kế theo kiến trúc Microservices-ready và Event-driven một phần:

- **Auth & Security:** 
  - Hệ thống sử dụng phân quyền theo Role đa dạng: `ADMIN`, `TEACHER`, và `STUDENT`.
  - Giao thức xác thực Đăng nhập/Đăng ký sử dụng JWT. 
  - `Access Token` có thời hạn ngắn, gửi qua Header.
  - `Refresh Token` có thời hạn dài, được lưu trữ an toàn trong **HttpOnly Cookie** chống tấn công XSS, đồng thời đối chiếu tính hợp lệ thông qua **Redis**. Cơ chế xoay vòng token (Token Rotation) được áp dụng.
- **Quản lý thực thể (Entities):** Cấu trúc 1-1 giữa bảng `users` (chứa thông tin đăng nhập chung, trạng thái khóa tài khoản `is_active`, xóa mềm `is_deleted`) với các bảng nghiệp vụ cụ thể `students` và `teachers`.
- **Transactional Integrity:** Các thao tác thay đổi dữ liệu liên đới (ví dụ: tạo User và tạo Profile Student/Teacher) được bọc trong `@Transactional` để đảm bảo tính nguyên vẹn dữ liệu (Atomic) - nếu một bước lỗi, toàn bộ quá trình sẽ được rollback.
- **Asynchronous Processing:** Tách biệt các tác vụ tốn thời gian ra khỏi luồng HTTP chính để tăng tốc độ phản hồi API thông qua `@Async` (Điển hình như tính năng gửi Email tự động).
- **Real-time Communication:**
  - Cổng **WebSocket (STOMP)** được cấu hình sử dụng RabbitMQ làm Broker Relay.
  - Trang bị `WebSocketChannelInterceptor` kiểm tra và xác thực JWT token ngay tại bước bắt tay (Handshake) `CONNECT`, chặn đứng các kết nối không hợp lệ từ sớm.

## 3. Các tính năng đã hoàn thiện (Done)
- [x] Thiết lập cấu trúc dự án cơ bản và cấu hình CI/CD môi trường Docker.
- [x] Tích hợp cơ sở dữ liệu PostgreSQL (kèm pgvector) và Redis, sử dụng **Flyway** để versioning database migrations.
- [x] Tài khoản quản trị cấp cao (`admin`) được tự động tiêm (seed) vào database ngay từ bước migration database đầu tiên để đảm bảo tính ổn định triển khai.
- [x] Xây dựng hệ thống Xác thực người dùng (Auth Service): Đăng ký (chỉ dành cho học sinh), Đăng nhập, Đăng xuất, Refresh Token từ HttpOnly Cookie.
- [x] Xây dựng các tính năng quản lý (Admin Operations): Admin có quyền CRUD, tạo tài khoản cho Giáo viên và Học sinh.
- [x] Cơ chế **Xóa Mềm (Soft Delete):** Xóa người dùng chỉ thay đổi cờ `is_deleted` thành true, không làm mất lịch sử dữ liệu.
- [x] Tối ưu hóa truy vấn Database bằng cách sử dụng `@Query` tường minh trong Spring Data JPA Repositories.
- [x] Cấu hình gửi mail (SMTP Gmail) tự động bất đồng bộ:
  - Tự động gửi email chúc mừng khi đăng ký học sinh thành công.
  - Tự động gửi email thông báo kèm thông tin đăng nhập (Username & Password) cho người dùng khi được Admin tạo tài khoản.
- [x] Xử lý ngoại lệ toàn cục (`GlobalExceptionHandler`), chuẩn hóa các response, bắt lỗi JWT và quyền truy cập (401 Unauthorized, 403 Forbidden).
- [x] Phân tách đa ngôn ngữ, các validate và message trả về cho End-user hoàn toàn bằng tiếng Việt.
- [x] Tích hợp **Cloudinary** để lưu trữ file (Avatar) an toàn, tối ưu dung lượng và băng thông.
- [x] Tăng cường bảo mật: Chống lỗi Path Traversal triệt để khi thao tác file, kiểm soát MIME type định dạng tệp tải lên.
- [x] Mở khóa **Swagger UI / OpenAPI** (public) để thuận tiện cho việc kiểm thử API nội bộ.
- [x] Khởi tạo hạ tầng WebSocket Gateway có bảo mật JWT, sử dụng RabbitMQ làm STOMP Broker.
- [x] Test-cases API hoàn chỉnh được export vào thư viện Postman Collection đi kèm dự án.

## 4. Các tính năng chuẩn bị phát triển (Next Steps - AI Integration)
Hệ thống đã có sẵn "bệ phóng" hạ tầng mạnh mẽ, bước tiếp theo là tích hợp AI để hoàn thiện logic RAG:

1. **Document Ingestion (Xử lý tài liệu giảng dạy):**
   - Sử dụng RabbitMQ làm Message Queue chính: Khi Admin/Giáo viên upload sách giáo khoa, đẩy Job vào Queue.
   - Background Worker (RabbitMQ Consumer) sẽ đọc PDF, chunking (băm nhỏ), gọi API AI lấy Embeddings và lưu vào PostgreSQL (`pgvector`).
   - Đẩy tiến trình xử lý real-time về Dashboard thông qua WebSockets.

2. **AI Chat Streaming (Trò chuyện thời gian thực với AI Tutor):**
   - Tích hợp thư viện AI (sử dụng thư viện AI chính thức hỗ trợ cấu hình Custom Knowledge Base/RAG, cho phép khoanh vùng kiến thức bám sát BGD&ĐT).
   - RAG Pipeline: Nhận câu hỏi học sinh -> Quét vector db lấy tài liệu chuẩn -> Gửi prompt cho LLM.
   - Nhận phản hồi dạng stream từ LLM và đẩy từng token về phía Web Client thông qua WebSocket để tạo hiệu ứng gõ phím.

3. **AI Cost Optimization:**
   - Ứng dụng Semantic Caching (Redis Vector) để lưu kết quả các câu hỏi trùng lặp, tiết kiệm lượng token truy vấn (tránh cạn kiệt tài nguyên API với lượng người dùng lớn).
   - Áp dụng Rate Limiting bằng Redis để giới hạn lượng tin nhắn mỗi học sinh có thể hỏi.
