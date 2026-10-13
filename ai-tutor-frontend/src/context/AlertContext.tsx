import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AlertModal, type AlertType, type AlertModalConfig } from '../components/common/AlertModal';

export interface AlertOptions {
  category?: string;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface AlertContextType {
  showAlert: (config: Omit<AlertModalConfig, 'isOpen'>) => void;
  showSuccess: (options: AlertOptions) => void;
  showError: (options: AlertOptions) => void;
  showConfirm: (options: AlertOptions) => void;
  showInfo: (options: AlertOptions) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState<AlertModalConfig | null>(null);

  const closeAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  const showAlert = useCallback((config: Omit<AlertModalConfig, 'isOpen'>) => {
    setAlertConfig({
      ...config,
      isOpen: true,
    });
  }, []);

  const showSuccess = useCallback((options: AlertOptions) => {
    showAlert({
      type: 'success',
      category: options.category || 'SUCCESS ALERT',
      title: options.title,
      description: options.description,
      confirmText: options.confirmText || 'Tuyệt vời',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  }, [showAlert]);

  const showError = useCallback((options: AlertOptions) => {
    showAlert({
      type: 'error',
      category: options.category || 'SYSTEM ERROR',
      title: options.title,
      description: options.description,
      confirmText: options.confirmText || 'Đóng',
      cancelText: options.cancelText,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  }, [showAlert]);

  const showConfirm = useCallback((options: AlertOptions) => {
    showAlert({
      type: 'warning',
      category: options.category || 'CONFIRM PROMPT',
      title: options.title,
      description: options.description,
      confirmText: options.confirmText || 'Xác nhận',
      cancelText: options.cancelText || 'Hủy',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  }, [showAlert]);

  const showInfo = useCallback((options: AlertOptions) => {
    showAlert({
      type: 'info',
      category: options.category || 'AI RECOMMENDATION',
      title: options.title,
      description: options.description,
      confirmText: options.confirmText || 'Đã hiểu',
      cancelText: options.cancelText,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  }, [showAlert]);

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showConfirm,
        showInfo,
        closeAlert,
      }}
    >
      {children}
      <AlertModal config={alertConfig} onClose={closeAlert} />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export type { AlertType, AlertModalConfig };
