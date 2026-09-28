# **Tài Liệu Đặc Tả Yêu Cầu Phần Mềm (SRS) - AI Tutor**

## **PHẦN 1: GIỚI THIỆU (INTRODUCTION)**

### **1.1 Mục đích (Purpose)**

Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) này được lập ra nhằm mục đích xác định rõ ràng, chi tiết và đầy đủ các yêu cầu chức năng và phi chức năng của hệ thống **AI Tutor**. Tài liệu là cơ sở cốt lõi để đội ngũ phát triển (Development), kiểm thử (QA/QC), và khách hàng (Stakeholders) thống nhất về phạm vi công việc, thiết kế, triển khai và nghiệm thu dự án.

### **1.2 Tổng quan ứng dụng (Application Overview)**

Hệ thống là một nền tảng giáo dục thông minh (AI Tutor) dành cho học sinh Việt Nam, bám sát chương trình của Bộ Giáo dục và Đào tạo.

- **Mục đích chính:** Cung cấp giải pháp học tập cá nhân hóa thông qua gia sư AI đa mô hình, kết hợp với các yếu tố trò chơi hóa (gamification) để tăng tương tác và hiệu quả học tập.
- **Tính năng cốt lõi:** Trò chuyện trực tiếp với AI (RAG system), quản lý lịch học (OCR từ ảnh), luyện tập và làm bài trắc nghiệm, hệ thống điểm thưởng (XP/Leaderboard), báo cáo học tập, và một trang quản trị (Admin Dashboard) toàn diện cho giáo viên/ban quản trị.

### **1.3 Đối tượng đọc tài liệu (Intended Audience)**

- **Đội ngũ Phát triển (Developers):** Kỹ sư Backend (NestJS), Frontend (Next.js), Mobile (React Native) để hiểu và lập trình hệ thống.
- **Đội ngũ Kiểm thử (QA/QC):** Để xây dựng các kịch bản kiểm thử (Test Cases) dựa trên các Use Case và Acceptance Criteria.
- **Quản lý dự án (PM/PO) và Khách hàng:** Theo dõi, đánh giá tiến độ và nghiệm thu tính năng.

### **1.4 Chữ viết tắt (Abbreviations)**

- **SRS:** Software Requirements Specification
- **AI:** Artificial Intelligence
- **RAG:** Retrieval-Augmented Generation
- **OCR:** Optical Character Recognition
- **RBAC:** Role-Based Access Control
- **XP:** Experience Points

### **1.5 Tài liệu tham khảo (References)**

- Tài liệu Tổng quan Hệ thống AI Tutor (`SYSTEM_REVIEW.md`)

---

## **PHẦN 2: YÊU CẦU MỨC TỔNG THỂ (HIGH LEVEL REQUIREMENT)**

### **2.1 Biểu đồ quan hệ đối tượng (Object Relationship Diagram)**

Biểu đồ mô tả cấu trúc tĩnh của hệ thống và các thực thể chính.

```mermaid
erDiagram
    User {
        uuid id PK
        string email "Unique"
        string passwordHash
        string fullName
        datetime dateOfBirth
        string gender "MALE | FEMALE | OTHER"
        string role "STUDENT | ADMIN"
        boolean isActive
        timestamptz createdAt
        timestamptz updatedAt
    }

    Student {
        uuid id PK
        uuid userId FK
        string studentCode "Unique"
        string gradeLevel
        string className
        string schoolName
        string phoneNumber
        string email
        string address
        int totalXP
        int currentLevel
        int currentStreak
        int longestStreak
        timestamptz lastActivityDate
        jsonb studyPreferences
    }

    Schedule {
        uuid id PK
        uuid studentId FK
        string subjectCode "TOAN | LY | HOA | ANH..."
        int dayOfWeek "1 = Monday... 7 = Sunday"
        int orderIndex "Tiết học số"
        string session "Morning | Afternoon"
        string notes
        timestamptz createdAt
    }

    CalendarEvent {
        uuid id PK
        uuid studentId FK
        string title
        text description
        timestamptz startDateTime
        timestamptz endDateTime
        string type "Event | Exam | Quiz | Assignment..."
        string location
        boolean hasReminder
        int reminderMinutesBefore
        timestamptz createdAt
    }

    ChatSession {
        uuid id PK
        uuid studentId FK
        string subject
        string title
        string status "OPEN | CLOSED"
        timestamptz createdAt
        timestamptz lastMessageAt
    }

    ChatMessage {
        uuid id PK
        uuid chatSessionId FK
        string senderType "STUDENT | AI"
        text content
        string audioUrl
        string intent
        jsonb citationLinks
        timestamptz createdAt
    }

    Quiz {
        uuid id PK
        string title
        text description
        string subject
        string gradeLevel
        string difficulty "EASY | MEDIUM | HARD"
        int timeLimit "Phút"
        boolean isAiGenerated
        uuid createdById FK
        boolean isActive
        timestamptz createdAt
    }

    QuizAttempt {
        uuid id PK
        uuid quizId FK
        uuid studentId FK
        float score
        int xpEarned
        int durationSeconds
        timestamptz submittedAt
    }

    Document {
        uuid id PK
        string title
        string fileName
        string filePath
        int fileSize
        string fileType
        string subject
        string gradeLevel
        string status "PROCESSING | SUCCESS | FAILED"
        int progressPercentage
        uuid createdById FK
        timestamptz createdAt
    }

    Lesson {
        uuid id PK
        string title
        text description
        string subject
        string gradeLevel
        int order
        text contentText
        timestamptz createdAt
    }

    %% Relationships
    User ||--o| Student : "has student details"
    Student ||--o{ Schedule : "timetable"
    Student ||--o{ CalendarEvent : "personal calendar"
    Student ||--o{ ChatSession : "chats with tutor"
    ChatSession ||--o{ ChatMessage : "contains"
    Student ||--o{ QuizAttempt : "attempts"
    Quiz ||--o{ QuizAttempt : "receives"
    Student ||--o{ Document : "uploads reference"
    Document ||--o{ Lesson : "source for"
```

### **2.2 Biểu đồ Luồng công việc (Workflow Diagram)**

Luồng thao tác chung của học sinh khi sử dụng tính năng học với AI.

```mermaid
```
erDiagram
    User {
        uuid id PK
        string email "Unique"
        string passwordHash
        string fullName
        datetime dateOfBirth
        string gender "MALE | FEMALE | OTHER"
        string role "STUDENT | ADMIN"
        boolean isActive
        timestamptz createdAt
        timestamptz updatedAt
    }

    Student {
        uuid id PK
        uuid userId FK
        string studentCode "Unique"
        string gradeLevel
        string className
        string schoolName
        string phoneNumber
        string email
        string address
        int totalXP
        int currentLevel
        int currentStreak
        int longestStreak
        timestamptz lastActivityDate
        jsonb studyPreferences
    }

    Schedule {
        uuid id PK
        uuid studentId FK
        string subjectCode "TOAN | LY | HOA | ANH..."
        int dayOfWeek "1 = Monday... 7 = Sunday"
        int orderIndex "Tiết học số"
        string session "Morning | Afternoon"
        string notes
        timestamptz createdAt
    }

    CalendarEvent {
        uuid id PK
        uuid studentId FK
        string title
        text description
        timestamptz startDateTime
        timestamptz endDateTime
        string type "Event | Exam | Quiz | Assignment..."
        string location
        boolean hasReminder
        int reminderMinutesBefore
        timestamptz createdAt
    }

    ChatSession {
        uuid id PK
        uuid studentId FK
        string subject
        string title
        string status "OPEN | CLOSED"
        timestamptz createdAt
        timestamptz lastMessageAt
    }

    ChatMessage {
        uuid id PK
        uuid chatSessionId FK
        string senderType "STUDENT | AI"
        text content
        string audioUrl
        string intent
        jsonb citationLinks
        timestamptz createdAt
    }

    Quiz {
        uuid id PK
        string title
        text description
        string subject
        string gradeLevel
        string difficulty "EASY | MEDIUM | HARD"
        int timeLimit "Phút"
        boolean isAiGenerated
        uuid createdById FK
        boolean isActive
        timestamptz createdAt
    }

    QuizAttempt {
        uuid id PK
        uuid quizId FK
        uuid studentId FK
        float score
        int xpEarned
        int durationSeconds
        timestamptz submittedAt
    }

    Document {
        uuid id PK
        string title
        string fileName
        string filePath
        int fileSize
        string fileType
        string subject
        string gradeLevel
        string status "PROCESSING | SUCCESS | FAILED"
        int progressPercentage
        uuid createdById FK
        timestamptz createdAt
    }

    Lesson {
        uuid id PK
        string title
        text description
        string subject
        string gradeLevel
        int order
        text contentText
        timestamptz createdAt
    }

    %% Relationships
    User ||--o| Student : "has student details"
    Student ||--o{ Schedule : "timetable"
    Student ||--o{ CalendarEvent : "personal calendar"
    Student ||--o{ ChatSession : "chats with tutor"
    ChatSession ||--o{ ChatMessage : "contains"
    Student ||--o{ QuizAttempt : "attempts"
    Quiz ||--o{ QuizAttempt : "receives"
    Student ||--o{ Document : "uploads reference"
    Document ||--o{ Lesson : "source for"
### **2.2 Biểu đồ Luồng công việc (Workflow Diagram)**

Luồng thao tác chung của học sinh khi sử dụng tính năng học với AI.
flowchart TD
    A["Học sinh Đăng nhập"] --> B{"Lựa chọn Chức năng"}
    B -->|Hỏi bài| C["Mở AI Tutor Chat"]
    C --> D["Nhập câu hỏi"]
    D --> E["AI phân tích bằng RAG & LangChain"]
    E --> F["Trả về câu trả lời kèm Trích dẫn"]
    
    B -->|Xem lịch| G["Mở Schedule"]
    G --> H["Thêm lịch mới chụp ảnh / Nhập tay"]
    H --> I["OCR trích xuất thông tin"]
    I --> J["Lưu lịch học"]
    
    B -->|Luyện tập| K["Mở Practice & Quizzes"]
    K --> L["Làm bài kiểm tra (Timer)"]
    L --> M["Nộp bài"]
    M --> N["Cập nhật XP & Leaderboard"]
### **2.3 Biểu đồ Chuyển đổi trạng thái (State Transition Diagram)**

Trạng thái của một Bài tập / Quiz trong hệ thống.
stateDiagram-v2
    [*] --> Draft: Giáo viên tạo bài
    Draft --> Published: Duyệt và Phát hành
    Published --> InProgress: Học sinh đang làm
    InProgress --> Submitted: Hết giờ / Nộp bài
    Submitted --> Graded: Hệ thống chấm điểm tự động
    Graded --> [*]
### **2.4 Biểu đồ Use Case (Use Case Diagram)**

Các tác nhân và hành động tương ứng.
flowchart LR
    Student((Học sinh))
    Admin((Quản trị viên))
    
    subgraph MobileApp["Ứng dụng Mobile (AI Tutor)"]
        UC1(["Chat với AI Tutor"])
        UC2(["Quản lý lịch học"])
        UC3(["Làm bài tập trắc nghiệm"])
        UC4(["Xem tiến độ & Bảng xếp hạng"])
    end
    
    subgraph AdminDashboard["Trang Web Quản trị"]
        UC5(["Quản lý Học sinh"])
        UC6(["Quản lý Giáo trình & Tài liệu"])
        UC7(["Xem Phân tích & Báo cáo"])
    end
    
    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
## **PHẦN 3: YÊU CẦU VỀ BẢO MẬT (SECURITY REQUIREMENT)**

### **3.1 Ma trận phân quyền (RBAC Matrix)**
| Chức năng \\ Vai trò | Học sinh (Student) | Quản trị viên (Admin) | Hệ thống (System/Background) |
| --- | --- | --- | --- |
| Trò chuyện với AI | Có | Không | N/A |
| Làm bài kiểm tra | Có | Xem trước | Chấm điểm tự động |
| Quản lý lịch học cá nhân | Có | Không | Tự động nhắc nhở |
| Quản lý thông tin Học sinh | Xem/Sửa cá nhân | Toàn quyền (CRUD) | N/A |
| Quản lý Nội dung (PDF, Word) | Không (Chỉ đọc) | Toàn quyền (CRUD) | Xử lý OCR/Vectorize |
| Xem Analytics Hệ thống | Không | Có | Cập nhật Real-time |
| Tùy chỉnh Cấu hình AI Model | Không | Có | N/A |

---

## **PHẦN 4: ĐẶC TẢ USE CASE (USE CASE SPECIFICATION)**

### **4.1 UC-01: Chat với AI Tutor (RAG System)**

- **Actor:** Học sinh
- **Pre-conditions:** Học sinh đã đăng nhập thành công vào Mobile App.
- **Normal Flow:**
  1. Học sinh truy cập tab "AI Tutor".
  2. Hệ thống hiển thị lịch sử chat hoặc màn hình chào mừng.
  3. Học sinh nhập nội dung câu hỏi (text/voice).
  4. Hệ thống (Backend) gửi câu hỏi cho AI Engine. Dữ liệu được tìm kiếm trong Vector DB (pgvector).
  5. AI Engine trả về phản hồi kèm theo nguồn trích dẫn (citations).
  6. Màn hình Mobile hiển thị câu trả lời dạng real-time qua WebSockets.
- **Alternative Flow:**
  - Nếu câu hỏi vi phạm chính sách Child Safety, AI trả lời từ chối khéo léo và cảnh báo nội dung không phù hợp.
- **Post-conditions:** Lịch sử chat được lưu, session cập nhật.

### **4.2 UC-02: Quản lý Lịch Học bằng OCR**

- **Actor:** Học sinh
- **Pre-conditions:** App đã được cấp quyền truy cập Camera/Thư viện ảnh.
- **Normal Flow:**
  1. Học sinh truy cập tab "Schedule" và chọn "Thêm lịch từ ảnh".
  2. Học sinh chụp ảnh Thời khóa biểu.
  3. Hệ thống upload ảnh lên Backend và thực hiện OCR.
  4. Hệ thống trả về dữ liệu thời khóa biểu dạng text đã được cấu trúc.
  5. Học sinh kiểm tra lại, chỉnh sửa nếu cần, rồi nhấn "Lưu".
  6. Hệ thống lưu lịch học và tự động lên lịch Push Notification nhắc nhở.
- **Alternative Flow:** OCR không đọc được chữ, học sinh tự nhập thủ công (Manual input).
- **Post-conditions:** Lịch học được đồng bộ, thông báo nhắc nhở sẵn sàng.

### **4.3 UC-03: Quản lý Nội dung Dạy học (Admin Ingestion)**

- **Actor:** Admin
- **Pre-conditions:** Đăng nhập vào trang Admin Dashboard.
- **Normal Flow:**
  1. Admin điều hướng đến "Content Management".
  2. Chọn file tài liệu (PDF, Word, Markdown) và bấm "Upload".
  3. Hệ thống tải file lên và khởi chạy Background Worker (DocumentIngestionWorker).
  4. Admin thấy thanh Progress Bar hiển thị tiến độ phân mảnh (chunking) và nhúng vector (embedding) tài liệu.
  5. Khi hoàn tất, tài liệu chuyển sang trạng thái "Sẵn sàng" trong Vector Database.
- **Exception Flow:** File lỗi định dạng hoặc vượt quá dung lượng cho phép. Hệ thống báo lỗi ngay tại bước Upload.
- **Post-conditions:** AI Tutor có thể trả lời câu hỏi dựa trên kiến thức từ tài liệu mới này.

---

## **PHẦN 5: THIẾT KẾ MÀN HÌNH (WIREFRAME)**

### **5.1 Mobile App (Học sinh)**

- **Header:** Hiển thị Avatar, Tên học sinh, số lượng XP, Streak lửa đang có (Gamification).
- **Tab Bar (Bottom):** 5 mục: Home (AI Chat), Schedule, Practice, Progress (Leaderboard), Profile.
- **Main Content (AI Chat):**
  - Giao diện chat bong bóng giống iMessage.
  - Phía dưới có thanh Input nhập văn bản, nút gửi, và icon Micro (thu âm).
  - Bong bóng AI có huy hiệu "AI Tutor", các link citation có thể nhấn vào xem chi tiết bài giảng liên quan.

### **5.2 Admin Dashboard (Web)**

- **Sidebar (Trái):** Logo AI Tutor, Navigation links: Students, Content, Analytics, Settings.
- **Top Bar:** Search bar toàn cục, Notification bell, Admin Profile Dropdown.
- **Main Area (Content Management):**
  - Góc trên phải: Nút "Upload Document" và "Create Lesson".
  - Giữa: Bảng danh sách tài liệu (Data Table) với các cột: Tên tài liệu, Môn học, Lớp, Trạng thái Ingestion (Thanh tiến trình), Hành động (Edit/Delete).

---

## **PHẦN 6: CÁC YÊU CẦU KHÁC (OTHER REQUIREMENT)**

### **6.1 Yêu cầu Tích hợp (Integration)**

- **AI Models Integration:** Hệ thống bắt buộc hỗ trợ cấu hình đa mô hình qua LangChain (OpenAI GPT-4, Google Gemini Pro, Anthropic Claude 3, DeepSeek Chat).
- **Push Notification:** Tích hợp Firebase Admin SDK để gửi thông báo real-time qua iOS/Android.
- **Database:** Tích hợp PostgreSQL và `pgvector` cho xử lý Embedding; Redis cho caching session.

### **6.2 Yêu cầu Hiệu năng (Performance)**

- **Real-time Chat:** Thời gian phản hồi của AI chat qua WebSockets phải dưới 2 giây/request trong điều kiện mạng ổn định.
- **OCR Processing:** Không được vượt quá 5 giây/tài liệu ảnh.

### **6.3 Phụ lục (Appendices)**

- **Mã lỗi phổ biến:**
  - `ERR_AI_001`: Model API không khả dụng.
  - `ERR_AUTH_002`: Token hết hạn.
  - `ERR_CONTENT_003`: File tài liệu chứa virus hoặc định dạng không hỗ trợ.