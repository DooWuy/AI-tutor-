export const styles = {
  container: 'w-full space-y-6 pb-16 font-sans',

  // Alerts
  alertSuccess: 'p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn shadow-xs',
  alertError: 'p-4 rounded-xl bg-error-container border border-error/20 text-on-error-container text-xs flex items-center gap-2.5 animate-fadeIn shadow-xs',

  // Top Header Banner
  headerCard: 'bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5',
  headerLeft: 'space-y-1.5',
  headerBadge: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold',
  headerTitle: 'text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2.5',
  headerSubtitle: 'text-sm text-on-surface-variant max-w-2xl leading-relaxed',
  headerActions: 'flex items-center flex-wrap gap-3',
  headerPrimaryBtn: 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-xs font-bold text-on-primary shadow-xs active:scale-95 transition-all cursor-pointer',
  headerSecondaryBtn: 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-xs font-bold text-on-surface shadow-xs active:scale-95 transition-all cursor-pointer',

  // Stats KPI Grid
  statsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
  statCard: 'bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-xs flex items-center gap-4 hover:border-primary/40 transition-all',
  statIconBox: 'w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold shrink-0',
  statIconBoxSecondary: 'w-11 h-11 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold shrink-0',
  statIconBoxAmber: 'w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0',
  statIconBoxEmerald: 'w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0',
  statContent: 'min-w-0 flex-1',
  statLabel: 'text-[11px] font-bold text-outline uppercase tracking-wider truncate',
  statValue: 'text-2xl font-black text-on-surface tracking-tight mt-0.5',

  // Import Section (Khung nhập liệu & Nút import)
  importSectionCard: 'bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-xs space-y-6',
  importSectionHeader: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/60 pb-4',
  importSectionTitle: 'text-lg font-bold text-on-surface flex items-center gap-2',
  importSectionSubtitle: 'text-xs text-on-surface-variant mt-0.5',
  importSectionActions: 'flex items-center gap-2',

  // Dropzone Area
  dropzoneArea: 'relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer select-none group',
  dropzoneIdle: 'border-outline-variant hover:border-primary hover:bg-primary-fixed/10 bg-surface/50',
  dropzoneActive: 'border-primary bg-primary-fixed/20 scale-[0.99] ring-4 ring-primary/10',
  dropzoneIconWrap: 'w-16 h-16 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform',
  dropzoneIcon: 'material-symbols-outlined text-3xl',
  dropzoneTitle: 'text-base font-bold text-on-surface group-hover:text-primary transition-colors',
  dropzoneDesc: 'text-xs text-on-surface-variant mt-1 max-w-md',
  dropzoneButtonRow: 'mt-4 flex items-center gap-3',
  dropzoneUploadBtn: 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer',
  dropzoneFormatsBadge: 'text-[11px] text-outline font-medium mt-3 flex items-center gap-1.5',

  // Queue List / Table
  queueCard: 'bg-surface rounded-xl border border-outline-variant p-4 space-y-4',
  queueHeaderRow: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/60 pb-3',
  queueHeaderTitle: 'text-sm font-bold text-on-surface flex items-center gap-2',
  queueCountBadge: 'px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold',
  queueHeaderActions: 'flex items-center gap-2',
  queueSaveBtn: 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  queueClearBtn: 'inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-outline-variant hover:bg-surface-container text-xs font-semibold text-on-surface-variant transition-all cursor-pointer',

  queueItemCard: 'bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-2xs space-y-3 hover:border-primary/40 transition-all',
  queueItemTop: 'flex items-center justify-between gap-3',
  queueFileMeta: 'flex items-center gap-3 min-w-0',
  queueFileIcon: 'w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0',
  queueFileName: 'text-xs font-bold text-on-surface truncate',
  queueFileSize: 'text-[11px] text-outline font-medium',
  queueStatusBadgeReady: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold shrink-0',
  queueStatusBadgeSaving: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold shrink-0 animate-pulse',
  queueStatusBadgeSaved: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold shrink-0',
  queueStatusBadgeError: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold shrink-0',
  queueRemoveBtn: 'w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-error hover:bg-error-container/50 transition-all cursor-pointer',

  queueFieldsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1',
  fieldGroup: 'flex flex-col gap-1',
  fieldLabel: 'text-[11px] font-bold text-outline uppercase tracking-wider',
  inputControl: 'h-9 px-3 text-xs bg-surface rounded-lg border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all',
  selectControl: 'h-9 px-3 text-xs bg-surface rounded-lg border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer',

  queueActionRow: 'flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/40',
  scanActionBtn: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-2xs transition-all cursor-pointer',

  // Existing Books Section
  booksSectionCard: 'bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-xs space-y-5',
  booksSectionHeader: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3',
  booksSectionTitle: 'text-lg font-bold text-on-surface flex items-center gap-2',
  booksSectionSubtitle: 'text-xs text-on-surface-variant',

  // Search & Filter Bar
  filterRow: 'flex flex-wrap items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-outline-variant',
  filterLeft: 'flex flex-wrap items-center gap-3 flex-1',
  filterSearchBox: 'relative min-w-[220px] flex-1 max-w-sm',
  filterSearchInput: 'w-full h-9 pl-8 pr-3 text-xs bg-surface-container-lowest rounded-lg border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all',
  filterSearchIcon: 'material-symbols-outlined absolute left-2.5 top-2 text-[18px] text-outline',
  filterSelect: 'h-9 px-3 text-xs font-semibold bg-surface-container-lowest rounded-lg border border-outline text-on-surface cursor-pointer min-w-[140px]',

  // Book Grid Cards
  bookGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5',
  bookCard: 'bg-surface rounded-xl border border-outline-variant p-5 shadow-2xs hover:border-primary/60 hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group',
  bookCardTop: 'space-y-2',
  bookCardBadges: 'flex items-center flex-wrap gap-1.5',
  badgeSubject: 'px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold',
  badgeGrade: 'px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold',
  badgeCurriculum: 'px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-medium border border-outline-variant/60 truncate max-w-[200px]',
  bookCardTitle: 'text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug',
  bookCardStats: 'flex items-center gap-4 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/50',
  bookStatItem: 'inline-flex items-center gap-1 font-medium',

  bookCardFooter: 'flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/50',
  bookActionBtnOutline: 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface transition-all cursor-pointer',
  bookActionBtnPrimary: 'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-xs font-bold text-on-primary shadow-2xs transition-all cursor-pointer',
  bookDeleteBtn: 'w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-error hover:bg-error-container/40 transition-all cursor-pointer',

  // Modals
  modalBackdrop: 'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn',
  modalDialog: 'bg-surface-container-lowest w-full max-w-4xl rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[92vh]',
  modalHeader: 'px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0',
  modalTitle: 'text-base font-bold text-on-surface flex items-center gap-2',
  modalCloseBtn: 'w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-all cursor-pointer',
  modalBody: 'p-6 space-y-6 overflow-y-auto flex-1',
  modalFooter: 'px-6 py-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0',

  // TOC Scan Modal specifics
  tocBookInfoBox: 'p-4 rounded-xl bg-surface-container border border-outline-variant/80 flex flex-wrap items-center justify-between gap-4 text-xs',
  tocUploadCard: 'p-4 rounded-xl border border-dashed border-outline-variant bg-surface hover:border-primary text-center space-y-2 cursor-pointer transition-all',
  tocImageThumbnails: 'flex flex-wrap gap-2 pt-2',
  tocImageThumb: 'relative w-16 h-20 rounded-lg border border-outline-variant overflow-hidden group shrink-0',
  tocTableWrapper: 'overflow-x-auto border border-outline-variant rounded-xl',
  tocTable: 'w-full text-left text-xs',
  tocThead: 'bg-surface-container-high border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider',
  tocTh: 'p-3',
  tocTd: 'p-3 border-b border-outline-variant/50 align-top',
  tocRowChapter: 'bg-surface-container font-bold text-on-surface',
  tocRowLesson: 'hover:bg-surface/80 text-on-surface',
  tocPageInput: 'w-16 h-7 px-2 text-center text-xs bg-surface-container-lowest rounded border border-outline font-semibold',

  // Drawer
  drawerBackdrop: 'fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn',
  drawerDialog: 'bg-surface-container-lowest w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-outline-variant animate-slideLeft',
  drawerHeader: 'px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0',
  drawerBody: 'p-6 space-y-5 overflow-y-auto flex-1 text-xs',
};
