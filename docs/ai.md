Là Học sinh (Student), tôi muốn làm các bài kiểm tra trắc nghiệm (do giáo viên giao hoặc AI tự động tạo cá nhân hóa) có giới hạn thời gian để tự đánh giá năng lực, nhận kết quả chấm điểm tức thì kèm giải thích chi tiết và nhận điểm thưởng XP.


# **User Story: Luyện tập và Làm Trắc nghiệm (Practice & Quizzes)**

## **1. Tổng quan & Bối cảnh (Overview & Context)**

### **Vấn đề (Problem):**

Để củng cố kiến thức đã học trên lớp, học sinh cần làm các bài tập rèn luyện (quizzes) thường xuyên. Tuy nhiên, việc tự tìm đề luyện tập trong sách tham khảo rất tốn thời gian, và các bài tập tĩnh không thể tự động thay đổi độ khó phù hợp với sự tiến bộ của học sinh. Học sinh cũng thường phải đợi giáo viên chấm điểm thủ công, dẫn đến việc không biết mình sai ở đâu để khắc phục ngay lập tức.

### **Pain Points hiện tại:**

- **Bài tập quá dễ hoặc quá khó:** Đề thi chung cho cả lớp khiến học sinh yếu cảm thấy nản chí vì không làm được bài, trong khi học sinh giỏi cảm thấy nhàm chán vì bài tập quá đơn giản.
- **Thiếu lời giải thích tức thời và chi tiết:** Học sinh làm sai trắc nghiệm chỉ biết đáp án đúng (Ví dụ: chọn A thay vì B) mà hoàn toàn không hiểu tại sao đáp án B mới là đáp án chính xác.
- **Tình trạng gian lận và thiếu tập trung:** Làm bài tập về nhà trực tuyến không có giới hạn thời gian thực khiến học sinh dễ bị phân tâm, lướt web tìm câu trả lời hoặc kéo dài thời gian làm bài vô tội vạ.
- **Định dạng câu hỏi nghèo nàn:** Các hệ thống trắc nghiệm cũ chỉ hỗ trợ câu hỏi chọn 1 đáp án đúng (Multiple choice), không hỗ trợ các dạng câu hỏi phong phú khác như Đúng/Sai, Điền khuyết hay Tự luận ngắn.

### **Giá trị Nghiệp vụ (Business Value):**

- **Cá nhân hóa lộ trình rèn luyện:** AI tự động tạo bài tập có độ khó thích ứng (Adaptive Difficulty) dựa trên kết quả học tập và lỗ hổng kiến thức hiện tại của từng học sinh.
- **Chấm điểm tự động và phản hồi tức thì:** Giúp học sinh học hỏi trực tiếp từ những lỗi sai của mình thông qua phần giải thích chi tiết từng bước của AI Tutor ngay sau khi nộp bài.
- **Nâng cao tính kỷ luật:** Tích hợp bộ đếm ngược thời gian thực giúp học sinh rèn luyện kỹ năng quản lý thời gian làm bài thi như trong phòng thi thật.
- **Kích thích động lực học tập:** Tích hợp hệ thống điểm thưởng XP giúp biến việc làm bài tập thành một trải nghiệm thú vị như đang chơi trò chơi.

### **Đối tượng (Actor):**

- **Primary Actor:** Học sinh (Student).
- **Secondary Actors:**
  - **Quản trị viên / Giáo viên (Admin/Teacher):** Tạo và quản lý các ngân hàng đề thi chuẩn hóa.
  - **Hệ thống AI Generator (LangChain):** Chịu trách nhiệm tự động tạo câu hỏi trắc nghiệm thông minh dựa trên môn học và độ khó yêu cầu.

### **User Story Statement**

Là Học sinh (Student), tôi muốn làm các bài kiểm tra trắc nghiệm (do giáo viên giao hoặc AI tự động tạo cá nhân hóa) có giới hạn thời gian để tự đánh giá năng lực, nhận kết quả chấm điểm tức thì kèm giải thích chi tiết và nhận điểm thưởng XP.

---

## **2. Luồng Người dùng (User Flow)**

### **2.1. Luồng chính: Học sinh làm bài kiểm tra trắc nghiệm**

1. Học sinh mở Mobile App và chọn tab **"Practice"** (Luyện tập).
2. Hệ thống hiển thị danh sách các bài kiểm tra khả dụng, bao gồm:
   - Các bài kiểm tra do Giáo viên giao (có gắn tag hạn chót - Deadline).
   - Các bài kiểm tra tự luyện do AI gợi ý dựa trên lịch sử học tập.
3. Học sinh chọn một bài kiểm tra (Ví dụ: **Bài tập Chương 1: Hàm số lũy thừa**).
4. Hệ thống hiển thị màn hình thông tin tổng quan của bài kiểm tra:
   - Tên bài kiểm tra, Môn học, Khối lớp.
   - Số lượng câu hỏi (ví dụ: 10 câu).
   - Thời gian làm bài (ví dụ: 15 phút).
   - Nút **"Bắt đầu làm bài"**.
5. Học sinh click nút "Bắt đầu làm bài".
6. Hệ thống chuyển hướng sang giao diện phòng thi:
   - Phía trên hiển thị thanh tiến trình làm bài (ví dụ: "Câu 1/10") và đồng hồ đếm ngược thời gian thực (ví dụ: `14:59`).
   - Phía giữa hiển thị nội dung câu hỏi hiện tại và các lựa chọn đáp án.
   - Phía dưới hiển thị thanh điều hướng câu hỏi (nút "Quay lại", "Tiếp theo" và danh sách lưới các câu hỏi để nhảy nhanh).
7. Học sinh lần lượt đọc và chọn đáp án cho từng câu hỏi (Hệ thống tự động lưu tạm đáp án mỗi khi học sinh tích chọn).
8. Khi trả lời đến câu cuối cùng, nút "Tiếp theo" chuyển thành nút **"Nộp bài"**.
9. Học sinh click nút "Nộp bài". Hệ thống hiển thị modal xác nhận: "Bạn có chắc chắn muốn nộp bài không? Vẫn còn 5 phút làm bài."
10. Học sinh click "Xác nhận nộp".
11. Hệ thống dừng đồng hồ đếm ngược, gửi dữ liệu câu trả lời lên Backend để chấm điểm tự động.
12. Hệ thống chuyển hướng học sinh đến màn hình **Kết quả bài thi** (Chi tiết ở luồng 2.3).

### **2.2. Luồng: AI tạo bài tập luyện tập cá nhân hóa (AI-generated Quiz)**

1. Tại tab "Practice", học sinh không chọn đề thi có sẵn mà click vào nút "AI tự tạo đề luyện tập".
2. Hệ thống hiển thị modal form yêu cầu cấu hình đề thi:
   - **Chọn Môn học:** Dropdown (Toán, Vật lý, Hóa học...).
   - **Chọn Chủ đề cụ thể:** Dropdown tương ứng (Ví dụ: chọn Lý -&gt; "Chương 1: Dao động cơ").
   - **Chọn mức độ khó:** Radio button (Dễ / Trung bình / Khó).
   - **Số lượng câu hỏi:** Dropdown chọn (5 câu, 10 câu, 15 câu).
3. Học sinh chọn các tùy chọn và click "Tạo đề thi".
4. Hệ thống hiển thị màn hình chờ: "AI đang biên soạn đề thi riêng cho bạn..."
5. Backend gọi LangChain kết hợp LLM:
   - Đọc các tài liệu học tập của chủ đề được chọn trong Vector Database.
   - Tạo ra danh sách các câu hỏi trắc nghiệm mới lạ, không trùng lặp, bám sát độ khó yêu cầu gồm câu hỏi, danh sách đáp án, đáp án đúng và phần giải thích chi tiết.
6. Hệ thống đóng màn hình chờ và hiển thị trang thông tin tổng quan của bài thi tự tạo.
7. Học sinh tiến hành làm bài như luồng chính.

### **2.3. Luồng: Xem kết quả chấm điểm và giải thích chi tiết**

1. Sau khi học sinh nộp bài hoặc hết giờ làm bài tự động, hệ thống hiển thị màn hình **Kết quả**.
2. Màn hình Kết quả hiển thị các thông tin tổng hợp:
   - Điểm số đạt được (Ví dụ: `8.0 / 10`).
   - Thời gian hoàn thành (Ví dụ: `09 phút 25 giây`).
   - **Số điểm XP nhận được** (Ví dụ: `+80 XP` được cộng trực tiếp vào tài khoản).
   - Tỷ lệ câu trả lời (Ví dụ: "Đúng 8, Sai 2").
3. Học sinh cuộn xuống dưới để xem chi tiết từng câu hỏi:
   - Với câu trả lời đúng: Hiển thị icon dấu tích xanh, đáp án đã chọn có màu xanh lá.
   - Với câu trả lời sai: Hiển thị icon dấu x đỏ, đáp án đã chọn màu đỏ, đồng thời bôi xanh đáp án đúng của hệ thống.
   - **Mục "Lời giải chi tiết của AI Tutor":** Hiển thị một khung văn bản giải thích rõ ràng các bước giải, công thức áp dụng và tại sao đáp án đó lại đúng để học sinh tự học lại.
4. Học sinh nhấn nút "Hoàn thành" để quay lại trang danh sách Practice.

### **2.4. Luồng: Chỉnh sửa đáp án nháp trong khi làm bài (Update Draft Flow)**

1. Trong khi đang ở giao diện phòng thi (chưa click nút "Nộp bài"), học sinh có thể click chọn lại đáp án khác cho câu trắc nghiệm đã làm, hoặc chỉnh sửa lại câu chữ trong các câu hỏi điền khuyết/tự luận ngắn.
2. Hệ thống:
   - Cập nhật tức thời đáp án đã sửa trên giao diện.
   - Tự động thực hiện lưu tạm (Auto-save draft) trạng thái câu trả lời mới nhất của học sinh lên Server sau mỗi thay đổi dưới nền (Background API call) để tránh mất dữ liệu nếu xảy ra sự cố sập nguồn hoặc mất kết nối mạng.

### **2.5. Quy tắc bất biến đối với kết quả bài làm đã nộp (Immutability Constraint)**

1. Ngay khi học sinh bấm "Nộp bài" hoặc hệ thống tự động thu bài khi hết giờ, bản ghi kết quả bài làm (`QuizAttempt`) được khởi tạo chính thức với các trường điểm số (`score`), số câu trả lời đúng, thời gian làm bài (`durationSeconds`), và số XP thưởng (`xpEarned`).
2. **Quy tắc bảo mật:** Hệ thống khóa vĩnh viễn dữ liệu kết quả bài làm này. Tuyệt đối không cung cấp bất kỳ API hay nút thao tác nào cho phép học sinh chỉnh sửa, thay đổi đáp án hoặc can thiệp vào điểm số đã lưu nhằm bảo vệ tính trung thực trong thi cử và tính chính xác của bảng xếp hạng.

### **2.6. Luồng: Xóa lịch sử bài kiểm tra tự luyện (Delete Practice History Flow)**

1. Tại tab "Practice", học sinh truy cập vào mục "Lịch sử tự luyện".
2. Hệ thống hiển thị danh sách các bài thi mà học sinh đã làm. Với các bài tập **tự luyện tự do** hoặc bài do **AI tự động tạo**, hệ thống hiển thị biểu tượng icon Thùng rác (Xóa khỏi lịch sử). Với các bài kiểm tra do giáo viên giao chính thức, biểu tượng này sẽ bị ẩn/vô hiệu hóa.
3. Học sinh click chọn biểu tượng Xóa bên cạnh một bài tự luyện.
4. Hệ thống hiển thị hộp thoại xác nhận: "Bạn có chắc chắn muốn ẩn lịch sử làm bài này? Thao tác này sẽ xóa bài thi khỏi giao diện lịch sử luyện tập cá nhân của bạn, nhưng điểm số tích lũy XP trước đó của bạn vẫn được giữ nguyên."
5. Học sinh click "Xác nhận".
6. Hệ thống thực hiện gửi yêu cầu xóa lên server. Backend thực hiện đánh dấu ẩn bản ghi (`isVisible = false` hoặc soft delete) để không hiển thị trên app của học sinh nữa, nhưng vẫn lưu trữ dữ liệu thô trong cơ sở dữ liệu để phục vụ báo cáo chất lượng của giáo viên.
7. Giao diện được cập nhật, ẩn dòng lịch sử bài thi vừa chọn và hiển thị thông báo: "Đã xóa bài thi khỏi lịch sử luyện tập cá nhân."

---

## **3. Tiêu chí Chấp nhận (Acceptance Criteria)**

### **AC-01: Tự động thu bài khi hết giờ làm bài**

- **Given:** Học sinh đang làm bài kiểm tra có thời gian đếm ngược.
- **When:** Đồng hồ đếm ngược về `00:00`.
- **Then:**
  - Hệ thống phải chặn ngay lập tức toàn bộ thao tác chọn đáp án của học sinh.
  - Tự động thực hiện gửi bài thi lên Backend để chấm điểm (nộp bài bắt buộc).
  - Hiển thị thông báo: "Đã hết giờ làm bài. Hệ thống tự động nộp bài của bạn."

### **AC-02: Tính toán và cộng điểm thưởng XP chính xác**

- **Given:** Học sinh hoàn thành một bài thi 10 câu. Mỗi câu đúng nhận được 10 XP. Học sinh trả lời đúng 7 câu.
- **When:** Hệ thống trả về kết quả chấm điểm.
- **Then:**
  - Hệ thống phải hiển thị số XP nhận được là `+70 XP` trên màn hình.
  - Số XP này phải được cập nhật ngay lập tức vào tổng số điểm tích lũy của học sinh trong Database để cập nhật Level và Bảng xếp hạng.

### **AC-03: AI tạo đề thi bám sát cấu hình yêu cầu**

- **Given:** Học sinh chọn tạo đề thi môn "Hóa học", chủ đề "Kim loại kiềm", mức độ "Khó".
- **When:** Đề thi được AI tạo xong.
- **Then:**
  - Toàn bộ các câu hỏi trong đề thi phải thuộc kiến thức về Kim loại kiềm.
  - Các câu hỏi phải có độ khó cao (yêu cầu suy luận hoặc tính toán phức tạp), không được chứa các câu hỏi nhận biết đơn giản.

### **AC-04: Hiển thị giải thích chi tiết cho từng câu hỏi**

- **Given:** Học sinh xem lại kết quả bài thi.
- **When:** Cuộn qua các câu hỏi đã làm.
- **Then:** Mỗi câu hỏi (bất kể học sinh làm đúng hay sai) đều phải hiển thị phần giải thích đáp án (AI explanation) rõ ràng, khoa học, không được để trống hoặc chỉ ghi mỗi đáp án đúng.

### **AC-05: Hỗ trợ nhiều định dạng câu hỏi phong phú**

- **Given:** Học sinh đang trong giao diện phòng thi.
- **When:** Làm bài.
- **Then:** Hệ thống phải hiển thị và nhận diện đúng các thao tác tương tác của học sinh đối với 4 loại câu hỏi:
  - Chọn 1 đáp án đúng (Multiple choice).
  - Chọn Đúng hoặc Sai (True/False).
  - Điền từ vào chỗ trống (Fill in the blank).
  - Viết câu trả lời tự luận ngắn dạng văn bản.

### **AC-06: Chặn chỉnh sửa kết quả bài kiểm tra đã nộp (Immutability Enforcement)**

- **Given:** Học sinh đã nộp bài thi thành công và nhận điểm `8.0`.
- **When:** Học sinh gửi các request API giả lập hoặc cố tình chỉnh sửa tham số điểm số gửi lên Backend.
- **Then:** Hệ thống phải lập tức từ chối và trả về lỗi quyền truy cập, không cho phép ghi đè điểm số hoặc thay đổi đáp án của bài làm đã kết thúc.

### **AC-07: Xóa lịch sử bài kiểm tra tự luyện thành công**

- **Given:** Học sinh đang xem danh sách Lịch sử tự luyện trên ứng dụng.
- **When:** Học sinh chọn xóa một bài luyện tập tự do và xác nhận.
- **Then:**
  - Bài thi đó phải lập tức biến mất khỏi danh sách hiển thị lịch sử của học sinh.
  - Dữ liệu thô vẫn được bảo toàn dưới cơ sở dữ liệu cho Analytics nhưng không hiển thị trên Mobile App.
  - Điểm số XP của học sinh trước đó đã nhận từ bài thi này tuyệt đối không bị sụt giảm.

---

## **4. Đặc tả dữ liệu**

| Tên trường                                                       | Bắt buộc?     | Ràng buộc dữ liệu (Validation Rules)                                                                                               | Ghi chú / Trạng thái mặc định                                                                         |
| ------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Chọn Môn học**                                           | Có             | \- Phải chọn một trong các môn học có sẵn trong hệ thống (Toán, Vật lý, Hóa học...)                                     | Chỉ dùng khi cấu hình tự tạo đề thi bằng AI. Mặc định: Toán.                                   |
| **Chọn Chủ đề cụ thể**                                  | Có             | \- Danh sách chủ đề tải động tương ứng với môn học đã chọn                                                             | Chỉ dùng khi cấu hình tự tạo đề thi bằng AI. Mặc định: Trống.                                  |
| **Chọn mức độ khó**                                      | Có             | \- Phải chọn một trong ba mức độ: Dễ, Trung bình, Khó                                                                         | Chỉ dùng khi cấu hình tự tạo đề thi bằng AI. Mặc định: Trung bình.                             |
| **Số lượng câu hỏi**                                     | Có             | \- Phải chọn một trong các mốc câu hỏi: 5 câu, 10 câu, 15 câu                                                                | Chỉ dùng khi cấu hình tự tạo đề thi bằng AI. Mặc định: 10 câu.                                 |
| **Lựa chọn đáp án trắc nghiệm**                        | Có             | \- Tích chọn một đáp án (đối với câu hỏi chọn một) hoặc tích chọn nhiều đáp án (đối với câu hỏi chọn nhiều) | Học sinh chọn khi đang làm bài thi. Mặc định: Trống.                                               |
| **Nội dung câu trả lời điền khuyết / tự luận ngắn** | Không          | \- Định dạng văn bản Unicode- Độ dài tối đa 200 ký tự                                                                      | Học sinh nhập trực tiếp khi làm dạng câu hỏi điền từ hoặc tự luận ngắn. Mặc định: Trống. |
| **Điểm số kết quả**                                      | Chỉ hiển thị | \- Số thực từ 0.0 đến 10.0 (lấy 1 chữ số thập phân)                                                                          | Điểm số tổng kết sau khi nộp bài thi.                                                                |
| **Số điểm XP nhận được**                               | Chỉ hiển thị | \- Số nguyên lớn hơn hoặc bằng 0                                                                                                 | Điểm thưởng kinh nghiệm tích lũy nhận được sau mỗi bài thi.                                    |
