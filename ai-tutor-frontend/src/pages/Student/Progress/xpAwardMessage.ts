import type { XpAwardStatus } from "../../../types/gamification";

export function xpAwardMessage(
  status: XpAwardStatus | undefined,
  xpEarned: number,
  dailyXpEarned: number | null,
  dailyXpCap: number | null,
): string {
  switch (status) {
    case "AWARDED":
      return `Bạn đã nhận ${xpEarned} XP từ bài luyện này. Tiếp tục giữ nhịp học nhé!`;
    case "PARTIALLY_CAPPED":
      return `Bạn nhận ${xpEarned} XP, là phần hạn mức còn lại trong ngày. Bạn đã đạt ${dailyXpEarned ?? "—"}/${dailyXpCap ?? "—"} XP hôm nay.`;
    case "DAILY_CAP_REACHED":
      return `Bạn đã đạt hạn mức ${dailyXpCap ?? "—"} XP hôm nay. Bài vẫn được chấm điểm và tính hoạt động cho chuỗi học.`;
    case "ALREADY_REWARDED":
      return "Đề này đã được hoàn tất trước đó nên lần làm lại không nhận thêm XP. Kết quả và hoạt động học vẫn được ghi nhận.";
    case "NO_XP_EARNED":
      return "Lần hoàn tất đầu tiên chưa có câu đúng nên bạn chưa nhận XP. Hoạt động học vẫn được ghi nhận; hãy xem lời giải và tiếp tục luyện tập.";
    default:
      return "Bài làm lịch sử chưa có thông tin lý do thưởng XP. Hệ thống giữ nguyên XP đã ghi nhận.";
  }
}
