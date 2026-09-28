export interface StudyNotificationPayload {
  subjectName: string
  subjectCode?: string | null
  startTime: string
  endTime?: string | null
  room?: string | null
  teacherName?: string | null
  weakTopics: string[]
  outline: string[]
}

export interface StudyNotification {
  id: string
  title: string
  body: string
  deepLink: string
  subjectName: string
  lessonStartsAt: string
  createdAt: string
  read: boolean
  payload?: StudyNotificationPayload | null
}

export interface NotificationList {
  items: StudyNotification[]
  unreadCount: number
}

export interface NextReminder {
  subjectName: string
  remindAt: string
  lessonStartsAt: string
  preview: string
}

export interface ReminderPreferences {
  enabled: boolean
  nextReminder: NextReminder | null
}
