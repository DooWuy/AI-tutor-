Là Học sinh (Student), tôi muốn trò chuyện trực tiếp với AI Tutor (gửi câu hỏi text/voice) để nhận được sự hướng dẫn, giải thích bài học chi tiết từng bước 24/7 bám sát chương trình học và an toàn tuyệt đối cho lứa tuổi của tôi.

# **User Story: Trò chuyện với AI Tutor (AI Tutor Chat)**

## **1. Tổng quan & Bối cảnh (Overview & Context)**

### **Vấn đề (Problem):**

Học sinh Việt Nam khi tự học tại nhà thường xuyên gặp khó khăn trong việc hiểu sâu các kiến thức lý thuyết phức tạp hoặc giải quyết các bài tập khó (Toán, Lý, Hóa, Tiếng Anh...). Khi không có giáo viên hoặc phụ huynh bên cạnh hỗ trợ kịp thời, học sinh dễ rơi vào tình trạng chán nản, từ bỏ hoặc chọn cách chép lời giải có sẵn trên mạng một cách đối phó mà không thực sự hiểu bản chất bài học.

### **Pain Points hiện tại:**

- **Thiếu sự hỗ trợ tức thì:** Học sinh phải đợi đến ngày hôm sau đi học để hỏi giáo viên, hoặc phụ huynh phải tốn chi phí thuê gia sư truyền thống rất đắt đỏ nhưng cũng chỉ hỗ trợ được vài tiếng mỗi tuần.
- **Lời giải trên mạng thiếu giải thích bản chất:** Các trang web giải bài tập hiện nay chỉ cung cấp đáp án cuối cùng hoặc các bước giải vắn tắt, không giải thích chi tiết tại sao lại áp dụng công thức đó.
- **Không cá nhân hóa:** Tài liệu học tập dùng chung cho mọi đối tượng học sinh, không phân biệt học sinh mất gốc hay học sinh khá giỏi cần cách tiếp cận khác nhau.
- **Nội dung thiếu an toàn cho trẻ em:** Việc tự tìm kiếm giải bài tập trên mạng dễ khiến học sinh tiếp xúc với quảng cáo độc hại, thông tin sai lệch hoặc không phù hợp với lứa tuổi.

### **Giá trị Nghiệp vụ (Business Value):**

- **Hỗ trợ học tập cá nhân hóa 24/7:** Học sinh có một Gia sư AI thông minh đồng hành mọi lúc mọi nơi, giải thích kiến thức với văn phong dễ hiểu phù hợp với trình độ hiện tại của từng em.
- **Hướng dẫn học tập thay vì giải hộ:** AI được cấu hình để định hướng, đưa ra gợi ý từng bước (hints) và giải thích bản chất tư duy giải bài, giúp học sinh tự suy nghĩ và tiến bộ vượt bậc.
- **Môi trường học tập an toàn tuyệt đối:** Đảm bảo toàn bộ nội dung tương tác của học sinh được kiểm duyệt chặt chẽ, lành mạnh, bám sát chương trình giáo dục phổ thông của Bộ GD&ĐT.
- **Kết nối kiến thức số hóa:** Gắn câu trả lời của AI với các tài liệu học tập chính thống hiện có trong hệ thống (RAG citations) để học sinh dễ dàng tra cứu lại bài giảng gốc.

### **Đối tượng (Actor):**

- **Primary Actor:** Học sinh (Student).
- **Secondary Actors:**
  - **Hệ thống AI Tutor Service (LangChain):** Chịu trách nhiệm xử lý ngôn ngữ, tìm kiếm ngữ cảnh trong Vector Database (pgvector) và tạo câu trả lời cá nhân hóa an toàn.

### **User Story Statement**

Là Học sinh (Student), tôi muốn trò chuyện trực tiếp với AI Tutor (gửi câu hỏi text/voice) để nhận được sự hướng dẫn, giải thích bài học chi tiết từng bước 24/7 bám sát chương trình học và an toàn tuyệt đối cho lứa tuổi của tôi.

---

## **2. Luồng Người dùng (User Flow)**

### **2.1. Luồng chính: Trò chuyện và hỏi bài với AI Tutor**

1. Học sinh đăng nhập thành công vào Mobile App và chọn tab "AI Tutor" (màn hình chính).
2. Hệ thống hiển thị giao diện trò chuyện:
   - Phần trên: Danh sách các session trò chuyện cũ (Lịch sử chat) được gom nhóm theo Môn học (Toán, Vật lý, Hóa học, Tiếng Anh...).
   - Phần giữa: Khung chat hiển thị lịch sử tin nhắn của cuộc trò chuyện hiện tại.
   - Phần dưới: Thanh công cụ gồm ô nhập nội dung, nút gửi tin nhắn, và icon Micro để ghi âm giọng nói.
3. Học sinh chọn một môn học cụ thể (Ví dụ: **Toán học**) và bắt đầu nhập câu hỏi vào thanh chat (Ví dụ: "Giải thích giúp em công thức tính thể tích khối chóp").
4. Học sinh bấm nút "Gửi".
5. Hệ thống:
   - Hiển thị tin nhắn của học sinh lên bong bóng chat bên phải (Màu xanh).
   - Hiển thị hiệu ứng bong bóng AI đang gõ chữ ("AI Tutor đang suy nghĩ...") ở bên trái.
   - Backend gọi dịch vụ LangChain, truy vấn Vector Database để tìm kiếm các bài giảng, tài liệu liên quan đến "thể tích khối chóp" làm ngữ cảnh (RAG).
   - Truyền ngữ cảnh sạch và câu hỏi tới LLM để tạo câu trả lời.
6. Hệ thống thực hiện truyền tải câu trả lời dạng dòng chảy (Streaming) thời gian thực lên màn hình chat của học sinh (từng chữ hiện ra mượt mà).
7. Câu trả lời của AI hiển thị rõ ràng các bước tư duy, kèm theo các **Nguồn tham khảo (Citations)** ở phía dưới bong bóng chat (Ví dụ: `[Nguồn: Bài 2 - Thể tích khối đa diện - Sách giáo khoa hình học lớp 12]`).
8. Học sinh có thể click vào nguồn tham khảo này để hệ thống mở ra modal/màn hình xem chi tiết tài liệu bài học gốc liên quan.
9. Buổi trò chuyện được tự động lưu trữ và đồng bộ hóa lên đám mây dưới nền.

### **2.2. Luồng: Gửi câu hỏi bằng giọng nói (Voice Input)**

1. Tại màn hình chat, học sinh nhấn và giữ vào icon **Micro**.
2. Hệ thống hiển thị hiệu ứng sóng âm đang thu âm và yêu cầu học sinh nói câu hỏi của mình.
3. Học sinh nói câu hỏi (Ví dụ: "Lực hấp dẫn là gì?") và thả tay ra khỏi nút micro.
4. Hệ thống gọi API Speech-to-Text để chuyển đổi giọng nói của học sinh thành văn bản tiếng Việt có dấu chính xác.
5. Hệ thống hiển thị đoạn văn bản vừa chuyển đổi vào ô nhập liệu để học sinh kiểm tra lại.
6. Học sinh nhấn nút "Gửi" và luồng xử lý tiếp theo diễn ra tương tự luồng chính.

### **2.3. Luồng: Xử lý bộ lọc an toàn trẻ em (Content Moderation Exception)**

1. Học sinh cố tình nhập một câu hỏi chứa từ ngữ bạo lực, nhạy cảm hoặc vi phạm tiêu chuẩn cộng đồng lứa tuổi học sinh (Ví dụ: các nội dung bạo lực, ngôn ngữ tục tĩu).
2. Học viên bấm nút Gửi.
3. Backend kích hoạt bộ lọc kiểm duyệt nội dung (Content Safety Filter) ngay khi tiếp nhận tin nhắn.
4. Hệ thống phát hiện tin nhắn vi phạm chính sách an toàn.
5. Hệ thống:
   - Không chuyển câu hỏi này tới mô hình AI phân tích.
   - Bong bóng AI lập tức phản hồi tin nhắn cảnh báo mặc định: "Chào bạn, câu hỏi của bạn chứa nội dung chưa phù hợp với chính sách an toàn học tập của hệ thống. Chúng mình cùng trao đổi về các chủ đề học tập bổ ích khác nhé! 😊".
   - Ghi nhận nhật ký (Audit Log) vi phạm kèm ID học sinh để phục vụ báo cáo giám sát của phụ huynh/admin.

### **2.4. Luồng chính: Đổi tên phiên trò chuyện (Rename Chat Session - Update Flow)**

1. Tại tab "AI Tutor" của Mobile App, học sinh nhấn giữ hoặc click vào dấu ba chấm ở cạnh phiên trò chuyện cần đổi tên trong danh sách lịch sử.
2. Hệ thống hiển thị menu lựa chọn: "Đổi tên" hoặc "Xóa cuộc trò chuyện". Học sinh chọn **"Đổi tên"**.
3. Giao diện hiển thị một hộp thoại nhập tên mới với giá trị mặc định là tên phiên hiện tại.
4. Học sinh chỉnh sửa tên theo mong muốn (Ví dụ: sửa "Toán học" thành "Ôn thi Đại số Chương 1") và bấm "Lưu".
5. Hệ thống cập nhật tên mới của phiên trong cơ sở dữ liệu và tải lại giao diện danh sách lịch sử với tên mới ngay lập tức.

### **2.5. Luồng chính: Xóa phiên trò chuyện khỏi lịch sử (Delete Chat Session - Delete Flow)**

1. Từ menu ba chấm của phiên trò chuyện, học sinh chọn **"Xóa cuộc trò chuyện"**.
2. Giao diện hiển thị hộp thoại xác nhận: "Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Toàn bộ lịch sử tin nhắn sẽ bị xóa vĩnh viễn khỏi thiết bị và máy chủ của bạn."
3. Học sinh bấm "Xác nhận".
4. Hệ thống thực hiện:
   - Gửi yêu cầu xóa lên server. Backend tiến hành xóa vĩnh viễn (hard delete) bản ghi phiên trò chuyện (`ChatSession`) và toàn bộ các tin nhắn liên quan (`ChatMessage`) trong cơ sở dữ liệu.
   - Cập nhật lại giao diện danh sách, ẩn cuộc trò chuyện vừa xóa và đưa học sinh về màn hình chào mừng trống.

---

## **3. Tiêu chí Chấp nhận (Acceptance Criteria)**

### **AC-01: Giao diện chat trực quan và đồng bộ lịch sử**

- **Given:** Học sinh truy cập vào tab AI Tutor.
- **When:** Giao diện được tải.
- **Then:**
  - Phải hiển thị danh sách các cuộc trò chuyện cũ theo môn học rõ ràng.
  - Cuộc trò chuyện gần nhất phải được tự động tải lên đầu danh sách và hiển thị đầy đủ lịch sử tin nhắn cũ giữa học sinh và AI.

### **AC-02: Phản hồi AI Streaming mượt mà tốc độ cao**

- **Given:** Học sinh đã nhấn gửi câu hỏi thành công.
- **When:** AI bắt đầu trả về dữ liệu.
- **Then:**
  - Thời gian trễ (latency) từ lúc nhấn gửi đến lúc chữ đầu tiên của AI xuất hiện trên màn hình phải dưới 2 giây.
  - Văn bản phản hồi phải chảy ra mượt mà dạng streaming (chữ chạy liên tục) chứ không hiển thị cục bộ một khối lớn sau thời gian đợi dài.

### **AC-03: Trích dẫn nguồn (RAG Citations) chính xác và nhấn vào được**

- **Given:** AI Tutor trả lời câu hỏi dựa trên tài liệu bài học có sẵn trong hệ thống.
- **When:** Hiển thị bong bóng chat của AI.
- **Then:**
  - Phải hiển thị danh sách nguồn tham khảo (Citations) rõ ràng ở cuối tin nhắn.
  - Khi học sinh click vào link nguồn tham khảo, hệ thống phải mở ra đúng trang tài liệu bài học thô đó trong app để học sinh đọc sâu hơn.

### **AC-04: Kiểm duyệt an toàn trẻ em hoạt động tuyệt đối chính xác**

- **Given:** Học sinh gửi câu hỏi chứa từ ngữ tục tĩu hoặc các chủ đề nhạy cảm không thuộc phạm vi giáo dục.
- **When:** Hệ thống chạy bộ lọc Content Safety.
- **Then:**
  - Phải chặn đứng câu hỏi và hiển thị tin nhắn từ chối khéo léo theo mẫu quy định.
  - Không được để lọt bất kỳ câu trả lời nhạy cảm hoặc nguy hại nào từ LLM đến học sinh.

### **AC-05: Chuyển đổi giọng nói tiếng Việt chuẩn xác (Speech-to-Text)**

- **Given:** Học sinh sử dụng chức năng Micro nói bằng tiếng Việt (giọng Bắc, Trung hoặc Nam).
- **When:** Thả tay hoàn thành thu âm.
- **Then:** Hệ thống phải chuyển đổi thành văn bản tiếng Việt chính xác trên 90%, hiển thị rõ ràng có dấu trong ô nhập liệu.

### **AC-06: Đổi tên phiên trò chuyện thành công**

- **Given:** Tôi đang mở danh sách lịch sử cuộc trò chuyện.
- **When:** Tôi đổi tên một cuộc trò chuyện từ "Toán học" thành "Học về đạo hàm" và lưu lại.
- **Then:**
  - Tên cuộc trò chuyện đó trên danh sách lịch sử phải đổi thành "Học về đạo hàm".
  - Hệ thống lưu chính xác tên mới vào cơ sở dữ liệu.

### **AC-07: Xóa cuộc trò chuyện thành công**

- **Given:** Tôi có cuộc trò chuyện "Toán học" không còn cần thiết.
- **When:** Tôi chọn xóa cuộc trò chuyện này và xác nhận đồng ý.
- **Then:**
  - Cuộc trò chuyện này phải biến mất hoàn toàn khỏi danh sách lịch sử của tôi.
  - Toàn bộ các tin nhắn của cuộc trò chuyện đó phải bị xóa sạch khỏi cơ sở dữ liệu, không thể phục hồi hoặc tìm kiếm lại.

---

## **4. Đặc tả dữ liệu**

| Tên trường                           | Bắt buộc?     | Ràng buộc dữ liệu (Validation Rules)                                                                                                                  | Ghi chú / Trạng thái mặc định                                                               |
| --------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Môn học lựa chọn**          | Có             | \- Phải chọn một trong các môn học có sẵn trong hệ thống (Toán học, Vật lý, Hóa học, Tiếng Anh, Sinh học...)                            | Mặc định: Toán học.                                                                          |
| **Câu hỏi văn bản**           | Không          | \- Định dạng văn bản Unicode- Độ dài tối đa 1000 ký tự                                                                                        | Học sinh nhập trực tiếp vào ô chat. Mặc định: Trống.                                    |
| **Tệp ghi âm giọng nói**      | Không          | \- Định dạng âm thanh tương thích: `.wav`, `.webm`, `.m4a`- Thời lượng ghi âm tối đa: 120 giây (2 phút)- Dung lượng tối đa: 5 MB | Hệ thống thu âm trực tiếp qua Micro trên thiết bị di động. Mặc định: Trống.         |
| **Phản hồi của AI**            | Chỉ hiển thị | \- Định dạng văn bản Unicode chuẩn RAG (hỗ trợ Markdown)                                                                                          | Dữ liệu dạng dòng chảy (streaming) hiển thị trên giao diện trò chuyện.                 |
| **Nguồn tài liệu trích dẫn** | Chỉ hiển thị | \- Danh sách các liên kết/tên tài liệu bóc tách được từ Vector Database                                                                      | Hiển thị dưới bong bóng chat của AI để học sinh click vào xem chi tiết bài học gốc. |
