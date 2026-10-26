Là Quản trị viên hoặc Giáo viên (Admin/Teacher), tôi muốn có một trang quản lý học sinh tập trung (tạo mới, xem chi tiết, cập nhật thông tin, tìm kiếm, lọc, và import Excel) để quản trị hồ sơ học sinh chính xác và hỗ trợ vận hành hệ thống mượt mà.


# **User Story: Quản lý Học sinh (Student Management)**

## **1. Tổng quan & Bối cảnh (Overview & Context)**

### **Vấn đề (Problem):**

Ban quản lý nền tảng AI Tutor và giáo viên cần một giao diện quản trị tập trung, thống nhất để quản lý thông tin toàn bộ học sinh đang sử dụng ứng dụng học tập. Việc này nhằm phục vụ mục đích kiểm soát hồ sơ học sinh, phân loại lớp/trường học, giám sát các hoạt động học tập, xử lý các sự cố về tài khoản và hỗ trợ can thiệp kịp thời đối với các học sinh gặp khó khăn trong học tập.

### **Pain Points hiện tại:**

- **Thiếu trang quản lý tập trung:** Dữ liệu học sinh nằm rải rác dưới cơ sở dữ liệu hoặc trong các file Excel thủ công của từng trường, giáo viên không thể tra cứu thông tin nhanh chóng.
- **Khó khăn khi tạo tài khoản hàng loạt:** Vào mỗi đầu năm học mới, việc gõ tay thêm từng học sinh một vào hệ thống là một cực hình đối với giáo viên hành chính.
- **Dữ liệu không đồng bộ:** Thay đổi thông tin học sinh ở một nơi nhưng các module khác (như Bảng xếp hạng, Báo cáo cho phụ huynh) vẫn hiển thị thông tin cũ.
- **Không kiểm soát được trạng thái tài khoản:** Khi học sinh chuyển trường hoặc vi phạm kỷ luật học tập cần khóa tài khoản, ban quản trị không có công cụ thao tác trực tiếp trên giao diện để vô hiệu hóa tài khoản ngay lập tức.

### **Giá trị Nghiệp vụ (Business Value):**

- **Quản lý thông tin tập trung hoàn hảo:** Cung cấp cho Admin và Giáo viên một công cụ CRUD mạnh mẽ, trực quan để kiểm soát hồ sơ của hàng ngàn học sinh cùng lúc.
- **Tiết kiệm thời gian vận hành:** Hỗ trợ tính năng Import Excel hàng loạt giúp số hóa danh sách học sinh toàn trường chỉ trong vài cú click chuột.
- **Đồng bộ hóa dữ liệu tuyệt đối:** Bất kỳ thay đổi nào về thông tin học sinh (Tên, Lớp, Môn học) sẽ được đồng bộ tức thì trên toàn bộ hệ thống (App Mobile, Dashboard, Email báo cáo).
- **Giám sát năng lực học tập trực quan:** Tích hợp việc xem nhanh các báo cáo điểm số và lỗ hổng kiến thức của từng học sinh ngay tại hồ sơ chi tiết.

### **Đối tượng (Actor):**

- **Primary Actor:** Quản trị viên hệ thống (Admin) / Giáo viên quản lý lớp (Teacher).
- **Secondary Actors:**
  - **MASTER (Super Admin):** Có quyền quản trị cao nhất, quản lý học sinh của tất cả các trường trên toàn quốc.

### **User Story Statement**

Là Quản trị viên hoặc Giáo viên (Admin/Teacher), tôi muốn có một trang quản lý học sinh tập trung (tạo mới, xem chi tiết, cập nhật thông tin, tìm kiếm, lọc, và import Excel) để quản trị hồ sơ học sinh chính xác và hỗ trợ vận hành hệ thống mượt mà.

---

## **2. Luồng Người dùng (User Flow)**

### **2.1. Luồng chính: Quản lý danh sách học sinh**

1. Admin/Teacher đăng nhập vào hệ thống Admin Dashboard.
2. Điều hướng đến mục **"Student Management"** (Quản lý Học sinh) trên thanh Menu Sidebar.
3. Hệ thống hiển thị giao diện danh sách dưới dạng bảng (Data Table) chứa các thông tin cột:
   - Avatar (nếu có)
   - Họ và tên học sinh
   - Mã học sinh (Student ID)
   - Email
   - Số điện thoại
   - Trường học / Khối lớp
   - Số điểm XP tích lũy hiện tại (Level)
   - Trạng thái tài khoản (Đang hoạt động / Đang khóa)
   - Cột hành động (Xem chi tiết, Chỉnh sửa, Khóa tài khoản).
4. Admin/Teacher có thể thực hiện:
   - Tìm kiếm nhanh bằng từ khóa (debounce 300ms).
   - Lọc danh sách theo: Trường học, Khối lớp, Trạng thái tài khoản.
   - Sắp xếp theo: Họ tên (A-Z, Z-A), Điểm XP (Cao-Thấp), Ngày tạo tài khoản.
   - Phân trang: Mặc định hiển thị 10 bản ghi/trang, tùy chọn 10/20/50/100 bản ghi.

### **2.2. Luồng: Tạo học sinh mới thủ công**

1. Từ trang danh sách quản lý, Admin click vào nút **"Thêm học sinh"** (+ Thêm học sinh).
2. Hệ thống hiển thị modal "Thêm học sinh mới" với form nhập liệu gồm các trường:
   - Họ và tên (bắt buộc)
   - Mã học sinh (bắt buộc, unique)
   - Email đăng ký (bắt buộc, đúng định dạng)
   - Số điện thoại (bắt buộc)
   - Trường học (bắt buộc, dropdown chọn)
   - Khối lớp (bắt buộc, dropdown chọn)
   - Ngày sinh (optional)
   - Giới tính (optional)
3. Admin điền đầy đủ thông tin và nhấn "Lưu".
4. Hệ thống thực hiện validate:
   - Các trường bắt buộc không được bỏ trống.
   - Email và Số điện thoại đúng định dạng quy chuẩn.
   - Mã học sinh không được trùng lặp với bất kỳ học sinh nào khác trên toàn hệ thống.
5. Nếu dữ liệu hợp lệ:
   - Tạo mới bản ghi Học sinh trong DB, tự động tạo tài khoản đăng nhập tương ứng trên Mobile App với mật khẩu mặc định được gửi về email của học sinh.
   - Đóng modal, hiển thị thông báo thành công: "Tạo tài khoản học sinh thành công! Mật khẩu đã được gửi qua email."
   - Refresh bảng danh sách học sinh để cập nhật bản ghi mới (không reload toàn trang).
6. Nếu dữ liệu không hợp lệ:
   - Hiển thị thông báo lỗi chi tiết màu đỏ ngay dưới từng trường dữ liệu nhập sai, giữ nguyên form nhập liệu để Admin chỉnh sửa tiếp.

### **2.3. Luồng: Nhập danh sách học sinh hàng loạt (Bulk Import từ Excel)**

1. Tại trang Quản lý Học sinh, Admin click vào nút **"Import Excel"**.
2. Hệ thống hiển thị modal "Tải lên danh sách học sinh":
   - Cung cấp liên kết (Link) tải về File mẫu Excel tiêu chuẩn (`student_template.xlsx`).
   - Khung kéo thả file Excel.
3. Admin tải file mẫu về, điền đầy đủ thông tin danh sách học sinh toàn trường vào file, sau đó kéo thả file Excel đã hoàn thiện vào khung tải lên.
4. Admin nhấn nút "Bắt đầu xử lý Import".
5. Hệ thống hiển thị thanh tiến trình xử lý dưới nền: "Hệ thống đang đọc dữ liệu Excel và tạo tài khoản...".
6. Backend thực hiện validate dữ liệu từng dòng trong file Excel.
7. Khi xử lý hoàn tất, hệ thống hiển thị modal **Báo cáo kết quả Import**:
   - Số lượng dòng tạo thành công (Ví dụ: 95/100 dòng).
   - Danh sách chi tiết các dòng bị lỗi kèm lý do (Ví dụ: "Dòng số 12: Email đã tồn tại", "Dòng số 45: Mã học sinh bị trùng").
8. Admin click nút "Đóng", hệ thống tự động tải lại danh sách bảng học sinh để cập nhật những tài khoản đã tạo thành công.

### **2.4. Luồng: Cập nhật thông tin học sinh**

1. Từ bảng danh sách học sinh, Admin tìm kiếm học sinh cần sửa và click chọn nút icon **"Chỉnh sửa"** (Edit) trên dòng tương ứng.
2. Hệ thống hiển thị modal "Chỉnh sửa thông tin học sinh" chứa đầy đủ dữ liệu hiện có trong form.
3. Admin chỉnh sửa các thông tin cần thiết (Lưu ý: Mã học sinh và Email đăng ký sẽ bị khóa - Readonly, không cho phép chỉnh sửa để đảm bảo tính nhất quán dữ liệu).
4. Admin click nút "Cập nhật".
5. Hệ thống thực hiện validate dữ liệu nhập mới tương tự luồng tạo.
6. Nếu hợp lệ:
   - Cập nhật thông tin bản ghi học sinh trong DB, ghi nhận thời gian chỉnh sửa (updatedAt).
   - Đóng modal, hiển thị thông báo: "Cập nhật thông tin học sinh thành công".
   - Refresh bảng danh sách để cập nhật dữ liệu mới.

### **2.5. Luồng: Xem chi tiết hồ sơ học sinh (Deep View)**

1. Tại bảng danh sách, Admin click vào Họ tên học sinh hoặc chọn nút hành động **"Xem chi tiết"** (View details).
2. Hệ thống chuyển hướng sang trang **Hồ sơ chi tiết học sinh** (/students/:id) hiển thị toàn diện các tab thông tin:
   - **Tab 1: Thông tin cá nhân:** Hiển thị Avatar, Họ tên, Mã học sinh, Email, SĐT, Ngày sinh, Trường học, Lớp, Ngày tham gia hệ thống, Trạng thái hoạt động.
   - **Tab 2: Tiến trình & Gamification:** Hiển thị Cấp độ (Level), Tổng XP, Số ngày Streak hiện tại, Danh sách các Huy hiệu đã đạt được, Bảng thống kê thời gian tự học trong tuần.
   - **Tab 3: Kết quả học tập (Analytics):**
     - Điểm số trung bình các bài kiểm tra.
     - Biểu đồ mạng nhện (Radar Chart) phân tích các kỹ năng môn học hiện tại.
     - Danh sách các **Lỗ hổng kiến thức (Knowledge Gaps)** do AI Tutor tổng hợp được từ lịch sử chat và các bài kiểm tra sai của học sinh.
3. Admin có các nút hành động: "Chỉnh sửa", "Khóa tài khoản" hoặc "Quay lại danh sách".

### **2.6. Luồng: Xóa tài khoản học sinh (Delete / Soft Delete Flow)**

1. Tại trang Quản lý Học sinh hoặc trang Hồ sơ chi tiết học sinh, Admin click vào nút **"Xóa tài khoản"** (Delete).
2. Hệ thống thực hiện quét kiểm tra các ràng buộc khóa ngoại (foreign key dependencies) của học sinh đó trong cơ sở dữ liệu (ví dụ: kiểm tra xem có tồn tại bản ghi trong các bảng `QuizAttempt`, `ChatSession`, `Schedule`, `Document` hay không).
3. **Trường hợp học sinh đã phát sinh hoạt động học tập:**
   - Hệ thống chặn việc xóa cứng dữ liệu để đảm bảo tính nhất quán của dữ liệu điểm thi và báo cáo chung.
   - Hiển thị hộp thoại cảnh báo: "Không thể xóa vĩnh viễn học sinh này do tài khoản đã có lịch sử làm bài kiểm tra hoặc tương tác học tập. Hệ thống khuyên bạn nên sử dụng tính năng **Khóa tài khoản** để vô hiệu hóa quyền truy cập mà vẫn giữ nguyên lịch sử báo cáo."
   - Cung cấp tùy chọn nhanh: "Khóa tài khoản ngay" hoặc "Hủy bỏ".
4. **Trường hợp học sinh chưa có bất kỳ hoạt động nào** (tài khoản mới tạo nhầm hoặc chưa từng đăng nhập):
   - Hệ thống hiển thị hộp thoại xác nhận xóa cứng: "Học sinh này chưa phát sinh bất kỳ dữ liệu học tập nào. Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản và mọi thông tin liên quan khỏi hệ thống không?"
   - Admin click "Xác nhận xóa".
   - Backend thực hiện một Transaction xóa sạch bản ghi trong bảng `Student` và bảng `User` liên kết.
   - Đóng modal, hiển thị thông báo: "Đã xóa vĩnh viễn tài khoản học sinh thành công." và cập nhật lại bảng danh sách.

---

## **3. Tiêu chí Chấp nhận (Acceptance Criteria)**

### **AC-01: Bộ lọc tìm kiếm học sinh chính xác và tối ưu hiệu năng**

- **Given:** Hệ thống có hơn 10,000 học sinh đăng ký.
- **When:** Admin nhập từ khóa "Nguyễn Văn" vào thanh tìm kiếm.
- **Then:**
  - Hệ thống phải tự động áp dụng debounce 300ms trước khi gọi API tìm kiếm để tránh quá tải server.
  - Bảng danh sách phải trả về đúng các học sinh có tên chứa "Nguyễn Văn".
  - Thời gian phản hồi và hiển thị danh sách kết quả phải dưới 1.5 giây.

### **AC-02: Import Excel hàng loạt xử lý lỗi chặt chẽ (Transactional)**

- **Given:** Admin tải lên file Excel chứa 100 dòng học sinh, trong đó có 5 dòng bị trùng Email đã có sẵn trong hệ thống.
- **When:** Nhấn Import.
- **Then:**
  - Hệ thống phải tạo thành công tài khoản cho 95 dòng dữ liệu hợp lệ.
  - Phải hiển thị bảng thông báo lỗi chi tiết chỉ ra chính xác số dòng và lỗi cụ thể của 5 dòng dữ liệu bị trùng kia để Admin dễ dàng sửa đổi.

### **AC-03: Ràng buộc tính độc nhất (Unique) của Mã học sinh**

- **Given:** Hệ thống đã tồn tại học sinh có mã "HS9999".
- **When:** Admin tạo mới một học sinh thủ công hoặc qua file Excel cũng gán mã "HS9999".
- **Then:**
  - Hệ thống phải từ chối tạo mới.
  - Hiển thị thông báo lỗi: "Mã học sinh HS9999 đã tồn tại trên hệ thống. Vui lòng kiểm tra lại."

### **AC-04: Khóa/Mở khóa tài khoản học sinh hoạt động tức thì**

- **Given:** Tài khoản của học sinh đang ở trạng thái `ACTIVE`.
- **When:** Admin nhấn nút "Khóa tài khoản" và xác nhận thành công.
- **Then:**
  - Trạng thái tài khoản của học sinh phải lập tức đổi thành `LOCKED` trong DB.
  - Hệ thống phải tự động ngắt kết nối session hiện tại của học sinh đó trên Mobile App ngay lập tức (force logout) và hiển thị thông báo "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị để biết thêm chi tiết." khi học sinh cố gắng đăng nhập lại.

### **AC-05: Đảm bảo thiết kế responsive và tương thích đa trình duyệt**

- **Given:** Admin truy cập trang Student Management bằng máy tính bảng hoặc iPad (màn hình nhỏ).
- **When:** Xem danh sách bảng dữ liệu.
- **Then:**
  - Giao diện bảng phải tự co giãn hợp lý, hỗ trợ thanh cuộn ngang (horizontal scroll) mượt mà để xem các cột bị tràn.
  - Các nút hành động (Xem, Sửa, Khóa) không được đè lên nhau và kích thước nút phải dễ dàng thao tác bằng ngón tay.

### **AC-06: Chặn xóa vật lý học sinh đã có lịch sử hoạt động**

- **Given:** Học sinh Nguyễn Văn A đã làm bài thi trắc nghiệm và có lịch sử chat với AI Tutor.
- **When:** Admin thực hiện yêu cầu xóa tài khoản học sinh A.
- **Then:** Systems phải hiển thị thông báo chặn hành động xóa cứng, giải thích rõ lý do ràng buộc lịch sử học tập và chuyển hướng Admin sử dụng tính năng Khóa tài khoản (LOCKED).

### **AC-07: Xóa cứng học sinh chưa có hoạt động thành công**

- **Given:** Học sinh B vừa được tạo tài khoản nhưng bị sai thông tin và chưa từng đăng nhập hay làm bài tập.
- **When:** Admin nhấn nút Xóa tài khoản học sinh B và xác nhận đồng ý.
- **Then:** Hệ thống phải xóa sạch hoàn toàn bản ghi học sinh B khỏi cả hai bảng Student và User trong cơ sở dữ liệu, cập nhật lại bảng danh sách học sinh ngay lập tức.

---

## **4. Đặc tả dữ liệu**

| Tên trường                      | Bắt buộc? | Ràng buộc dữ liệu (Validation Rules)                                                                                                                                      | Ghi chú / Trạng thái mặc định                                   |
| ---------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Họ và tên**             | Có         | \- Định dạng văn bản Unicode- Độ dài từ 2 đến 50 ký tự- Không chứa ký tự đặc biệt hay chữ số                                                            | Sử dụng ở form thêm/sửa học sinh. Mặc định: Trống.          |
| **Mã học sinh**            | Có         | \- Chỉ chứa chữ cái không dấu và số, tự động viết hoa- Độ dài từ 4 đến 20 ký tự- Phải độc nhất trên toàn hệ thống                                 | Khóa không cho sửa khi chỉnh sửa học sinh. Mặc định: Trống. |
| **Email đăng ký**         | Có         | \- Đúng định dạng email tiêu chuẩn (ví dụ: [student@domain.com](mailto:student@domain.com))- Độ dài tối đa 255 ký tự- Phải độc nhất trên toàn hệ thống | Khóa không cho sửa khi chỉnh sửa học sinh. Mặc định: Trống. |
| **Số điện thoại**        | Có         | \- Phải là số điện thoại Việt Nam hợp lệ (10 chữ số, bắt đầu bằng 0)- Đúng định dạng số                                                                  | Sử dụng ở form thêm/sửa học sinh. Mặc định: Trống.          |
| **Trường học**            | Có         | \- Phải chọn từ danh sách các trường liên kết có sẵn trong hệ thống                                                                                              | Dropdown lựa chọn. Mặc định: Chưa chọn.                        |
| **Khối lớp**               | Có         | \- Phải chọn một trong các khối lớp từ Lớp 1 đến Lớp 12                                                                                                            | Dropdown lựa chọn. Mặc định: Chưa chọn.                        |
| **Ngày sinh**               | Không      | \- Định dạng ngày tháng năm hợp lệ (dd/mm/yyyy)- Phải nhỏ hơn ngày hiện tại                                                                                     | Date picker lựa chọn. Mặc định: Trống.                          |
| **Giới tính**              | Không      | \- Phải chọn một trong các giá trị: Nam, Nữ, Khác                                                                                                                     | Lựa chọn dạng Radio button. Mặc định: Trống.                   |
| **Trạng thái tài khoản** | Có         | \- Phải chọn một trong hai giá trị: Đang hoạt động (ACTIVE), Đang khóa (LOCKED)                                                                                    | Mặc định: Đang hoạt động (ACTIVE).                             |
