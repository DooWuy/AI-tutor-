Là Học sinh (Student), tôi muốn theo dõi tiến độ học tập của mình, tích lũy điểm thưởng XP để tăng cấp độ (Level), duy trì chuỗi ngày học liên tục (Streak), mở khóa các huy hiệu danh giá và thi đua trên bảng xếp hạng cùng bạn bè.


# **User Story: Tiến độ và Điểm thưởng (Progress & Gamification)**

## **1. Tổng quan & Bối cảnh (Overview & Context)**

### **Vấn đề (Problem):**

Tự học trực tuyến đòi hỏi tính kỷ luật và sự kiên trì rất lớn từ học sinh. Tuy nhiên, nếu thiếu đi các yếu tố phản hồi tích cực tức thời hoặc môi trường thi đua thân thiện, học sinh rất dễ cảm thấy cô đơn, nhàm chán và nhanh chóng bỏ dở lộ trình học tập chỉ sau vài ngày sử dụng ứng dụng.

### **Pain Points hiện tại:**

- **Thiếu động lực duy trì thói quen học tập:** Không có phần thưởng hay sự khích lệ nào khiến học sinh muốn mở app học bài mỗi ngày một cách tự nguyện.
- **Tiến độ học tập mơ hồ:** Học sinh không nhìn thấy rõ sự tiến bộ của bản thân qua từng ngày, không biết mình đang đứng ở đâu so với bạn bè cùng trang lứa.
- **Tình trạng "cày điểm ảo" (Anti-gaming):** Học sinh cố tình làm đi làm lại các bài tập cực dễ hoặc dùng tool để spam nhận XP tăng hạng bảng xếp hạng một cách không lành mạnh.
- **Huy hiệu không có giá trị tinh thần:** Các phần thưởng huy hiệu nếu thiết kế xấu hoặc quá dễ đạt được sẽ không tạo ra cảm giác tự hào và mong muốn sưu tầm của học sinh.

### **Giá trị Nghiệp vụ (Business Value):**

- **Tăng tỷ lệ giữ chân người dùng (Retention Rate):** Cơ chế Streak lửa (chuỗi ngày học) thúc đẩy học sinh mở app học ít nhất 5 phút mỗi ngày để duy trì chuỗi, tạo thành thói quen học tập tự nhiên.
- **Tạo môi trường học tập sôi nổi:** Bảng xếp hạng (Leaderboard) tạo ra sự thi đua lành mạnh giữa các học sinh trong cùng lớp, cùng khối hoặc toàn quốc.
- **Ghi nhận nỗ lực xứng đáng:** Hệ thống Level và Badge ghi dấu từng mốc trưởng thành trong học tập của học sinh, mang lại cảm giác thành tựu lớn.
- **Đảm bảo tính công bằng:** Cơ chế chống cày điểm ảo (XP rate limiting) đảm bảo bảng xếp hạng phản ánh thực chất năng lực và sự kiên trì học tập của học sinh.

### **Đối tượng (Actor):**

- **Primary Actor:** Học sinh (Student).
- **Secondary Actors:**
  - **Hệ thống Gamification Engine (System Service):** Tự động tính toán điểm XP, kiểm tra điều kiện mở khóa huy hiệu, cập nhật chuỗi Streak hàng ngày và tính toán thứ hạng Leaderboard.

### **User Story Statement**

Là Học sinh (Student), tôi muốn theo dõi tiến độ học tập của mình, tích lũy điểm thưởng XP để tăng cấp độ (Level), duy trì chuỗi ngày học liên tục (Streak), mở khóa các huy hiệu danh giá và thi đua trên bảng xếp hạng cùng bạn bè.

---

## **2. Luồng Người dùng (User Flow)**

### **2.1. Luồng chính: Xem tiến độ học tập và Bảng xếp hạng**

1. Học sinh đăng nhập vào Mobile App và chọn tab **"Progress"** (Tiến độ) trên thanh điều hướng dưới cùng.
2. Hệ thống hiển thị trang Tiến độ cá nhân gồm 3 khu vực chính:
   - **Khu vực 1: Chỉ số cá nhân (My Stats):**
     - Avatar của học sinh có vòng tròn màu sắc thể hiện Cấp độ hiện tại (Level - Ví dụ: Level 5).
     - Thanh tiến trình Level thể hiện số XP hiện tại và số XP cần để lên cấp tiếp theo (Ví dụ: `450/1000 XP`).
     - Biểu tượng **Streak lửa** kèm số ngày học liên tiếp hiện tại (Ví dụ: `🔥 7 ngày`).
   - **Khu vực 2: Thống kê môn học:**
     - Biểu đồ cột thể hiện thời gian tự học trong tuần (từ Thứ 2 đến Chủ nhật).
     - Bảng thống kê tiến độ học tập theo từng môn học cụ thể (Toán: hoàn thành 80%, Lý: hoàn thành 45%...).
   - **Khu vực 3: Bộ sưu tập Huy hiệu (Badges Gallery):**
     - Hiển thị danh sách các huy hiệu: Các huy hiệu đã mở khóa (hiển thị màu sắc rực rỡ) và các huy hiệu chưa mở khóa (hiển thị màu xám mờ kèm điều kiện mở khóa khi di chuột/click vào).
3. Học sinh muốn xem thi đua, click vào nút **"Bảng xếp hạng"** (Leaderboard) ở góc trên phải.
4. Giao diện Leaderboard hiển thị:
   - Bộ lọc phạm vi: Dropdown chọn (Theo Lớp / Theo Khối / Toàn quốc).
   - Bộ lọc thời gian: Tab chọn (Tuần này / Tháng này).
   - Danh sách top 100 học sinh có số XP cao nhất sắp xếp từ cao xuống thấp. Mỗi dòng hiển thị: Hạng, Avatar, Tên học sinh, Trường học, Số XP đạt được.
   - Phía dưới cùng giao diện hiển thị một dòng cố định (Sticky Row) biểu diễn thông tin hạng hiện tại của chính học sinh đó (Ví dụ: `#12. Bạn - 850 XP - Cần thêm 50 XP để vào Top 10`).

### **2.2. Luồng: Mở khóa Huy hiệu và nhận phần thưởng (Badge Unlock Event)**

1. Học sinh hoàn thành một bài tập hoặc hành động học tập thỏa mãn điều kiện mở khóa một Huy hiệu mới (Ví dụ: Hoàn thành bài trắc nghiệm thứ 10 môn Toán học, đáp ứng điều kiện huy hiệu **"Chiến binh Toán học"**).
2. Ngay khi Backend ghi nhận bài thi được nộp thành công và chấm điểm:
   - Gamification Engine kiểm tra và kích hoạt sự kiện mở khóa huy hiệu.
   - Thêm Huy hiệu "Chiến binh Toán học" vào cơ sở dữ liệu của học sinh.
3. Trên màn hình điện thoại của học sinh lập tức hiển thị một hiệu ứng Modal chúc mừng rực rỡ (Confetti animation):
   - Hình ảnh huy hiệu 3D quay tròn đẹp mắt.
   - Tiêu đề: "Chúc mừng! Bạn đã mở khóa Huy hiệu mới!".
   - Mô tả: "Bạn đã xuất sắc hoàn thành 10 bài kiểm tra Toán học. Nhận ngay **+200 XP** thưởng!".
4. Học sinh nhấn nút "Tuyệt vời" để đóng modal.
5. Hệ thống tự động cộng 200 XP thưởng vào tổng điểm và cập nhật lại giao diện Level của học sinh ngay lập tức.

### **2.3. Luồng: Cơ chế duy trì Streak lửa (Streak Maintenance)**

1. Mỗi ngày, học sinh cần mở app và thực hiện ít nhất một hành động học tập có tính điểm (Ví dụ: nhắn tin hỏi AI Tutor, hoàn thành 1 bài trắc nghiệm) để duy trì Streak.
2. Khi học sinh hoàn thành hành động học tập đầu tiên trong ngày:
   - Hệ thống ghi nhận và hiển thị một hiệu ứng Lửa bùng cháy nhỏ ở icon Streak kèm thông báo: "Streak hôm nay đã được giữ vững! 🔥 Chuỗi của bạn đã tăng lên X ngày!".
3. **Cơ chế Reset Streak tự động:**
   - Hàng ngày vào lúc 12:00 AM (nửa đêm), hệ thống chạy background job quét toàn bộ học sinh.
   - Nếu trong ngày hôm đó (từ 00:00 đến 23:59), học sinh không có bất kỳ hành động học tập nào:
     - Hệ thống tự động đặt số ngày Streak của học sinh về `0`.
     - Khi học sinh mở app vào ngày hôm sau, hệ thống hiển thị thông báo tiếc nuối: "Tiếc quá! Chuỗi Streak lửa của bạn đã bị dập tắt. Hãy bắt đầu lại chuỗi mới từ hôm nay nhé!".

### **2.4. Quy tắc bất biến đối với các chỉ số Gamification (Immutability Constraints)**

1. Toàn bộ các chỉ số tính điểm của học sinh gồm: Điểm tích lũy (`totalXP`), Cấp độ hiện tại (`currentLevel`), Chuỗi ngày học liên tục (`currentStreak`, `longestStreak`) và danh sách các Huy hiệu đã mở khóa (`Badges`) được tính toán và kiểm soát tự động hoàn toàn bởi hệ thống Gamification Engine ở phía Server.
2. **Quy tắc bảo mật và bất biến:**
   - Học sinh không được phép chỉnh sửa (Update) hoặc xóa bỏ (Delete) các chỉ số này trong giao diện ứng dụng. Giao diện Mobile App chỉ hiển thị ở chế độ Chỉ đọc (Read-only).
   - Mọi nỗ lực truy cập trái phép hoặc cố tình bypass giao diện để gửi các gói tin API chỉnh sửa các chỉ số trên lên Backend đều bị hệ thống chặn đứng và báo lỗi tức thì.
   - Giáo viên và Quản trị viên (Admin) thông thường cũng không được cung cấp tính năng sửa đổi điểm số XP hay cấp độ trực tiếp trên Dashboard nhằm đảm bảo tính công bằng tuyệt đối trên Bảng xếp hạng thi đua toàn trường.

---

## **3. Tiêu chí Chấp nhận (Acceptance Criteria)**

### **AC-01: Tự động cập nhật Level khi tích lũy đủ XP**

- **Given:** Học sinh đang ở Level 5 (yêu cầu 1000 XP để lên Level 6) và hiện đang có 950 XP.
- **When:** Học sinh hoàn thành bài kiểm tra và nhận được thêm +80 XP.
- **Then:**
  - Hệ thống phải tự động cập nhật Level của học sinh lên **Level 6**.
  - Số XP dư phải được chuyển tiếp sang chu kỳ Level mới (Số XP mới hiển thị là `30/1200 XP` với yêu cầu Level 6 là 1200 XP).
  - Hiển thị hiệu ứng chúc mừng lên cấp (Level Up) mượt mà trên màn hình.

### **AC-02: Bảng xếp hạng cập nhật real-time chính xác**

- **Given:** Học sinh A vừa hoàn thành bài tập và nhận +100 XP, giúp tổng XP vượt qua học sinh B trên bảng xếp hạng.
- **When:** Học sinh A truy cập trang Leaderboard.
- **Then:** Vị trí thứ hạng của học sinh A phải lập tức hiển thị xếp trên học sinh B, số XP hiển thị của học sinh A phải cập nhật số mới chính xác 100%.

### **AC-03: Cơ chế chống cày điểm ảo (Anti-gaming Limits) hoạt động tốt**

- **Given:** Học sinh cố tình spams gửi hàng trăm tin nhắn vô nghĩa cho AI hoặc làm đi làm lại 1 bài trắc nghiệm siêu dễ trong thời gian cực ngắn.
- **When:** Hệ thống tính điểm XP.
- **Then:**
  - Hệ thống phải áp dụng giới hạn XP tối đa nhận được trong một ngày (Ví dụ: tối đa 500 XP/ngày từ các hoạt động tự do).
  - Khi học sinh đạt đến giới hạn này, các hoạt động tiếp theo vẫn diễn ra bình thường nhưng hệ thống hiển thị thông báo: "Bạn đã đạt giới hạn XP nhận được trong ngày hôm nay. Hãy tiếp tục học tập để tích lũy thêm XP vào ngày mai nhé!".

### **AC-04: Streak lửa hoạt động chính xác theo múi giờ địa phương**

- **Given:** Học sinh đang có chuỗi Streak là 5 ngày. Hôm nay học sinh đã học bài lúc 08:00 PM.
- **When:** Qua 12:00 AM đêm hôm đó.
- **Then:** Chuỗi Streak phải được giữ nguyên là 5 ngày (không bị reset về 0) và sẵn sàng để tăng lên 6 ngày khi học sinh học bài vào ngày tiếp theo.

### **AC-05: Hiển thị đầy đủ thông tin chi tiết của Huy hiệu**

- **Given:** Học sinh đang ở thư viện Huy hiệu và click vào một huy hiệu bất kỳ (Ví dụ: Huy hiệu "Cú đêm" - chưa mở khóa).
- **When:** Click chọn.
- **Then:** Hệ thống phải hiển thị một modal thông tin chi tiết chứa: Tên huy hiệu, Hình ảnh minh họa (dạng xám mờ), Mô tả điều kiện đạt được (Ví dụ: "Học bài trong khung giờ từ 12h đêm đến 4h sáng liên tục 3 ngày") và phần thưởng XP đi kèm khi mở khóa.

### **AC-06: Chặn chỉnh sửa điểm tích lũy XP và Huy hiệu trái phép**

- **Given:** Học sinh đã tích lũy `2500 XP` và đạt Level `10`.
- **When:** Học sinh gửi các request API nhằm thay đổi, chỉnh sửa giá trị `totalXP` hoặc tự mở khóa Huy hiệu trong cơ sở dữ liệu.
- **Then:** Hệ thống phải trả về lỗi bảo mật (403 Forbidden), chặn đứng mọi thay đổi và ghi nhận log vi phạm của học sinh.

---

## **4. Đặc tả dữ liệu**

| Tên trường                         | Bắt buộc?     | Ràng buộc dữ liệu (Validation Rules)                               | Ghi chú / Trạng thái mặc định                            |
| ------------------------------------- | --------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Số ngày Streak lửa**       | Chỉ hiển thị | \- Số nguyên lớn hơn hoặc bằng 0                                 | Số ngày học liên tục của học sinh.                      |
| **Điểm tích lũy XP**        | Chỉ hiển thị | \- Số nguyên lớn hơn hoặc bằng 0                                 | Tổng điểm kinh nghiệm học sinh đã tích lũy.           |
| **Cấp độ (Level)**           | Chỉ hiển thị | \- Số nguyên lớn hơn hoặc bằng 1                                 | Cấp độ học tập hiện tại của học sinh.                 |
| **Phạm vi bảng xếp hạng**   | Có             | \- Chọn một trong các giá trị: Theo Lớp, Theo Khối, Toàn quốc | Bộ lọc hiển thị bảng xếp hạng. Mặc định: Theo Lớp.  |
| **Thời gian bảng xếp hạng** | Có             | \- Chọn một trong các giá trị: Tuần này, Tháng này            | Bộ lọc hiển thị bảng xếp hạng. Mặc định: Tuần này. |
