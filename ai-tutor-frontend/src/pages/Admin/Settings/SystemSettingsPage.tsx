import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Bot,
  Check,
  Cpu,
  Database,
  Eye,
  EyeOff,
  Flame,
  Info,
  Key,
  Power,
  RefreshCw,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { systemSettingsApi, SystemSettingsApiError } from '../../../services/systemSettingsApi';
import { useToast } from '../../../context/ToastContext';
import type { MaintenanceStatus, SystemSettingItem } from '../../../types/systemSettings';

type ActiveTab = 'gamification' | 'ai' | 'cache_db';

const MODEL_OPTIONS = [
  { label: 'Google Gemini 1.5 Flash (Khuyên dùng - Nhanh & Tối ưu chi phí)', value: 'gemini-1.5-flash' },
  { label: 'Google Gemini 1.5 Pro (Nâng cao - Phân tích sâu)', value: 'gemini-1.5-pro' },
  { label: 'OpenAI GPT-4o Mini (Phản hồi nhanh)', value: 'gpt-4o-mini' },
  { label: 'OpenAI GPT-4o (Toàn diện)', value: 'gpt-4o' },
];

export function SystemSettingsPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('gamification');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings state (Key-Value)
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [originalSettings, setOriginalSettings] = useState<Record<string, string>>({});

  // Maintenance state
  const [maintenance, setMaintenance] = useState<MaintenanceStatus>({ enabled: false, message: '' });
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);
  const [confirmMaintenanceModal, setConfirmMaintenanceModal] = useState(false);

  // Custom AI API Key visibility
  const [showApiKey, setShowApiKey] = useState(false);

  // Load all settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [groups, maint] = await Promise.all([
        systemSettingsApi.fetchSettings(),
        systemSettingsApi.fetchMaintenanceStatus(),
      ]);

      const flat: Record<string, string> = {};
      Object.values(groups).forEach((items: SystemSettingItem[]) => {
        items.forEach((item) => {
          flat[item.key] = item.value;
        });
      });

      setSettings(flat);
      setOriginalSettings(flat);
      setMaintenance(maint);
    } catch (err: unknown) {
      if (err instanceof SystemSettingsApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tải cấu hình hệ thống. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleFieldChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      await systemSettingsApi.updateSettings(settings);
      setOriginalSettings(settings);
      toast.success('Đã lưu cấu hình hệ thống thành công (Cập nhật tức thì - Hot-reload)!');
    } catch (err: unknown) {
      if (err instanceof SystemSettingsApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể lưu cấu hình. Vui lòng kiểm tra lại.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async (targetEnabled: boolean) => {
    try {
      setMaintenanceSubmitting(true);
      const msg = settings['system.maintenance_message'] || maintenance.message;
      const res = await systemSettingsApi.toggleMaintenance(targetEnabled, msg);
      setMaintenance(res);
      setSettings((prev) => ({ ...prev, 'system.maintenance_mode': String(targetEnabled) }));
      setConfirmMaintenanceModal(false);

      if (targetEnabled) {
        toast.warning('Đã KÍCH HOẠT chế độ bảo trì hệ thống. Học sinh sẽ nhận thông báo HTTP 503.');
      } else {
        toast.success('Đã TẮT chế độ bảo trì. Hệ thống đã hoạt động bình thường trở lại.');
      }
    } catch (err: unknown) {
      toast.error('Không thể thay đổi trạng thái bảo trì.');
    } finally {
      setMaintenanceSubmitting(false);
    }
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-[#004bb5] to-[#2575fc] text-white shadow-md shadow-[#004bb5]/20 ring-1 ring-white/20">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface">
              Cấu hình Hệ thống (System Settings)
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Quản trị các tham số Gamification, mô hình AI thông minh, hạ tầng Cache và Chế độ bảo trì toàn cục
            </p>
          </div>
        </div>

        {isDirty && (
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:opacity-95 active:scale-95 transition-all self-start sm:self-auto shrink-0"
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Lưu tất cả thay đổi</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-600 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={loadSettings} className="font-bold underline">
            Thử lại
          </button>
        </div>
      )}

      {/* Maintenance Mode Card (AC-SYS-03) */}
      <div
        className={`rounded-2xl border p-5 transition-all shadow-xs ${
          maintenance.enabled
            ? 'border-red-500/40 bg-red-500/5'
            : 'border-outline-variant/60 bg-surface'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                maintenance.enabled ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'
              }`}
            >
              {maintenance.enabled ? <ShieldAlert size={22} /> : <Power size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-bold text-on-surface">Chế độ Bảo trì Hệ thống (Maintenance Mode)</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                    maintenance.enabled
                      ? 'bg-red-500/15 text-red-600 border-red-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                  }`}
                >
                  {maintenance.enabled ? 'ĐANG BẢO TRÌ' : 'HOẠT ĐỘNG BÌNH THƯỜNG'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-2xl">
                Khi kích hoạt, toàn bộ lượt truy cập của học sinh sẽ bị tạm ngắt và nhận thông báo lỗi <strong>HTTP 503</strong>.
                Tài khoản Quản trị viên (Admin) vẫn có toàn quyền truy cập để nâng cấp hệ thống.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {maintenance.enabled ? (
              <button
                type="button"
                onClick={() => handleToggleMaintenance(false)}
                disabled={maintenanceSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {maintenanceSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Power size={14} />}
                <span>Tắt bảo trì (Khôi phục)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmMaintenanceModal(true)}
                disabled={maintenanceSubmitting}
                className="inline-flex items-center gap-2 rounded-xl border border-red-400 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-500/20 active:scale-95 transition-all"
              >
                <ShieldAlert size={14} />
                <span>Bật bảo trì hệ thống</span>
              </button>
            )}
          </div>
        </div>

        {/* Maintenance Message Textarea */}
        <div className="mt-4 pt-4 border-t border-outline-variant/40">
          <label className="block text-xs font-bold text-on-surface mb-1">
            Thông điệp hiển thị cho học sinh khi bảo trì:
          </label>
          <input
            type="text"
            value={settings['system.maintenance_message'] ?? maintenance.message}
            onChange={(e) => handleFieldChange('system.maintenance_message', e.target.value)}
            placeholder="Hệ thống đang được nâng cấp bảo trì định kỳ. Vui lòng quay lại sau ít phút!"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-outline-variant/60 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('gamification')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'gamification'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Award size={16} />
          <span>Gamification & Học tập</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'ai'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Bot size={16} />
          <span>Mô hình Trí tuệ AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cache_db')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'cache_db'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Database size={16} />
          <span>Hạ tầng & Cache</span>
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
          <RefreshCw size={24} className="animate-spin text-primary" />
          <span className="text-xs">Đang tải cấu hình hệ thống...</span>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-outline-variant/60 p-6 shadow-xs space-y-6">
          {/* TAB 1: GAMIFICATION */}
          {activeTab === 'gamification' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <Flame size={18} className="text-amber-500" />
                  <span>Hạn mức XP tối đa trong ngày (Daily XP Cap)</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Giới hạn số điểm kinh nghiệm (XP) tối đa một học sinh có thể kiếm được mỗi ngày từ việc hoàn thành bài kiểm tra và luyện tập.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Điểm XP tối đa / ngày:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={100}
                      max={5000}
                      step={50}
                      value={settings['gamification.daily_xp_cap'] || '500'}
                      onChange={(e) => handleFieldChange('gamification.daily_xp_cap', e.target.value)}
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-bold text-primary focus:border-primary focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">
                      XP
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest/60 p-3 text-xs text-on-surface-variant flex items-start gap-2">
                  <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    Mặc định khuyến nghị: <strong>500 XP</strong> (tương đương 5 bài kiểm tra đạt điểm tối đa), giúp ngăn chặn cày điểm ảo để leo top bảng xếp hạng.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI MODEL CONFIG */}
          {activeTab === 'ai' && (
            <div className="space-y-6 max-w-2xl">
              {/* Default Model */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Mô hình AI mặc định (Default AI Model)
                </label>
                <select
                  value={settings['ai.default_model'] || 'gemini-1.5-flash'}
                  onChange={(e) => handleFieldChange('ai.default_model', e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                >
                  {MODEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-on-surface-variant block mt-1">
                  Mô hình sử dụng để tự động biên soạn câu hỏi trắc nghiệm, tạo lời giải thích chi tiết và chấm bài tự luận.
                </span>
              </div>

              {/* Temperature Slider */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-on-surface">Nhiệt độ sáng tạo (Temperature):</span>
                  <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {settings['ai.temperature'] || '0.7'}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={Number(settings['ai.temperature'] || '0.7')}
                  onChange={(e) => handleFieldChange('ai.temperature', e.target.value)}
                  className="w-full accent-[#004bb5] h-1.5 bg-surface-container rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                  <span>0.0 (Chính xác, nghiêm ngặt)</span>
                  <span>0.7 (Cân bằng khuyến nghị)</span>
                  <span>1.0 (Sáng tạo tối đa)</span>
                </div>
              </div>

              {/* Custom API Key */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1 flex items-center gap-1.5">
                  <Key size={14} className="text-primary" />
                  <span>Custom Google Gemini API Key (Tùy chọn)</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings['ai.api_key'] || ''}
                    onChange={(e) => handleFieldChange('ai.api_key', e.target.value)}
                    placeholder="Để trống nếu muốn sử dụng API Key mặc định của hệ thống..."
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-3 pr-10 py-2 text-xs font-mono text-on-surface focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-[11px] text-on-surface-variant block mt-1">
                  Khóa API tùy chỉnh riêng cho trường/tổ chức nếu cần định tuyến hạn mức riêng.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: CACHE & DB */}
          {activeTab === 'cache_db' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <Database size={18} className="text-blue-500" />
                  <span>Cấu hình Bộ nhớ đệm Redis (Cache TTL)</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Thời gian tồn tại (Time-to-live) mặc định của các bản ghi đệm danh sách câu hỏi, đề thi và cấu hình cài đặt.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Thời gian lưu cache (giây):
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    min={60}
                    max={86400}
                    step={300}
                    value={settings['cache.redis_ttl_seconds'] || '3600'}
                    onChange={(e) => handleFieldChange('cache.redis_ttl_seconds', e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-on-surface-variant">
                    giây (3600 = 1h)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Save Action Footer */}
          <div className="flex items-center justify-between pt-5 border-t border-outline-variant/60">
            <span className="text-xs text-on-surface-variant">
              {isDirty ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <AlertTriangle size={14} /> Có thay đổi chưa được lưu
                </span>
              ) : (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <Check size={14} /> Cấu hình đang đồng bộ với cơ sở dữ liệu
                </span>
              )}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSettings(originalSettings)}
                disabled={!isDirty || saving}
                className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-40"
              >
                Hủy thay đổi
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={!isDirty || saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004bb5] to-[#2575fc] px-5 py-2 text-xs font-bold text-white shadow-sm shadow-[#004bb5]/25 hover:opacity-95 active:scale-95 transition-all disabled:opacity-40"
              >
                {saving && <RefreshCw size={14} className="animate-spin" />}
                <span>Lưu cấu hình</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Enabling Maintenance Mode */}
      {confirmMaintenanceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181c22]/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-surface border border-outline-variant shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-600">
                <ShieldAlert size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-on-surface">Kích hoạt Chế độ Bảo trì?</h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Khi bật chế độ bảo trì, <strong>tất cả học sinh sẽ bị ngắt quyền truy cập</strong> và màn hình sẽ thông báo hệ thống đang bảo dưỡng. Bạn có chắc chắn muốn tiếp tục?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmMaintenanceModal(false)}
                className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleToggleMaintenance(true)}
                disabled={maintenanceSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-red-600/30 hover:bg-red-700 active:scale-95 transition-all"
              >
                {maintenanceSubmitting && <RefreshCw size={14} className="animate-spin" />}
                <span>Xác nhận Bật bảo trì</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SystemSettingsPage;
