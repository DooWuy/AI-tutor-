import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import type { StudyNotification } from '../../../types/notification'
import {
  isSafeStudentPath,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationApiError,
  notificationSocketUrl,
} from '../../../services/notificationApi'

type BrowserPermission = NotificationPermission | 'unsupported'

interface NotificationContextValue {
  items: StudyNotification[]
  unreadCount: number
  browserPermission: BrowserPermission
  requestBrowserPermission: () => Promise<BrowserPermission>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

function currentPermission(): BrowserPermission {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  const [items, setItems] = useState<StudyNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [browserPermission, setBrowserPermission] = useState<BrowserPermission>(currentPermission)
  const knownIds = useRef(new Set<string>())
  const listReady = useRef(false)
  const markReadRef = useRef<(id: string) => Promise<void>>(async () => {})

  const showOs = useCallback((item: StudyNotification) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    try {
      const toast = new Notification(item.title, { body: item.body, tag: item.id })
      toast.onclick = () => {
        window.focus()
        toast.close()
        if (isSafeStudentPath(item.deepLink)) {
          navigateRef.current(item.deepLink)
        }
        void markReadRef.current(item.id)
      }
    } catch {
      // The browser can reject a toast without failing the in-app list.
    }
  }, [])

  const remember = useCallback((item: StudyNotification, announce: boolean) => {
    const seen = knownIds.current.has(item.id)
    knownIds.current.add(item.id)
    if (announce && !seen) showOs(item)
    return seen
  }, [showOs])

  const refresh = useCallback(async () => {
    const data = await listNotifications()
    data.items.forEach((item) => remember(item, listReady.current))
    listReady.current = true
    setItems(data.items)
    setUnreadCount(data.unreadCount)
  }, [remember])

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id)
    setItems((prev) => {
      const wasUnread = prev.some((item) => item.id === id && !item.read)
      if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1))
      return prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    })
  }, [])

  markReadRef.current = markRead

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    setItems((prev) => prev.map((item) => ({ ...item, read: true })))
    setUnreadCount(0)
  }, [])

  const requestBrowserPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      setBrowserPermission('unsupported')
      return 'unsupported' as const
    }
    const permission = await Notification.requestPermission()
    setBrowserPermission(permission)
    return permission
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await refresh()
      } catch (error) {
        if (cancelled) return
        if (error instanceof NotificationApiError && (error.status === 401 || error.status === 403)) {
          cancelled = true
        }
      }
    }
    void load()
    const timer = window.setInterval(() => {
      if (!cancelled) void load()
    }, 30000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [refresh])

  useEffect(() => {
    const client = new Client({
      brokerURL: notificationSocketUrl(),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (message) => {
          const item = JSON.parse(message.body) as StudyNotification
          const seen = remember(item, true)
          setItems((prev) => [item, ...prev.filter((existing) => existing.id !== item.id)].slice(0, 20))
          if (!seen && !item.read) setUnreadCount((count) => count + 1)
        })
      },
    })
    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [remember])

  const value = useMemo<NotificationContextValue>(() => ({
    items,
    unreadCount,
    browserPermission,
    requestBrowserPermission,
    markRead,
    markAllRead,
    refresh,
  }), [items, unreadCount, browserPermission, requestBrowserPermission, markRead, markAllRead, refresh])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider')
  }
  return context
}
