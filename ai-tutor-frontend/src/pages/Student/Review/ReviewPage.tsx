import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { styles } from './ReviewPage.styles'
import { getNotification, NotificationApiError } from '../../../services/notificationApi'
import { useNotifications } from '../../../layouts/StudentLayout/notifications/NotificationContext'
import type { StudyNotification } from '../../../types/notification'

function formatRange(start?: string | null, end?: string | null) {
  if (!start) return null
  return end ? `${start}–${end}` : start
}

export const ReviewPage: React.FC = () => {
  const { notificationId } = useParams()
  const { markRead } = useNotifications()
  const [item, setItem] = useState<StudyNotification | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!notificationId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getNotification(notificationId)
      .then((data) => {
        if (cancelled) return
        setItem(data)
        markRead(data.id).catch(() => {})
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setItem(null)
        setError(err instanceof NotificationApiError ? err.message : 'Không tải được bài ôn.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [notificationId, markRead])

  if (loading) {
    return <p className="text-sm text-on-surface-variant">Đang mở bài ôn...</p>
  }

  if (error || !item) {
    return (
      <div className={styles.error}>
        <h1 className={styles.errorTitle}>Không mở được bài ôn</h1>
        <p className={styles.errorBody}>{error || 'Thông báo này không còn trên tài khoản của bạn.'}</p>
        <Link className={styles.back} to="/student/timetable">Về thời khóa biểu</Link>
      </div>
    )
  }

  const payload = item.payload
  const when = formatRange(payload?.startTime, payload?.endTime)
  const outline = payload?.outline ?? []
  const topics = payload?.weakTopics ?? []

  return (
    <div className={styles.page}>
      <article className={styles.card}>
        <p className={styles.eyebrow}>
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          Ôn nhanh trước giờ học
        </p>
        <h1 className={styles.title}>{item.subjectName}</h1>
        <div className={styles.meta}>
          {when && <span className={styles.chip}>Tiết {when}</span>}
          {payload?.room && <span className={styles.chip}>Phòng {payload.room}</span>}
          {payload?.teacherName && <span className={styles.chip}>{payload.teacherName}</span>}
        </div>
        <p className={styles.body}>{item.body}</p>

        {outline.length > 0 && (
          <section className="space-y-3">
            <h2 className={styles.sectionTitle}>Dàn ý ôn tập</h2>
            <ol className={styles.outline}>
              {outline.map((line, index) => (
                <li key={line} className={styles.outlineItem}>
                  <span className={styles.outlineIndex}>{index + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {topics.length > 0 && (
          <section className="space-y-2">
            <h2 className={styles.sectionTitle}>Nên xem lại</h2>
            <div className={styles.topics}>
              {topics.map((topic) => (
                <span key={topic} className={styles.topic}>{topic}</span>
              ))}
            </div>
          </section>
        )}
      </article>
      <Link className={styles.back} to="/student/timetable">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Về thời khóa biểu
      </Link>
    </div>
  )
}
