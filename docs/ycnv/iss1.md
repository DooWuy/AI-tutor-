Là Người dùng ứng dụng (Học sinh/Giáo viên), tôi muốn đăng ký tài khoản cá nhân, đăng nhập hệ thống an toàn và duy trì phiên đăng nhập để bảo mật thông tin và đồng bộ hóa tiến trình học tập của mình trên các thiết bị.


# **User Story: Xác thực và Quản lý Tài khoản (User Authentication & Profile)**

## **1. Tổng quan & Bối cảnh (Overview & Context)**

### **Vấn đề (Problem):**

Nếu không có hệ thống quản lý tài khoản và xác thực người dùng, ứng dụng không thể phân biệt được các học sinh khác nhau. Điều này dẫn đến các hệ lụy nghiêm trọng:

- **Lộ thông tin cá nhân:** Học sinh có thể vô tình xem được lịch học, lịch sử chat AI hoặc kết quả bài làm trắc nghiệm của học sinh khác.
- **Không cá nhân hóa được lộ trình:** AI Tutor không có cơ sở dữ liệu lịch sử để nhận biết lỗ hổng kiến thức riêng của từng học sinh để đề xuất bài học phù hợp.
- **Mất dữ liệu học tập:** Học sinh sẽ bị mất toàn bộ lịch sử chat, Streak lửa và điểm XP tích lũy khi đổi thiết bị hoặc cài đặt lại ứng dụng.
- **Không kiểm soát được truy cập:** Hệ thống trang quản trị Admin không thể phân quyền (giữa Giáo viên và Học sinh), dẫn đến việc học sinh có thể truy cập trái phép và sửa đổi dữ liệu tài liệu học tập của hệ thống.

### **Pain Points hiện tại:**

- Học sinh lo ngại về việc mất thông tin tiến trình tự học khi thay đổi điện thoại.
- Ban giám hiệu lo lắng về việc rò rỉ đề thi hoặc các thông tin nội bộ của trường học nếu không có phân quyền truy cập.
- Giáo viên không thể theo dõi chính xác học sinh nào đang làm bài thi và điểm số của từng cá nhân trên hệ thống.

### **Giá trị Nghiệp vụ (Business Value):**

- **Bảo mật và riêng tư:** Đảm bảo mỗi học sinh chỉ có quyền xem và quản lý dữ liệu học tập của chính mình.
- **Đồng bộ hóa đa thiết bị:** Học sinh có thể đăng nhập trên bất kỳ thiết bị nào (điện thoại, máy tính bảng) và tiếp tục lộ trình học tập mà không bị gián đoạn.
- **Lưu trữ tiến trình học tập:** Hệ thống lưu giữ an toàn điểm số XP, chuỗi Streak học tập và danh sách Huy hiệu đạt được của học sinh.
- **Phân quyền chặt chẽ (RBAC):** Bảo vệ các tài nguyên hệ thống (tài liệu giảng dạy, cài đặt cảnh báo nguy cơ) khỏi sự truy cập không hợp lệ.

### **Đối tượng (Actor):**

- **Primary Actor:** Học sinh (Student), Quản trị viên/Giáo viên (Admin/Teacher).
- **Secondary Actors:**
  - **Dịch vụ Xác thực hệ thống (Auth Service):** Quản lý quy trình mã hóa mật khẩu, cấp phát và thu hồi mã xác thực (JWT Access Token & Refresh Token).

### **User Story Statement**

Là Người dùng ứng dụng (Học sinh/Giáo viên), tôi muốn đăng ký tài khoản cá nhân, đăng nhập hệ thống an toàn và duy trì phiên đăng nhập để bảo mật thông tin và đồng bộ hóa tiến trình học tập của mình trên các thiết bị.

---

## **2. Luồng Người dùng (User Flow)**

### **2.1. Luồng: Đăng ký tài khoản học sinh mới (Create Flow)**

1. Học sinh mở Mobile App lần đầu tiên, tại màn hình chào mừng học sinh click vào nút **"Đăng ký tài khoản"**.
2. Hệ thống hiển thị form Đăng ký học sinh mới bao gồm các trường:
   - Email đăng ký (bắt buộc)
   - Mật khẩu (bắt buộc)
   - Xác nhận mật khẩu (bắt buộc)
   - Họ và tên học sinh (bắt buộc)
   - Số điện thoại (bắt buộc)
   - Ngày sinh (optional)
   - Giới tính (optional)
   - Trường học (bắt buộc)
   - Khối lớp (bắt buộc - Lớp 10 đến Lớp 12)
   - Tên lớp (bắt buộc - Ví dụ: 10A1)
3. Học sinh nhập đầy đủ các trường thông tin và click nút **"Đăng ký"**.
4. Hệ thống thực hiện validate:
   - Các trường bắt buộc không được để trống.
   - Định dạng email và số điện thoại Việt Nam hợp lệ.
   - Mật khẩu phải có tối thiểu 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt.
   - Trường "Xác nhận mật khẩu" phải khớp chính xác với "Mật khẩu".
   - Email đăng ký phải chưa từng tồn tại trên hệ thống.
5. Nếu dữ liệu hợp lệ:
   - Hệ thống tiến hành mã hóa bảo mật mật khẩu.
   - Tạo bản ghi người dùng mới (`User`) với vai trò là `STUDENT`, đồng thời tạo hồ sơ chi tiết học sinh tương ứng (`Student`).
   - Gửi email xác nhận đăng ký tài khoản thành công về hòm thư của học sinh.
   - Điều hướng học sinh thẳng tới màn hình Đăng nhập và hiển thị thông báo: "Đăng ký tài khoản thành công! Vui lòng đăng nhập để bắt đầu học tập."
6. Nếu dữ liệu không hợp lệ:
   - Hệ thống hiển thị lỗi chi tiết dưới từng ô nhập dữ liệu sai và giữ nguyên thông tin để học sinh sửa lại.

### **2.2. Luồng: Đăng nhập hệ thống (Read Flow)**

1. Tại màn hình Đăng nhập của ứng dụng (Mobile App hoặc Web Admin), người dùng nhập Email và Mật khẩu.
2. Người dùng tích chọn hộp kiểm **"Ghi nhớ đăng nhập"** (Remember Me - optional) nếu muốn duy trì phiên đăng nhập lâu dài.
3. Người dùng click nút **"Đăng nhập"**.
4. Backend nhận thông tin, thực hiện giải mã bảo mật và so khớp mật khẩu trong cơ sở dữ liệu.
5. Nếu xác thực thành công:
   - Hệ thống khởi tạo một mã truy cập ngắn hạn (Access Token - thời hạn 15 phút) và một mã gia hạn phiên dài hạn (Refresh Token - thời hạn 7 ngày).
   - Lưu trữ Refresh Token vào cơ sở dữ liệu để quản lý phiên làm việc.
   - Trả thông tin đăng nhập về ứng dụng.
   - Ứng dụng lưu trữ Access Token vào bộ nhớ tạm (State) và lưu trữ Refresh Token vào bộ nhớ bảo mật của thiết bị (SecureStore đối với Mobile, HttpOnly Cookie đối với Web Admin).
   - Hệ thống kiểm tra vai trò người dùng (Role) để điều hướng: Học sinh chuyển tới trang chủ Mobile App, Quản trị viên/Giáo viên chuyển tới trang tổng quan Admin Dashboard.
6. Nếu xác thực thất bại (sai email hoặc sai mật khẩu):
   - Hệ thống hiển thị thông báo lỗi chung chung: "Email hoặc mật khẩu không chính xác. Vui lòng thử lại." (để tránh rò rỉ thông tin bảo mật xem email đó có tồn tại hay không).

### **2.3. Luồng: Tự động gia hạn phiên đăng nhập (Update Session Flow)**

1. Khi học sinh đang sử dụng app, Access Token hết hạn (quá 15 phút).
2. Khi học sinh gửi một yêu cầu lấy dữ liệu bất kỳ (ví dụ: mở danh sách Lịch học):
   - Ứng dụng phát hiện Access Token đã hết hạn.
   - Trước khi gửi yêu cầu chính, ứng dụng tự động kích hoạt tiến trình ngầm gửi Refresh Token lên Backend yêu cầu cấp mã mới.
3. Backend kiểm tra tính hợp lệ của Refresh Token gửi lên:
   - Token phải còn trong thời hạn sử dụng.
   - Token phải trùng khớp với mã Refresh Token đã lưu trong database của User đó.
   - Token chưa bị thu hồi hoặc đánh dấu vi phạm.
4. Nếu Refresh Token hợp lệ:
   - Backend sinh một cặp Access Token mới và một Refresh Token mới (áp dụng cơ chế Token Rotation để tăng tính bảo mật).
   - Cập nhật Refresh Token mới vào cơ sở dữ liệu và vô hiệu hóa Refresh Token cũ.
   - Trả cặp mã mới về cho ứng dụng để ghi đè mã cũ vào SecureStore.
   - Tiến trình lấy dữ liệu chính (lịch học) tiếp tục thực hiện mượt mà dưới nền mà học sinh không hề biết và không bị ngắt quãng trải nghiệm.
5. Nếu Refresh Token không hợp lệ hoặc đã hết hạn (học sinh không mở app quá 7 ngày):
   - Hệ thống từ chối yêu cầu.
   - Ứng dụng lập tức xóa sạch mọi token cũ trong bộ nhớ thiết bị, hiển thị thông báo: "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại." và đưa học sinh quay về màn hình Đăng nhập.

### **2.4. Luồng: Cập nhật hồ sơ cá nhân và đổi mật khẩu (Update Profile Flow)**

1. Tại tab "Profile" của ứng dụng, học sinh chọn **"Thông tin cá nhân"**.
2. Hệ thống hiển thị thông tin hồ sơ hiện tại. Trong đó:
   - Các trường có thể chỉnh sửa: Họ tên, Ngày sinh, Giới tính, Số điện thoại, Tên trường học, Tên lớp.
   - Các trường khóa cứng (Read-only): Email đăng ký và Mã học sinh (để đảm bảo định danh duy nhất của học sinh trên cơ sở dữ liệu, không bị thay đổi lung tung).
3. Học sinh thay đổi các thông tin cần thiết và bấm **"Lưu thay đổi"**.
4. Hệ thống validate thông tin mới, cập nhật vào bảng `Student` và bảng `User` liên kết, hiển thị thông báo cập nhật thành công.
5. **Đổi mật khẩu:** Nếu học sinh muốn đổi mật khẩu, học sinh nhập mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới. Hệ thống kiểm tra mật khẩu cũ chính xác và cập nhật mật khẩu mới mã hóa bảo mật vào cơ sở dữ liệu.

### **2.5. Luồng: Đăng xuất tài khoản (Delete Session Flow)**

1. Tại tab "Profile", học sinh click vào nút **"Đăng xuất"** (Logout).
2. Hệ thống hiển thị hộp thoại xác nhận: "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?"
3. Học sinh click "Đăng xuất".
4. Hệ thống thực hiện:
   - Gửi yêu cầu đăng xuất lên Server kèm Refresh Token hiện tại.
   - Backend thực hiện xóa hoặc vô hiệu hóa bản ghi Refresh Token đó trong cơ sở dữ liệu.
   - Ứng dụng xóa sạch hoàn toàn các token lưu trữ trong thiết bị (Access Token trong bộ nhớ tạm và Refresh Token trong SecureStore/Cookies).
   - Chuyển hướng người dùng về màn hình đăng nhập ban đầu.

---

## **3. Tiêu chí Chấp nhận (Acceptance Criteria)**

### **AC-01: Ràng buộc độ mạnh mật khẩu và định dạng email khi đăng ký**

- **Given:** Học sinh đang ở form đăng ký tài khoản.
- **When:** Học sinh nhập mật khẩu là `12345` hoặc email là `student-test-email` (sai định dạng) và bấm Đăng ký.
- **Then:**
  - Hệ thống phải ngăn chặn việc submit.
  - Hiển thị thông báo lỗi màu đỏ tương ứng dưới các trường dữ liệu: "Email không đúng định dạng", "Mật khẩu phải dài ít nhất 8 ký tự, chứa cả chữ hoa, chữ thường, số và ký tự đặc biệt."

### **AC-02: Đăng nhập an toàn và bảo vệ thông tin sai lệch**

- **Given:** Học sinh nhập sai mật khẩu của tài khoản email `student@test.com`.
- **When:** Nhấn Đăng nhập.
- **Then:**
  - Hệ thống phải từ chối đăng nhập.
  - Hiển thị thông báo lỗi chung: "Email hoặc mật khẩu không chính xác." Tuyệt đối không hiển thị chi tiết "Sai mật khẩu" hay "Email không tồn tại" để tránh hacker dò tìm tài khoản.

### **AC-03: Tự động gia hạn phiên đăng nhập thành công (Silent Refresh)**

- **Given:** Học sinh đang mở ứng dụng sau 20 phút không thao tác (Access Token đã hết hạn).
- **When:** Học sinh nhấn vào xem Lịch học cá nhân.
- **Then:**
  - Hệ thống phải tự động gửi Refresh Token dưới nền để lấy Access Token mới thành công trước khi gọi API lấy lịch học.
  - Giao diện lịch học phải hiển thị mượt mà mà không bắt học sinh phải thấy màn hình đăng nhập hoặc thao tác thủ công nào.

### **AC-04: Khóa cứng thông tin định danh khi sửa hồ sơ**

- **Given:** Học sinh đang ở trang chỉnh sửa thông tin cá nhân.
- **When:** Xem giao diện form chỉnh sửa.
- **Then:** Trường Email đăng ký và Mã học sinh phải hiển thị ở trạng thái khóa (màu xám readonly) và không cho phép người dùng click sửa đổi hay nhập chữ.

### **AC-05: Đăng xuất an toàn và hủy bỏ Token**

- **Given:** Học sinh đã đăng xuất thành công trên ứng dụng.
- **When:** Kẻ xấu lấy được chuỗi Refresh Token cũ của học sinh đó và gửi request gia hạn lên Backend.
- **Then:** Hệ thống phải từ chối cấp Access Token mới do Refresh Token tương ứng đã bị xóa/vô hiệu hóa hoàn toàn trên cơ sở dữ liệu khi đăng xuất.

---

## **4. Đặc tả dữ liệu**

| Tên trường                    | Bắt buộc? | Ràng buộc dữ liệu (Validation Rules)                                                                       | Ghi chú / Trạng thái mặc định                                                  |
| -------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Email đăng ký**       | Có         | \- Đúng định dạng email chuẩn- Độ dài tối đa 255 ký tự- Phải duy nhất (Unique) trên hệ thống | Dùng làm tên đăng nhập của tài khoản. Khóa không cho sửa sau khi tạo.   |
| **Mật khẩu**             | Có         | \- Độ dài từ 8 đến 50 ký tự- Ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt       | Được băm (hashing) bảo mật bằng thuật toán PBKDF2 trước khi lưu vào DB. |
| **Họ và tên học sinh** | Có         | \- Văn bản Unicode chứa dấu tiếng Việt- Độ dài từ 2 đến 100 ký tự                                | Tên hiển thị của học sinh trên giao diện chính.                              |
| **Số điện thoại**      | Có         | \- Phải là số điện thoại Việt Nam hợp lệ (10 chữ số, bắt đầu bằng số 0)                        | Để liên lạc và gửi thông báo khẩn cấp.                                     |
| **Trường học**          | Có         | \- Dropdown chọn các trường có sẵn trong cơ sở dữ liệu hoặc nhập văn bản tự do                  | Đơn vị học tập của học sinh.                                                  |
| **Khối lớp**             | Có         | \- Phải chọn một trong các giá trị: Lớp 10, Lớp 11, Lớp 12                                            | Để AI gợi ý nội dung bài học đúng trình độ.                              |
| **Tên lớp**              | Có         | \- Định dạng văn bản Unicode- Độ dài tối đa 10 ký tự                                               | Lớp học chính khóa của học sinh (Ví dụ: 10A2).                               |
| **Ngày sinh**             | Không      | \- Định dạng ngày tháng năm (dd/mm/yyyy)- Phải nhỏ hơn ngày hiện tại                               | Date picker để chọn. Mặc định: Trống.                                         |
| **Giới tính**            | Không      | \- Chọn một trong các giá trị: Nam, Nữ, Khác                                                            | Lựa chọn dạng Radio button. Mặc định: Trống.                                  |
| **Ghi nhớ đăng nhập**  | Không      | \- Giá trị Boolean (Đúng / Sai)                                                                            | Nếu Đúng, hệ thống sẽ cấp Refresh Token duy trì lâu dài. Mặc định: Sai. |
