export const styles = {
  container: 'space-y-6 pb-12 font-sans max-w-7xl mx-auto',
  
  // Hero / Profile Header Card (Glassmorphism & Gradient)
  heroCard: 'relative overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface/90 backdrop-blur-xl p-6 sm:p-8 shadow-sm transition-all',
  heroBgGradient: 'absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-primary/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none',
  heroContent: 'relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6',
  heroProfileInfo: 'flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left',
  
  // Avatar
  avatarWrapper: 'relative group shrink-0',
  avatarImage: 'h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover ring-4 ring-primary/20 shadow-md transition-all group-hover:ring-primary/40',
  avatarUploadBtn: 'absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-[#004bb5] to-[#2575fc] text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer',
  
  // Badges & Details
  nameRow: 'flex flex-wrap items-center justify-center sm:justify-start gap-2.5',
  studentName: 'text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface',
  roleBadge: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20',
  metaRow: 'mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1.5 text-xs text-on-surface-variant',
  metaItem: 'flex items-center gap-1.5',
  
  // Hero Actions
  heroActions: 'flex flex-wrap items-center justify-center sm:justify-end gap-3 shrink-0',
  btnPrimary: 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004bb5] to-[#2575fc] px-4.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-95 transition-all disabled:opacity-60 cursor-pointer',
  btnSecondary: 'inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4.5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-all active:scale-95 cursor-pointer',

  // Bento Metrics Grid
  metricsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
  metricCard: 'relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/80 backdrop-blur-md p-5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between group',
  metricTop: 'flex items-center justify-between',
  metricIconWrapper: 'grid h-11 w-11 place-items-center rounded-xl shadow-xs transition-transform group-hover:scale-105',
  metricValue: 'mt-3 text-2xl font-extrabold tracking-tight text-on-surface',
  metricLabel: 'text-xs font-medium text-on-surface-variant',
  metricFooter: 'mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold pt-2 border-t border-outline-variant/40',

  // Layout Columns
  mainGrid: 'grid grid-cols-1 lg:grid-cols-12 gap-6',
  leftCol: 'lg:col-span-7 flex flex-col gap-6',
  rightCol: 'lg:col-span-5 flex flex-col gap-6',

  // Standard Section Card
  card: 'rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs flex flex-col gap-4',
  cardHeader: 'flex items-center justify-between pb-2 border-b border-outline-variant/40',
  cardTitle: 'text-base font-bold text-on-surface flex items-center gap-2',
  cardSubtitle: 'text-xs text-on-surface-variant mt-0.5',

  // Chart Container
  chartContainer: 'w-full h-64 sm:h-72 relative pt-2',
  chartTabs: 'inline-flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/50 text-xs font-semibold',
  chartTabActive: 'px-3 py-1.5 rounded-lg bg-surface text-primary shadow-xs font-bold transition-all',
  chartTabInactive: 'px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface transition-all cursor-pointer',

  // Info Items
  infoGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-3.5',
  infoBox: 'rounded-xl bg-surface-container-low/70 border border-outline-variant/30 p-3.5 flex flex-col justify-between',
  infoLabel: 'text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80',
  infoValue: 'mt-1 text-sm font-semibold text-on-surface',

  // Security Accordion
  securitySection: 'rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs transition-all',
  inputClass: 'w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15',

  // Edit Form
  formCard: 'rounded-2xl border border-primary/30 bg-surface-container-lowest p-5 sm:p-6 shadow-sm',
}
