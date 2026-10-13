export interface SystemSettingItem {
  key: string;
  value: string;
  groupName: string;
  description?: string;
  updatedAt?: string;
}

export type SystemSettingsGroupMap = Record<string, SystemSettingItem[]>;

export interface MaintenanceStatus {
  enabled: boolean;
  message: string;
}

export interface MaintenanceTogglePayload {
  enabled: boolean;
  message?: string;
}
