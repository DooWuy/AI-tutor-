import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { styles } from './StudentHeader.styles'
import { useNotifications } from '../../notifications/NotificationContext'
import { isSafeStudentPath } from '../../../../services/notificationApi'
import type { StudyNotification } from '../../../../types/notification'

function relativeTime(iso: string) {
  const delta = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(delta / 60000)
  if (Number.isNaN(minutes) || minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const { items, unreadCount, browserPermission, requestBrowserPermission, markRead, markAllRead } = useNotifications()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openItem = async (item: StudyNotification) => {
    setOpen(false)
    try {
      await markRead(item.id)
    } catch {
      // Navigation still works if the read call fails.
    }
    if (isSafeStudentPath(item.deepLink)) {
      navigate(item.deepLink)
    }
  }

  return (
    <div className={styles.notificationWrap} ref={dropdownRef}>
      <button
        type="button"
        className={styles.notificationBtn}
        title="Thông báo"
        aria-label="Thông báo"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && <span className={styles.notificationDot}></span>}
      </button>

      {open && (
        <div className={styles.notificationMenu}>
          <div className={styles.notificationMenuHeader}>
            <p className={styles.notificationMenuTitle}>Thông báo</p>
            {unreadCount > 0 && (
              <button type="button" className={styles.notificationMarkAll} onClick={() => void markAllRead()}>
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className={styles.notificationEmpty}>Chưa có nhắc lịch</p>
          ) : (
            <ul className={styles.notificationList}>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={item.read ? styles.notificationItem : styles.notificationItemUnread}
                    onClick={() => void openItem(item)}
                  >
                    <span className={styles.notificationItemTitle}>{item.title}</span>
                    <span className={styles.notificationItemBody}>{item.body}</span>
                    <span className={styles.notificationItemMeta}>
                      {item.subjectName} · {relativeTime(item.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.notificationFooter}>
            {browserPermission === 'default' && (
              <button type="button" className={styles.notificationPermissionBtn} onClick={() => void requestBrowserPermission()}>
                Bật thông báo trình duyệt
              </button>
            )}
            {browserPermission === 'granted' && (
              <p className={styles.notificationPermissionNote}>Thông báo trình duyệt đang bật.</p>
            )}
            {browserPermission === 'denied' && (
              <p className={styles.notificationPermissionNote}>
                Trình duyệt đang chặn thông báo. Hãy bật lại trong cài đặt trang.
              </p>
            )}
            {browserPermission === 'unsupported' && (
              <p className={styles.notificationPermissionNote}>Trình duyệt này không hỗ trợ thông báo.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
