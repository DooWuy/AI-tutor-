Là Quản trị viên hệ thống hoặc Chuyên gia giáo dục (Admin/Academic Admin), tôi muốn quản lý bộ kỹ năng thích ứng, liên kết kỹ năng vào bài học và điều chỉnh các cấu hình toàn cục cùng nhật ký logs lỗi để đảm bảo hệ thống vận hành an toàn, ổn định và thông minh.


# **User Story: Quản lý Kỹ năng thích ứng và Cấu hình Hệ thống (Skills & System Settings)**

## **1. Tổng quan & Bối cảnh (Overview & Context)**

### **Vấn đề (Problem):**

Hệ thống AI Tutor cung cấp công cụ tự học thích ứng (Adaptive Learning), nghĩa là hệ thống tự động chẩn đoán năng lực của học sinh và đề xuất bài học/câu hỏi phù hợp. Để làm được điều này, hệ thống cần một bản đồ kỹ năng (Skill Map) chi tiết bám sát chương trình của Bộ GD&ĐT. Các kỹ năng này cần được định cấu hình các thông số kỹ thuật (độ quan trọng, ngưỡng thành thạo, số lần làm bài tối thiểu) và liên kết trực tiếp với các bài học trong sách giáo khoa. Ngoài ra, đội ngũ vận hành kỹ thuật cần một giao diện quản trị tập trung để điều chỉnh cấu hình toàn cục (System Settings), theo dõi nhật ký lỗi hệ thống (System Logs) và kích hoạt chế độ bảo trì khi nâng cấp mà không cần can thiệp trực tiếp vào database hay code của server.

### **Pain Points hiện tại:**

- **Cấu hình thuật toán Adaptive cứng nhắc:** Các tham số về độ thành thạo và số lần thử tối thiểu của kỹ năng bị hardcode, không thể thay đổi linh hoạt theo từng môn học.
- **Thiếu sự liên kết giữa kỹ năng và bài học:** Giáo trình sách giáo khoa và bản đồ kỹ năng nằm riêng rẽ, khiến hệ thống không biết bài học này tương ứng với kỹ năng nào để gợi ý câu hỏi thích ứng.
- **Khó khăn khi xử lý sự cố:** Khi hệ thống xảy ra lỗi, đội ngũ vận hành phải mở console server để đọc log rất phiền phức, không có nơi hiển thị tập trung và không có cách nào để khóa ứng dụng bảo trì an toàn.

### **Giá trị Nghiệp vụ (Business Value):**

- **Thuật toán thích ứng linh hoạt:** Giáo viên dễ dàng tinh chỉnh ngưỡng thành thạo (Mastery Threshold) và độ quan trọng của từng kỹ năng, giúp thuật toán Adaptive Diagnostic chẩn đoán năng lực học sinh chính xác nhất.
- **Đồng bộ hóa chương trình và kỹ năng:** Tạo liên kết đa-đa giữa Bài học và Kỹ năng, làm cơ sở để AI sinh câu hỏi thích ứng đúng trọng tâm bài giảng.
- **Quản trị vận hành nhanh chóng:** Giúp đội ngũ kỹ thuật thay đổi cấu hình toàn cục (hạn mức XP ngày, cache timeout) ngay trên giao diện Web Dashboard.
- **Bảo trì và khắc phục lỗi an toàn:** Giám sát nhật ký lỗi trực quan, hỗ trợ bật chế độ bảo trì chủ động để bảo vệ dữ liệu học sinh khi nâng cấp hệ thống.

### **Đối tượng (Actor):**

- **Primary Actor:** Quản trị viên hệ thống (Admin) / Chuyên gia giáo dục (Academic Admin).
- **Secondary Actors:**
  - **Thuật toán Adaptive Engine (System Service):** Đọc cấu hình kỹ năng để tính toán mức độ thành thạo học tập của học sinh.

### **User Story Statement**

Là Quản trị viên hệ thống hoặc Chuyên gia giáo dục (Admin/Academic Admin), tôi muốn quản lý bộ kỹ năng thích ứng, liên kết kỹ năng vào bài học và điều chỉnh các cấu hình toàn cục cùng nhật ký logs lỗi để đảm bảo hệ thống vận hành an toàn, ổn định và thông minh.

---

## **2. Luồng Người dùng (User Flow)**

### **2.1. Luồng: Quản lý bộ kỹ năng học tập thích ứng (Skill CRUD Flow)**

1. Academic Admin đăng nhập vào hệ thống, truy cập mục **"Skills Management"** (Quản lý Kỹ năng).
2. Hệ thống hiển thị danh sách kỹ năng dưới dạng bảng, hỗ trợ tìm kiếm theo Mã/Tên kỹ năng và lọc theo Môn học, Khối lớp.
3. Academic Admin thực hiện các thao tác:
   - **Tạo Kỹ năng mới (+ Create Skill):** Nhập Mã kỹ năng (độc nhất), Tên kỹ năng, mô tả chi tiết, chọn Môn học, Khối lớp, và thiết lập các chỉ số thuật toán:
     - *Độ quan trọng (Importance):* Thang điểm từ 1 đến 10.
     - *Ngưỡng thành thạo (Mastery Threshold):* Số thập phân từ 0.0 đến 1.0 (mặc định: 0.9 - tương đương học sinh phải đạt 90% độ chính xác mới được coi là thành thạo kỹ năng này).
     - *Số lượt thử tối thiểu (Min Attempts):* Số câu hỏi tối thiểu học sinh phải trả lời thuộc kỹ năng này trước khi hệ thống tính độ thành thạo (mặc định: 3 câu).
     - *Cho phép bỏ qua (Can Skip):* Hộp kiểm Boolean (Cho phép học sinh bỏ qua nếu đã chứng minh thành thạo ở kỹ năng tiên quyết).
   - **Chỉnh sửa Kỹ năng:** Thay đổi các chỉ số thuật toán hoặc tên kỹ năng.
   - **Xóa Kỹ năng:** Hệ thống thực hiện xóa liên kết kỹ năng với bài học trước khi xóa bản ghi chính khỏi DB.

### **2.2. Luồng: Liên kết Kỹ năng vào bài học giáo trình (Link Skill to Lesson Flow)**

1. Tại trang chi tiết của một Kỹ năng, Admin click chọn mục **"Bài học liên kết"** (Associated Lessons).
2. Hệ thống hiển thị danh sách các bài học hiện có thuộc cùng môn học và khối lớp.
3. Admin thực hiện tích chọn một hoặc nhiều bài học tương ứng (Ví dụ: liên kết kỹ năng "Cộng phân số" vào "Bài 2: Phép cộng phân số" và "Bài 3: Luyện tập phép cộng").
4. Admin nhấn **"Cập nhật liên kết"**.
5. Backend thực hiện lưu trữ các bản ghi liên kết vào bảng trung gian `LessonSkill` trong cơ sở dữ liệu. Từ nay, khi học sinh mở làm bài tập của các bài học này, thuật toán sẽ tự động bốc câu hỏi từ ngân hàng câu hỏi thuộc kỹ năng liên kết để chấm điểm.

### **2.3. Luồng: Điều chỉnh cấu hình hệ thống toàn cục (Update System Settings Flow)**

1. Admin điều hướng đến mục **"System Settings"** (Cấu hình Hệ thống).
2. Hệ thống hiển thị các tab cấu hình:
   - **Tab 1: Cấu hình Gamification:** Nhập giới hạn XP nhận được tối đa trong ngày của học sinh (Daily XP Cap).
   - **Tab 2: Cấu hình AI Model:** Nhập các khóa API, chọn mô hình mặc định (Gemini, GPT-4, Claude) và tham số nhiệt độ sáng tạo (Temperature).
   - **Tab 3: Cấu hình Cache & Database:** Thiết lập thời gian lưu cache Redis, cấu hình pool connection.
3. Admin thay đổi các thông số cấu hình và nhấn nút **"Lưu cấu hình"**.
4. Hệ thống cập nhật các tham số vào cơ sở dữ liệu cấu hình, tự động tải lại (reload) cấu hình ứng dụng ở phía Server mà không cần khởi động lại API.

### **2.4. Luồng: Giám sát nhật ký hệ thống và Kích hoạt bảo trì (System Logs & Maintenance Flow)**

1. Admin truy cập mục **"System Logs"** (Nhật ký lỗi) trên Sidebar.
2. Hệ thống hiển thị bảng nhật ký sự kiện, cho phép lọc theo Cấp độ log (Info, Warning, Error, Critical) và khoảng thời gian (Từ ngày... Đến ngày...). Admin có thể xem chi tiết dòng log lỗi (Error Stack Trace) để phát hiện sự cố hệ thống.
3. **Kích hoạt bảo trì:** Khi cần nâng cấp database hoặc deploy server:
   - Admin truy cập trang "Maintenance" và click vào nút **"Kích hoạt chế độ Bảo trì"** (Trigger Maintenance).
   - Hệ thống hiển thị modal cảnh báo xác nhận. Admin click "Xác nhận".
   - Backend đổi trạng thái hệ thống sang `MAINTENANCE`. Toàn bộ API gọi từ ứng dụng Mobile của học sinh sẽ bị chặn và trả về mã lỗi bảo trì.
   - Ứng dụng Mobile App của học sinh lập tức hiển thị màn hình thông báo thân thiện: "Hệ thống đang được nâng cấp bảo trì định kỳ để mang lại trải nghiệm tốt hơn. Vui lòng quay lại sau ít phút! Cảm ơn bạn."
   - Khi hoàn thành nâng cấp, Admin click "Tắt chế độ Bảo trì" để khôi phục hoạt động bình thường.

---

## **3. Tiêu chí Chấp nhận (Acceptance Criteria)**

### **AC-SYS-01: Quản lý cấu hình Kỹ năng thích ứng thành công**

- **Given:** Academic Admin đang tạo một kỹ năng mới.
- **When:** Admin nhập mã kỹ năng đã tồn tại, hoặc nhập Ngưỡng thành thạo là `1.5` (lớn hơn 1.0) và nhấn Lưu.
- **Then:**
  - Hệ thống phải chặn submit, hiển thị thông báo lỗi chi tiết: "Mã kỹ năng đã tồn tại" hoặc "Ngưỡng thành thạo phải nằm trong khoảng từ 0.0 đến 1.0".

### **AC-SYS-02: Liên kết bài học giáo trình hoạt động chính xác**

- **Given:** Kỹ năng A đã được liên kết thành công với Bài học B và Bài học C.
- **When:** Hệ thống Adaptive Quiz tạo đề thi tự luyện cho bài học B.
- **Then:** Hệ thống phải bốc các câu hỏi thuộc Kỹ năng A để gán vào đề thi thích ứng của bài học B.

### **AC-SYS-03: Kích hoạt chế độ bảo trì hoạt động tức thì**

- **Given:** Admin đã kích hoạt chế độ bảo trì thành công trên Admin Dashboard.
- **When:** Học sinh đang mở ứng dụng Mobile App và bấm gửi tin nhắn cho AI Tutor.
- **Then:**
  - Yêu cầu phải bị chặn ngay tại API Gateway.
  - Mobile App phải hiển thị ngay màn hình thông báo hệ thống đang bảo trì, không cho phép học sinh thao tác chat hay làm bài thi.

---

## **4. Đặc tả dữ liệu**

| Tên trường                               | Bắt buộc? | Ràng buộc dữ liệu (Validation Rules)                                                                                                      | Ghi chú / Trạng thái mặc định                                           |
| ------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Mã kỹ năng**                     | Có         | \- Chỉ chứa chữ cái không dấu và số, tự động viết hoa- Độ dài từ 2 đến 20 ký tự- Phải độc nhất trên toàn hệ thống | Mã định danh kỹ thuật của kỹ năng thích ứng.                        |
| **Tên kỹ năng**                    | Có         | \- Định dạng văn bản Unicode- Độ dài từ 2 đến 100 ký tự                                                                          | Tên hiển thị của kỹ năng học tập.                                     |
| **Mô tả kỹ năng**                 | Không      | \- Định dạng văn bản Unicode- Độ dài tối đa 500 ký tự                                                                             | Mô tả yêu cầu của kỹ năng.                                             |
| **Độ quan trọng**                  | Có         | \- Số nguyên từ 1 đến 10                                                                                                                 | Trọng số ưu tiên của kỹ năng. Mặc định: 1.                          |
| **Ngưỡng thành thạo**             | Có         | \- Số thập phân từ 0.00 đến 1.00                                                                                                        | Tỷ lệ làm đúng tối thiểu để đạt thành thạo. Mặc định: 0.90.   |
| **Số lượt thử tối thiểu**       | Có         | \- Số nguyên từ 1 đến 100                                                                                                                | Số câu hỏi tối thiểu phải làm. Mặc định: 3.                         |
| **Cho phép bỏ qua**                 | Có         | \- Giá trị Boolean (Đúng / Sai)                                                                                                           | Có thể bỏ qua khi chẩn đoán. Mặc định: Sai.                          |
| **Hạn mức XP tối đa trong ngày** | Có         | \- Số nguyên lớn hơn hoặc bằng 0                                                                                                        | Hạn mức XP của học sinh để chống cày điểm ảo. Mặc định: 500 XP. |
| **Cấp độ Log sự kiện**           | Có         | \- Chọn một trong các giá trị: INFO, WARNING, ERROR, CRITICAL                                                                            | Cấp độ lọc xem nhật ký lỗi hệ thống. Mặc định: ERROR.             |
