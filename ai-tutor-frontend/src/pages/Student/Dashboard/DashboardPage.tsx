import { styles } from './DashboardPage.styles';

export const DashboardPage = () => {
  return (
    <div className={styles.container}>
      {/* Hero / Welcome Personalized Banner */}
      <section className={styles.heroSection}>
        <div className={styles.heroContentWrapper}>
          {/* Left: Greetings & Inspiring Message */}
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span>Học tập cùng Trợ lý AI thế hệ mới</span>
            </div>
            <h1 className={styles.heroTitle}>
              Chào buổi sáng, Nguyễn Văn An! 👋
            </h1>
            <p className={styles.heroSubtitle}>
              Hôm nay bạn có <strong className="text-on-surface font-semibold">3 nhiệm vụ</strong> cần hoàn thành. Bạn đã đạt <strong className="text-primary font-semibold">60% mục tiêu</strong> học 45 phút mỗi ngày!
            </p>
            {/* Daily Study Time Progress Bar */}
            <div className={styles.progressContainer}>
              <div className={styles.progressHeader}>
                <span>Thời gian học hôm nay</span>
                <span className="font-semibold text-primary">28 / 45 phút</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressBar} style={{ width: '62%' }}></div>
              </div>
            </div>
          </div>
          
          {/* Right: 3 Quick Action Buttons */}
          <div className={styles.quickActionsWrapper}>
            <button className={styles.actionBtnPrimary} type="button">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
              <span>Hỏi bài AI ngay 💬</span>
            </button>
            <button className={styles.actionBtnSecondary} type="button">
              <span className="material-symbols-outlined text-[20px] text-secondary">quiz</span>
              <span>Luyện đề 15 phút 📝</span>
            </button>
            <button className={styles.actionBtnSecondary} type="button">
              <span className="material-symbols-outlined text-[20px] text-primary">play_circle</span>
              <span>Học tiếp bài dở dang ▶️</span>
            </button>
          </div>
        </div>
        {/* Background Ambient Glow */}
        <div className={styles.heroBgGlow}></div>
      </section>

      {/* Two-Column Dashboard Layout */}
      <div className={styles.mainGrid}>
        {/* ================= MAIN COLUMN (LEFT - 8 cols) ================= */}
        <div className={styles.leftCol}>
          {/* Block 1: Lộ trình hôm nay (Daily Focus) */}
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderLeft}>
                <span className="material-symbols-outlined text-primary text-[24px]">target</span>
                <h2 className={styles.sectionTitle}>Lộ trình hôm nay (Daily Focus)</h2>
              </div>
              <span className="font-label-sm text-label-sm bg-surface-container px-2.5 py-1 rounded-full text-on-surface-variant font-medium">
                1/3 Hoàn thành
              </span>
            </div>
            <div className="space-y-3">
              {/* Item 1: Toán 10 */}
              <div className={styles.taskCardActive}>
                <div className={styles.taskContentWrapper}>
                  <div className={styles.taskIconWrapperMath}>
                    <span className="material-symbols-outlined text-[22px]">calculate</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={styles.taskSubjectMath}>Toán 10</span>
                      <span className="text-outline text-xs">• Chương 2: Bất phương trình</span>
                    </div>
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface mt-0.5">
                      Hệ bất phương trình bậc nhất hai ẩn
                    </h3>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-on-surface-variant">
                      <div className="w-24 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span>75% hoàn thành</span>
                    </div>
                  </div>
                </div>
                <button className={styles.taskBtnActive} type="button">
                  <span>Làm tiếp</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>

              {/* Item 2: Vật lý 10 */}
              <div className={styles.taskCardActive}>
                <div className={styles.taskContentWrapper}>
                  <div className={styles.taskIconWrapperPhysics}>
                    <span className="material-symbols-outlined text-[22px]">speed</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={styles.taskSubjectPhysics}>Vật lý 10</span>
                      <span className="text-outline text-xs">• Động học chất điểm</span>
                    </div>
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface mt-0.5">
                      Chuyển động thẳng biến đổi đều
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1.5">
                      10 bài tập trắc nghiệm tính gia tốc và quãng đường
                    </p>
                  </div>
                </div>
                <button className={styles.taskBtnSecondary} type="button">
                  <span>Bắt đầu luyện bài</span>
                  <span className="material-symbols-outlined text-[16px] text-secondary">play_arrow</span>
                </button>
              </div>

              {/* Item 3: Tiếng Anh 10 */}
              <div className={styles.taskCardCompleted}>
                <div className={styles.taskContentWrapper}>
                  <div className={styles.taskIconWrapperCompleted}>
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={styles.taskSubjectCompleted}>Tiếng Anh 10</span>
                      <span className="text-outline text-xs">• Global Success</span>
                    </div>
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface line-through text-on-surface-variant mt-0.5">
                      Unit 4 Vocabulary Flashcards
                    </h3>
                    <p className="text-xs text-emerald-700 font-medium mt-1">
                      Đã hoàn thành 25/25 từ vựng mới (+50 XP)
                    </p>
                  </div>
                </div>
                <span className={styles.taskBtnCompleted}>
                  <span className="material-symbols-outlined text-[16px]">done_all</span>
                  <span>Hoàn tất</span>
                </span>
              </div>
            </div>
          </section>

          {/* Block 2: Gợi ý thông minh từ Gia sư AI */}
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderLeft}>
                <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                <h2 className={styles.sectionTitle}>Gợi ý thông minh từ Gia sư AI</h2>
              </div>
              <span className="text-xs text-primary font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Cập nhật tức thời
              </span>
            </div>
            
            {/* Alert Card */}
            <div className={styles.aiAlertCard}>
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-label-sm text-label-sm font-bold text-on-tertiary-fixed">Củng cố kiến thức Vectơ</h4>
                  <p className="text-sm text-on-surface leading-relaxed">
                    Phần Hình học Vectơ còn hay sai ở bước <strong className="text-tertiary font-semibold">quy tắc 3 điểm</strong>. Hãy luyện 5 câu ngắn để lấy lại phong độ nhé!
                  </p>
                </div>
              </div>
              <button className={styles.aiAlertBtn} type="button">
                Ôn tập ngay (5 phút)
              </button>
            </div>

            {/* Trending Questions */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">group</span>
                Các bạn cùng lớp 10A1 đang hỏi nhiều hôm nay:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <a className={styles.trendingLink} href="#">
                  <span className="text-xs font-medium text-on-surface truncate pr-2">"Cách áp dụng định luật II Newton khi có lực ma sát?"</span>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary text-[18px] flex-shrink-0">arrow_outward</span>
                </a>
                <a className={styles.trendingLink} href="#">
                  <span className="text-xs font-medium text-on-surface truncate pr-2">"Mẹo nhớ nhanh bảng giá trị lượng giác cung đặc biệt"</span>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary text-[18px] flex-shrink-0">arrow_outward</span>
                </a>
              </div>
            </div>
          </section>

          {/* Block 3: Lịch sử hỏi đáp gần nhất */}
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderLeft}>
                <span className="material-symbols-outlined text-primary text-[24px]">history</span>
                <h2 className={styles.sectionTitle}>Lịch sử hỏi đáp gần nhất với AI</h2>
              </div>
              <a className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5" href="#">
                <span>Xem tất cả (24)</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* History Card 1 */}
              <div className={styles.historyCard}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded font-medium">Toán Học</span>
                    <span>2 giờ trước</span>
                  </div>
                  <h3 className={styles.historyCardTitle}>Cách chứng minh tứ giác nội tiếp đường tròn</h3>
                  <p className={styles.historyCardSummary}>
                    <strong>Tóm tắt AI:</strong> Sử dụng 4 dấu hiệu chính: Tổng hai góc đối bằng 180°, hai đỉnh kề cùng nhìn một cạnh dưới hai góc bằng nhau, hoặc góc ngoài bằng góc đối trong...
                  </p>
                </div>
                <div className={styles.historyCardFooter}>
                  <span className="text-emerald-700 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px]">thumb_up</span> Đã hiểu bài
                  </span>
                  <a className="text-primary font-semibold hover:underline flex items-center" href="#">
                    Xem lại lời giải
                  </a>
                </div>
              </div>

              {/* History Card 2 */}
              <div className={styles.historyCard}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded font-medium">Tiếng Anh</span>
                    <span>Hôm qua</span>
                  </div>
                  <h3 className={styles.historyCardTitle}>Phân biệt Thì hiện tại hoàn thành và quá khứ đơn</h3>
                  <p className={styles.historyCardSummary}>
                    <strong>Tóm tắt AI:</strong> Thì quá khứ đơn (Past Simple) diễn tả hành động đã chấm dứt rõ thời điểm (yesterday, in 2020), còn hiện tại hoàn thành (Present Perfect) liên quan đến kết quả ở hiện tại...
                  </p>
                </div>
                <div className={styles.historyCardFooter}>
                  <span className="text-emerald-700 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px]">thumb_up</span> Đã lưu sổ tay
                  </span>
                  <a className="text-primary font-semibold hover:underline flex items-center" href="#">
                    Xem lại lời giải
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ================= SIDEBAR COLUMN (RIGHT - 4 cols) ================= */}
        <div className={styles.rightCol}>
          {/* Sidebar Card 1: Mục tiêu tuần & Chuỗi Streak */}
          <section className={styles.sidebarCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderLeft}>
                <span className="material-symbols-outlined text-tertiary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <h3 className="font-label-sm text-base font-bold text-on-surface">Mục tiêu & Chuỗi Streak</h3>
              </div>
              <span className="font-label-sm text-xs font-bold text-tertiary bg-tertiary-fixed px-2 py-0.5 rounded-full">14 Ngày liên tiếp</span>
            </div>
            
            {/* 7-Day Weekly Calendar Tracker */}
            <div className={styles.streakGrid}>
              {['T2', 'T3', 'T4', 'T5'].map((day) => (
                <div key={day} className={styles.streakDayPast}>
                  <span className="text-[11px] text-outline font-medium">{day}</span>
                  <div className="w-7 h-7 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  </div>
                </div>
              ))}
              
              {/* Today (T6) */}
              <div className={styles.streakDayActive}>
                <span className="text-[11px] text-primary font-bold">T6</span>
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                </div>
              </div>
              
              {/* Future Days (T7, CN) */}
              {[{ day: 'T7', date: '18' }, { day: 'CN', date: '19' }].map((item) => (
                <div key={item.day} className={styles.streakDayPast}>
                  <span className="text-[11px] text-outline font-medium">{item.day}</span>
                  <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-outline-variant">
                    <span className="text-xs">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Level Status & Progress Bar */}
            <div className="pt-3 border-t border-outline-variant/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                  <span className="font-bold text-on-surface">Cấp 4: Học sinh Chuyên Cần</span>
                </div>
                <span className="text-outline font-medium">1,250 / 1,500 XP</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressBar} style={{ width: '83%' }}></div>
              </div>
              <p className="text-[11px] text-on-surface-variant text-right">
                Còn 250 XP nữa để thăng hạng <strong className="text-primary">Cấp 5 (Học Bá Tinh Hoa)</strong>
              </p>
            </div>
          </section>

          {/* Sidebar Card 2: Bảng xếp hạng lớp */}
          <section className={styles.sidebarCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderLeft}>
                <span className="material-symbols-outlined text-amber-500 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>leaderboard</span>
                <h3 className="font-label-sm text-base font-bold text-on-surface">Bảng xếp hạng lớp 10A1</h3>
              </div>
              <span className="text-xs text-primary font-semibold hover:underline cursor-pointer">Tuần này</span>
            </div>
            
            <div className="space-y-2">
              {/* Rank #1 */}
              <div className={styles.rankRow}>
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 text-center font-bold text-amber-600 text-sm">#1</div>
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">HM</div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Hoàng Minh</h4>
                    <p className="text-[10px] text-outline">Chuỗi 18 ngày</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-600">1,320 XP</span>
                </div>
              </div>
              
              {/* Rank #2 (Current User) */}
              <div className={styles.rankRowActive}>
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 text-center font-bold text-primary text-sm">#2</div>
                  <img className="w-8 h-8 rounded-full object-cover ring-1 ring-primary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRJYl40OEfLzzaa3bm2MMLAn3T6xbcbQiCy_IZSkLcpXoS-j90oYvhe7ff6CXGRzshiqq9Hzthh_6BIpoEMcYLDgm7PKVXvJVpWmcZeWJC1izxbKDnSWfi7xYkYuiCSkW5KASne1-JLe7Mm2EfKu6wP5oSJVJ183sxSNkwxWsFF7m7EoeChXTijCa4Ozn1bTAE_PVyZ9rJQcWRTy1iyGS9Nmx5Mer6E5RDB2PevfSpYbtgyuif3wHctQ" alt="User Avatar" />
                  <div>
                    <h4 className="text-xs font-bold text-on-surface flex items-center gap-1">
                      Nguyễn Văn An <span className="text-[9px] bg-primary text-on-primary px-1 rounded">Bạn</span>
                    </h4>
                    <p className="text-[10px] text-primary">Kém Top 1 chỉ 70 XP!</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-primary">1,250 XP</span>
                </div>
              </div>
              
              {/* Rank #3 */}
              <div className={styles.rankRow}>
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 text-center font-bold text-secondary text-sm">#3</div>
                  <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs">QC</div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Lê Quỳnh Chi</h4>
                    <p className="text-[10px] text-outline">Chuỗi 12 ngày</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-secondary">1,180 XP</span>
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-outline pt-1">
              Cuộc đua bảng vàng sẽ chốt kết quả vào 23:59 Chủ Nhật
            </p>
          </section>

          {/* Sidebar Card 3: Lời khuyên học tập */}
          <section className={styles.sidebarCardSpecial}>
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
              <h3 className="font-label-sm text-base font-bold text-on-surface">Lời khuyên học tập hôm nay</h3>
            </div>
            <blockquote className={styles.tipQuote}>
              "Không có bài toán nào quá khó, chỉ có những bài toán chưa được chia nhỏ đúng cách."
            </blockquote>
            <div className={styles.tipCard}>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-primary">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>Tip: Phương pháp Pomodoro</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Hãy tập trung giải bài trong 25 phút, sau đó nghỉ 5 phút. Nếu gặp chỗ nghẽn tư duy, hãy chụp ảnh gửi AI Tutor phân tích ngay thay vì bỏ cuộc!
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
