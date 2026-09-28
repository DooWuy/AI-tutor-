export const styles = {
  container: 'w-full space-y-6 pb-12 font-sans',

  // Top Page Header Banner
  headerCard: 'bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5',
  headerLeft: 'space-y-1.5',
  headerBadge: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold',
  headerTitle: 'text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2.5',
  headerSubtitle: 'text-sm text-on-surface-variant max-w-2xl leading-relaxed',
  headerActions: 'flex items-center flex-wrap gap-3',
  headerSettingsBtn: 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-xs font-bold text-on-surface shadow-xs active:scale-95 transition-all cursor-pointer',

  // Filter Bar Section
  filterCard: 'bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4',
  filterGroup: 'flex flex-wrap items-center gap-3 flex-1',
  filterItemWrapper: 'flex flex-col gap-1',
  filterLabel: 'text-[11px] font-bold text-outline uppercase tracking-wider',
  filterSelect: 'h-10 px-3.5 py-1.5 text-xs font-semibold bg-surface rounded-xl border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer min-w-[160px]',
  filterPeriodTabs: 'inline-flex p-1 bg-surface-container rounded-xl border border-outline-variant self-end md:self-auto',
  filterPeriodBtnActive: 'px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary shadow-xs text-xs font-bold transition-all',
  filterPeriodBtnInactive: 'px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface text-xs font-medium transition-all cursor-pointer',
  customDateRow: 'flex items-center gap-2 pt-2 md:pt-0',
  customDateInput: 'h-9 px-2.5 text-xs bg-surface rounded-lg border border-outline text-on-surface',

  // KPI Metrics Grid
  kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5',
  kpiCard: 'bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-xs flex flex-col justify-between hover:border-primary/50 transition-all group relative overflow-hidden',
  kpiTop: 'flex items-center justify-between',
  kpiIconPrimary: 'w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold',
  kpiIconSecondary: 'w-12 h-12 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold',
  kpiIconWarning: 'w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center font-bold',
  kpiBadgePrimary: 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed',
  kpiBadgeSecondary: 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed',
  kpiBadgeWarning: 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container animate-pulse',
  kpiBody: 'mt-5 space-y-1',
  kpiLabel: 'text-xs font-bold text-on-surface-variant uppercase tracking-wider',
  kpiValue: 'text-3xl font-extrabold text-on-surface tracking-tight',
  kpiUnit: 'text-sm font-semibold text-outline ml-1',
  kpiFooter: 'mt-5 pt-3.5 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant',
  kpiLinkBtn: 'text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0',

  // Charts Grid Section
  chartsGrid: 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch',
  chartCardLeft: 'lg:col-span-7 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-xs flex flex-col justify-between space-y-4',
  chartCardRight: 'lg:col-span-5 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-xs flex flex-col justify-between space-y-4',
  chartHeader: 'flex items-center justify-between',
  chartTitle: 'text-base font-bold text-on-surface flex items-center gap-2',
  chartSubtitle: 'text-xs text-on-surface-variant mt-0.5',
  chartWrapper: 'w-full h-64 relative pt-2',

  // Knowledge Gaps Section
  gapsSectionCard: 'bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-xs space-y-5',
  gapsHeader: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3',
  gapsTitle: 'text-lg font-bold text-on-surface flex items-center gap-2',
  gapsSubtitle: 'text-xs text-on-surface-variant',
  gapsList: 'space-y-4',
  gapCard: 'p-5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-low transition-all space-y-3.5',
  gapCardTop: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3',
  gapRankBadge: 'w-7 h-7 rounded-lg bg-primary-fixed text-primary font-extrabold text-xs flex items-center justify-center shrink-0',
  gapTopicName: 'text-base font-bold text-on-surface',
  gapSubjectPill: 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed',
  gapPercentArea: 'flex items-baseline gap-1 text-right shrink-0',
  gapPercentText: 'text-2xl font-black text-error',
  gapPercentLabel: 'text-xs font-semibold text-outline',
  gapProgressTrack: 'w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden',
  gapProgressBar: 'h-full bg-gradient-to-r from-tertiary to-error rounded-full transition-all duration-500',
  gapStatsRow: 'flex flex-wrap items-center gap-4 text-xs text-on-surface-variant pt-1',
  gapStatChip: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/60 font-medium',
  gapAdviceBox: 'p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant shadow-xs text-xs leading-relaxed space-y-2 transition-all hover:border-primary/40',
  gapAdviceTitle: 'font-bold text-on-surface flex items-center gap-2 text-xs',
  gapAdviceIconWrap: 'w-6 h-6 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0 shadow-2xs',
  gapAdviceText: 'text-on-surface-variant font-medium leading-relaxed pl-8',

  // Modals Core
  modalBackdrop: 'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn',
  modalDialog: 'bg-surface-container-lowest w-full max-w-3xl rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]',
  modalHeader: 'px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0',
  modalTitle: 'text-lg font-bold text-on-surface flex items-center gap-2',
  modalCloseBtn: 'w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-all cursor-pointer',
  modalBody: 'p-6 space-y-5 overflow-y-auto flex-1',
  modalFooter: 'px-6 py-4 border-t border-outline-variant flex items-center justify-end gap-3 bg-surface-container-low shrink-0',

  // Table styles for At-Risk Students
  tableWrapper: 'w-full overflow-x-auto border border-outline-variant rounded-xl',
  table: 'w-full text-left text-xs border-collapse',
  tableThead: 'bg-surface-container border-b border-outline-variant text-outline uppercase tracking-wider font-bold',
  tableTh: 'py-3 px-4',
  tableRow: 'border-b border-outline-variant/60 hover:bg-surface-container-low/60 transition-colors',
  tableTd: 'py-3.5 px-4 text-on-surface align-middle',
  badgeRed: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error text-on-error text-[11px] font-bold shadow-xs',
  badgeOrange: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary text-on-tertiary text-[11px] font-bold shadow-xs',
  reasonTag: 'inline-block px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-medium mr-1 mb-1 border border-outline-variant/50',

  // Buttons & Controls
  btnPrimary: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
  btnSecondary: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface font-semibold text-xs rounded-xl active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
  btnSuccess: 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer',
  btnDangerSmall: 'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-error text-on-error font-bold text-xs rounded-lg hover:bg-red-700 active:scale-95 transition-all cursor-pointer',

  // Forms in Modals
  formGroup: 'space-y-1.5',
  formLabel: 'text-xs font-bold text-on-surface flex items-center justify-between',
  formInput: 'w-full px-3.5 py-2 text-xs bg-surface rounded-xl border border-outline text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all',
  formTextarea: 'w-full px-3.5 py-2.5 text-xs bg-surface rounded-xl border border-outline text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[120px] leading-relaxed',
  formHint: 'text-[11px] text-on-surface-variant',

  // Toast / Feedback banner
  alertSuccess: 'p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-medium',
  alertError: 'p-4 rounded-xl bg-error-container border border-error/20 text-on-error-container text-xs flex items-center gap-2.5 font-medium',

  // Empty state
  emptyStateBox: 'text-center py-12 px-4 space-y-3',
  emptyStateIcon: 'w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-outline text-[28px]',
  emptyStateTitle: 'text-sm font-bold text-on-surface',
  emptyStateDesc: 'text-xs text-on-surface-variant max-w-sm mx-auto',
};
