Là Học sinh (Student), tôi muốn quản lý lịch học của mình một cách dễ dàng thông qua việc chụp ảnh thời khóa biểu để AI quét (OCR) tự động tạo lịch học, hoặc tự nhập tay nhanh chóng để nhận được các thông báo nhắc nhở chuẩn bị bài thông minh.


# **User Story: Quản lý Lịch học (Schedule Management)**

## **1. Tổng quan & Bối cảnh (Overview & Context)**

### **Vấn đề (Problem):**

Học sinh phổ thông Việt Nam thường phải đối mặt với lịch học dày đặc và phức tạp, bao gồm lịch học chính khóa trên lớp, lịch học thêm tại các trung tâm, lịch tự học ở nhà và chuẩn bị kiểm tra. Việc quản lý và ghi nhớ thủ công toàn bộ các khung giờ học này rất dễ dẫn đến tình trạng quên lịch, đi học muộn, hoặc chuẩn bị bài không kỹ trước khi lên lớp.

### **Pain Points hiện tại:**

- **Thời khóa biểu giấy dễ thất lạc:** Học sinh thường chụp ảnh thời khóa biểu giấy được dán trên lớp hoặc ghi chép vào sổ tay. Các bức ảnh này dễ bị trôi mất trong thư viện ảnh điện thoại và khó tìm lại khi cần.
- **Nhập lịch thủ công tốn thời gian:** Việc tự gõ từng môn học, từng thứ, từng tiết học vào các ứng dụng lịch thông thường (Google Calendar) cực kỳ tốn thời gian và dễ gây nản lòng cho học sinh.
- **Thiếu sự liên kết học tập:** Lịch học hiện tại chỉ đơn thuần là thông báo giờ giấc, không có bất kỳ sự liên kết nào với tài liệu cần chuẩn bị hay gợi ý ôn bài của AI Tutor.
- **Không tự động nhắc nhở thông minh:** Các app nhắc nhở thông thường chỉ kêu chuông mà không nhắc nhở chi tiết nội dung cần chuẩn bị trước tiết học (Ví dụ: "Tiết Toán tiếp theo học bài thể tích, bạn đã làm bài tập về nhà chưa?").

### **Giá trị Nghiệp vụ (Business Value):**

- **Số hóa thời khóa biểu siêu tốc:** Học sinh chỉ cần chụp một bức ảnh thời khóa biểu giấy, AI sẽ tự động đọc hiểu và lên lịch toàn bộ tuần học chỉ trong 3 giây.
- **Chủ động trong học tập:** Giúp học sinh luôn chuẩn bị đầy đủ bài tập và tâm lý vững vàng trước khi bước vào mỗi tiết học nhờ hệ thống nhắc nhở thông minh.
- **Tăng tính gắn kết ứng dụng:** Lịch học hoạt động như một trung tâm điều phối, tự động kích hoạt các gợi ý ôn bài từ AI Tutor dựa trên các tiết học sắp diễn ra.
- **Giảm thiểu sai sót:** Tránh hoàn toàn việc học sinh quên lịch học thêm hoặc nhầm phòng học.

### **Đối tượng (Actor):**

- **Primary Actor:** Học sinh (Student).
- **Secondary Actors:**
  - **Hệ thống OCR Engine (System Service):** Chịu trách nhiệm nhận diện chữ viết và phân tích cấu trúc bảng biểu thời khóa biểu từ ảnh chụp.

### **User Story Statement**

Là Học sinh (Student), tôi muốn quản lý lịch học của mình một cách dễ dàng thông qua việc chụp ảnh thời khóa biểu để AI quét (OCR) tự động tạo lịch học, hoặc tự nhập tay nhanh chóng để nhận được các thông báo nhắc nhở chuẩn bị bài thông minh.

---

## **2. Luồng Người dùng (User Flow)**

### **2.1. Luồng chính: Thêm lịch học tự động bằng ảnh chụp (OCR Schedule Ingestion)**

1. Học sinh mở Mobile App và chọn tab "Schedule" (Lịch học) trên thanh điều hướng dưới cùng.
2. Hệ thống hiển thị giao diện lịch học hiện tại (mặc định hiển thị ngày hôm nay kèm theo timeline các tiết học dọc).
3. Học sinh click vào nút "Thêm lịch học" (+ Thêm lịch).
4. Hệ thống hiển thị modal tùy chọn: "Chụp ảnh thời khóa biểu" hoặc "Nhập lịch thủ công".
5. Học sinh chọn **"Chụp ảnh thời khóa biểu"**.
6. Hệ thống yêu cầu cấp quyền truy cập Camera/Thư viện ảnh (nếu chưa cấp) và mở camera điện thoại hoặc thư viện để chọn ảnh thời khóa biểu.
7. Học sinh chụp ảnh một tờ thời khóa biểu giấy hoặc chọn ảnh chụp màn hình thời khóa biểu có sẵn.
8. Hệ thống hiển thị màn hình chờ: "AI đang quét ảnh và thiết lập lịch học cho bạn..."
9. Backend gửi ảnh tới dịch vụ OCR:
   - Nhận diện toàn bộ chữ viết trong ảnh.
   - Sử dụng AI phân tích cấu trúc bảng biểu (hàng là Thứ/Ngày, cột là Tiết/Giờ hoặc ngược lại).
   - Trích xuất ra danh sách các tiết học gồm: Tên môn học, Thứ trong tuần, Khung giờ/Tiết học, Tên giáo viên (nếu có), Phòng học (nếu có).
10. Hệ thống đóng màn hình chờ và hiển thị trang **Xác nhận Thời khóa biểu** với một form dạng bảng chứa các thông tin đã được điền tự động.
11. Học sinh kiểm tra thông tin:
    - Có thể click vào bất kỳ ô nào để chỉnh sửa nếu AI nhận diện sai.
    - Có thể thêm bớt các môn học thủ công.
12. Học sinh nhấn nút "Xác nhận & Lưu lịch học".
13. Hệ thống:
    - Lưu lịch học chính thức vào Database.
    - Lên lịch tự động gửi các thông báo đẩy nhắc nhở (Push Notification schedule) trước mỗi tiết học 15 phút.
    - Quay lại giao diện lịch học và hiển thị thông báo: "Đã cập nhật thời khóa biểu của bạn thành công!".

### **2.2. Luồng: Thêm lịch học/lịch học thêm thủ công (Manual Input)**

1. Từ modal tùy chọn thêm lịch, học sinh chọn **"Nhập lịch thủ công"**.
2. Hệ thống hiển thị form nhập thông tin lịch học mới gồm các trường dữ liệu:
   - **Tên môn học/Hoạt động (bắt buộc):** Nhập văn bản hoặc chọn từ danh sách môn gợi ý.
   - **Loại lịch:** Radio button chọn (Học chính khóa / Học thêm / Tự học).
   - **Thứ trong tuần (bắt buộc):** Checkbox chọn các thứ (Thứ 2 đến Chủ nhật) nếu lịch lặp lại hàng tuần.
   - **Thời gian (bắt buộc):** Chọn Giờ bắt đầu và Giờ kết thúc.
   - **Tên giáo viên (optional).**
   - **Phòng học / Địa điểm (optional).**
3. Học sinh điền thông tin và click nút "Lưu".
4. Hệ thống validate:
   - Không được để trống Tên môn học, Thứ và Thời gian.
   - Giờ kết thúc phải sau Giờ bắt đầu.
   - Lịch học mới không được trùng khít khung giờ với lịch học chính khóa đã có (Hiển thị cảnh báo trùng lịch nếu có).
5. Nếu hợp lệ:
   - Lưu thông tin lịch học mới.
   - Đóng form, hiển thị thông báo "Thêm lịch học thành công" và refresh màn hình lịch học.
6. Nếu không hợp lệ:
   - Hiển thị thông báo lỗi chi tiết dưới trường dữ liệu sai và giữ nguyên dữ liệu trong form để người dùng sửa.

### **2.3. Luồng: Nhắc nhở lịch học thông minh (Proactive Push Notifications)**

1. Lịch học của học sinh có tiết "Vật lý lớp 12" diễn ra lúc 08:00 AM thứ Hai hàng tuần.
2. Đúng 07:45 AM thứ Hai (trước 15 phút), hệ thống kích hoạt Background Notification Worker.
3. Hệ thống gửi một Push Notification cá nhân hóa đến điện thoại của học sinh.
4. Nội dung thông báo hiển thị thông minh: "Chào Nam, bạn có tiết Vật lý tại phòng 204 lúc 8:00 đó. Hôm nay học bài Lực hướng tâm, bạn đã xem bài giảng tóm tắt chưa? Nhấn vào đây để xem nhanh nhé!".
5. Học sinh click vào thông báo.
6. Điện thoại tự động mở app AI Tutor, điều hướng thẳng tới bài giảng tóm tắt môn Vật lý liên quan trong Vector Database để học sinh ôn bài nhanh trước khi vào lớp.

### **2.4. Luồng: Chỉnh sửa lịch học đã lưu (Update Flow)**

1. Tại tab "Schedule", học sinh click vào một tiết học/hoạt động học tập bất kỳ trên timeline hoặc danh sách thời khóa biểu tuần.
2. Hệ thống hiển thị popup/bottom-sheet chi tiết lịch học đó, kèm theo nút **"Chỉnh sửa"** (Edit) và nút **"Xóa"** (Delete).
3. Học sinh click nút **"Chỉnh sửa"**.
4. Hệ thống hiển thị form chỉnh sửa với các trường dữ liệu chứa sẵn thông tin hiện tại của lịch học.
5. Học sinh thực hiện thay đổi các thông tin (ví dụ: đổi phòng học, cập nhật tên giáo viên, thay đổi ghi chú bài tập cần chuẩn bị hoặc điều chỉnh thời gian học).
6. Học sinh click "Lưu thay đổi".
7. Hệ thống validate:
   - Các trường bắt buộc không được để trống.
   - Thời gian bắt đầu và kết thúc hợp lệ.
   - Kiểm tra xem khung giờ mới có bị trùng với các lịch học chính khóa khác hay không.
8. Nếu thông tin hợp lệ:
   - Hệ thống cập nhật các thay đổi vào cơ sở dữ liệu.
   - Cập nhật lại lịch nhắc nhở tự động (Push Notification scheduler) dựa trên khung giờ mới.
   - Quay lại màn hình lịch học, hiển thị thông báo: "Đã cập nhật lịch học thành công!".

### **2.5. Luồng: Xóa lịch học khỏi thời khóa biểu (Delete Flow)**

1. Từ popup/bottom-sheet chi tiết của lịch học, học sinh click nút **"Xóa"**.
2. Hệ thống hiển thị modal xác nhận: "Bạn có chắc chắn muốn xóa lịch học này khỏi thời khóa biểu của mình? Hành động này cũng sẽ hủy bỏ tất cả thông báo nhắc nhở tương ứng."
3. Học sinh chọn **"Xác nhận xóa"**.
4. Hệ thống thực hiện:
   - Gửi yêu cầu xóa lên server. Backend thực hiện xóa vĩnh viễn (hard delete) bản ghi lịch học (`Schedule` hoặc `CalendarEvent`) trong cơ sở dữ liệu.
   - Hủy bỏ các task nhắc nhở tương ứng trên Notification Service.
   - Đóng popup, cập nhật lại màn hình lịch học (ẩn lịch học đã xóa) và hiển thị thông báo: "Đã xóa lịch học thành công!".

---

## **3. Tiêu chí Chấp nhận (Acceptance Criteria)**

### **AC-01: OCR nhận diện chữ viết và cấu trúc thời khóa biểu chính xác**

- **Given:** Học sinh tải lên một ảnh thời khóa biểu giấy rõ nét, không bị nhòe.
- **When:** Hệ thống chạy tiến trình OCR bóc tách bảng biểu.
- **Then:**
  - Tỷ lệ nhận diện đúng tên các môn học phổ thông (Toán, Văn, Anh...) phải đạt trên 85%.
  - Phải phân tích đúng cấu trúc hàng/cột để gán chính xác môn học vào đúng thứ trong tuần và khung giờ quy định.

### **AC-02: Cho phép chỉnh sửa thông tin bóc tách trước khi lưu**

- **Given:** Hệ thống bóc tách xong ảnh và hiển thị trang xác nhận.
- **When:** Học sinh phát hiện môn "Hóa học" bị nhận diện nhầm thành "Hoa học" và click sửa lại.
- **Then:** Hệ thống phải cho phép sửa đổi văn bản trực tiếp trên các ô dữ liệu và lưu lại thông tin đã sửa chính xác 100%.

### **AC-03: Ràng buộc logic thời gian khi nhập thủ công**

- **Given:** Học sinh đang ở form nhập lịch thủ công.
- **When:** Học sinh chọn giờ bắt đầu là `14:00` nhưng chọn giờ kết thúc là `13:30`, sau đó click Lưu.
- **Then:** Hệ thống phải chặn submit, hiển thị thông báo lỗi màu đỏ ngay dưới trường thời gian: "Thời gian kết thúc phải lớn hơn thời gian bắt đầu."

### **AC-04: Cảnh báo trùng lịch học thông minh**

- **Given:** Học sinh đã có lịch học Toán chính khóa từ `08:00` đến `09:30` thứ Ba.
- **When:** Học sinh thêm lịch học thêm thủ công cũng vào khung giờ `08:30` đến `10:00` thứ Ba.
- **Then:** Hệ thống phải hiển thị cảnh báo xác nhận: "Lịch học thêm này đang bị trùng khung giờ với tiết Toán học chính khóa của bạn. Bạn vẫn muốn tiếp tục lưu chứ?" để học sinh quyết định (cho phép lưu đè hoặc hủy).

### **AC-05: Gửi Push Notification chính xác theo khung giờ cấu hình**

- **Given:** Hệ thống có lịch nhắc nhở trước 15 phút cho tiết học.
- **When:**
  - Đến đúng thời gian thực tế.
  - Điện thoại của học sinh phải nhận được Push Notification tức thì với nội dung cá nhân hóa thông minh, liên kết đúng bài học gốc.

### **AC-06: Chỉnh sửa lịch học thành công**

- **Given:** Học sinh đang xem chi tiết tiết học "Vật lý" trên thời khóa biểu.
- **When:** Học sinh chỉnh sửa phòng học từ "Phòng 204" thành "Phòng 301" và click Lưu thay đổi.
- **Then:**
  - Hệ thống phải lưu chính xác phòng học mới vào cơ sở dữ liệu.
  - Màn hình lịch học và thông báo nhắc nhở tiếp theo của tiết học này phải hiển thị đúng địa điểm mới là "Phòng 301".

### **AC-07: Xóa lịch học thành công**

- **Given:** Học sinh có lịch học thêm "Tiếng Anh" đã đăng ký trên thời khóa biểu.
- **When:** Học sinh nhấn Xóa lịch học này và bấm xác nhận đồng ý.
- **Then:**
  - Lịch học thêm đó phải biến mất hoàn toàn khỏi thời khóa biểu.
  - Các thông báo nhắc nhở chuẩn bị bài của lịch học đó phải bị hủy bỏ hoàn toàn, không được gửi đến điện thoại của học sinh nữa.

---

## **4. Đặc tả dữ liệu**

| Tên trường                        | Bắt buộc? | Ràng buộc dữ liệu (Validation Rules)                                                                | Ghi chú / Trạng thái mặc định                                                       |
| ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Ảnh thời khóa biểu**     | Không      | \- Chỉ chấp nhận định dạng ảnh: `.jpg`, `.jpeg`, `.png`- Dung lượng file tối đa: 10 MB | Chỉ sử dụng khi thêm lịch tự động bằng ảnh chụp (OCR). Mặc định: Trống.    |
| **Tên lịch học/môn học**  | Có         | \- Định dạng văn bản Unicode- Độ dài từ 2 đến 100 ký tự                                    | Tên của môn học hoặc hoạt động học tập. Mặc định: Trống.                    |
| **Loại lịch học**           | Có         | \- Phải chọn một trong các giá trị: Học chính khóa, Học thêm, Tự học                       | Mặc định: Học chính khóa.                                                           |
| **Thứ trong tuần**           | Có         | \- Chọn ít nhất một thứ trong tuần (Thứ 2 đến Chủ nhật)                                      | Cho phép chọn nhiều thứ nếu hoạt động lặp lại hàng tuần. Mặc định: Trống. |
| **Thời gian bắt đầu**      | Có         | \- Định dạng giờ:phút (hh:mm)                                                                      | Khung giờ bắt đầu tiết học/hoạt động. Mặc định: Trống.                       |
| **Thời gian kết thúc**      | Có         | \- Định dạng giờ:phút (hh:mm)- Phải lớn hơn **Thời gian bắt đầu**                     | Khung giờ kết thúc tiết học/hoạt động. Mặc định: Trống.                       |
| **Phòng học / Địa điểm** | Không      | \- Định dạng văn bản Unicode- Độ dài tối đa 100 ký tự                                       | Phòng học hoặc nơi diễn ra buổi học thêm/tự học. Mặc định: Trống.           |
| **Tên giáo viên**           | Không      | \- Định dạng văn bản Unicode- Độ dài tối đa 100 ký tự                                       | Tên giáo viên phụ trách môn học. Mặc định: Trống.                              |
| **Ghi chú lịch học**        | Không      | \- Định dạng văn bản Unicode- Độ dài tối đa 500 ký tự                                       | Ghi chú thêm về chuẩn bị bài hoặc dặn dò. Mặc định: Trống.                   |
