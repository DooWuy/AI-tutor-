export const styles = {
  container: 'flex-grow w-full space-y-space-lg',
  
  // Hero Banner Section
  heroSection: 'relative overflow-hidden rounded-xl bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-primary-fixed/20 border border-outline-variant p-6 lg:p-8 shadow-sm',
  heroContentWrapper: 'flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10',
  heroLeft: 'space-y-3 max-w-2xl',
  heroBadge: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm',
  heroTitle: 'font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight',
  heroSubtitle: 'font-body-md text-body-md text-on-surface-variant',
  
  // Progress Bar
  progressContainer: 'pt-2 max-w-md space-y-1.5',
  progressHeader: 'flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant',
  progressTrack: 'w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden',
  progressBar: 'h-full bg-primary rounded-full transition-all duration-500',
  
  // Quick Actions (Hero Right)
  quickActionsWrapper: 'flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]',
  actionBtnPrimary: 'w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all active:scale-95 duration-100',
  actionBtnSecondary: 'w-full flex items-center justify-center gap-2 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant text-on-surface font-label-sm text-label-sm font-semibold py-2.5 px-4 rounded-xl transition-all active:scale-95 duration-100',
  
  heroBgGlow: 'absolute -right-16 -bottom-16 w-64 h-64 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none',
  
  // Two Column Grid
  mainGrid: 'grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start',
  leftCol: 'lg:col-span-8 space-y-space-lg',
  rightCol: 'lg:col-span-4 space-y-space-lg',
  
  // Section Cards
  sectionCard: 'bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-5',
  sectionHeader: 'flex items-center justify-between',
  sectionHeaderLeft: 'flex items-center space-x-2',
  sectionTitle: 'font-headline-lg text-lg font-bold text-on-surface',
  
  // Task Items
  taskCardActive: 'p-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-low transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4',
  taskCardCompleted: 'p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-90',
  taskContentWrapper: 'flex items-start space-x-3.5',
  taskIconWrapperMath: 'w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5',
  taskIconWrapperPhysics: 'w-10 h-10 rounded-lg bg-secondary-fixed/50 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5',
  taskIconWrapperCompleted: 'w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5',
  taskSubjectMath: 'text-xs font-semibold uppercase tracking-wider text-primary',
  taskSubjectPhysics: 'text-xs font-semibold uppercase tracking-wider text-secondary',
  taskSubjectCompleted: 'text-xs font-semibold uppercase tracking-wider text-emerald-800',
  taskBtnActive: 'sm:self-center inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-on-primary font-label-sm text-label-sm font-semibold rounded-lg hover:bg-primary-container active:scale-95 transition-all',
  taskBtnSecondary: 'sm:self-center inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-sm text-label-sm font-semibold rounded-lg hover:bg-surface-container active:scale-95 transition-all',
  taskBtnCompleted: 'sm:self-center inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-label-sm font-label-sm font-semibold',
  
  // AI Recommendations
  aiAlertCard: 'p-4 rounded-xl bg-tertiary-fixed/30 border border-tertiary-fixed-dim/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4',
  aiAlertBtn: 'self-stretch md:self-auto whitespace-nowrap px-4 py-2 bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-semibold rounded-lg transition-all active:scale-95 shadow-sm',
  trendingLink: 'p-3 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container transition-colors flex items-center justify-between group',
  
  // AI History
  historyCard: 'p-4 rounded-xl border border-outline-variant bg-surface hover:border-primary/50 transition-colors flex flex-col justify-between space-y-3',
  historyCardTitle: 'text-sm font-semibold text-on-surface leading-snug line-clamp-2',
  historyCardSummary: 'text-xs text-on-surface-variant line-clamp-3 leading-relaxed',
  historyCardFooter: 'pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs',
  
  // Right Sidebar Widgets
  sidebarCard: 'bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm space-y-4',
  sidebarCardSpecial: 'bg-gradient-to-br from-surface-container to-surface-container-high rounded-xl border border-outline-variant p-5 shadow-sm space-y-3',
  streakGrid: 'grid grid-cols-7 gap-1.5 pt-1 text-center',
  streakDayPast: 'flex flex-col items-center space-y-1 p-1 rounded-lg bg-surface',
  streakDayActive: 'flex flex-col items-center space-y-1 p-1 rounded-lg bg-primary-fixed/40 ring-1 ring-primary',
  rankRow: 'flex items-center justify-between p-2.5 rounded-lg bg-surface border border-outline-variant/50',
  rankRowActive: 'flex items-center justify-between p-2.5 rounded-lg bg-primary-fixed/40 border border-primary/40 ring-1 ring-primary/30',
  
  tipQuote: 'italic text-xs text-on-surface-variant border-l-2 border-primary pl-3 py-0.5',
  tipCard: 'p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/60 space-y-1.5',
};
