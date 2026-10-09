export const styles = {
  layout: 'bg-surface text-on-surface font-sans min-h-screen flex flex-col antialiased selection:bg-primary-fixed selection:text-on-primary-fixed',
  
  // Header
  header: 'sticky top-0 z-40 w-full bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant transition-all',
  headerContainer: 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4',
  headerBrand: 'flex items-center gap-3 select-none',
  headerLogoIcon: 'w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs',
  headerBrandText: 'flex flex-col',
  headerTitle: 'text-base font-bold text-on-surface leading-tight tracking-tight',
  headerBadge: 'text-[10px] font-bold text-primary uppercase tracking-wider',
  
  headerRight: 'flex items-center gap-4',
  headerUserInfo: 'hidden md:flex flex-col text-right',
  headerUserName: 'text-xs font-bold text-on-surface leading-snug',
  headerUserRole: 'text-[11px] text-on-surface-variant font-medium',
  headerAvatar: 'w-9 h-9 rounded-full ring-2 ring-primary/20 bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden',
  headerLogoutBtn: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container text-xs font-semibold text-on-surface transition-all active:scale-95 cursor-pointer',
  
  // Body Layout (Sidebar + Main)
  bodyWrapper: 'flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6 items-start',
  
  // Sidebar
  sidebar: 'w-full md:w-64 bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xs shrink-0 space-y-4',
  sidebarSectionTitle: 'text-[11px] font-bold text-outline uppercase tracking-wider px-3 pt-1',
  sidebarNavList: 'space-y-1',
  sidebarNavLinkActive: 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm shadow-xs transition-all',
  sidebarNavLinkInactive: 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium text-sm transition-all',
  sidebarIcon: 'material-symbols-outlined text-[20px]',
  sidebarQuickNotice: 'p-3 rounded-xl bg-surface-container border border-outline-variant/60 text-xs text-on-surface-variant space-y-1 mt-4',
  sidebarNoticeTitle: 'font-bold text-on-surface flex items-center gap-1.5 text-xs',
  
  // Main Content
  mainContent: 'flex-1 w-full min-w-0 overflow-visible',
};
