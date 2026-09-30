export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

export const getMyNotifications = async (): Promise<Notification[]> => {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'GET',
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch notifications');
  const data = await response.json();
  return data.data;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PUT',
    credentials: 'include'
  });
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    credentials: 'include'
  });
};
