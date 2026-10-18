Là Giáo viên (Teacher), tôi muốn có một Bảng phân tích Học tập (Analytics Dashboard) trực quan hiển thị thống kê điểm số, thời gian tự học, các lỗ hổng kiến thức và danh sách học sinh có nguy cơ mất gốc của lớp tôi quản lý để tôi điều chỉnh cách dạy và can thiệp hỗ trợ học sinh kịp thời.


# **User Story: Bảng phân tích Học tập (Analytics Dashboard)**

## **1. Tổng quan & Bối cảnh (Overview & Context)**

### **Vấn đề (Problem):**

Ban giám hiệu nhà trường và các giáo viên quản lý lớp học hiện nay gặp rất nhiều khó khăn trong việc đánh giá chính xác năng lực tự học của từng học sinh và của toàn lớp học. Các phương pháp kiểm tra truyền thống (bài thi định kỳ) chỉ phản ánh điểm số tại một thời điểm nhất định mà không chỉ ra được toàn bộ quá trình nỗ lực, thói quen tự học hàng ngày cũng như những **Lỗ hổng kiến thức cụ thể (Knowledge Gaps)** mà học sinh đang gặp phải. Do đó, giáo viên không thể đưa ra các biện pháp can thiệp, điều chỉnh cách giảng dạy kịp thời trước khi quá muộn.

### **Pain Points hiện tại:**

- **Dữ liệu phân mảnh không có tính kết nối:** Thông tin điểm số bài thi, lịch sử hỏi bài AI Tutor, thời gian tự học của học sinh nằm rải rác ở nhiều nơi, không được tổng hợp lại thành một bức tranh năng lực toàn diện.
- **Không phát hiện được học sinh có nguy cơ mất gốc:** Giáo viên chỉ nhận biết được học sinh yếu kém sau khi đã có điểm thi học kỳ thấp, khi đó việc kèm cặp bù đắp kiến thức đã trở nên vô cùng khó khăn và muộn màng.
- **Báo cáo cho phụ huynh thiếu thuyết phục:** Giáo viên trao đổi với phụ huynh về học lực của học sinh chỉ dựa trên điểm số khô khan mà không có dữ liệu chứng minh cụ thể thói quen học tập của con em họ ở nhà.
- **Biểu đồ hiển thị đơn điệu, khó đọc:** Các hệ thống quản lý học tập (LMS) cũ chỉ xuất ra các bảng Excel dài hàng ngàn dòng, khiến giáo viên cực kỳ ngại đọc và khó rút ra các nhận định nghiệp vụ giá trị.

### **Giá trị Nghiệp vụ (Business Value):**

- **Phát hiện sớm nguy cơ học tập (Early Intervention):** AI tự động phân tích và cảnh báo giáo viên về những học sinh có dấu hiệu giảm sút thói quen tự học hoặc có quá nhiều lỗ hổng kiến thức nghiêm trọng trước khi kỳ thi diễn ra 4 tuần.
- **Cá nhân hóa phương pháp giảng dạy:** Giúp giáo viên biết chính xác cả lớp đang bị hổng ở mảng kiến thức nào nhất để tập trung ôn tập lại mảng đó trên lớp chính khóa.
- **Minh bạch hóa thông tin giáo dục:** Cung cấp các báo cáo trực quan, đầy thuyết phục để giáo viên gửi cho phụ huynh học sinh, giúp gia đình phối hợp đôn đốc con em tự học tại nhà.
- **Nâng cao hiệu suất quản lý giáo dục:** Ban giám hiệu dễ dàng so sánh hiệu quả học tập và tự học giữa các lớp, các môn học trong trường để có các điều chỉnh chiến lược giáo dục hợp lý.

### **Đối tượng (Actor):**

- **Primary Actor:** Giáo viên chủ nhiệm / Giáo viên bộ môn (Teacher).
- **Secondary Actors:**
  - **Ban giám hiệu nhà trường (SchoolAdmin):** Xem báo cáo tổng quan ở quy mô toàn trường, so sánh giữa các lớp.
  - **Hệ thống AI Analytics Engine (System Service):** Tự động tổng hợp lịch sử bài kiểm tra, lịch sử chat của học sinh để bóc tách các lỗ hổng kiến thức bằng AI.

### **User Story Statement**

Là Giáo viên (Teacher), tôi muốn có một Bảng phân tích Học tập (Analytics Dashboard) trực quan hiển thị thống kê điểm số, thời gian tự học, các lỗ hổng kiến thức và danh sách học sinh có nguy cơ mất gốc của lớp tôi quản lý để tôi điều chỉnh cách dạy và can thiệp hỗ trợ học sinh kịp thời.

---

## **2. Luồng Người dùng (User Flow)**

### **2.1. Luồng chính: Giáo viên xem Báo cáo phân tích chất lượng học tập lớp học**

1. Giáo viên đăng nhập vào hệ thống Admin Dashboard.
2. Điều hướng tới mục **"Analytics Dashboard"** (Bảng phân tích) trên Menu Sidebar.
3. Hệ thống hiển thị giao diện báo cáo tổng quát của lớp mà giáo viên đó được phân công quản lý (Mặc định chọn lớp chủ nhiệm hiện tại).
4. Phía trên cùng hiển thị thanh Bộ lọc (Filter Bar) cho phép tùy biến:
   - Chọn lớp học (Dropdown các lớp giáo viên dạy).
   - Chọn môn học (Toán, Vật lý, Hóa học...).
   - Chọn thời gian báo cáo (7 ngày qua, 30 ngày qua, Học kỳ 1...).
5. Dashboard hiển thị các khu vực phân tích dữ liệu trực quan:
   - **Khu vực 1: Các chỉ số KPI cốt lõi:**
     - Tỷ lệ chuyên cần tự học trung bình (Số giờ tự học/tuần của cả lớp).
     - Điểm số bài thi trắc nghiệm trung bình của lớp.
     - Số lượng học sinh đang bị cảnh báo nguy cơ học lực yếu.
   - **Khu vực 2: Biểu đồ xu hướng:**
     - Biểu đồ đường (Line Chart) thể hiện sự thay đổi điểm số trung bình của lớp qua các tuần.
     - Biểu đồ cột (Bar Chart) so sánh thời gian tự học trung bình giữa các ngày trong tuần.
   - **Khu vực 3: Phân tích Lỗ hổng Kiến thức của Lớp (AI Class Knowledge Gaps):**
     - Hiển thị danh sách các chủ đề kiến thức mà học sinh trong lớp làm sai nhiều nhất hoặc hỏi AI Tutor nhiều nhất (Ví dụ: "70% học sinh trong lớp đang bị hổng kiến thức phần Tiệm cận đồ thị hàm số").
     - Đề xuất của AI Tutor dành cho Giáo viên: "Gợi ý giáo viên ôn tập lại lý thuyết tiệm cận đứng và làm 5 bài tập thực hành trên lớp."

### **2.2. Luồng: Xem danh sách học sinh có nguy cơ mất gốc (At-Risk Students List)**

1. Tại khu vực KPI "Học sinh bị cảnh báo nguy cơ", giáo viên click vào nút **"Xem danh sách"** (View At-risk Students).
2. Hệ thống chuyển hướng sang trang danh sách chi tiết các học sinh đang gặp khó khăn trong học tập.
3. Danh sách hiển thị dưới dạng bảng kèm theo mức độ cảnh báo (Nguy cơ cao - Màu Đỏ, Nguy cơ trung bình - Màu Cam) và các tiêu chí đánh giá tự động của AI:
   - Tên học sinh.
   - Điểm trung bình trắc nghiệm (Dưới 5.0).
   - Chỉ số sụt giảm hoạt động (Ví dụ: "Không mở app tự học liên tục 7 ngày qua").
   - Số lượng lỗ hổng kiến thức nghiêm trọng (Ví dụ: "Hổng 5/6 chủ đề Toán chương 1").
4. Giáo viên click vào nút hành động **"Gửi cảnh báo"** bên dòng của học sinh Nguyễn Văn A.
5. Hệ thống hiển thị modal soạn tin nhắn gửi cho Phụ huynh học sinh:
   - Form tin nhắn đã được AI soạn thảo tự động (Auto-draft) chứa các dữ liệu thực tế đầy thuyết phục (Ví dụ: "Kính gửi phụ huynh em Nguyễn Văn A, hệ thống ghi nhận em A đang bị hổng kiến thức phần hàm số và chưa tham gia tự học 5 ngày qua. Kính mong phụ huynh đôn đốc em ôn tập...").
6. Giáo viên kiểm tra tin nhắn và bấm nút "Gửi thông báo".
7. Hệ thống gửi tin nhắn SMS/Zalo hoặc thông báo đẩy (Push Notification) trực tiếp tới app của Phụ huynh học sinh thành công.

### **2.3. Luồng: Xuất báo cáo học tập của Lớp (Export PDF/Excel Reports)**

1. Tại trang chính Analytics Dashboard, giáo viên click vào nút **"Xuất báo cáo"** (Export Report) ở góc trên bên phải giao diện.
2. Hệ thống hiển thị một menu thả xuống gồm các tùy chọn định dạng: "Xuất báo cáo PDF trực quan" hoặc "Xuất dữ liệu thô Excel".
3. Giáo viên chọn **"Xuất báo cáo PDF trực quan"**.
4. Hệ thống hiển thị màn hình chờ tạo báo cáo.
5. Backend tổng hợp toàn bộ các biểu đồ xu hướng, số liệu KPI, biểu đồ lỗ hổng kiến thức lớp học và danh sách học sinh nguy cơ thành một tài liệu PDF được thiết kế căn lề chuẩn hóa của hệ thống.
6. Hệ thống tự động tải file PDF báo cáo học tập của lớp xuống máy tính của giáo viên trong vòng dưới 3 giây.

### **2.4. Luồng: Cấu hình ngưỡng cảnh báo nguy cơ học tập (Update Warning Thresholds Flow)**

1. Tại trang chính Analytics Dashboard, Giáo viên/Admin click vào nút **"Cài đặt cảnh báo"** (Alert Settings) ở thanh công cụ phía trên.
2. Hệ thống hiển thị modal "Cài đặt cấu hình cảnh báo nguy cơ học tập":
   - **Ngưỡng điểm trung bình yếu:** Ô nhập số thập phân (cho phép nhập từ 0.0 đến 10.0, mặc định: 5.0). Học sinh có điểm kiểm tra trung bình dưới ngưỡng này sẽ bị gắn cờ cảnh báo.
   - **Số ngày không hoạt động tối đa:** Ô nhập số nguyên (cho phép nhập từ 1 đến 30 ngày, mặc định: 7 ngày). Học sinh không mở ứng dụng tự học vượt quá số ngày này sẽ bị gắn cờ cảnh báo.
   - **Số lượng lỗ hổng kiến thức tối đa:** Ô nhập số nguyên (mặc định: 3). Học sinh có số chủ đề kiến thức bị hổng nhiều hơn số này sẽ bị cảnh báo.
   - **Mẫu tin nhắn cảnh báo gửi phụ huynh:** Vùng nhập văn bản lớn (Text area), cho phép cấu hình mẫu văn bản gửi tự động có chứa các từ khóa động (placeholders) như `{StudentName}`, `{InactivityDays}`, `{GapDetails}`.
3. Giáo viên chỉnh sửa các tham số theo nhu cầu của lớp học và click nút **"Lưu cấu hình"**.
4. Backend thực hiện validate dữ liệu đầu vào.
5. Nếu hợp lệ:
   - Ghi nhận cấu hình mới vào cơ sở dữ liệu (lưu riêng biệt theo từng lớp hoặc lưu chung toàn trường tùy theo vai trò của Admin/Teacher).
   - Hệ thống tự động chạy ngầm tiến trình quét và đánh giá lại (re-evaluate) trạng thái cảnh báo của toàn bộ học sinh trong lớp dựa trên các ngưỡng mới.
   - Đóng modal, hiển thị thông báo: "Cấu hình cảnh báo học tập thành công!" và tự động làm mới (refresh) danh sách học sinh nguy cơ trên màn hình.

### **2.5. Quy tắc bất biến đối với dữ liệu báo cáo thống kê lịch sử (Immutability Constraint)**

1. Toàn bộ các bản ghi dữ liệu lịch sử hoạt động thô của học sinh (như nhật ký làm bài trắc nghiệm `QuizAttempt`, nhật ký gửi tin nhắn `ChatMessage`, nhật ký lịch sử gửi thông báo cảnh báo cho phụ huynh, và các báo cáo tuần/tháng/học kỳ đã xuất ra) đều là dữ liệu **bất biến (Immutable)**.
2. Hệ thống nghiêm cấm mọi hành vi chỉnh sửa (Update) hoặc xóa bỏ (Delete) các dữ liệu lịch sử này từ phía Giáo viên, Admin hay bất kỳ tác nhân nào để đảm bảo tính minh bạch, phục vụ công tác thanh tra giáo dục và đối chiếu chất lượng dạy học của nhà trường.

---

## **3. Tiêu chí Chấp nhận (Acceptance Criteria)**

### **AC-01: Tính toán các chỉ số KPI lớp học chính xác 100%**

- **Given:** Lớp học 12A1 có 40 học sinh làm tổng cộng 80 bài kiểm tra trắc nghiệm trong tuần qua, tổng điểm của toàn bộ 80 bài thi là 640 điểm.
- **When:** Giáo viên truy cập Analytics Dashboard xem báo cáo tuần qua.
- **Then:** Chỉ số KPI "Điểm trắc nghiệm trung bình của lớp" phải hiển thị chính xác con số là `8.0` (Không được làm tròn sai lệch kiểu số).

### **AC-02: Phân tích lỗ hổng kiến thức bằng AI (Knowledge Gaps) hoạt động logic**

- **Given:** Có 30 trên tổng số 40 học sinh trong lớp liên tục trả lời sai các câu hỏi liên quan đến công thức "Thể tích hình nón" trong các bài thi thử.
- **When:** Hệ thống chạy tiến trình phân tích AI hàng tuần.
- **Then:**
  - Tại bảng phân tích Lỗ hổng kiến thức của lớp phải hiển thị chủ đề "Thể tích hình nón" ở vị trí đầu danh sách lỗ hổng.
  - Tỷ lệ học sinh bị hổng phải hiển thị chính xác là `75%` kèm theo lời khuyên sư phạm thiết thực của AI dành cho giáo viên.

### **AC-03: Cảnh báo học sinh có nguy cơ mất gốc (At-Risk) hoạt động đúng tiêu chí**

- **Given:** Học sinh Nguyễn Văn A có điểm thi trung bình trắc nghiệm là 4.5 và hoàn toàn không mở ứng dụng tự học trong 8 ngày liên tiếp.
- **When:** Hệ thống quét dữ liệu phân tích hàng ngày.
- **Then:** Học sinh Nguyễn Văn A phải được tự động đưa vào danh sách "Học sinh bị cảnh báo nguy cơ cao (Màu Đỏ)" trên Dashboard của giáo viên.

### **AC-04: Soạn tin nhắn tự động gửi phụ huynh chính xác và chuyên nghiệp**

- **Given:** Giáo viên click vào nút "Gửi cảnh báo" cho phụ huynh học sinh Nguyễn Văn A.
- **When:** Giao diện hiển thị modal soạn tin nhắn.
- **Then:**
  - Nội dung tin nhắn phải được điền tự động hoàn chỉnh, chứa đúng Họ tên học sinh, số ngày nghỉ học tự học thực tế và các môn học bị hổng kiến thức cụ thể.
  - Văn phong tin nhắn phải trang trọng, lịch sự, đúng chuẩn sư phạm giáo dục.

### **AC-05: Xuất báo cáo PDF giữ nguyên cấu trúc thiết kế đẹp mắt**

- **Given:** Giáo viên thực hiện xuất báo cáo PDF.
- **When:** File PDF được tải xuống và mở lên.
- **Then:**
  - File PDF phải hiển thị đầy đủ tiêu đề trường học, logo AI Tutor, họ tên giáo viên báo cáo.
  - Toàn bộ các biểu đồ đường, biểu đồ cột phải được render sắc nét thành dạng ảnh vector nhúng trong PDF, không bị vỡ chữ, không bị tràn lề hay lỗi phông chữ tiếng Việt.

### **AC-06: Thay đổi cấu hình ngưỡng cảnh báo nguy cơ thành công**

- **Given:** Ngưỡng cảnh báo học tập mặc định của lớp là điểm trung bình dưới 5.0 và không hoạt động trên 7 ngày.
- **When:** Giáo viên thay đổi cấu hình thành điểm trung bình dưới 6.0 và không hoạt động trên 5 ngày, sau đó nhấn Lưu cấu hình.
- **Then:**
  - Hệ thống lưu cấu hình mới thành công và chạy quét lại dữ liệu lớp học tức thì.
  - Danh sách học sinh bị cảnh báo nguy cơ học tập phải được cập nhật ngay lập tức: các học sinh có điểm trung bình 5.5 hoặc không hoạt động 6 ngày trước đây bình thường thì nay phải hiển thị gắn cờ cảnh báo (Màu Cam hoặc Đỏ).

### **AC-07: Đảm bảo tính bất biến của báo cáo lịch sử**

- **Given:** Hệ thống đã ghi nhận lịch sử gửi 10 tin nhắn cảnh báo cho phụ huynh trong học kỳ trước.
- **When:** Giáo viên hoặc Admin gửi request API nhằm chỉnh sửa nội dung hoặc xóa các bản ghi lịch sử này.
- **Then:** Hệ thống phải trả về lỗi (403 Forbidden), chặn hoàn toàn thao tác chỉnh sửa/xóa và ghi nhận log vi phạm quyền hạn.

---

## **4. Đặc tả dữ liệu**

| Tên trường                                   | Bắt buộc?           | Ràng buộc dữ liệu (Validation Rules)                                                                    | Ghi chú / Trạng thái mặc định                                                                                                                            |
| ----------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lọc lớp học**                        | Có                   | \- Phải chọn một trong các lớp học giáo viên được phân quyền quản lý trong cơ sở dữ liệu | Dropdown lựa chọn. Mặc định: Chọn lớp chủ nhiệm đầu tiên.                                                                                          |
| **Lọc môn học**                        | Có                   | \- Phải chọn một trong các môn học có trong hệ thống                                               | Dropdown lựa chọn. Mặc định: Tất cả môn học.                                                                                                          |
| **Khoảng thời gian báo cáo**          | Có                   | \- Chọn một trong các mốc: 7 ngày qua, 30 ngày qua, Học kỳ 1, Tùy chọn (Date Range Picker)        | Mặc định: 7 ngày qua.                                                                                                                                      |
| **Tin nhắn thông báo gửi phụ huynh** | Có                   | \- Định dạng văn bản Unicode- Độ dài tối thiểu 50 ký tự, tối đa 1000 ký tự                  | Cho phép giáo viên chỉnh sửa lại tin nhắn mẫu đã được AI soạn sẵn. Mặc định: Bản nháp chứa thông tin kết quả thực tế của học sinh. |
| **Tệp xuất báo cáo PDF**              | Chỉ hiển thị/xuất | \- Định dạng tệp: PDF chứa nội dung biểu đồ và văn bản sắc nét                                | Xuất ra khi click "Xuất báo cáo PDF trực quan".                                                                                                           |
| **Tệp xuất báo cáo Excel**            | Chỉ hiển thị/xuất | \- Định dạng tệp: Excel (.xlsx) chứa bảng dữ liệu thô điểm số                                   | Xuất ra khi click "Xuất dữ liệu thô Excel".                                                                                                               |
