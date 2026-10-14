export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface SystemLogItem {
  id: string;
  level: LogLevel | string;
  message: string;
  source?: string;
  stackTrace?: string;
  createdAt: string;
}

export interface SystemLogFilterParams {
  level?: string;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  direction?: 'asc' | 'desc';
}
