# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## Hệ thống AI Tutor - Phiên bản sản phẩm mở rộng

| Thuộc tính | Giá trị |
|---|---|
| Tên dự án | AI Tutor |
| Phiên bản tài liệu | 2.0 |
| Trạng thái | Baseline đề xuất để team phê duyệt |
| Mô hình phát triển | Agile Scrum |
| Thời gian triển khai | Phát triển theo nhiều Sprint, ưu tiên hoàn thiện sản phẩm theo milestone |
| Quy mô đội ngũ | 4 người: Backend, Frontend, AI/RAG, QA/DevOps |
| Actor chính | Học sinh, Giáo viên, Quản trị viên |
| Phạm vi phát hành | Sản phẩm AI Tutor mở rộng, không giới hạn ở bản tối thiểu |

---

## 1. Giới thiệu

### 1.1. Mục đích tài liệu

Tài liệu này mô tả phạm vi, yêu cầu nghiệp vụ, yêu cầu chức năng, yêu cầu phi chức năng, mô hình dữ liệu và tiêu chí nghiệm thu cho phiên bản sản phẩm mở rộng của hệ thống AI Tutor.

Tài liệu là baseline để:

- Thống nhất phạm vi giữa bốn thành viên dự án.
- Tạo Product Backlog, User Story, Task và Test Case.
- Quản lý mở rộng chức năng theo milestone mà không cắt bỏ định hướng sản phẩm ban đầu.
- Làm căn cứ nghiệm thu nội bộ, kiểm thử tích hợp và chuẩn bị phát hành.

### 1.2. Mục tiêu sản phẩm

AI Tutor là nền tảng hỗ trợ học tập cá nhân hóa cho học sinh, tập trung vào bốn giá trị chính:

1. Học sinh có thể hỏi đáp với gia sư AI dựa trên tài liệu học tập đã được kiểm duyệt.
2. Học sinh có thể làm bài trắc nghiệm và nhận kết quả ngay.
3. Học sinh được ghi nhận XP để tăng động lực học tập.
4. Giáo viên và quản trị viên có thể quản lý nội dung, tài khoản và theo dõi số liệu cơ bản.

### 1.3. Đối tượng sử dụng tài liệu

- Backend Developer.
- Frontend Developer.
- AI Prompt Engineer/DevOps.
- Người phụ trách sản phẩm hoặc giảng viên hướng dẫn.
- Tester nội bộ của nhóm.

### 1.4. Thuật ngữ

| Thuật ngữ | Giải thích |
|---|---|
| AI Tutor | Gia sư AI tương tác với học sinh qua hội thoại |
| RAG | Retrieval-Augmented Generation, sinh câu trả lời dựa trên dữ liệu được truy xuất |
| Chunk | Đoạn văn bản nhỏ được tách từ tài liệu để tìm kiếm ngữ nghĩa |
| Citation | Thông tin nguồn được AI sử dụng để tạo câu trả lời |
| XP | Điểm kinh nghiệm nhận được từ hoạt động học tập |
| Baseline | Phạm vi yêu cầu đã được thống nhất để phát triển và nghiệm thu |
| RBAC | Kiểm soát quyền truy cập dựa trên vai trò |
| Attempt | Một lần học sinh thực hiện bài trắc nghiệm |
| Sprint | Chu kỳ phát triển kéo dài 2 tuần |

---

## 2. Phạm vi dự án

### 2.1. Phạm vi lõi bắt buộc - Must Have

- Đăng nhập, đăng xuất và phân quyền `STUDENT`, `TEACHER`, `ADMIN`.
- Quản lý hồ sơ học sinh ở mức cơ bản.
- Học sinh trò chuyện với AI Tutor theo phiên hội thoại.
- AI sử dụng RAG từ tài liệu đã xử lý và trả về nguồn tham khảo khi có.
- Giáo viên/Admin tải tài liệu lên và theo dõi trạng thái xử lý.
- Giáo viên/Admin tạo, sửa, kích hoạt hoặc vô hiệu hóa bài trắc nghiệm.
- Học sinh làm bài, nộp bài và xem kết quả.
- Ghi nhận XP sau khi hoàn thành hoạt động hợp lệ.
- Hiển thị bảng xếp hạng học sinh theo tổng XP.
- Học sinh quản lý lịch học cơ bản.
- Dashboard cơ bản cho học sinh và Admin/Giáo viên.
- Triển khai môi trường tích hợp/staging có dữ liệu mẫu và có thể dùng để trình bày.

### 2.2. Phạm vi mở rộng bắt buộc theo milestone - Must Have mở rộng

- Sự kiện lịch cá nhân như kỳ thi, bài tập và lời nhắc.
- Bộ lọc lịch sử hội thoại theo môn học.
- Sinh câu hỏi trắc nghiệm bằng AI, có bước giáo viên duyệt trước khi phát hành.
- Báo cáo tổng hợp đơn giản theo khoảng thời gian.
- Streak học tập cơ bản.
- Chức năng quên mật khẩu qua email.
- Nhắc lịch bằng push notification hoặc email.
- OCR tài liệu scan và xử lý ảnh/bảng ở mức khả thi.
- Câu hỏi nhiều đáp án, tự luận hoặc upload bài làm.
- Badge, đổi quà, shop và gamification nâng cao.
- Xuất PDF/Excel và phân tích học tập nâng cao.

Các chức năng mở rộng không bị loại khỏi scope. Team triển khai theo milestone, phụ thuộc kỹ thuật và mức độ rủi ro, nhưng Product Backlog phải giữ chúng như yêu cầu hợp lệ của sản phẩm.

### 2.3. Phạm vi định hướng sau baseline hiện tại

- Actor Phụ huynh và Super Admin.
- Thanh toán, gói thuê bao và hóa đơn.
- Lớp học trực tuyến, video call hoặc livestream.
- Chấm bài tự luận hoàn chỉnh bằng AI.
- Mạng xã hội, nhắn tin giữa người dùng.
- Hệ thống badge, cửa hàng quà tặng hoặc gamification nâng cao.
- Quản lý trường, lớp, khóa học và chương trình học phức tạp.
- Phân tích học tập dự đoán hoặc dashboard BI nâng cao.
- Ứng dụng mobile native.
- SSO, đăng nhập mạng xã hội và MFA.
- Fine-tune mô hình AI riêng.
- Hỗ trợ đa tenant hoặc nhiều tổ chức độc lập.

Các hạng mục trên không bị cắt bỏ khỏi định hướng sản phẩm. Chúng được quản lý như epic sau baseline hiện tại, cần thiết kế chi tiết thêm về nghiệp vụ, bảo mật, vận hành và kiểm thử trước khi triển khai.

### 2.4. Tiêu chí thành công của sản phẩm

- Ba actor đăng nhập và chỉ truy cập được chức năng đúng vai trò.
- Học sinh hoàn thành được luồng: đăng nhập -> hỏi AI -> xem nguồn -> làm quiz -> nhận XP -> xem thứ hạng.
- Giáo viên hoàn thành được luồng: đăng nhập -> tải tài liệu -> tài liệu được xử lý -> tạo/publish quiz -> xem kết quả cơ bản.
- Admin quản lý được trạng thái tài khoản và xem số liệu tổng quan.
- Các chức năng mở rộng được đưa vào backlog, có tiêu chí nghiệm thu và được triển khai theo milestone.
- Hệ thống hoạt động ổn định trên môi trường staging/phát hành nội bộ.
- Không có lỗi mức Critical/Blocker trong các luồng nghiệp vụ chính.

---

## 3. Actor và phân quyền

### 3.1. Học sinh - STUDENT

- Quản lý thông tin cá nhân được cho phép.
- Quản lý lịch học cá nhân.
- Tạo và xem lịch sử hội thoại của chính mình.
- Hỏi AI Tutor và xem citation.
- Xem và thực hiện quiz đang hoạt động phù hợp với khối lớp.
- Xem kết quả, XP, streak và leaderboard.
- Không được tạo tài liệu hoặc quiz.
- Không được truy cập dữ liệu riêng của học sinh khác.

### 3.2. Giáo viên - TEACHER

- Tải lên và quản lý tài liệu do mình tạo.
- Theo dõi trạng thái xử lý tài liệu.
- Tạo, sửa và quản lý quiz do mình tạo.
- Xem kết quả tổng hợp quiz ở mức cơ bản.
- Xem dashboard nội dung và hoạt động học tập tổng hợp.
- Không được thay đổi vai trò tài khoản hoặc cấu hình hệ thống.

### 3.3. Quản trị viên - ADMIN

- Quản lý tài khoản người dùng và trạng thái hoạt động.
- Quản lý toàn bộ tài liệu và quiz.
- Xem dashboard tổng quan hệ thống.
- Có thể khóa/mở khóa tài khoản.
- Mọi Admin trong baseline hiện tại có cùng mức quyền; Super Admin là epic mở rộng nếu cần phân cấp quản trị sâu hơn.

### 3.4. Ma trận quyền

| Chức năng | Student | Teacher | Admin |
|---|:---:|:---:|:---:|
| Đăng nhập/đăng xuất | Có | Có | Có |
| Cập nhật hồ sơ cá nhân | Có | Có | Có |
| Quản lý lịch cá nhân | Có | Không | Không |
| Chat với AI Tutor | Có | Tùy chọn | Tùy chọn |
| Làm quiz | Có | Không | Không |
| Xem XP/leaderboard | Có | Có | Có |
| Tải và xử lý tài liệu | Không | Có | Có |
| Tạo/publish quiz | Không | Có | Có |
| Xem thống kê quiz | Không | Có | Có |
| Quản lý người dùng | Không | Không | Có |
| Xem dashboard hệ thống | Không | Giới hạn | Có |

---

## 4. Giả định và ràng buộc

### 4.1. Giả định

- Hệ thống hướng tới sản phẩm học tập mở rộng, không chỉ phục vụ trình bày ngắn hạn.
- Dữ liệu học tập chủ yếu là tiếng Việt.
- Giáo viên/Admin chịu trách nhiệm về tính hợp lệ của tài liệu và câu hỏi.
- Dịch vụ LLM và embedding được cung cấp qua API bên thứ ba.
- Tài liệu đầu vào ưu tiên PDF có text; OCR và xử lý tài liệu scan được triển khai theo milestone mở rộng.
- Mỗi tài khoản có một vai trò chính trong baseline hiện tại; mở rộng đa vai trò cần thiết kế RBAC chi tiết hơn.
- `subject` và `gradeLevel` được lưu dạng chuỗi để giảm số bảng và nghiệp vụ quản trị danh mục.

### 4.2. Ràng buộc kỹ thuật

- Backend sử dụng Java, Spring Boot và Spring Data JPA.
- Database quan hệ ưu tiên PostgreSQL.
- Thay đổi schema phải được quản lý bằng Flyway hoặc Liquibase.
- Không dùng `spring.jpa.hibernate.ddl-auto=update` cho môi trường dùng chung, staging hoặc production.
- Frontend sử dụng framework hiện có của team và giao tiếp qua REST API.
- Hệ thống được đóng gói bằng Docker; môi trường triển khai có cấu hình qua biến môi trường.
- Vector search có thể sử dụng `pgvector` hoặc một vector database do team lựa chọn.

### 4.3. Nguyên tắc quản lý phạm vi mở rộng

- Mọi yêu cầu mới phải được đưa vào Product Backlog và đánh giá lại độ ưu tiên.
- Không loại bỏ feature khỏi SRS chỉ vì khó hoặc vượt phạm vi milestone đầu; nếu chưa triển khai ngay, feature được quản lý bằng milestone/epic.
- Thay đổi ảnh hưởng database, API hoặc luồng nghiệp vụ chính phải được cả bốn thành viên hoặc người phụ trách sản phẩm xác nhận.

---

## 5. Yêu cầu chức năng

### 5.1. Xác thực và tài khoản

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-AUTH-01 | Hệ thống cho phép người dùng đăng nhập bằng email và mật khẩu | Must |
| FR-AUTH-02 | Hệ thống phát hành token/phiên đăng nhập và cho phép đăng xuất | Must |
| FR-AUTH-03 | Hệ thống từ chối đăng nhập nếu tài khoản bị vô hiệu hóa | Must |
| FR-AUTH-04 | Hệ thống phân quyền API và giao diện theo `STUDENT`, `TEACHER`, `ADMIN` | Must |
| FR-AUTH-05 | Admin có thể xem danh sách, tìm kiếm và khóa/mở khóa tài khoản | Must |
| FR-AUTH-06 | Mật khẩu phải được băm; không lưu hoặc ghi log mật khẩu thô | Must |
| FR-AUTH-07 | Chức năng quên mật khẩu qua email | Should |

### 5.2. Hồ sơ học sinh

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-PRO-01 | Hệ thống lưu hồ sơ học sinh liên kết một-một với tài khoản | Must |
| FR-PRO-02 | Học sinh xem và cập nhật các trường hồ sơ được cho phép | Must |
| FR-PRO-03 | Hệ thống hiển thị tổng XP, cấp độ và streak hiện tại | Must |
| FR-PRO-04 | Email đăng nhập chỉ lưu tại bảng `User`, không lặp lại ở hồ sơ học sinh | Must |

### 5.3. Lịch học

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-SCH-01 | Học sinh tạo lịch học gồm môn, thứ, tiết/buổi và ghi chú | Must |
| FR-SCH-02 | Học sinh xem, sửa và xóa lịch của chính mình | Must |
| FR-SCH-03 | Hệ thống kiểm tra giá trị ngày trong tuần từ 1 đến 7 | Must |
| FR-SCH-04 | Học sinh tạo sự kiện có thời gian bắt đầu/kết thúc và loại sự kiện | Should |
| FR-SCH-05 | Nhắc lịch bằng push notification/email | Should |

### 5.4. AI Tutor và hội thoại

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-CHAT-01 | Học sinh tạo phiên hội thoại mới theo môn học | Must |
| FR-CHAT-02 | Học sinh gửi câu hỏi dạng văn bản và nhận câu trả lời AI | Must |
| FR-CHAT-03 | Hệ thống lưu tin nhắn theo đúng thứ tự thời gian | Must |
| FR-CHAT-04 | Học sinh xem lại danh sách và nội dung phiên chat của chính mình | Must |
| FR-CHAT-05 | AI truy xuất các chunk phù hợp trước khi sinh câu trả lời | Must |
| FR-CHAT-06 | Câu trả lời hiển thị citation khi có nguồn phù hợp | Must |
| FR-CHAT-07 | AI phải nêu rõ không đủ dữ liệu khi retrieval không đạt ngưỡng tin cậy | Must |
| FR-CHAT-08 | Hệ thống không cho phép người dùng xem phiên chat của người khác | Must |
| FR-CHAT-09 | Học sinh đóng hoặc đổi tiêu đề phiên chat | Should |
| FR-CHAT-10 | Nhập/xuất giọng nói | Should |

### 5.5. Tài liệu và RAG

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-DOC-01 | Giáo viên/Admin tải lên tài liệu với định dạng được hỗ trợ | Must |
| FR-DOC-02 | Hệ thống lưu metadata: tên file, kích thước, loại, môn, khối và người tạo | Must |
| FR-DOC-03 | Hệ thống hiển thị trạng thái `PROCESSING`, `SUCCESS`, `FAILED` | Must |
| FR-DOC-04 | Pipeline trích xuất text, chia chunk, tạo embedding và lưu kết quả | Must |
| FR-DOC-05 | Chỉ tài liệu có trạng thái `SUCCESS` được sử dụng cho retrieval | Must |
| FR-DOC-06 | Giáo viên quản lý tài liệu của mình; Admin quản lý mọi tài liệu | Must |
| FR-DOC-07 | Hệ thống lưu thông báo lỗi xử lý đủ để chẩn đoán nội bộ | Should |
| FR-DOC-08 | OCR tài liệu scan và xử lý ảnh/bảng phức tạp | Should |

### 5.6. Quiz và luyện tập

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-QUIZ-01 | Giáo viên/Admin tạo quiz gồm tiêu đề, môn, khối, độ khó và thời gian | Must |
| FR-QUIZ-02 | Mỗi quiz có nhiều câu hỏi trắc nghiệm một đáp án đúng | Must |
| FR-QUIZ-03 | Mỗi câu hỏi có tối thiểu 2 phương án và đúng 1 đáp án đúng | Must |
| FR-QUIZ-04 | Người tạo có thể sửa quiz trước khi kích hoạt | Must |
| FR-QUIZ-05 | Học sinh chỉ thấy quiz đang hoạt động và phù hợp khối lớp | Must |
| FR-QUIZ-06 | Hệ thống ghi nhận đáp án, thời gian và tính điểm khi nộp bài | Must |
| FR-QUIZ-07 | Học sinh xem điểm, số câu đúng và đáp án/giải thích sau khi nộp | Must |
| FR-QUIZ-08 | Hệ thống không chấp nhận nộp lại cùng một attempt đã hoàn tất | Must |
| FR-QUIZ-09 | AI có thể đề xuất quiz, nhưng giáo viên phải duyệt trước khi kích hoạt | Should |
| FR-QUIZ-10 | Câu hỏi nhiều đáp án, tự luận hoặc upload bài làm | Should |

### 5.7. XP và bảng xếp hạng

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-XP-01 | Hệ thống cộng XP khi học sinh nộp quiz hợp lệ | Must |
| FR-XP-02 | Mỗi sự kiện chỉ được cộng XP một lần | Must |
| FR-XP-03 | Hệ thống lưu lịch sử giao dịch XP để truy vết | Must |
| FR-XP-04 | Hệ thống cập nhật `totalXP` của học sinh sau giao dịch thành công | Must |
| FR-XP-05 | Leaderboard sắp xếp theo tổng XP giảm dần | Must |
| FR-XP-06 | Khi bằng XP, ưu tiên người đạt mức XP đó sớm hơn | Should |
| FR-XP-07 | Badge, đổi quà và shop | Should |

### 5.8. Dashboard và báo cáo

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-REP-01 | Dashboard học sinh hiển thị XP, level, streak, quiz gần đây và lịch học | Must |
| FR-REP-02 | Dashboard giáo viên hiển thị số tài liệu, quiz và lượt làm quiz liên quan | Must |
| FR-REP-03 | Dashboard Admin hiển thị tổng user, tài liệu, quiz và lượt chat/attempt | Must |
| FR-REP-04 | Giáo viên/Admin xem bảng kết quả theo quiz | Must |
| FR-REP-05 | Xuất PDF/Excel và phân tích nâng cao | Should |

---

## 6. User Story và tiêu chí nghiệm thu

### US-01 - Đăng nhập

**Là** người dùng, **tôi muốn** đăng nhập bằng email và mật khẩu **để** truy cập chức năng theo vai trò.

**Acceptance Criteria:**

- Với tài khoản hợp lệ và đang hoạt động, đăng nhập thành công và trả về thông tin vai trò.
- Với mật khẩu sai, hệ thống trả thông báo chung và không tiết lộ tài khoản có tồn tại hay không.
- Với tài khoản bị khóa, hệ thống từ chối truy cập.
- API thuộc vai trò khác trả về `403 Forbidden`.

### US-02 - Quản lý tài khoản

**Là** Admin, **tôi muốn** xem và khóa/mở khóa tài khoản **để** kiểm soát quyền truy cập hệ thống.

**Acceptance Criteria:**

- Admin xem được danh sách có phân trang và tìm theo email/tên.
- Admin thay đổi được `isActive`.
- Người không phải Admin không truy cập được chức năng này.
- Admin không thể vô tình khóa chính tài khoản đang sử dụng nếu đây là Admin hoạt động cuối cùng của hệ thống.

### US-03 - Quản lý lịch học

**Là** học sinh, **tôi muốn** quản lý lịch học cá nhân **để** theo dõi kế hoạch học tập.

**Acceptance Criteria:**

- Học sinh tạo, xem, sửa và xóa lịch của mình.
- `dayOfWeek` chỉ nhận giá trị 1-7.
- Không thể sửa hoặc xóa lịch của học sinh khác.
- Lịch được hiển thị theo thứ và thứ tự tiết học.

### US-04 - Tạo phiên chat

**Là** học sinh, **tôi muốn** tạo một phiên chat theo môn **để** đặt câu hỏi cho AI Tutor.

**Acceptance Criteria:**

- Phiên mới có `studentId`, môn, tiêu đề, trạng thái và thời gian tạo.
- Học sinh xem được danh sách phiên của chính mình theo thời gian mới nhất.
- Phiên chat của học sinh khác không thể truy cập bằng cách thay ID trên URL/API.

### US-05 - Hỏi AI bằng RAG

**Là** học sinh, **tôi muốn** nhận câu trả lời dựa trên tài liệu học **để** có thông tin đáng tin cậy hơn.

**Acceptance Criteria:**

- Câu hỏi và câu trả lời được lưu vào đúng phiên.
- Pipeline retrieval trả về các chunk phù hợp theo môn/khối nếu có.
- Câu trả lời có citation gồm tối thiểu tên tài liệu và vị trí/chunk tham chiếu.
- Khi không có nguồn đủ phù hợp, AI nêu rõ giới hạn thay vì bịa nguồn.
- Lỗi LLM được xử lý và hiển thị thông báo có thể thử lại.

### US-06 - Tải tài liệu

**Là** giáo viên, **tôi muốn** tải tài liệu học tập lên **để** bổ sung nguồn cho AI Tutor.

**Acceptance Criteria:**

- Hệ thống kiểm tra định dạng và kích thước trước khi xử lý.
- Tài liệu được tạo với trạng thái `PROCESSING`.
- Xử lý thành công chuyển sang `SUCCESS` và tạo các `DocumentChunk`.
- Xử lý lỗi chuyển sang `FAILED`, không được dùng cho retrieval.
- Người tải lên và Admin xem được trạng thái tài liệu.

### US-07 - Tạo quiz

**Là** giáo viên, **tôi muốn** tạo quiz có câu hỏi và đáp án **để** học sinh luyện tập.

**Acceptance Criteria:**

- Quiz lưu được thông tin chung, danh sách câu hỏi và phương án.
- Mỗi câu hỏi có đúng một đáp án được đánh dấu đúng.
- Quiz không hợp lệ không thể kích hoạt.
- Giáo viên chỉ sửa nội dung do mình tạo; Admin có thể sửa mọi quiz.

### US-08 - Làm và nộp quiz

**Là** học sinh, **tôi muốn** làm và nộp quiz **để** biết kết quả học tập.

**Acceptance Criteria:**

- Hệ thống tạo một `QuizAttempt` khi bắt đầu hoặc nộp bài theo thiết kế API thống nhất.
- Mỗi đáp án được lưu gắn với attempt và câu hỏi.
- Điểm được tính phía server, không tin điểm gửi từ client.
- Sau khi nộp, attempt có thời gian, điểm và trạng thái hoàn tất.
- Hệ thống trả kết quả và giải thích nếu câu hỏi có giải thích.

### US-09 - Nhận XP

**Là** học sinh, **tôi muốn** nhận XP sau hoạt động học tập **để** theo dõi tiến bộ.

**Acceptance Criteria:**

- Nộp quiz hợp lệ ghi nhận `xpEarned` trên `QuizAttempt` và cập nhật `Student.totalXP`.
- Cùng một attempt không thể cộng XP hai lần.
- `totalXP` và giao dịch XP được cập nhật trong cùng transaction database.
- XP hiển thị trên dashboard sau khi cập nhật.

### US-10 - Xem leaderboard

**Là** học sinh, **tôi muốn** xem bảng xếp hạng **để** so sánh tiến độ học tập.

**Acceptance Criteria:**

- Danh sách hiển thị tên, tổng XP, level và thứ hạng.
- Mặc định trả tối đa số lượng bản ghi được cấu hình, ví dụ top 20.
- Không hiển thị email, địa chỉ hoặc dữ liệu cá nhân nhạy cảm.

### US-11 - Xem dashboard học sinh

**Là** học sinh, **tôi muốn** xem tóm tắt hoạt động **để** biết việc cần học và kết quả gần đây.

**Acceptance Criteria:**

- Hiển thị XP, level, streak, lịch học và các quiz gần đây.
- Dữ liệu chỉ thuộc về học sinh đang đăng nhập.
- Trạng thái trống được hiển thị hợp lý khi chưa có dữ liệu.

### US-12 - Xem dashboard quản trị

**Là** Admin/Giáo viên, **tôi muốn** xem số liệu tổng quan **để** theo dõi hoạt động hệ thống.

**Acceptance Criteria:**

- Admin thấy số lượng user, tài liệu, quiz và attempt.
- Giáo viên chỉ thấy số liệu liên quan đến nội dung của mình khi áp dụng.
- Dashboard tải được với dữ liệu mẫu trong mục tiêu hiệu năng của baseline hiện tại.

### US-13 - Cập nhật hồ sơ học sinh

**Là** học sinh, **tôi muốn** xem và cập nhật hồ sơ cá nhân **để** thông tin học tập của tôi luôn chính xác.

**Acceptance Criteria:**

- Học sinh xem được hồ sơ liên kết với tài khoản đang đăng nhập.
- Học sinh chỉ sửa được các trường được cho phép như tên hiển thị, khối lớp và tùy chọn học tập.
- Học sinh không thể tự thay đổi role, tổng XP hoặc trạng thái tài khoản.
- Email đăng nhập được lấy từ `User`, không lấy từ trường email trùng trong `Student` cũ.

### US-14 - Xem kết quả quiz

**Là** giáo viên, **tôi muốn** xem kết quả tổng hợp của quiz mình tạo **để** đánh giá mức độ hoàn thành của học sinh.

**Acceptance Criteria:**

- Giáo viên xem được số lượt làm, điểm trung bình và danh sách kết quả của quiz do mình tạo.
- Admin xem được kết quả của mọi quiz.
- Học sinh không truy cập được báo cáo tổng hợp của người khác.
- Danh sách kết quả hỗ trợ phân trang và không hiển thị dữ liệu cá nhân không cần thiết.

---

## 7. Quy tắc nghiệp vụ

| ID | Quy tắc |
|---|---|
| BR-01 | Email đăng nhập là duy nhất, không phân biệt chữ hoa/chữ thường |
| BR-02 | Mỗi `Student` thuộc đúng một `User` có role `STUDENT` |
| BR-03 | Mỗi user có một role chính trong baseline hiện tại |
| BR-04 | Chỉ user đang hoạt động mới được xác thực |
| BR-05 | Teacher/Admin mới được tạo tài liệu và quiz |
| BR-06 | Chỉ tài liệu `SUCCESS` được sử dụng trong RAG |
| BR-07 | Quiz chỉ được kích hoạt khi có ít nhất một câu hỏi hợp lệ |
| BR-08 | Câu hỏi trắc nghiệm một đáp án đúng là loại câu hỏi mặc định; các loại câu hỏi mở rộng phải có rule chấm điểm riêng |
| BR-09 | Điểm quiz được tính ở backend |
| BR-10 | Một `QuizAttempt` hoàn tất chỉ được ghi nhận XP một lần thông qua `xpEarned` |
| BR-11 | Tổng XP không được âm |
| BR-12 | User chỉ truy cập dữ liệu thuộc quyền sở hữu hoặc phạm vi vai trò của mình |
| BR-13 | Xóa dữ liệu có liên kết ưu tiên soft delete/vô hiệu hóa thay vì xóa vật lý |

### 7.1. Công thức điểm và XP mặc định

- `score = correctAnswers / totalQuestions * 100`.
- Làm tròn điểm đến 2 chữ số thập phân.
- XP cơ bản cho một attempt hoàn tất: `10 + floor(score / 10)`.
- XP tối đa mặc định từ một attempt: 20.
- Công thức phải đặt trong cấu hình/service để có thể điều chỉnh, không hard-code ở frontend.

---

## 8. Mô hình dữ liệu

### 8.1. Nguyên tắc đồng bộ database hiện có

ERD dưới đây phản ánh schema hiện tại trong `V1__init_schema.sql` của codebase. Tài liệu lấy database đang triển khai làm baseline để tránh lệch giữa SRS, entity JPA và migration.

- Ba role chính được lưu ở `users.role`: `STUDENT`, `TEACHER`, `ADMIN`.
- Hồ sơ học sinh và giáo viên tách thành `students` và `teachers`, mỗi bảng liên kết một-một với `users`.
- Quản lý lớp học đã có trong schema qua `school_classes` và `teacher_class_assignments`.
- Quiz hiện lưu lựa chọn đáp án trong `quiz_questions.options` dạng JSONB; đáp án học sinh lưu ở `quiz_attempt_answers`.
- XP hiện được lưu ở `students.total_xp` và `quiz_attempts.xp_earned`; nếu cần ledger truy vết XP đa nguồn, team sẽ bổ sung `xp_transactions` ở migration sau.
- `students.email` là dữ liệu trùng với `users.email`; không dùng làm nguồn email đăng nhập và nên loại bỏ hoặc bỏ qua ở migration dọn nợ kỹ thuật sau.

### 8.2. ERD chốt

```mermaid
erDiagram
    User {
        uuid id PK
        string username UK
        string email UK
        string passwordHash
        string fullName
        date dateOfBirth
        string phoneNumber
        string avatarUrl
        string gender
        string role
        boolean isActive
        boolean isDeleted
        timestamptz createdAt
        timestamptz updatedAt
    }

    Student {
        uuid id PK
        uuid userId FK
        string studentCode UK
        string gradeLevel
        string className
        string schoolName
        string email
        text address
        uuid classId FK
        int totalXP
        int currentLevel
        int currentStreak
        int longestStreak
        timestamptz lastActivityDate
        jsonb studyPreferences
        string parentName
        string parentEmail
        string parentPhone
    }

    Teacher {
        uuid id PK
        uuid userId FK
        string teacherCode UK
        string department
        string subjectTaught
        string schoolName
    }

    SchoolClass {
        uuid id PK
        string name
        string gradeLevel
        string schoolName
        string academicYear
        uuid homeroomTeacherId FK
        timestamptz createdAt
    }

    TeacherClassAssignment {
        uuid id PK
        uuid teacherId FK
        uuid classId FK
        string subject
        boolean isHomeroom
        timestamptz createdAt
    }

    CalendarEvent {
        uuid id PK
        uuid studentId FK
        string title
        text description
        timestamptz startDateTime
        timestamptz endDateTime
        string type
        string location
        boolean hasReminder
        int reminderMinutesBefore
        timestamptz createdAt
    }

    Schedule {
        uuid id PK
        uuid studentId FK
        string name
        boolean isActive
        timestamptz createdAt
    }

    ScheduleSlot {
        uuid id PK
        uuid scheduleId FK
        string subjectName
        int dayOfWeek
        time startTime
        time endTime
        string teacherName
        string room
        string scheduleType
        timestamptz createdAt
    }

    ChatSession {
        uuid id PK
        uuid studentId FK
        string subject
        string title
        string status
        timestamptz createdAt
        timestamptz lastMessageAt
    }

    ChatMessage {
        uuid id PK
        uuid chatSessionId FK
        string senderType
        text content
        string audioUrl
        string intent
        jsonb citationLinks
        timestamptz createdAt
    }

    Document {
        uuid id PK
        uuid createdById FK
        string title
        string fileName
        string filePath
        long fileSize
        string fileType
        string subject
        string gradeLevel
        string status
        int progressPercentage
        timestamptz createdAt
    }

    DocumentChunk {
        uuid id PK
        uuid documentId FK
        int chunkIndex
        text content
        vector embedding
        jsonb metadata
        timestamptz createdAt
    }

    Quiz {
        uuid id PK
        uuid createdById FK
        string title
        string subject
        string gradeLevel
        string difficulty
        int timeLimit
        boolean isAiGenerated
        boolean isActive
        timestamptz createdAt
    }

    Question {
        uuid id PK
        uuid quizId FK
        text questionText
        jsonb options
        string correctOptionKey
        text explanation
        int orderIndex
        int points
        string topic
        timestamptz createdAt
    }

    QuizAttempt {
        uuid id PK
        uuid quizId FK
        uuid studentId FK
        float score
        int xpEarned
        int durationSeconds
        timestamptz submittedAt
    }

    AttemptAnswer {
        uuid id PK
        uuid attemptId FK
        uuid questionId FK
        string selectedOptionKey
        boolean isCorrect
    }

    Notification {
        uuid id PK
        uuid userId FK
        string title
        text message
        string type
        string link
        boolean isRead
        timestamptz createdAt
    }

    PasswordResetToken {
        uuid id PK
        string token UK
        uuid userId FK
        timestamp expiryDate
        boolean isUsed
        timestamp createdAt
    }

    ParentAlertMessage {
        uuid id PK
        uuid studentId FK
        uuid classId FK
        uuid senderUserId FK
        string body
        string channel
        string status
        string errorMessage
        timestamptz createdAt
    }

    ClassAlertSetting {
        uuid classId PK FK
        decimal scoreThreshold
        int inactivityDays
        int maxGapTopics
        string messageTemplate
        timestamptz updatedAt
        uuid updatedBy FK
    }

    User ||--o| Student : has_student_profile
    User ||--o| Teacher : has_teacher_profile
    Teacher ||--o{ SchoolClass : homeroom_for
    SchoolClass ||--o{ Student : contains
    Teacher ||--o{ TeacherClassAssignment : assigned
    SchoolClass ||--o{ TeacherClassAssignment : has_assignment
    Student ||--o{ CalendarEvent : owns
    Student ||--o{ Schedule : owns
    Schedule ||--o{ ScheduleSlot : contains
    Student ||--o{ ChatSession : starts
    ChatSession ||--o{ ChatMessage : contains
    User ||--o{ Document : uploads
    Document ||--o{ DocumentChunk : splits_into
    User ||--o{ Quiz : creates
    Quiz ||--o{ Question : contains
    Student ||--o{ QuizAttempt : performs
    Quiz ||--o{ QuizAttempt : receives
    QuizAttempt ||--o{ AttemptAnswer : contains
    Question ||--o{ AttemptAnswer : answers
    User ||--o{ Notification : receives
    User ||--o{ PasswordResetToken : resets_password
    Student ||--o{ ParentAlertMessage : has_alerts
    SchoolClass ||--o{ ParentAlertMessage : class_alerts
    User ||--o{ ParentAlertMessage : sends
    SchoolClass ||--o| ClassAlertSetting : configures
    User ||--o{ ClassAlertSetting : updates
```

### 8.3. Ràng buộc database quan trọng

- Unique index trên `lower(User.email)`.
- Unique trên `User.username`, `User.email`, `Student.userId`, `Student.studentCode`, `Teacher.userId` và `Teacher.teacherCode`.
- Unique trên `PasswordResetToken.token`.
- Unique trên tổ hợp lớp học `(schoolName, academicYear, name)`.
- Unique trên tổ hợp phân công giáo viên/lớp/môn `(teacherId, classId, subject)`.
- Unique trên `(DocumentChunk.documentId, chunkIndex)`.
- Unique trên `(AttemptAnswer.attemptId, questionId)`.
- Check constraint `User.role IN ('STUDENT', 'ADMIN', 'TEACHER')`.
- Check constraint `User.gender IN ('MALE', 'FEMALE', 'OTHER')`.
- Check constraint `ScheduleSlot.dayOfWeek BETWEEN 2 AND 8` theo convention hiện tại của codebase.
- Check constraint `CalendarEvent.type IN ('EVENT', 'EXAM', 'QUIZ', 'ASSIGNMENT')`.
- Check constraint `ChatSession.status IN ('OPEN', 'CLOSED')`, `ChatMessage.senderType IN ('STUDENT', 'AI')`.
- Check constraint `Document.status IN ('PROCESSING', 'SUCCESS', 'FAILED')`.
- Check constraint `Quiz.difficulty IN ('EASY', 'MEDIUM', 'HARD')`.
- Check constraint ngưỡng cảnh báo lớp: điểm trong `(0, 10]`, số ngày không hoạt động `0..365`, số chủ đề hổng kiến thức `1..50`.
- Index trên các khóa ngoại, `QuizAttempt.submittedAt`, `ChatSession(studentId, lastMessageAt)`, `DocumentChunk.documentId`.
- Vector index HNSW trên `DocumentChunk.embedding` dùng `vector_cosine_ops`.
- Trigger chặn update/delete lịch sử trên `quiz_attempts`, `chat_messages` và `parent_alert_messages` trừ khi bật cấu hình bảo trì dữ liệu.

### 8.4. Migration đề xuất

| Migration | Nội dung |
|---|---|
| `V1__init_schema.sql` | Schema hiện tại trong codebase: users, students, teachers, schedule, chat, quiz, document/RAG, class, notification, password reset và parent alert |
| Migration tương lai: `add_xp_transactions` | Tùy chọn nếu team cần ledger XP đa nguồn và truy vết ngoài `quiz_attempts.xp_earned` |
| Migration tương lai: `normalize_quiz_options` | Tùy chọn nếu team muốn tách `quiz_questions.options` JSONB thành bảng option riêng |
| Migration tương lai: `cleanup_student_email` | Tùy chọn để loại bỏ dữ liệu email trùng ở `students.email` |

---

## 9. API mức cao

API sử dụng prefix đề xuất `/api/v1`. Chi tiết request/response được quản lý bằng OpenAPI/Swagger trong source code.

| Nhóm | Endpoint chính đề xuất |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Users | `GET /users`, `PATCH /users/{id}/status` |
| Profile | `GET /students/me`, `PATCH /students/me` |
| Schedule | `GET/POST /schedules`, `PUT/DELETE /schedules/{id}` |
| Chat | `GET/POST /chat-sessions`, `GET /chat-sessions/{id}`, `POST /chat-sessions/{id}/messages` |
| Documents | `GET/POST /documents`, `GET /documents/{id}`, `DELETE /documents/{id}` |
| Quiz admin | `GET/POST /quizzes`, `PUT /quizzes/{id}`, `PATCH /quizzes/{id}/status` |
| Quiz student | `GET /quizzes/available`, `POST /quizzes/{id}/attempts`, `POST /attempts/{id}/submit` |
| Progress | `GET /students/me/progress`, `GET /leaderboard` |
| Dashboard | `GET /dashboard/student`, `GET /dashboard/teacher`, `GET /dashboard/admin` |

### 9.1. Chuẩn phản hồi lỗi

Mọi lỗi API nên trả cấu trúc thống nhất:

```json
{
  "timestamp": "2026-01-01T10:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "fieldErrors": {
    "email": "Email không đúng định dạng"
  },
  "traceId": "request-trace-id"
}
```

Frontend không phụ thuộc vào thông báo exception thô từ backend.

---

## 10. Yêu cầu AI và RAG

### 10.1. Pipeline xử lý tài liệu

1. Giáo viên/Admin tải file.
2. Backend kiểm tra loại file, kích thước và quyền.
3. Tài liệu được lưu với trạng thái `PROCESSING`.
4. Worker/service trích xuất text.
5. Text được chuẩn hóa và chia thành chunk có overlap.
6. Hệ thống tạo embedding và lưu `DocumentChunk`.
7. Thành công chuyển trạng thái sang `SUCCESS`; thất bại chuyển `FAILED`.

### 10.2. Pipeline trả lời

1. Kiểm tra quyền truy cập phiên chat.
2. Chuẩn hóa câu hỏi và xác định môn/khối từ ngữ cảnh.
3. Tạo embedding cho truy vấn.
4. Lấy top-K chunk và áp dụng ngưỡng tương đồng.
5. Xây prompt gồm system instruction, lịch sử chat giới hạn và context.
6. Gọi LLM với timeout và giới hạn token.
7. Lưu câu trả lời cùng citation ở `ChatMessage.citationLinks`.

### 10.3. Nguyên tắc prompt

- Trả lời bằng tiếng Việt rõ ràng, phù hợp cấp học.
- Ưu tiên gợi mở cách làm thay vì chỉ đưa đáp án khi phù hợp.
- Không tuyên bố nội dung nằm trong tài liệu nếu không có citation tương ứng.
- Không được làm lộ system prompt, API key hoặc dữ liệu của người dùng khác.
- Không sử dụng lịch sử chat vượt ngoài phiên hiện tại.
- Khi câu hỏi ngoài dữ liệu hoặc ngoài phạm vi học tập, trả lời ngắn gọn và nêu giới hạn.

### 10.4. Chỉ số AI

- Tập kiểm thử tối thiểu 20 câu hỏi thuộc tài liệu chuẩn bị sẵn và mở rộng dần theo môn/khối.
- Ít nhất 80% câu hỏi có retrieval đúng tài liệu/chunk theo đánh giá thủ công.
- Không có citation giả trong tập kiểm thử đã chuẩn bị.
- Theo dõi latency, lỗi API, số token hoặc chi phí ước tính ở log nội bộ.

---

## 11. Yêu cầu phi chức năng

### 11.1. Hiệu năng

| ID | Yêu cầu |
|---|---|
| NFR-PERF-01 | API CRUD thông thường có thời gian phản hồi mục tiêu dưới 2 giây ở tải vận hành nội bộ |
| NFR-PERF-02 | Phản hồi AI mục tiêu dưới 15 giây; UI phải hiển thị trạng thái đang xử lý |
| NFR-PERF-03 | Danh sách phải hỗ trợ phân trang, mặc định không quá 20-50 bản ghi/trang |
| NFR-PERF-04 | Hệ thống hỗ trợ tối thiểu 20 người dùng đồng thời trong baseline và có khả năng mở rộng theo tải thực tế |

### 11.2. Bảo mật

| ID | Yêu cầu |
|---|---|
| NFR-SEC-01 | Mật khẩu được băm bằng BCrypt hoặc Argon2 |
| NFR-SEC-02 | Mọi endpoint nghiệp vụ được xác thực và kiểm tra quyền phía server |
| NFR-SEC-03 | API key và secret chỉ lưu trong biến môi trường/secret store |
| NFR-SEC-04 | Validate loại file, kích thước file và tên file upload |
| NFR-SEC-05 | Không ghi log mật khẩu, token, API key hoặc toàn bộ dữ liệu cá nhân nhạy cảm |
| NFR-SEC-06 | CORS chỉ cho phép origin frontend được cấu hình theo môi trường |
| NFR-SEC-07 | Staging/production public phải sử dụng HTTPS |
| NFR-SEC-08 | Truy vấn dữ liệu phải kiểm tra ownership để tránh IDOR |

### 11.3. Tin cậy và toàn vẹn dữ liệu

- Giao dịch nộp quiz, tính điểm và cộng XP phải bảo đảm idempotency.
- Upload hoặc xử lý AI thất bại không được làm mất dữ liệu tài liệu gốc đã hợp lệ.
- Database staging/production được backup định kỳ và trước các mốc phát hành quan trọng.
- Migration phải chạy tự động và theo đúng thứ tự khi deploy.
- Lỗi tích hợp LLM không làm crash toàn bộ backend.

### 11.4. Khả dụng và giao diện

- Giao diện responsive cho desktop và mobile web.
- Có trạng thái loading, empty, error và retry cho các luồng bất đồng bộ.
- Form hiển thị lỗi validation gần trường nhập.
- Các thao tác xóa/khóa phải có xác nhận.
- Ngôn ngữ giao diện chính là tiếng Việt.

### 11.5. Khả năng bảo trì

- Backend phân tách controller, service, repository, DTO và entity.
- Không trả trực tiếp JPA entity từ API.
- Có OpenAPI/Swagger cho endpoint backend.
- Có migration database được version hóa trong repository.
- Cấu hình môi trường không hard-code trong source code.

### 11.6. Logging và giám sát

- Mỗi request có `traceId` hoặc correlation ID.
- Log các sự kiện: đăng nhập thất bại, upload tài liệu, xử lý RAG, nộp quiz và cộng XP.
- Health endpoint kiểm tra trạng thái ứng dụng và database.
- Có logging, health check và nền tảng giám sát đủ để chẩn đoán lỗi vận hành; observability nâng cao được mở rộng theo milestone.

---

## 12. Kiến trúc logic đề xuất

```mermaid
flowchart TD
    FE[Web Frontend] --> API[Spring Boot REST API]
    API --> DB[(PostgreSQL)]
    API --> FS[File/Object Storage]
    API --> AI[AI/RAG Service]
    AI --> VDB[(pgvector/Vector Store)]
    AI --> LLM[LLM and Embedding API]
```

Kiến trúc logic ở trên được giữ làm baseline. Backend có thể triển khai theo modular monolith để bảo toàn tốc độ phát triển ban đầu, trong khi AI/RAG có thể nằm trong cùng repository/service hoặc tách service riêng khi nhu cầu mở rộng, triển khai độc lập hoặc tối ưu tài nguyên trở nên rõ ràng.

### 12.1. Module backend đề xuất

- `auth`: xác thực và RBAC.
- `user`: tài khoản và hồ sơ học sinh.
- `schedule`: lịch học.
- `chat`: phiên chat và tin nhắn.
- `document`: upload và trạng thái xử lý.
- `rag`: chunking, embedding, retrieval và gọi LLM.
- `quiz`: quiz, câu hỏi, attempt và tính điểm.
- `gamification`: XP, level, streak và leaderboard.
- `dashboard`: truy vấn tổng hợp.

---

## 13. Kế hoạch phát triển Agile Scrum

### 13.1. Quy ước backlog

- Mỗi yêu cầu nghiệp vụ được tạo thành một User Story issue.
- Mỗi User Story liên kết với ID yêu cầu chức năng tương ứng, ví dụ `US-05 -> FR-CHAT-02, FR-CHAT-05, FR-CHAT-06`.
- User Story được chia thành task theo FE, BE, AI/DevOps và QA khi cần.
- Technical task như migration, CI/CD hoặc cấu hình Docker không bắt buộc viết theo mẫu “Là một...”.
- Chỉ kéo story vào Sprint khi đã có Acceptance Criteria và phụ thuộc chính đã rõ.

### 13.2. Milestone 1 - Nền tảng và xác thực

**Mục tiêu:** Có hệ thống chạy end-to-end, đăng nhập và phân quyền được.

- Chốt schema baseline và migration.
- Cấu hình repository, môi trường, Docker và CI cơ bản.
- Auth, JWT/session, RBAC cho ba role.
- Hồ sơ học sinh cơ bản.
- Layout frontend theo vai trò.
- CRUD lịch học cơ bản.
- Seed dữ liệu mẫu cho phát triển, kiểm thử và trình bày.

**Kết quả kiểm chứng:** Ba role đăng nhập và thấy đúng màn hình; học sinh quản lý được lịch.

### 13.3. Milestone 2 - AI Chat và RAG

**Mục tiêu:** Học sinh hỏi AI và nhận câu trả lời có nguồn từ tài liệu.

- Upload và quản lý trạng thái tài liệu.
- Migration/entity `DocumentChunk`.
- Pipeline extract, chunk, embedding và retrieval.
- Chat session, chat message và giao diện chat.
- Citation và xử lý trường hợp không đủ dữ liệu.
- Bộ test 20 câu hỏi RAG.

**Kết quả kiểm chứng:** Giáo viên upload tài liệu; học sinh hỏi và nhận câu trả lời có citation.

### 13.4. Milestone 3 - Quiz và gamification

**Mục tiêu:** Hoàn thành vòng lặp luyện tập, chấm điểm và nhận XP.

- Entity/migration quiz hiện có: `QuizQuestion`, `QuizAttempt`, `QuizAttemptAnswer`; XP lưu qua `QuizAttempt.xpEarned` và `Student.totalXP`.
- CRUD quiz cho Teacher/Admin.
- Màn hình làm bài cho Student.
- Chấm điểm phía backend.
- XP idempotent, level cơ bản và leaderboard.
- Test các trường hợp nộp trùng, quyền truy cập và tính điểm.

**Kết quả kiểm chứng:** Giáo viên tạo quiz; học sinh làm bài, xem kết quả, nhận XP và lên leaderboard.

### 13.5. Milestone 4 - Dashboard, ổn định và triển khai

**Mục tiêu:** Hoàn thiện các luồng sản phẩm chính, dashboard và nền tảng triển khai.

- Dashboard Student, Teacher và Admin.
- Hoàn thiện loading/error/empty state.
- Security review và kiểm tra ownership.
- Tối ưu truy vấn chính và bổ sung index.
- Deploy staging, health check và backup.
- Test end-to-end, sửa lỗi và diễn tập kịch bản trình bày/sử dụng nội bộ.
- Freeze chức năng trước mốc phát hành tối thiểu 3 ngày.

**Kết quả kiểm chứng:** Chạy toàn bộ kịch bản nghiệp vụ chính trên môi trường triển khai.

### 13.6. Milestone 5 - Mở rộng sản phẩm

**Mục tiêu:** Đưa các chức năng đã từng bị xem là ngoài phạm vi tối thiểu trở lại roadmap sản phẩm.

- Quên mật khẩu qua email và luồng bảo mật tài khoản nâng cao.
- Nhắc lịch qua email/push notification.
- OCR tài liệu scan và cải thiện xử lý bảng/hình ảnh.
- Loại câu hỏi nâng cao: nhiều đáp án, tự luận và upload bài làm.
- Gamification nâng cao: badge, shop, đổi quà và rule XP cấu hình được.
- Xuất PDF/Excel, báo cáo nâng cao và phân tích xu hướng học tập.
- Đánh giá khả năng mở rộng sang Phụ huynh, Super Admin, thanh toán, mobile native, SSO/MFA và đa tenant.

### 13.7. Cách phối hợp nhân sự

| Vai trò | Trách nhiệm chính |
|---|---|
| Backend | Database migration, API, RBAC, business rules, integration và test service |
| Frontend | UI theo role, form, state, tích hợp API và test luồng người dùng |
| AI/RAG | Prompt, retrieval, embedding, đánh giá chất lượng AI và tối ưu pipeline |
| QA/DevOps | Test plan, E2E, Docker/CI/CD, deploy, monitoring và quản lý môi trường |

Team làm theo vertical slice. Backend thống nhất contract/OpenAPI sớm hơn FE khoảng 1-2 ngày; FE dùng mock theo contract; AI/RAG tích hợp liên tục từ các milestone đầu; QA/DevOps tham gia từ đầu để tránh dồn kiểm thử và triển khai về cuối. Không chờ hoàn thành toàn bộ Backend mới bắt đầu Frontend hoặc deploy.

---

## 14. Definition of Ready và Definition of Done

### 14.1. Definition of Ready - DoR

Một User Story sẵn sàng vào Sprint khi:

- Có mục tiêu người dùng rõ ràng.
- Có Acceptance Criteria kiểm thử được.
- Có liên kết FR tương ứng.
- Có wireframe hoặc mô tả UI nếu cần.
- API contract và thay đổi database đã được xác định sơ bộ.
- Phụ thuộc và rủi ro chính đã được ghi nhận.
- Story đủ nhỏ để hoàn thành trong một Sprint.

### 14.2. Definition of Done - DoD

Một User Story chỉ được coi là hoàn tất khi:

- Code đã merge và build thành công.
- Migration chạy thành công trên database mới.
- API được cập nhật trong OpenAPI nếu có thay đổi.
- Unit/integration test cần thiết đã pass.
- FE xử lý loading, empty và error state.
- Acceptance Criteria đã được kiểm tra.
- Không còn lỗi Critical/Blocker.
- Chức năng đã deploy lên môi trường tích hợp và được Product Owner/người đại diện xác nhận.

---

## 15. Chiến lược kiểm thử và nghiệm thu

### 15.1. Phạm vi kiểm thử

- Unit test cho tính điểm, tính XP và validation nghiệp vụ.
- Repository/integration test cho các constraint quan trọng.
- API test cho auth, RBAC và ownership.
- Integration test cho upload -> chunk -> retrieval.
- E2E smoke test cho các luồng nghiệp vụ chính.
- Kiểm thử thủ công chất lượng câu trả lời AI bằng bộ câu hỏi chuẩn.

### 15.2. Các ca kiểm thử ưu tiên cao

- Student gọi API Admin/Teacher.
- Student thay ID để đọc chat/attempt của người khác.
- Nộp cùng attempt nhiều lần.
- Quiz không có đáp án đúng hoặc có nhiều đáp án đúng.
- Document xử lý thất bại hoặc LLM timeout.
- Upload file sai định dạng hoặc vượt kích thước.
- Token hết hạn hoặc tài khoản bị khóa giữa phiên.
- Database migration trên môi trường sạch.

### 15.3. Điều kiện nghiệm thu phát hành

- 100% User Story `Must Have` của milestone phát hành đã Done hoặc có quyết định điều chỉnh baseline được ghi nhận.
- Toàn bộ kịch bản nghiệp vụ chính pass.
- Không còn lỗi Critical hoặc High chưa có phương án xử lý.
- Tài khoản kiểm thử, dữ liệu mẫu và tài liệu RAG đã được chuẩn bị.
- Có bản backup database và hướng dẫn khởi động lại hệ thống.

---

## 16. Triển khai và môi trường

### 16.1. Môi trường

| Môi trường | Mục đích |
|---|---|
| Local | Phát triển cá nhân bằng Docker Compose hoặc cấu hình local |
| Integration/Staging | Tích hợp FE, BE, AI và chạy test |
| Production/Internal Release | Phiên bản ổn định dùng cho phát hành nội bộ hoặc công khai tùy quyết định |

Staging và môi trường phát hành phải được quản lý bằng version/tag rõ ràng. Nếu dùng chung tài nguyên hạ tầng, cần có quy trình backup, rollback và freeze trước các mốc nghiệm thu.

### 16.2. Biến môi trường tối thiểu

- Database URL, username và password.
- JWT secret hoặc khóa ký token.
- LLM API key và model name.
- Embedding model và vector store configuration.
- File storage path/bucket.
- Frontend origin/CORS.
- Logging level.

### 16.3. CI/CD tối thiểu

- Build backend và frontend khi tạo pull request.
- Chạy test tự động chính.
- Build Docker image hoặc artifact triển khai.
- Deploy có kiểm soát lên môi trường staging/phát hành.
- Chạy migration trước khi ứng dụng mới nhận traffic.
- Có khả năng quay lại image phiên bản trước; migration phải ưu tiên backward-compatible trong các mốc phát hành.

---

## 17. Rủi ro và phương án giảm thiểu

| Rủi ro | Mức độ | Phương án |
|---|---|---|
| Roadmap mở rộng khiến ưu tiên bị phân tán | Cao | Chia milestone rõ ràng, giữ backlog đầy đủ, ưu tiên theo giá trị người dùng và rủi ro kỹ thuật |
| RAG trả lời sai hoặc không đúng nguồn | Cao | Dataset kiểm thử chuẩn, metadata filter, threshold, citation và bộ test thủ công |
| Quiz schema cũ thiếu entity | Cao | Thêm 3 bảng bằng migration trong Sprint 3, không viết lại database |
| Cộng XP trùng do retry | Cao | Chặn submit lại cùng attempt, cập nhật XP trong transaction database; cân nhắc thêm `xp_transactions` nếu mở rộng XP đa nguồn |
| FE chờ BE | Trung bình | Chốt OpenAPI sớm, mock response và làm vertical slice |
| Deploy muộn | Cao | Có môi trường tích hợp từ Sprint 1, deploy tăng dần mỗi Sprint |
| API LLM chậm/hết quota | Trung bình | Timeout, retry có giới hạn, quota cảnh báo và câu trả lời lỗi thân thiện |
| Upload tài liệu khó xử lý | Trung bình | Ưu tiên PDF text ở baseline, mở rộng OCR theo milestone và có thông báo lỗi rõ ràng |
| Thiếu thời gian test | Cao | Tự động hóa các rule quan trọng và để QA/DevOps tham gia từ đầu mỗi milestone |

---

## 18. Truy vết yêu cầu

| User Story | Yêu cầu liên quan | Sprint |
|---|---|---:|
| US-01 Đăng nhập | FR-AUTH-01..04, FR-AUTH-06 | 1 |
| US-02 Quản lý tài khoản | FR-AUTH-05 | 1/4 |
| US-03 Quản lý lịch | FR-SCH-01..03 | 1 |
| US-04 Tạo phiên chat | FR-CHAT-01, FR-CHAT-03, FR-CHAT-04, FR-CHAT-08 | 2 |
| US-05 Hỏi AI bằng RAG | FR-CHAT-02, FR-CHAT-05..07 | 2 |
| US-06 Tải tài liệu | FR-DOC-01..06 | 2 |
| US-07 Tạo quiz | FR-QUIZ-01..04 | 3 |
| US-08 Làm và nộp quiz | FR-QUIZ-05..08 | 3 |
| US-09 Nhận XP | FR-XP-01..04 | 3 |
| US-10 Leaderboard | FR-XP-05 | 3 |
| US-11 Dashboard học sinh | FR-REP-01 | 4 |
| US-12 Dashboard quản trị | FR-REP-02..04 | 4 |
| US-13 Cập nhật hồ sơ | FR-PRO-01..04 | 1 |
| US-14 Xem kết quả quiz | FR-REP-04 | 4 |

---

## 19. Quy trình quản lý thay đổi

Mọi thay đổi sau khi SRS được chốt cần ghi nhận tối thiểu:

1. Mô tả thay đổi và lý do.
2. User Story/FR bị ảnh hưởng.
3. Tác động tới database, API, UI, AI và deployment.
4. Ước lượng công sức.
5. Milestone, phụ thuộc và thứ tự ưu tiên bị ảnh hưởng.
6. Xác nhận của cả bốn thành viên hoặc người chịu trách nhiệm sản phẩm.

Các chi tiết kỹ thuật nhỏ có thể thay đổi trong quá trình phát triển mà không sửa SRS, miễn không làm thay đổi hành vi người dùng, Acceptance Criteria hoặc phạm vi baseline đã được phê duyệt.

---

## 20. Kịch bản nghiệm thu và trình bày

1. Admin đăng nhập, xem dashboard và danh sách tài khoản.
2. Giáo viên đăng nhập, tải một tài liệu môn học và quan sát trạng thái xử lý thành công.
3. Giáo viên tạo và kích hoạt một quiz.
4. Học sinh đăng nhập, xem lịch học và dashboard cá nhân.
5. Học sinh mở phiên chat, đặt câu hỏi liên quan tài liệu và xem citation.
6. Học sinh làm quiz, nộp bài và xem kết quả.
7. Hệ thống cộng XP; dashboard và leaderboard được cập nhật.
8. Admin xem số liệu hoạt động mới trên dashboard.

Kịch bản này là luồng ưu tiên cao của baseline hiện tại. Các chức năng mở rộng vẫn nằm trong roadmap sản phẩm và được nghiệm thu bằng kịch bản riêng khi đến milestone tương ứng.

---

## 21. Phê duyệt baseline

| Vai trò | Người xác nhận | Ngày | Trạng thái |
|---|---|---|---|
| Đại diện sản phẩm/Team Lead |  |  | Chờ duyệt |
| Backend Developer |  |  | Chờ duyệt |
| Frontend Developer |  |  | Chờ duyệt |
| AI/RAG Engineer |  |  | Chờ duyệt |
| QA/DevOps |  |  | Chờ duyệt |

Sau khi phê duyệt, tài liệu này trở thành baseline cho sản phẩm AI Tutor mở rộng. Product Backlog và các issue phải tham chiếu các ID trong tài liệu; chức năng chưa triển khai ngay được quản lý bằng epic/milestone thay vì bị loại khỏi phạm vi.
