export function getNormalizedDay(date: Date = new Date()): number {
  const currentDayIndex = date.getDay(); // 0 is Sunday, 1 is Monday
  return currentDayIndex === 0 ? 6 : currentDayIndex - 1; // 0 for Monday, 6 for Sunday
}

export function getDayDate(offsetFromMonday: number, baseDate: Date = new Date()): string {
  const normalizedDay = getNormalizedDay(baseDate);
  const d = new Date(baseDate);
  d.setDate(baseDate.getDate() - normalizedDay + offsetFromMonday);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function getFullDayDate(offsetFromMonday: number, baseDate: Date = new Date()): string {
  const normalizedDay = getNormalizedDay(baseDate);
  const d = new Date(baseDate);
  d.setDate(baseDate.getDate() - normalizedDay + offsetFromMonday);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export function getTomorrowDayName(baseDate: Date = new Date()): string {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return days[(baseDate.getDay() + 1) % 7];
}
