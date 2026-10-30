export const styles = {
  page: 'flex flex-col gap-7 pb-12 font-sans max-w-7xl mx-auto w-full px-4 sm:px-6',

  // Heading Header
  heading: {
    wrapper: 'flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2 pb-1',
    eyebrow: 'inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-primary uppercase mb-1.5',
    title: 'text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight',
    wave: 'text-primary',
    subtitle: 'text-sm text-on-surface-variant mt-2 leading-relaxed',
    actionLink: 'inline-flex items-center gap-2 text-xs font-semibold text-primary px-4 py-2.5 rounded-full bg-primary/10 hover:bg-primary hover:text-white border border-primary/20 transition-all duration-200 self-start sm:self-center shadow-xs hover:shadow-md hover:-translate-y-0.5',
  },

  // Hero Banner Section
  hero: {
    section: 'home-hero relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#04356f] via-[#0853a8] to-[#1275e2] text-white p-6 sm:p-10 shadow-lg hover:shadow-xl transition-shadow duration-300 min-h-[350px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center',
    left: 'lg:col-span-7 flex flex-col justify-center z-10 space-y-4',
    tags: 'flex items-center gap-2.5 flex-wrap',
    label: 'inline-flex items-center gap-2 text-[11px] font-bold tracking-wider text-blue-100 uppercase bg-white/12 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20',
    pulseDot: 'h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.3)] animate-pulse',
    streakBadge: 'inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-300/30',
    title: 'text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight',
    desc: 'text-sm sm:text-base text-blue-100/90 max-w-xl leading-relaxed',
    ctaGroup: 'flex flex-wrap items-center gap-3 pt-2',
    primaryBtn: 'inline-flex items-center justify-center gap-2 rounded-xl bg-white text-[#04356f] hover:bg-blue-50 active:scale-95 px-5 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all',
    secondaryBtn: 'inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/25 px-4.5 py-3 text-sm font-semibold text-white transition-all',
    foot: 'flex items-center gap-2 text-xs text-blue-100/80 pt-1',
    artWrapper: 'lg:col-span-5 hidden lg:flex items-center justify-center relative w-full h-full min-h-[260px]',
    bookCard: 'relative z-10 flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl text-white text-center transform hover:scale-105 transition-transform duration-300',
    bookText: 'text-[11px] font-extrabold tracking-widest text-blue-100',
    artNote: 'text-xs italic text-blue-100/80 mt-1',
  },

  // Quick Action Prompts
  quickPrompts: {
    wrapper: 'flex items-center gap-3 overflow-x-auto py-1 px-1',
    label: 'flex items-center gap-1.5 text-xs font-bold text-on-surface-variant shrink-0 uppercase tracking-wider',
    chips: 'flex items-center gap-2 shrink-0',
    chip: 'inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest hover:border-primary/50 hover:bg-primary/5 hover:text-primary text-xs font-semibold text-on-surface transition-all whitespace-nowrap shadow-xs active:scale-95',
  },

  // Navigation Shortcuts
  shortcuts: {
    grid: 'grid grid-cols-1 sm:grid-cols-3 gap-4',
    card: 'group relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low/60 p-5 shadow-xs hover:shadow-md hover:border-primary/50 transition-all flex items-start justify-between gap-4 active:scale-[0.99]',
    iconWrapper: (bgClass: string, textClass: string) => `grid h-12 w-12 place-items-center rounded-xl shrink-0 ${bgClass} ${textClass} shadow-xs group-hover:scale-105 transition-transform`,
    content: 'flex-1 min-w-0',
    title: 'text-base font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5',
    text: 'text-xs text-on-surface-variant mt-1 leading-relaxed line-clamp-2',
    arrow: 'text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-1',
  },

  // Main Two-Column Grid
  grid: {
    layout: 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start',
    studyCol: 'lg:col-span-8 space-y-6',
    personalCol: 'lg:col-span-4 space-y-6',
  },

  // Today Card
  today: {
    card: 'rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs space-y-5',
    header: 'flex items-center justify-between pb-3 border-b border-outline-variant/30',
    headingGroup: 'flex items-center gap-3',
    iconWrapper: 'grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-primary shrink-0',
    title: 'text-base font-bold text-on-surface',
    subtitle: 'text-xs text-on-surface-variant',
    dateBadge: 'px-3 py-1 rounded-full bg-surface-container-low text-xs font-semibold text-on-surface-variant border border-outline-variant/40',
    statsGrid: 'grid grid-cols-1 sm:grid-cols-3 gap-3.5',
    statBox: 'p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 flex flex-col justify-between hover:bg-surface-container-low transition-colors',
    statBoxHighlight: 'p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-surface-container-low/60 to-surface-container-low/60 border border-amber-500/30 flex flex-col justify-between hover:border-amber-500/50 transition-colors',
    statIcon: 'text-primary mb-2',
    statIconHighlight: 'text-amber-500 mb-2',
    statNumbers: 'flex items-baseline gap-1',
    statValue: 'text-2xl font-extrabold text-on-surface tracking-tight',
    statUnit: 'text-xs font-semibold text-on-surface-variant',
    statLabel: 'text-xs text-on-surface-variant mt-1',
  },

  // 7-day Rhythm Chart Card
  chartCard: {
    card: 'rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs space-y-4',
    header: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30',
    headingGroup: 'flex items-center gap-3',
    iconWrapper: 'grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0',
    title: 'text-base font-bold text-on-surface',
    subtitle: 'text-xs text-on-surface-variant',
    toggleGroup: 'inline-flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs font-semibold self-start sm:self-auto',
    toggleBtnActive: 'px-3 py-1.5 rounded-lg bg-surface text-primary shadow-xs font-bold transition-all',
    toggleBtnInactive: 'px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface transition-all cursor-pointer',
    summaryRow: 'flex flex-wrap items-center justify-between gap-4 py-2 text-xs text-on-surface-variant',
    summaryItem: 'flex items-center gap-1.5',
    summaryBold: 'font-bold text-on-surface',
    moreLink: 'inline-flex items-center gap-1 text-primary font-semibold hover:underline',
    chartWrapper: 'grid grid-cols-[34px_minmax(0,1fr)] gap-2.5 pt-2',
    yLabels: 'flex flex-col justify-between text-[10px] text-on-surface-variant text-right py-1 font-mono',
    svg: 'w-full h-[150px] overflow-visible',
    xLabels: 'grid grid-cols-7 gap-1 mt-2 text-[10px] text-center text-on-surface-variant font-medium',
    xLabelToday: 'text-primary font-bold',
  },

  // Recent Quizzes Card
  recent: {
    card: 'rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs space-y-4',
    header: 'flex items-center justify-between pb-3 border-b border-outline-variant/30',
    headingGroup: 'flex items-center gap-3',
    iconWrapper: 'grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0',
    title: 'text-base font-bold text-on-surface',
    subtitle: 'text-xs text-on-surface-variant',
    viewAllLink: 'inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline',
    list: 'divide-y divide-outline-variant/20',
    item: 'py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low/40 px-2 rounded-xl transition-colors',
    left: 'flex items-center gap-3 min-w-0',
    itemIcon: 'grid h-10 w-10 place-items-center rounded-xl bg-surface-container-low text-primary shrink-0',
    info: 'min-w-0',
    itemTitle: 'text-sm font-bold text-on-surface truncate block',
    meta: 'flex flex-wrap items-center gap-2 mt-1 text-xs text-on-surface-variant',
    subjectBadge: 'px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-[11px]',
    timeText: 'text-[11px]',
    xpBadge: 'text-amber-600 dark:text-amber-400 font-bold text-[11px]',
    actions: 'flex items-center gap-2 shrink-0 self-end sm:self-center',
    scorePill: (scoreClass: string) => {
      const colors: Record<string, string> = {
        'score-high': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
        'score-medium': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
        'score-low': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
        'score-none': 'bg-surface-container-low text-on-surface-variant border border-outline-variant/40',
      };
      return `px-2.5 py-1 rounded-lg text-xs font-bold ${colors[scoreClass] || colors['score-none']}`;
    },
    reviewBtn: 'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low text-xs font-semibold text-primary transition-all active:scale-95 shadow-xs',
    retryBtn: 'grid h-8 w-8 place-items-center rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant hover:text-primary transition-all active:scale-95 shadow-xs',
    emptyState: 'flex items-center gap-4 p-6 rounded-xl bg-surface-container-low/50 border border-outline-variant/30 text-center sm:text-left flex-col sm:flex-row',
    emptyIcon: 'grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0',
    emptyTitle: 'text-base font-bold text-on-surface',
    emptyDesc: 'text-xs text-on-surface-variant mt-1 max-w-md',
    emptyBtn: 'mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-sm',
  },

  // Personal Column: Streak
  streak: {
    card: 'rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs space-y-4',
    header: 'flex items-center gap-3 pb-3 border-b border-outline-variant/30',
    iconWrapper: 'grid h-11 w-11 place-items-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0',
    tag: 'text-[10px] font-bold tracking-widest uppercase text-on-surface-variant',
    title: 'text-base font-bold text-on-surface',
    desc: 'text-xs text-on-surface-variant leading-relaxed',
    focusBox: 'p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-2 mt-2',
    focusHeader: 'flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider',
    focusSubject: 'text-sm font-bold text-on-surface block',
    focusStats: 'text-xs text-on-surface-variant',
    focusBtn: 'inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-1',
  },

  // Personal Column: Progress Link
  progressLink: {
    card: 'home-progress-link group block rounded-2xl border border-outline-variant/60 bg-surface-container-lowest hover:border-primary/50 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-3',
    header: 'flex items-center justify-between',
    tag: 'text-[10px] font-bold tracking-widest uppercase text-on-surface-variant',
    levelPill: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20',
    mainStat: 'flex items-baseline justify-between',
    totalXp: 'text-2xl font-extrabold text-on-surface tracking-tight',
    nextHint: 'text-xs font-semibold text-primary',
    track: 'w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden',
    fill: 'h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-500',
    footer: 'flex items-center justify-between text-xs font-bold text-primary pt-1 group-hover:translate-x-0.5 transition-transform',
  },

  // Personal Column: Leaderboard
  leaderboard: {
    card: 'rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs space-y-4',
    header: 'flex items-center justify-between pb-3 border-b border-outline-variant/30',
    headingGroup: 'flex items-center gap-3',
    iconWrapper: 'grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0',
    title: 'text-base font-bold text-on-surface',
    subtitle: 'text-xs text-on-surface-variant',
    viewAllLink: 'grid h-8 w-8 place-items-center rounded-lg text-primary hover:bg-primary/10 transition-colors',
    list: 'space-y-1.5',
    row: (isMe: boolean) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
      isMe ? 'bg-primary/10 border border-primary/30 shadow-xs' : 'bg-surface-container-low/60 hover:bg-surface-container-low'
    }`,
    place: (rank: number) => {
      const colors: Record<number, string> = {
        1: 'text-amber-500 font-extrabold',
        2: 'text-slate-400 font-extrabold',
        3: 'text-amber-700 font-extrabold',
      };
      return `grid place-items-center w-6 text-xs font-bold ${colors[rank] || 'text-on-surface-variant'}`;
    },
    avatar: 'grid place-items-center h-7 w-7 rounded-full bg-primary/15 text-primary text-xs font-bold overflow-hidden shrink-0',
    avatarImg: 'h-full w-full object-cover',
    nameCol: 'flex-1 min-w-0',
    displayName: 'text-xs font-bold text-on-surface truncate block',
    levelText: 'text-[10px] text-on-surface-variant block',
    xp: 'text-xs font-extrabold text-on-surface shrink-0 font-mono',
    meDivider: 'pt-3 mt-3 border-t border-outline-variant/30',
    meLabel: 'text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block',
    loading: 'py-6 text-center text-xs text-on-surface-variant',
  },
};
