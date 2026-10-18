Là Quản trị viên hoặc Giáo viên (Admin/Teacher), tôi muốn quản lý ngân hàng câu hỏi (tạo thủ công, xóa hàng loạt, hoặc dùng AI tự động sinh câu hỏi theo kỹ năng) và thiết lập các đề thi chính thức để giao bài tập cho học sinh và theo dõi thống kê kết quả thi cử của lớp học.


# **User Story: Quản lý Ngân hàng câu hỏi và Đề thi chính thức (Question Bank & Quiz Management)**

## **1. Tổng quan & Bối cảnh (Overview & Context)**

### **Vấn đề (Problem):**

Để tổ chức các bài kiểm tra đánh giá năng lực học sinh và cung cấp dữ liệu cho thuật toán chẩn đoán học tập thích ứng (Adaptive Learning), hệ thống cần một ngân hàng câu hỏi đồ sộ và chất lượng. Tuy nhiên, việc biên soạn thủ công hàng ngàn câu hỏi trắc nghiệm kèm theo đáp án và lời giải thích chi tiết cho từng kỹ năng học tập là một gánh nặng cực kỳ lớn đối với giáo viên, dễ dẫn đến tình trạng thiếu hụt câu hỏi ôn luyện. Bên cạnh đó, giáo viên cần công cụ để tạo các bài thi chính thức (Quizzes) giao cho học sinh làm trên lớp hoặc ở nhà, đồng thời phải theo dõi được thống kê điểm số chung để đánh giá chất lượng dạy học của mình.

### **Pain Points hiện tại:**

- **Thiếu hụt nguồn câu hỏi chất lượng:** Biên soạn câu hỏi thủ công mất quá nhiều thời gian, đặc biệt là phần viết lời giải thích chi tiết từng bước cho học sinh tự học.
- **Khó quản lý câu hỏi theo kỹ năng:** Các câu hỏi không được gắn thẻ kỹ năng (Skill Code) rõ ràng, dẫn đến thuật toán chẩn đoán năng lực không thể lựa chọn câu hỏi phù hợp với trình độ học sinh.
- **Tổ chức thi cử thủ công phức tạp:** Không có giao diện trực quan để giáo viên tự tạo đề thi, đặt thời gian làm bài, giới hạn số lượt thi và xem thống kê kết quả bài làm của cả lớp.

### **Giá trị Nghiệp vụ (Business Value):**

- **Tối ưu biên soạn bằng AI:** Cho phép giáo viên sử dụng AI để tự động tạo hàng loạt câu hỏi trắc nghiệm chất lượng cao bám sát kỹ năng học tập chỉ trong vài giây, giảm 90% thời gian soạn đề.
- **Phân loại câu hỏi thông minh:** Toàn bộ câu hỏi được liên kết chặt chẽ với Kỹ năng (Skill) và mức độ khó, làm cơ sở cho hệ thống Adaptive Learning tự động chẩn đoán năng lực học sinh.
- **Quản lý thi cử chuyên nghiệp:** Giáo viên dễ dàng CRUD đề thi chính thức, kiểm soát thời gian làm bài thi và số lượt làm bài của học sinh.
- **Báo cáo thống kê trực quan:** Cung cấp các thống kê điểm số trung bình, tỷ lệ hoàn thành đề thi để giúp giáo viên đánh giá đúng hiệu quả học tập và điều chỉnh cách giảng dạy.

### **Đối tượng (Actor):**

- **Primary Actor:** Quản trị viên (Admin) / Giáo viên (Teacher).
- **Secondary Actors:**
  - **Hệ thống AI Generator (LangChain):** Gọi mô hình ngôn ngữ lớn (LLM) để soạn thảo các câu hỏi thông minh theo kỹ năng và độ khó yêu cầu.

### **User Story Statement**

Là Quản trị viên hoặc Giáo viên (Admin/Teacher), tôi muốn quản lý ngân hàng câu hỏi (tạo thủ công, xóa hàng loạt, hoặc dùng AI tự động sinh câu hỏi theo kỹ năng) và thiết lập các đề thi chính thức để giao bài tập cho học sinh và theo dõi thống kê kết quả thi cử của lớp học.

---

## **2. Luồng Người dùng (User Flow)**

### **2.1. Luồng: Quản lý ngân hàng câu hỏi theo Kỹ năng (Question Bank CRUD Flow)**

1. Admin đăng nhập vào trang quản trị, chọn mục **"Question Bank"** (Ngân hàng Câu hỏi).
2. Hệ thống hiển thị bảng danh sách các Kỹ năng (Skills) hiện có kèm theo số lượng câu hỏi đang có trong ngân hàng của từng kỹ năng đó. Admin có thể lọc danh sách kỹ năng theo Môn học và Khối lớp.
3. Admin click vào một Kỹ năng cụ thể (Ví dụ: kỹ năng "Tính đạo hàm hàm số mũ").
4. Hệ thống hiển thị bảng danh sách các câu hỏi thuộc kỹ năng đó, gồm các cột: Nội dung câu hỏi (Stem), Mức độ khó (từ 1 đến 5), Các thẻ phân loại (Tags) và Cột hành động. Admin có thể thực hiện:
   - **Tạo câu hỏi thủ công (+ Create Question):** Admin điền nội dung câu hỏi, danh sách đáp án lựa chọn, chỉ rõ đáp án đúng, viết lời giải thích chi tiết, chọn mức độ khó (1-5) và gắn thẻ tags, rồi bấm "Lưu".
   - **Chỉnh sửa câu hỏi (Edit):** Admin click vào một câu hỏi để chỉnh sửa nội dung, đáp án hoặc lời giải thích.
   - **Xóa câu hỏi (Delete):** Xóa câu hỏi khỏi ngân hàng.
   - **Xóa hàng loạt (Bulk Delete):** Admin tích chọn nhiều câu hỏi cùng lúc và bấm nút "Xóa các câu hỏi đã chọn". Hệ thống hiển thị modal xác nhận số lượng câu hỏi sẽ bị xóa trước khi thực hiện xóa vĩnh viễn trong cơ sở dữ liệu.

### **2.2. Luồng: AI tự động sinh câu hỏi hàng loạt (AI Question Generation Flow)**

1. Tại trang danh sách câu hỏi của một Kỹ năng cụ thể, Admin click vào nút **"Tạo câu hỏi bằng AI"** (Generate with AI).
2. Hệ thống hiển thị modal form yêu cầu cấu hình sinh câu hỏi:
   - **Kỹ năng lựa chọn:** Tự động điền theo kỹ năng hiện tại (Read-only).
   - **Độ khó câu hỏi:** Dropdown chọn mức độ (từ 1 đến 5).
   - **Số lượng câu hỏi cần tạo:** Nhập số lượng (tối thiểu 1, tối đa 20 câu/lần).
3. Admin điền thông tin cấu hình và bấm **"Bắt đầu tạo câu hỏi"**.
4. Hệ thống hiển thị hiệu ứng chờ: "AI đang biên soạn câu hỏi và lời giải chi tiết cho bạn...".
5. Backend gọi dịch vụ AI Generator:
   - Đọc lý thuyết và tài liệu thuộc kỹ năng đó.
   - Sinh ra các câu hỏi trắc nghiệm mới lạ bám sát độ khó yêu cầu, đi kèm các phương án nhiễu (distractors), đáp án đúng và phần giải thích từng bước.
6. Sau khi hoàn thành:
   - Hệ thống tự động lưu các câu hỏi vừa sinh vào bảng `QuestionBank` trong cơ sở dữ liệu.
   - Hiển thị danh sách các câu hỏi vừa tạo lên màn hình modal để Admin xem trước, chỉnh sửa nhanh hoặc xóa bớt câu không vừa ý.
   - Admin click "Xác nhận nạp vào Ngân hàng". Hệ thống đóng modal và cập nhật lại bảng danh sách câu hỏi của kỹ năng.

### **2.3. Luồng: Quản lý Đề thi chính thức (Quiz CRUD Flow)**

1. Admin điều hướng đến mục **"Quizzes Management"** (Quản lý Đề thi).
2. Hệ thống hiển thị danh sách các Đề thi chính thức trên nền tảng. Admin thực hiện các thao tác:
   - **Tạo Đề thi mới (+ Create Quiz):** Admin điền form gồm: Tiêu đề đề thi, Mô tả ngắn, chọn Môn học, Khối lớp, Bài học liên kết (optional), Thời gian làm bài (phút), Số lượt thi tối đa, và Điểm số đạt yêu cầu (Passing score - %).
   - **Thiết lập bộ câu hỏi cho Đề thi:** Admin có thể:
     - *Chọn thủ công:* Click chọn các câu hỏi có sẵn từ Ngân hàng câu hỏi theo môn/kỹ năng để gán vào đề thi.
     - *AI tự động sinh đề:* Nhập các tham số chủ đề, số lượng câu, độ khó tối thiểu/tối đa, tỷ lệ các loại câu hỏi (trắc nghiệm, đúng/sai, điền từ). AI sẽ tự động bốc và sinh một bộ câu hỏi hoàn chỉnh gán vào đề thi.
   - **Phát hành đề thi (Publish):** Chuyển trạng thái đề thi sang `PUBLISHED` để học sinh bắt đầu nhìn thấy và làm bài trên Mobile App.
   - **Chỉnh sửa / Xóa đề thi:** Hỗ trợ cập nhật thông tin hoặc xóa đề thi (chặn xóa nếu đề thi đã có học sinh làm bài - QuizAttempt phát sinh).

### **2.4. Luồng: Xem thống kê kết quả thi cử (Quiz Statistics)**

1. Từ danh sách Đề thi, Admin click vào nút **"Xem thống kê"** (Statistics) bên cạnh một đề thi đã phát hành.
2. Hệ thống hiển thị trang báo cáo chi tiết kết quả làm bài của đề thi đó, bao gồm:
   - Tổng số lượt làm bài (Attempts count).
   - Điểm số trung bình (Average score).
   - Tỷ lệ học sinh đạt yêu cầu (Completion/Passing rate).
   - Biểu đồ phân tích độ khó (tỷ lệ câu trả lời sai nhiều nhất của học sinh).
   - Danh sách bảng chi tiết điểm số của từng học sinh đã làm bài.
3. Giáo viên có thể click "Xuất dữ liệu" để tải file Excel báo cáo chi tiết điểm số của lớp học.

---

## **3. Tiêu chí Chấp nhận (Acceptance Criteria)**

### **AC-QUIZ-01: AI tạo câu hỏi ngân hàng chính xác theo kỹ năng và độ khó**

- **Given:** Admin chọn tạo 5 câu hỏi bằng AI cho kỹ năng "Đạo hàm" với độ khó "Mức 4".
- **When:** Hệ thống hoàn thành tiến trình sinh câu hỏi.
- **Then:**
  - Phải hiển thị đúng 5 câu hỏi mới trong danh sách xem trước.
  - Các câu hỏi phải thuộc chủ đề đạo hàm và có độ khó cao (Mức 4).
  - Mỗi câu hỏi phải có đầy đủ: Nội dung, 4 đáp án lựa chọn, chỉ định đáp án đúng, và lời giải thích khoa học bằng tiếng Việt.

### **AC-QUIZ-02: Xóa hàng loạt câu hỏi thành công và dọn sạch dữ liệu liên kết**

- **Given:** Ngân hàng đang có 10 câu hỏi được tích chọn.
- **When:** Admin nhấn nút "Xóa các câu hỏi đã chọn" và bấm xác nhận đồng ý.
- **Then:** Hệ thống phải thực hiện xóa sạch hoàn toàn 10 câu hỏi này khỏi cơ sở dữ liệu, đồng thời xóa các liên kết lựa chọn đáp án tương ứng.

### **AC-QUIZ-03: Chặn xóa Đề thi chính thức đã có học sinh làm bài**

- **Given:** Đề thi "Kiểm tra Đại số 15 phút" đã được phát hành và đã có 3 học sinh nộp bài thi.
- **When:** Admin click nút Xóa đề thi này.
- **Then:** Hệ thống phải chặn thao tác, hiển thị thông báo lỗi màu đỏ: "Không thể xóa đề thi này vì đã có học sinh làm bài. Bạn chỉ có thể chuyển trạng thái đề thi sang Ngừng hoạt động (Draft/Archived)."

### **AC-QUIZ-04: Thống kê điểm số và tỷ lệ đạt yêu cầu chính xác 100%**

- **Given:** Đề thi có điểm đạt yêu cầu là 70%. Có 10 học sinh làm bài, trong đó 7 học sinh đạt điểm từ 7.0 trở lên, 3 học sinh dưới 7.0.
- **When:** Giáo viên truy cập trang Thống kê đề thi.
- **Then:** Chỉ số "Tỷ lệ đạt yêu cầu" phải hiển thị chính xác con số là `70.0%`.

---

## **4. Đặc tả dữ liệu**

| Tên trường                                 | Bắt buộc? | Ràng buộc dữ liệu (Validation Rules)                                                         | Ghi chú / Trạng thái mặc định                                     |
| --------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| **Nội dung câu hỏi**                 | Có         | \- Định dạng văn bản Unicode- Độ dài từ 10 đến 2000 ký tự                           | Câu hỏi hiển thị cho học sinh làm.                                |
| **Lựa chọn đáp án**                | Có         | \- Mảng văn bản Unicode chứa tối thiểu 2 lựa chọn, tối đa 6 lựa chọn                 | Các phương án trả lời.                                            |
| **Đáp án đúng**                    | Có         | \- Phải là một trong các phương án trong danh sách lựa chọn                            | Đáp án chính xác để chấm điểm.                                |
| **Lời giải thích chi tiết**         | Có         | \- Định dạng văn bản Unicode (hỗ trợ Markdown/LaTeX)- Độ dài từ 10 đến 2000 ký tự | Hiển thị sau khi học sinh nộp bài để hướng dẫn ôn tập.      |
| **Độ khó câu hỏi**                 | Có         | \- Số nguyên từ 1 (Dễ nhất) đến 5 (Khó nhất)                                            | Dùng cho thuật toán chẩn đoán thích ứng. Mặc định: 3.        |
| **Số lượng câu hỏi sinh bằng AI** | Có         | \- Số nguyên từ 1 đến 20                                                                    | Số lượng câu yêu cầu AI tạo mỗi lượt. Mặc định: 1.         |
| **Tiêu đề đề thi**                 | Có         | \- Định dạng văn bản Unicode- Độ dài từ 3 đến 200 ký tự                             | Tên hiển thị của đề thi chính thức.                             |
| **Thời gian làm bài thi**            | Có         | \- Số nguyên lớn hơn 0- Giá trị từ 1 đến 180 phút                                      | Giới hạn đếm ngược làm bài. Mặc định: 30 phút.              |
| **Số lượt làm bài tối đa**       | Có         | \- Số nguyên lớn hơn 0 (từ 1 đến 10)                                                      | Giới hạn số lần học sinh được thử sức. Mặc định: 3 lượt. |
| **Điểm số đạt yêu cầu**          | Có         | \- Số thực từ 0.0 đến 100.0 (%)                                                             | Ngưỡng tính tỷ lệ đỗ bài thi. Mặc định: 70.0%.               |
