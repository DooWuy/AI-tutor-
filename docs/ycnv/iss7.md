Là Quản trị viên nội dung hoặc Giáo viên (Admin/Teacher), tôi muốn quản lý cấu trúc giáo trình (Sách, Chương, Bài học) và sử dụng công cụ AI phân tích mục lục tự động để chia nhỏ sách giáo khoa, nạp tài liệu học tập chuẩn hóa vào cơ sở dữ liệu tri thức của AI.


# **User Story: Quản lý Giáo trình và Tài liệu Học tập (Curriculum & Content Management)**

## **1. Tổng quan & Bối cảnh (Overview & Context)**

### **Vấn đề (Problem):**

Hệ thống AI Tutor hoạt động dựa trên cơ chế RAG (Retrieval-Augmented Generation), nghĩa là để trả lời chính xác các câu hỏi của học sinh theo chương trình chuẩn của Bộ GD&ĐT, AI cần truy cập vào một kho tri thức có cấu trúc rõ ràng. Nếu tài liệu nạp vào hệ thống chỉ là các file PDF dài hàng trăm trang tải lên vô tội vạ, AI sẽ gặp khó khăn trong việc định vị chính xác ngữ cảnh bài học, phản hồi chậm và dễ bị nhầm lẫn giữa các môn học hay khối lớp. Do đó, hệ thống đòi hỏi phải có một cấu trúc giáo trình chuẩn hóa (Sách -&gt; Chương -&gt; Bài học) làm điểm neo. Tuy nhiên, việc giáo viên phải tự bóc tách thủ công một cuốn sách giáo khoa dày 300 trang thành từng file bài học nhỏ và nạp thủ công vào hệ thống là một quy trình cực kỳ tốn thời gian và dễ xảy ra sai sót.

### **Pain Points hiện tại:**

- **Thiếu cấu trúc bài học rõ ràng:** Tài liệu nạp vào không được liên kết trực tiếp với từng bài học cụ thể trong chương trình học chuẩn, khiến AI trích dẫn nguồn thiếu chính xác.
- **Tốn công sức vận hành:** Nạp thủ công từng chương, bài học và tài liệu giảng dạy của nhiều bộ sách khác nhau (Cánh Diều, Kết nối tri thức...) gây quá tải cho ban giáo vụ.
- **Tiến trình Ingestion chạy ngầm khó kiểm soát:** Khi tải sách hoặc tài liệu lớn lên, hệ thống xử lý ngầm nhưng không hiển thị tiến độ, giáo viên không biết tài liệu đã sẵn sàng để học sinh hỏi AI hay chưa.
- **Lỗi công thức khoa học:** Việc bóc tách PDF chứa công thức Toán, Lý, Hóa thường bị mất định dạng hoặc hiển thị ký tự lạ, làm AI hiểu sai bản chất.

### **Giá trị Nghiệp vụ (Business Value):**

- **Cấu trúc tri thức hoàn hảo:** Xây dựng bộ khung chương trình học chuẩn hóa, giúp AI Tutor định vị ngữ cảnh câu trả lời cực nhanh và trích dẫn chính xác bài học gốc.
- **Tự động hóa số hóa giáo trình:** Chỉ cần upload file sách giáo khoa và ảnh chụp trang mục lục, AI sẽ tự động phân tích mục lục, nhận diện khoảng trang bài học và tự động cắt nhỏ cuốn sách thành các tài liệu bài học độc lập, giúp tiết kiệm 95% thời gian vận hành.
- **Vận hành minh bạch:** Giáo viên theo dõi tiến độ bóc tách văn bản, sinh vector và lưu trữ thời gian thực qua thanh tiến trình trực quan trên Dashboard.
- **Bảo toàn công thức khoa học:** Hệ thống giữ nguyên định dạng toán học chuẩn (LaTeX) khi vector hóa để AI Tutor hiển thị công thức chuẩn xác cho học sinh.

### **Đối tượng (Actor):**

- **Primary Actor:** Quản trị viên nội dung (Admin) / Giáo viên biên soạn tài liệu (Teacher).
- **Secondary Actors:**
  - **Hệ thống Ingestion Worker & Queue (Background Services):** RabbitMQ, dịch vụ OCR bóc tách mục lục, dịch vụ cắt PDF theo trang, và dịch vụ nhúng vector lưu trữ vào pgvector Database.

### **User Story Statement**

Là Quản trị viên nội dung hoặc Giáo viên (Admin/Teacher), tôi muốn quản lý cấu trúc giáo trình (Sách, Chương, Bài học) và sử dụng công cụ AI phân tích mục lục tự động để chia nhỏ sách giáo khoa, nạp tài liệu học tập chuẩn hóa vào cơ sở dữ liệu tri thức của AI.

---

## **2. Luồng Người dùng (User Flow)**

### **2.1. Luồng chính: Quản lý cấu trúc giáo trình (Curriculum CRUD Flow)**

1. Admin đăng nhập vào Admin Dashboard, chọn mục **"Curriculum Management"** (Quản lý Giáo trình).
2. Hệ thống hiển thị danh sách các cuốn sách giáo khoa hiện có. Admin có thể thực hiện các thao tác:
   - **Thêm Sách mới (+ Book):** Nhập tên sách, chọn Môn học, Khối lớp, và tên Chương trình học (Ví dụ: bộ sách "Cánh Diều").
   - **Chỉnh sửa Sách:** Sửa tên sách hoặc cập nhật chương trình học.
   - **Xóa Sách:** Hệ thống kiểm tra ràng buộc. Nếu sách đã có chứa các chương học, bài học hoặc tài liệu đã được vector hóa, hệ thống sẽ chặn xóa vật lý và hiển thị thông báo yêu cầu dọn dẹp các mục con trước.
3. Khi click chọn một cuốn Sách, hệ thống hiển thị danh sách các **Chương (Chapters)** trong sách:
   - Admin có thể thực hiện CRUD cho Chương học (nhập Mã chương, Tên chương, Số thứ tự hiển thị).
4. Khi click chọn một Chương, hệ thống hiển thị danh sách các **Bài học (Lessons)** thuộc chương đó:
   - Admin có thể thực hiện CRUD cho Bài học (nhập Mã bài học, Tiêu đề bài học, Số thứ tự hiển thị).

### **2.2. Luồng: Tự động phân tích mục lục và trích xuất bài học từ sách (TOC Analysis & Ingestion)**

1. Tại trang chi tiết của một cuốn Sách giáo khoa vừa tạo trên Dashboard, Admin click vào nút **"Nhập dữ liệu từ sách PDF"** (Import Book).
2. Hệ thống hiển thị modal yêu cầu:
   - Chọn file sách giáo khoa gốc (định dạng `.pdf`).
   - Tải lên một hoặc nhiều ảnh chụp các trang Mục lục của cuốn sách đó (định dạng `.jpg`, `.png`).
   - Chọn Phương pháp trích xuất (AI hoặc OCR).
   - Chọn Tên chương trình học (Ví dụ: "Cánh Diều").
3. Admin chọn các tệp tin tương ứng và click **"Xác nhận phân tích"**.
4. Hệ thống tải file PDF sách và các ảnh mục lục lên bộ lưu trữ đám mây. Đồng thời, Backend gọi dịch vụ **AnalyzeTableOfContents**:
   - Dịch vụ sử dụng AI/OCR để đọc hình ảnh mục lục, tự động nhận diện cấu trúc phân cấp gồm: Tên Chương, Tên Bài học, và **Khoảng trang (Page Ranges)** của từng bài trong file PDF sách gốc (Ví dụ: "Bài 1: Đạo hàm" nằm ở trang 5 đến trang 12).
5. Hệ thống hiển thị giao diện **Kết quả phân tích mục lục** dưới dạng bảng cấu trúc phân cấp.
6. Admin rà soát lại thông tin:
   - Có thể click vào bất kỳ dòng nào để chỉnh sửa Tên chương, Tên bài học hoặc sửa lại khoảng trang nếu AI nhận diện sai lệch.
   - Bấm nút **"Bắt đầu cắt sách & nạp tri thức"**.
7. Backend đẩy thông điệp vào hàng đợi RabbitMQ và khởi chạy tác vụ chạy ngầm (`PublishBookExtractionWithRangesAsync`):
   - Background worker tải file PDF sách gốc về.
   - Tiến hành cắt (split) file PDF gốc thành các file PDF nhỏ độc lập tương ứng với khoảng trang của từng bài học đã xác nhận.
   - Tạo bản ghi tài liệu (`Document`) tương ứng liên kết với đúng ID của Bài học (`Lesson`) trong cơ sở dữ liệu.
   - Tự động kích hoạt quy trình nhúng vector (Ingestion Pipeline) của từng tài liệu bài học vừa cắt để lưu vào Vector DB.
   - Dashboard quản trị hiển thị tiến trình cắt và nạp của từng bài học thời gian thực (từ 0% đến 100%) qua kết nối SignalR.

### **2.3. Luồng: Tải tài liệu bổ trợ trực tiếp cho Bài học (Direct Document Upload)**

1. Tại trang chi tiết của một Bài học (Lesson), giáo viên chọn tab "Tài liệu bổ trợ" và click nút **"Tải lên tài liệu"**.
2. Hệ thống hiển thị modal upload tài liệu:
   - Giáo viên chọn file từ máy tính (PDF, Word, MD, TXT, tối đa 50MB).
   - Chọn phân loại tài liệu (Tài liệu lý thuyết, Bài tập ôn luyện, Đề thi mẫu).
   - Click "Tải lên".
3. Hệ thống tải file lên Server, tạo bản ghi `Document` ở trạng thái `PROCESSING` với `LessonId` tương ứng.
4. Kích hoạt dịch vụ **DocumentIngestionWorker** chạy ngầm để xử lý tài liệu này.

### **2.4. Luồng: Tiến trình AI Document Ingestion Pipeline (Background Process)**

1. Tiến trình **DocumentIngestionWorker** tiếp nhận bản ghi tài liệu mới ở trạng thái `PROCESSING`.
2. Worker đọc file thô từ Cloud Storage, tiến hành bóc tách toàn bộ dữ liệu văn bản thuần túy (Plain text):
   - Nếu là file PDF dạng quét ảnh (Scan PDF): Kích hoạt dịch vụ OCR để nhận diện chữ viết.
   - Nếu là file PDF text hoặc Word: Bóc tách text trực tiếp, giữ lại các ký hiệu công thức toán/lý/hóa dưới định dạng LaTeX chuẩn (MathJax/LaTeX nếu có).
3. **Semantic Chunking (Chia nhỏ văn bản):** Worker tiến hành cắt văn bản thành các đoạn nhỏ (Chunks) khoảng 500-1000 ký tự, cấu hình độ chồng chéo (Overlap) 10-20% giữa các đoạn để tránh mất ngữ cảnh ở các điểm cắt.
4. **Vector Embedding (Nhúng Vector):** Với mỗi đoạn văn bản (chunk) đã cắt, Worker gọi API dịch vụ sinh vector (Embedding API 1536 chiều của OpenAI) để chuyển đổi đoạn văn bản thành mảng vector.
5. **Lưu trữ tri thức:** Lưu toàn bộ các đoạn văn bản kèm theo mảng vector, ID tài liệu gốc, mã môn học, khối lớp và Metadata bổ sung vào bảng `DocumentChunks` trong PostgreSQL pgvector.
6. Khi hoàn tất, cập nhật trạng thái bản ghi tài liệu gốc thành `SUCCESS` và Tiến độ là `100% - Hoàn thành`. Giao diện Dashboard tự động cập nhật trạng thái dòng tài liệu sang màu xanh lá qua SignalR.

### **2.5. Luồng: Chỉnh sửa thông tin phân loại tài liệu (Update Metadata Flow)**

1. Tại bảng danh sách tài liệu học tập, Admin tìm kiếm tài liệu cần cập nhật và click vào biểu tượng icon **"Chỉnh sửa"** (Edit) ở cột hành động.
2. Hệ thống hiển thị modal "Chỉnh sửa thông tin tài liệu" chứa các trường dữ liệu hiện tại: Tên hiển thị, Môn học, Khối lớp.
3. Admin thay đổi thông tin phân loại và click "Cập nhật".
4. Backend cập nhật thông tin bản ghi tài liệu trong bảng chính DB.
5. Tự động chạy tiến trình ngầm đồng bộ, cập nhật các trường metadata tương ứng (`subjectCode`, `gradeLevel`) của tất cả các đoạn phân mảnh (chunks) thuộc tài liệu này trong Vector Database để đảm bảo AI Tutor lọc RAG chính xác.

### **2.6. Luồng: Xóa tài liệu khỏi kho tri thức của AI (Delete Flow)**

1. Admin tìm tài liệu cần xóa trong danh sách và click chọn nút **"Xóa"** (Delete).
2. Hệ thống hiển thị modal xác nhận: "Hành động này sẽ xóa vĩnh viễn tài liệu này và toàn bộ các dữ liệu Vector liên quan khỏi cơ sở dữ liệu tri thức của AI Tutor. AI sẽ không thể truy xuất kiến thức từ nguồn này nữa. Bạn có chắc chắn muốn xóa?".
3. Admin click "Xác nhận xóa".
4. Backend thực hiện một Transaction:
   - Xóa file gốc trên Server/Cloud Storage.
   - Thực hiện lệnh xóa hàng loạt (Cascade Delete) toàn bộ các bản ghi vector chunk thuộc ID tài liệu đó trong Vector Database (`DocumentChunks`).
   - Xóa bản ghi tài liệu trong bảng chính DB.
5. Hệ thống cập nhật biến mất dòng tài liệu đó trên bảng danh sách.

---

## **3. Tiêu chí Chấp nhận (Acceptance Criteria)**

### **AC-01: Ràng buộc định dạng file và dung lượng nghiêm ngặt tại Client & Server**

- **Given:** Admin chọn tải lên file `.zip` hoặc file PDF nặng 60MB.
- **When:** Thực hiện tải lên hệ thống.
- **Then:** Hệ thống phải báo lỗi và chặn không cho tải lên. Chỉ chấp nhận các file tài liệu định dạng: `.pdf`, `.docx`, `.md`, `.txt` có dung lượng tối đa 50MB.

### **AC-02: Bóc tách text giữ nguyên định dạng công thức khoa học (LaTeX/MathJax)**

- **Given:** File PDF tải lên chứa các công thức toán phức tạp (Ví dụ: công thức tích phân, đạo hàm).
- **When:** Hệ thống chạy tiến trình Ingestion.
- **Then:** Phần text bóc tách được ở các đoạn chunk phải giữ nguyên cấu trúc công thức ở định dạng LaTeX (Ví dụ: `$$\int_{a}^{b} f(x) dx$$`) để khi AI đọc hiểu và trả lời học sinh hiển thị công thức toán học chuẩn xác, không bị lỗi ký tự lạ.

### **AC-03: Theo dõi tiến độ Ingestion thời gian thực (Real-time Progress Tracking)**

- **Given:** Admin vừa click upload thành công một file sách hoặc tài liệu.
- **When:** Tiến trình Ingestion chạy ngầm dưới Backend.
- **Then:** Giao diện quản trị của Admin phải hiển thị cập nhật phần trăm tiến trình tăng dần liên tục (30% -&gt; 60% -&gt; 90% -&gt; 100%) thông qua kết nối SignalR mà không yêu cầu Admin phải tải lại trang thủ công.

### **AC-04: Xử lý ngoại lệ an toàn khi gặp lỗi trong quá trình Vector hóa (Ingestion Error Handling)**

- **Given:** Dịch vụ API sinh Embedding bị lỗi kết nối hoặc vượt quá hạn mức request.
- **When:** Tiến trình Ingestion đang chạy ở bước sinh Vector (60%).
- **Then:**
  - Hệ thống phải tự động thực hiện cơ chế Retry tối đa 3 lần.
  - Nếu sau 3 lần vẫn lỗi, hệ thống phải dừng tiến trình, cập nhật trạng thái bản ghi tài liệu gốc thành `FAILED` với mô tả lỗi cụ thể và dọn sạch (Rollback) các đoạn chunk đã được ghi dở dang trước đó trong Vector DB.

### **AC-05: Đảm bảo xóa dữ liệu vật lý sạch hoàn toàn (Clean Cascade Delete)**

- **Given:** Admin thực hiện xóa tài liệu thành công.
- **When:** AI Tutor nhận câu hỏi mới liên quan đến kiến thức của tài liệu vừa xóa.
- **Then:** AI Tutor không được phép sử dụng bất kỳ mảnh kiến thức nào của tài liệu đã xóa để trả lời (đảm bảo toàn bộ các bản ghi vector chunk tương ứng trong Vector DB đã bị xóa sạch vật lý hoàn toàn khỏi hệ thống).

### **AC-06: Cập nhật thông tin phân loại tài liệu thành công**

- **Given:** Tài liệu "Sách Bài Tập Toán 10" đang được phân loại thuộc môn "Toán", lớp "Khối 10".
- **When:** Admin chỉnh sửa môn học thành "Vật lý" và lớp thành "Khối 11", sau đó bấm Cập nhật.
- **Then:**
  - Hệ thống cập nhật thành công bản ghi tài liệu trong cơ sở dữ liệu.
  - Phải tự động đồng bộ thay đổi môn học và lớp cho toàn bộ các vector chunks của tài liệu này trong Vector DB.

### **AC-07: Quản lý cấu trúc giáo trình với ràng buộc dữ liệu chặt chẽ**

- **Given:** Cuốn sách giáo khoa "Vật lý 12" đang chứa các chương học và bài học mà học sinh đang học.
- **When:** Admin bấm nút xóa cuốn sách này.
- **Then:** Hệ thống phải chặn hành động xóa, hiển thị thông báo lỗi yêu cầu Admin phải gỡ bỏ tất cả các chương học và bài học liên kết trước khi xóa sách để bảo vệ tính toàn vẹn dữ liệu.

### **AC-08: Phân tích ảnh mục lục bóc tách cấu trúc bài học và khoảng trang chính xác**

- **Given:** Admin upload ảnh chụp mục lục của một cuốn sách.
- **When:** Click phân tích mục lục.
- **Then:** Hệ thống phải bóc tách chính xác tên các chương, các bài học và khoảng trang tương ứng hiển thị lên màn hình kiểm tra (độ chính xác trên 80% đối với ảnh chụp rõ nét).

### **AC-09: Tự động cắt sách và nhúng vector theo phân trang bài học thành công**

- **Given:** Bảng khoảng trang mục lục sách đã được xác nhận.
- **When:** Admin nhấn nút bắt đầu trích xuất và nạp tri thức.
- **Then:** Hệ thống phải cắt file PDF gốc thành các file PDF nhỏ tương ứng với khoảng trang của từng bài, lưu trữ Cloud Storage, tự động tạo các tài liệu liên kết với từng bài học và kích hoạt tiến trình nhúng vector thành công cho từng tài liệu bài học đó.

---

## **4. Đặc tả dữ liệu**

| Tên trường                             | Bắt buộc? | Ràng buộc dữ liệu (Validation Rules)                                                                                                      | Ghi chú / Trạng thái mặc định                                                 |
| ----------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Tên sách giáo khoa**           | Có         | \- Định dạng văn bản Unicode- Độ dài từ 2 đến 100 ký tự                                                                          | Tên hiển thị của cuốn sách giáo khoa.                                        |
| **Môn học**                       | Có         | \- Phải chọn một trong các môn học có sẵn trong hệ thống (Toán, Vật lý, Hóa học, Sinh học, Tiếng Anh...)                     | Môn học áp dụng cho sách/chương/bài/tài liệu.                             |
| **Khối lớp**                      | Có         | \- Phải chọn một trong các khối lớp: Lớp 10, Lớp 11, Lớp 12                                                                          | Khối lớp áp dụng cho sách/chương/bài/tài liệu.                            |
| **Chương trình học**            | Có         | \- Định dạng văn bản Unicode- Độ dài từ 2 đến 50 ký tự                                                                           | Tên bộ sách/chương trình học (Ví dụ: Cánh Diều, Chân trời sáng tạo). |
| **Tên chương học**              | Có         | \- Định dạng văn bản Unicode- Độ dài từ 2 đến 150 ký tự                                                                          | Tên của chương học trong sách.                                                |
| **Mã chương học**               | Có         | \- Chỉ chứa chữ cái không dấu và số, tự động viết hoa- Độ dài từ 2 đến 20 ký tự- Phải độc nhất trong cuốn sách      | Mã định danh kỹ thuật của chương học.                                      |
| **Tiêu đề bài học**            | Có         | \- Định dạng văn bản Unicode- Độ dài từ 2 đến 150 ký tự                                                                          | Tiêu đề của bài học trong chương.                                           |
| **Mã bài học**                   | Có         | \- Chỉ chứa chữ cái không dấu và số, tự động viết hoa- Độ dài từ 2 đến 20 ký tự- Phải độc nhất trên hệ thống       | Mã định danh kỹ thuật của bài học.                                          |
| **Ảnh chụp mục lục sách**      | Không      | \- Chỉ nhận file hình ảnh: `.jpg`, `.jpeg`, `.png`- Dung lượng tối đa: 10 MB/file                                               | Dùng để chạy OCR/AI phân tích mục lục. Mặc định: Trống.                 |
| **Tệp sách PDF gốc**             | Có         | \- Chỉ nhận file `.pdf`- Dung lượng tối đa: 100 MB                                                                                    | Cuốn sách giáo khoa gốc để thực hiện cắt trang. Mặc định: Trống.       |
| **Khoảng trang bài học**         | Có         | \- Số trang bắt đầu và số trang kết thúc phải là số nguyên dương- Trang kết thúc phải lớn hơn hoặc bằng trang bắt đầu | Cấu hình khoảng trang cắt PDF cho từng bài học.                              |
| **Tên tài liệu bổ trợ**        | Có         | \- Định dạng văn bản Unicode- Độ dài từ 5 đến 100 ký tự                                                                          | Tên hiển thị của tài liệu bổ trợ. Mặc định: Trống.                      |
| **Phân loại tài liệu bổ trợ** | Có         | \- Chọn một trong các giá trị: Tài liệu lý thuyết, Bài tập ôn luyện, Đề thi mẫu                                               | Để hệ thống quản lý loại tài nguyên. Mặc định: Tài liệu lý thuyết.  |
| **Tệp tài liệu bổ trợ**        | Có         | \- Định dạng file: `.pdf`, `.docx`, `.md`, `.txt`- Dung lượng tối đa: 50 MB                                                    | File đính kèm để nạp vector RAG trực tiếp. Mặc định: Trống.             |
