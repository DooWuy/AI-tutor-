# UI/UX Requirements - Issue 6: Admin Student Management

## 1. Mục đích tài liệu

Tài liệu này mô tả yêu cầu màn hình, luồng tương tác và tiêu chuẩn UI/UX cho chức năng Admin Dashboard - Student Management. Đội UI/UX dùng tài liệu này để thiết kế wireframe, high-fidelity mockup và prototype trước khi frontend implement.

Thiết kế cần bám theo:

- `docs/issue6-admin-dashboard-student-management.md`
- `docs/AI_Tutor_SRS_MVP.md`
- `docs/DESIGN.md` với style "Fidelity Modern"

## 2. Nguyên tắc thiết kế

- Giao diện là công cụ vận hành, ưu tiên rõ ràng, quét nhanh, thao tác nhanh.
- Không thiết kế theo landing page hoặc hero marketing.
- Không dùng hình minh họa trang trí lớn trong màn hình quản trị.
- Mật độ thông tin vừa đủ: bảng rõ, filter dễ dùng, action không gây nhầm lẫn.
- Trạng thái quan trọng như active/locked/deleted phải dễ nhận biết bằng badge màu và text.
- Các thao tác rủi ro như khóa tài khoản, xóa mềm phải có confirm dialog.
- Thiết kế responsive cho desktop, tablet và mobile web; bảng được phép horizontal scroll ở màn hình hẹp.
- Ngôn ngữ giao diện chính là tiếng Việt.

## 3. Design system cần dùng

Theo `docs/DESIGN.md`:

- Font: `Inter`.
- Primary: `#1275e2`.
- Error: `#ba1a1a`.
- Surface chính: `#f9f9ff`, container trắng hoặc xám rất nhạt.
- Border: `#c1c6d5` hoặc tone outline nhẹ.
- Card/table radius khoảng `8px`.
- Spacing theo nhịp 8px.

Khuyến nghị:

- Primary action dùng màu primary.
- Secondary action dùng outline hoặc tonal button.
- Danger action dùng error, không dùng primary.
- Badge trạng thái:
  - `Đang hoạt động`: xanh lá hoặc primary nhẹ.
  - `Đang khóa`: đỏ/amber nhẹ.
  - `Đã xóa mềm`: xám, chỉ dùng nếu có màn hình audit sau này.

## 4. IA và navigation

### 4.1. Admin navigation

Cần thiết kế `AdminLayout` mới hoặc biến thể từ layout hiện có.

Sidebar Admin tối thiểu gồm:

| Menu | Route | Icon gợi ý | Ghi chú |
|---|---|---|---|
| Tổng quan | `/admin/dashboard` | dashboard | Có thể placeholder nếu chưa implement |
| Quản lý học sinh | `/admin/students` | groups/person_search | Active trong issue này |
| Tài khoản | `/admin/users` | manage_accounts | Có thể merge với students hoặc placeholder |
| Tài liệu | `/admin/documents` | menu_book | Placeholder nếu chưa implement |
| Quiz | `/admin/quizzes` | quiz | Placeholder nếu chưa implement |

Header Admin cần có:

- Tên hệ thống hoặc breadcrumb ngắn.
- Avatar/tên Admin.
- Nút đăng xuất nếu layout hiện tại chưa có.

## 5. Danh sách màn hình cần design

### 5.1. Màn hình A - Student Management List

Route: `/admin/students`

Mục tiêu: Admin xem, tìm kiếm, lọc và thao tác nhanh với danh sách học sinh.

#### Layout desktop

Thứ tự từ trên xuống:

1. Page header
   - Title: `Quản lý học sinh`
   - Subtitle: `Theo dõi tài khoản, lớp học và tiến trình cơ bản của học sinh.`
   - Primary button: `Thêm học sinh`
2. Summary strip, nếu có dữ liệu
   - Tổng học sinh
   - Đang hoạt động
   - Đang khóa
   - Tổng XP trung bình hoặc số học sinh có hoạt động gần đây
3. Filter/search toolbar
   - Search input: placeholder `Tìm theo tên, email, username hoặc mã học sinh`
   - Select trạng thái: `Tất cả`, `Đang hoạt động`, `Đang khóa`
   - Select trường
   - Select khối
   - Select lớp
   - Sort select: `Mới nhất`, `Tên A-Z`, `XP cao nhất`, `Hoạt động gần đây`
   - Button reset filter
4. Data table
5. Pagination footer

#### Table columns

| Cột | Nội dung | Ghi chú UX |
|---|---|---|
| Học sinh | Avatar, họ tên, email | Họ tên clickable sang chi tiết |
| Mã HS | `studentCode` | Monospace hoặc chip nhẹ |
| Lớp | `schoolName`, `gradeLevel`, `className` | Trường nhỏ hơn lớp |
| Tiến trình | XP, level, streak | Hiển thị compact |
| Hoạt động gần đây | `lastActivityDate` | Empty: `Chưa có hoạt động` |
| Trạng thái | Badge active/locked | Rõ màu và text |
| Ngày tạo | `createdAt` | Format ngày ngắn |
| Hành động | View, Edit, Lock/Unlock, Delete | Icon button có tooltip |

#### Action buttons

- View detail: icon eye, tooltip `Xem chi tiết`.
- Edit: icon edit, tooltip `Chỉnh sửa`.
- Lock/Unlock:
  - Nếu active: icon lock, tooltip `Khóa tài khoản`.
  - Nếu locked: icon unlock, tooltip `Mở khóa tài khoản`.
- Soft delete: icon trash, tooltip `Xóa mềm`.

Không dùng text button dài trong từng dòng nếu làm bảng bị chật. Dùng icon button + tooltip.

#### Empty state

Trường hợp không có học sinh:

- Title: `Chưa có học sinh`
- Text: `Tạo học sinh đầu tiên để bắt đầu quản lý tài khoản và hồ sơ học tập.`
- Button: `Thêm học sinh`

Trường hợp filter không có kết quả:

- Title: `Không tìm thấy học sinh phù hợp`
- Text: `Thử đổi từ khóa hoặc xóa bộ lọc đang áp dụng.`
- Button secondary: `Xóa bộ lọc`

#### Loading state

- Skeleton cho toolbar và 5-8 dòng bảng.
- Không dùng spinner toàn màn hình nếu có thể giữ layout bảng.

#### Error state

- Inline error block phía trên bảng.
- Text: `Không thể tải danh sách học sinh.`
- Button: `Thử lại`

### 5.2. Màn hình B - Add Student Modal

Trigger: button `Thêm học sinh` ở list page.

Mục tiêu: Admin tạo học sinh thủ công.

#### Modal layout

Title: `Thêm học sinh`

Form chia nhóm:

1. Thông tin tài khoản
   - Username
   - Email
   - Mật khẩu tạm
2. Thông tin cá nhân
   - Họ và tên
   - Số điện thoại
   - Ngày sinh
   - Giới tính
3. Lớp học
   - Trường
   - Khối
   - Lớp

Footer:

- Secondary: `Hủy`
- Primary: `Tạo học sinh`

#### Validation UI

- Hiển thị lỗi dưới từng field.
- Field invalid có border error.
- Nếu lỗi backend là duplicate username/email, focus vào field tương ứng.
- Khi submitting, disable button và đổi label thành `Đang tạo...`.

#### Copy cần dùng

- Success toast: `Đã tạo học sinh và gửi email thiết lập mật khẩu.`
- Duplicate email: `Email này đã được sử dụng.`
- Duplicate username: `Username này đã tồn tại.`

### 5.3. Màn hình C - Edit Student Modal

Trigger: icon edit ở table hoặc detail page.

Mục tiêu: Admin chỉnh thông tin được phép, không sửa định danh.

#### Fields readonly

Hiển thị nhưng không cho sửa:

- Username
- Email
- Mã học sinh

Readonly fields cần có visual khác field editable, ví dụ nền xám nhạt và helper text ngắn: `Thông tin định danh không chỉnh sửa tại đây.`

#### Fields editable

- Họ và tên
- Số điện thoại
- Ngày sinh
- Giới tính
- Trường
- Khối
- Lớp
- Địa chỉ, nếu design đủ chỗ
- Thông tin phụ huynh, nếu đưa vào phase này

Footer:

- Secondary: `Hủy`
- Primary: `Lưu thay đổi`

Success toast: `Đã cập nhật hồ sơ học sinh.`

### 5.4. Màn hình D - Student Detail

Route: `/admin/students/:studentId`

Mục tiêu: Admin xem tổng quan hồ sơ học sinh và hoạt động học tập cơ bản.

#### Layout desktop

1. Top bar
   - Back button: `Quay lại`
   - Title: tên học sinh
   - Status badge
   - Actions: `Chỉnh sửa`, `Khóa/Mở khóa`
2. Profile summary band
   - Avatar
   - Họ tên
   - Email
   - Student code
   - School/class
3. KPI row
   - Tổng XP
   - Level
   - Streak hiện tại
   - Hoạt động gần đây
4. Tabs
   - `Hồ sơ`
   - `Học tập`
   - `Lớp & lịch học`
   - `Hoạt động`

#### Tab Hồ sơ

Hiển thị:

- Họ và tên
- Username
- Email
- Số điện thoại
- Ngày sinh
- Giới tính
- Trạng thái
- Ngày tạo
- Cập nhật gần nhất

#### Tab Học tập

Hiển thị:

- Total XP
- Current level
- Current streak
- Longest streak
- Số lần làm quiz
- Điểm trung bình
- Lần nộp quiz gần nhất

Nếu chưa có dữ liệu quiz:

- Empty text: `Học sinh chưa có lượt làm quiz.`

#### Tab Lớp & lịch học

Hiển thị:

- Trường
- Khối
- Lớp
- Mã học sinh
- Số lịch học đang có

Nếu lịch học chưa có:

- Empty text: `Học sinh chưa tạo lịch học.`

#### Tab Hoạt động

Hiển thị:

- Số phiên chat
- Số lịch học
- Số quiz attempt
- Last activity date

Không cần timeline chi tiết trong issue này nếu backend chưa có endpoint.

### 5.5. Confirm Dialog - Lock/Unlock

#### Khóa tài khoản

Title: `Khóa tài khoản học sinh?`

Body: `Học sinh sẽ không thể đăng nhập cho đến khi tài khoản được mở lại. Dữ liệu học tập vẫn được giữ nguyên.`

Buttons:

- Secondary: `Hủy`
- Danger/primary destructive: `Khóa tài khoản`

Success toast: `Đã khóa tài khoản học sinh.`

#### Mở khóa tài khoản

Title: `Mở khóa tài khoản học sinh?`

Body: `Học sinh có thể đăng nhập lại bằng thông tin tài khoản hiện tại.`

Buttons:

- Secondary: `Hủy`
- Primary: `Mở khóa`

Success toast: `Đã mở khóa tài khoản học sinh.`

### 5.6. Confirm Dialog - Soft Delete

Title: `Xóa học sinh khỏi danh sách quản lý?`

Body: `Đây là xóa mềm. Tài khoản sẽ bị ẩn khỏi danh sách vận hành, nhưng lịch sử học tập, bài làm và hội thoại vẫn được giữ lại để bảo toàn dữ liệu báo cáo.`

Buttons:

- Secondary: `Hủy`
- Danger: `Xóa mềm`

Success toast: `Đã xóa mềm tài khoản học sinh.`

Không thiết kế hard delete trong issue này.

## 6. Responsive requirements

### Desktop >= 1200px

- Sidebar cố định bên trái.
- Content rộng, table hiển thị đầy đủ cột.
- Filter toolbar nằm một hàng hoặc hai hàng tùy độ rộng.

### Tablet 768px - 1199px

- Sidebar có thể thu gọn.
- Table có horizontal scroll.
- Các filter xuống 2-3 cột.
- Action buttons trong bảng giữ dạng icon.

### Mobile < 768px

- Ưu tiên card list thay vì table nếu có thời gian design.
- Mỗi student card hiển thị:
  - Avatar, tên, status
  - Email
  - Mã học sinh
  - Lớp/trường
  - XP/level/streak
  - Action menu dạng kebab
- Filter mở trong bottom sheet hoặc collapsible panel.
- Detail page dùng stacked sections thay vì tab ngang nếu tab bị chật.

## 7. Component requirements

### 7.1. Search input

- Có icon search.
- Placeholder rõ.
- Có nút clear khi có text.
- Debounce 300ms là hành vi frontend, nhưng design cần thể hiện input không chiếm quá nhiều chiều ngang.

### 7.2. Filter controls

- Select có label rõ: `Trạng thái`, `Trường`, `Khối`, `Lớp`, `Sắp xếp`.
- Có button `Xóa bộ lọc`.
- Khi filter active, nên có indicator nhẹ hoặc chip filter đang áp dụng.

### 7.3. Pagination

- Hiển thị:
  - Tổng số bản ghi.
  - Page hiện tại.
  - Prev/Next.
  - Page size: 10/20/50.
- Không dùng 100 records/page vì SRS ưu tiên 20-50 và backend nên giới hạn tối đa 50.

### 7.4. Status badge

- `Đang hoạt động`: badge tích cực.
- `Đang khóa`: badge cảnh báo hoặc danger nhẹ.
- Badge cần có text, không chỉ dùng màu.

### 7.5. KPI cards

Dùng card nhỏ gọn, không quá cao.

KPI detail page:

- Tổng XP
- Level
- Streak
- Hoạt động gần đây

KPI list page, nếu dùng:

- Tổng học sinh
- Active
- Locked
- Có hoạt động gần đây

### 7.6. Toast

- Vị trí: góc phải trên hoặc dưới, nhất quán toàn app.
- Success toast tự đóng.
- Error toast có thể giữ lâu hơn.

## 8. Nội dung text chuẩn

| Context | Text |
|---|---|
| Page title | Quản lý học sinh |
| Page subtitle | Theo dõi tài khoản, lớp học và tiến trình cơ bản của học sinh. |
| Add button | Thêm học sinh |
| Search placeholder | Tìm theo tên, email, username hoặc mã học sinh |
| Empty no data | Chưa có học sinh |
| Empty no results | Không tìm thấy học sinh phù hợp |
| Reset filter | Xóa bộ lọc |
| Edit modal title | Chỉnh sửa học sinh |
| Create modal title | Thêm học sinh |
| Lock confirm title | Khóa tài khoản học sinh? |
| Unlock confirm title | Mở khóa tài khoản học sinh? |
| Soft delete title | Xóa học sinh khỏi danh sách quản lý? |
| Save button | Lưu thay đổi |
| Create submit | Tạo học sinh |

## 9. Data mapping cho design

### List item

Designer cần để chỗ cho các field sau:

- `avatarUrl`
- `fullName`
- `email`
- `studentCode`
- `schoolName`
- `gradeLevel`
- `className`
- `totalXp`
- `currentLevel`
- `currentStreak`
- `lastActivityDate`
- `active`
- `createdAt`

### Detail

Designer cần để chỗ cho:

- `username`
- `dateOfBirth`
- `gender`
- `phoneNumber`
- `address`
- `parentName`
- `parentEmail`
- `parentPhone`
- `longestStreak`
- `quizAttemptCount`
- `averageScore`
- `lastQuizSubmittedAt`
- `chatSessionCount`
- `scheduleCount`

## 10. Những điểm không được thiết kế lệch scope

- Không thêm import Excel vào UI chính của issue này.
- Không thêm hard delete.
- Không thêm Super Admin/MASTER role.
- Không thêm quản lý trường học độc lập.
- Không thiết kế mobile app.
- Không thiết kế badge/shop/reward.
- Không yêu cầu AI knowledge gap per student nếu backend chưa có endpoint riêng.

## 11. Deliverables mong muốn từ UI/UX

- Wireframe desktop cho:
  - Student list
  - Add modal
  - Edit modal
  - Detail page
  - Confirm dialogs
- High-fidelity desktop theo design system.
- Responsive variant cho tablet.
- Mobile variant cho list/detail hoặc ghi rõ cách table chuyển thành card list.
- Prototype thể hiện các luồng:
  - Search/filter
  - Create student
  - Edit student
  - Lock/unlock
  - Soft delete
  - View detail
- Component spec cho table, filter toolbar, modal, badge, toast, confirm dialog.

## 12. Checklist nghiệm thu thiết kế

- Bám đúng scope trong issue 6.
- Không đưa feature ngoài scope vào màn hình chính.
- Có đầy đủ state: loading, empty, error, success, validation error.
- Có confirm cho action rủi ro.
- Bảng không vỡ ở tablet.
- Mobile có phương án rõ.
- Text tiếng Việt nhất quán.
- Dùng đúng màu, typography và spacing từ `DESIGN.md`.
- Action chính/phụ/nguy hiểm phân cấp rõ ràng.
- Developer có thể mapping trực tiếp từ mockup sang API/DTO đã mô tả.
