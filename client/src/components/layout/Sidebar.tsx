import { useLocation, Link } from 'wouter';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/hooks/use-language';
import { RoleGuard, hasPermission } from '@/components/auth/RoleGuard';
import { ROLE_IDS } from '@shared/roles.config';
import { getVersionString, APP_FULL_NAME } from '@shared/version';
import { useState, useEffect } from 'react';
import {
  Home,
  Users,
  UserPlus,
  Laptop,
  Ticket,
  BarChart2,
  Settings,
  History,
  FileText,
  User,
  Pin,
  PinOff,
  Shield,
  Wrench,
  ChevronDown,
  ChevronRight,
  ArrowUpCircle,
  Database,
  Activity,
  Terminal,
  Zap,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  isSidebarOpen: boolean;
  onHover?: (hovering: boolean) => void;
  onPageSelect?: () => void;
  isPinned?: boolean;
  onPinToggle?: () => void;
}

export default function Sidebar({ isSidebarOpen, onHover, onPageSelect, isPinned = false, onPinToggle }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState(false);
  const [isDeveloperToolsOpen, setIsDeveloperToolsOpen] = useState(false);

  useEffect(() => {
  // Auto-expand Admin Console if on any admin page
  if (location.startsWith('/admin-console')) {
    setIsAdminConsoleOpen(true);
  }
  // Auto-expand Developer Tools if on any developer tools page
  if (location.startsWith('/developer-tools')) {
    setIsDeveloperToolsOpen(true);
  }
  }, [location]);


  // Link translations
  const translations = {
    Dashboard: language === 'English' ? 'Dashboard' : 'لوحة التحكم',
    Users: language === 'English' ? 'Users' : 'المستخدمين',
    Employees: language === 'English' ? 'Employees' : 'الموظفين',
    Assets: language === 'English' ? 'Assets' : 'الأصول',
    AssetHistory: language === 'English' ? 'Asset History' : 'سجل الأصول',
    Tickets: language === 'English' ? 'Tickets' : 'التذاكر',
    Reports: language === 'English' ? 'Reports' : 'التقارير',
    SystemConfig: language === 'English' ? 'System Config' : 'إعدادات النظام',
    AdminConsole: language === 'English' ? 'Admin Console' : 'وحدة التحكم الإدارية',
    Maintenance: language === 'English' ? 'Maintenance' : 'الصيانة',
    UpgradeRequests: language === 'English' ? 'Upgrade Requests' : 'طلبات الترقية',
    AuditLogs: language === 'English' ? 'Audit Logs' : 'سجلات التدقيق',
    ManageYourIT: language === 'English' ? 'Manage Your IT' : 'إدارة تكنولوجيا المعلومات',
    PinSidebar: language === 'English' ? 'Pin Sidebar' : 'تثبيت الشريط الجانبي',
    UnpinSidebar: language === 'English' ? 'Unpin Sidebar' : 'إلغاء تثبيت الشريط الجانبي',
    BulkOperations: language === 'English' ? 'Bulk Operations History' : 'سجل العمليات المجمعة',
    BackupRestore: language === 'English' ? 'Backup & Restore' : 'النسخ الاحتياطي والاستعادة',
    SystemHealth: language === 'English' ? 'System Health' : 'حالة النظام',
    SystemLogs: language === 'English' ? 'System Logs' : 'سجلات النظام',
    DeveloperTools: language === 'English' ? 'Developer Tools' : 'أدوات المطور',
  };

  // Get class for sidebar item based on active path
  // Update the getLinkClass function to handle submenu paths:
    const getLinkClass = (path: string) => {
    const baseClass = "flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:text-primary rounded-lg transition-all duration-300";
    const activeClass = "bg-gradient-to-r from-primary/20 to-transparent text-primary font-medium shadow-sm";
    
    // Check if current location matches the path or is a child of it
    const isActive = location === path || location.startsWith(path + '/');
    
    return isActive ? `${baseClass} ${activeClass}` : baseClass;
  };

  // Handle link click
  const handleLinkClick = () => {
    if (onPageSelect) {
      onPageSelect();
    }
  };

  const toggleAdminConsole = () => {
  setIsAdminConsoleOpen(!isAdminConsoleOpen);
};

  const toggleDeveloperTools = () => {
    setIsDeveloperToolsOpen(!isDeveloperToolsOpen);
  };

  // If sidebar is hidden, don't render anything
  if (!isSidebarOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay backdrop when sidebar is open but not pinned (for mobile or hover mode) */}
      {isSidebarOpen && !isPinned && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 lg:bg-transparent"
          onClick={() => onPageSelect && onPageSelect()}
        />
      )}
      
      <aside 
        onMouseEnter={() => onHover && onHover(true)}
        onMouseLeave={() => onHover && onHover(false)}
        className={`
          fixed top-[57px] bottom-0 w-64 bg-gradient-to-b from-white to-gray-50 
          overflow-y-auto flex flex-col border-gray-100 
          transition-all duration-300 ease-in-out
          ${language === 'Arabic' ? 'right-0 border-l' : 'left-0 border-r'}
          ${isSidebarOpen ? 'translate-x-0' : language === 'Arabic' ? 'translate-x-full' : '-translate-x-full'}
          ${!isPinned ? 'z-20 shadow-xl' : 'z-10 shadow-md'}
        `}
      >
      <div className="pt-6 pb-2 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {translations.ManageYourIT}
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPinToggle}
                  className="h-8 w-8 text-gray-500 hover:text-primary"
                >
                  {isPinned ? (
                    <PinOff className="h-4 w-4" />
                  ) : (
                    <Pin className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={language === 'Arabic' ? 'left' : 'right'}>
                <p>{isPinned ? translations.UnpinSidebar : translations.PinSidebar}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className={`h-0.5 w-1/2 bg-gradient-to-r from-primary to-transparent mt-2 ${language === 'Arabic' ? 'mr-auto' : ''}`}></div>
      </div>
      
      <nav className="py-4 flex flex-col gap-2 px-3">
        <div className={`transform transition-transform duration-200 ${language === 'English' ? 'hover:translate-x-1' : 'hover:-translate-x-1'}`}>
          <Link href="/" className={getLinkClass('/')} onClick={handleLinkClick}>
            <Home className="h-5 w-5" />
            <span>{translations.Dashboard}</span>
          </Link>
        </div>
        
        <RoleGuard allowedRoles={[ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.MANAGER, ROLE_IDS.AGENT]}>
          <div className={`transform transition-transform duration-200 ${language === 'English' ? 'hover:translate-x-1' : 'hover:-translate-x-1'}`}>
            <Link href="/employees" className={getLinkClass('/employees')} onClick={handleLinkClick}>
              <UserPlus className="h-5 w-5" />
              <span>{translations.Employees}</span>
            </Link>
          </div>
        </RoleGuard>
        
        <div className={`transform transition-transform duration-200 ${language === 'English' ? 'hover:translate-x-1' : 'hover:-translate-x-1'}`}>
          <Link href="/assets" className={getLinkClass('/assets')} onClick={handleLinkClick}>
            <Laptop className="h-5 w-5" />
            <span>{translations.Assets}</span>
          </Link>
        </div>
        
        <RoleGuard allowedRoles={[ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.MANAGER, ROLE_IDS.AGENT]}>
          <div className={`transform transition-transform duration-200 ${language === 'English' ? 'hover:translate-x-1' : 'hover:-translate-x-1'}`}>
            <Link href="/asset-history" className={getLinkClass('/asset-history')} onClick={handleLinkClick}>
              <History className="h-5 w-5" />
              <span>{translations.AssetHistory}</span>
            </Link>
          </div>
        </RoleGuard>
        
        <div className={`transform transition-transform duration-200 ${language === 'English' ? 'hover:translate-x-1' : 'hover:-translate-x-1'}`}>
          <Link href="/tickets" className={getLinkClass('/tickets')} onClick={handleLinkClick}>
            <Ticket className="h-5 w-5" />
            <span>{translations.Tickets}</span>
          </Link>
        </div>
        
        <RoleGuard allowedRoles={[ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.MANAGER]}>
          <div className={`transform transition-transform duration-200 ${language === 'English' ? 'hover:translate-x-1' : 'hover:-translate-x-1'}`}>
            <Link href="/reports" className={getLinkClass('/reports')} onClick={handleLinkClick}>
              <BarChart2 className="h-5 w-5" />
              <span>{translations.Reports}</span>
            </Link>
          </div>
        </RoleGuard>
        
        <RoleGuard allowedRoles={[ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN]}>
          <div className={`transform transition-transform duration-200 ${language === 'English' ? 'hover:translate-x-1' : 'hover:-translate-x-1'}`}>
            <Link href="/system-config" className={getLinkClass('/system-config')} onClick={handleLinkClick}>
              <Settings className="h-5 w-5" />
              <span>{translations.SystemConfig}</span>
            </Link>
          </div>
        </RoleGuard>
        <RoleGuard allowedRoles={[ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN]}>
          <div className="space-y-1">
            {/* Admin Console Parent Menu */}
            <div 
              className={`${getLinkClass('/admin-console')} cursor-pointer justify-between`}
              onClick={(e) => {
                e.preventDefault();
                toggleAdminConsole();
              }}
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                  <span className="flex items-center gap-2">
                  {translations.AdminConsole}
                  <span className="bg-gray-200 text-gray-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    Beta
                  </span>
                </span>
              </div>
              {isAdminConsoleOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
            
           {/* Admin Console Submenu Items */}
            {isAdminConsoleOpen && (
              <div className={`ml-6 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 ${language === 'Arabic' ? 'mr-6 ml-0 border-r-2 border-l-0' : ''}`}>
                {/* Manage Users */}
                <Link 
                  href="/admin-console/users" 
                  className={`${getLinkClass('/admin-console/users')} pl-4 ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}
                  onClick={handleLinkClick}
                >
                  <Users className="h-4 w-4" />
                  <span>{translations.Users}</span>
                </Link>
                
                {/* Backup & Restore - NEW */}
                <Link 
                  href="/admin-console/backup-restore" 
                  className={`${getLinkClass('/admin-console/backup-restore')} pl-4 ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}
                  onClick={handleLinkClick}
                >
                  <Database className="h-4 w-4" />
                  <span>{translations.BackupRestore}</span>
                </Link>
                
                {/* System Health - NEW */}
                <Link 
                  href="/admin-console/system-health" 
                  className={`${getLinkClass('/admin-console/system-health')} pl-4 ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}
                  onClick={handleLinkClick}
                >
                  <Activity className="h-4 w-4" />
                  <span>{translations.SystemHealth}</span>
                </Link>
                
                {/* Audit Logs */}
                <Link 
                  href="/admin-console/audit-logs" 
                  className={`${getLinkClass('/admin-console/audit-logs')} pl-4 ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}
                  onClick={handleLinkClick}
                >
                  <FileText className="h-4 w-4" />
                  <span>{translations.AuditLogs}</span>
                </Link>
                
                {/* Upgrade Requests */}
                <Link 
                  href="/admin-console/upgrade-requests" 
                  className={`${getLinkClass('/admin-console/upgrade-requests')} pl-4 ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}
                  onClick={handleLinkClick}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  <span>{translations.UpgradeRequests}</span>
                </Link>
                
                {/* Bulk Operations History */}
                <Link 
                  href="/admin-console/bulk-operations" 
                  className={`${getLinkClass('/admin-console/bulk-operations')} pl-4 ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}
                  onClick={handleLinkClick}
                >
                  <Activity className="h-4 w-4" />
                  <span>{translations.BulkOperations}</span>
                </Link>
              </div>
            )}
          </div>
        </RoleGuard>

        {/* Developer Tools - Super Admin Only */}
        <RoleGuard allowedRoles={[ROLE_IDS.SUPER_ADMIN]}>
          <div className="space-y-1">
            {/* Developer Tools Parent Menu */}
            <div 
              className={`${getLinkClass('/developer-tools')} cursor-pointer justify-between border-l-2 border-yellow-500 bg-gradient-to-r from-yellow-50 to-transparent`}
              onClick={(e) => {
                e.preventDefault();
                toggleDeveloperTools();
              }}
            >
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-yellow-600" />
                <span className="flex items-center gap-2">
                  {translations.DeveloperTools}
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium">DEV</span>
                </span>
              </div>
              {isDeveloperToolsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
            
            {/* Developer Tools Submenu Items */}
            {isDeveloperToolsOpen && (
              <div className={`ml-6 space-y-1 border-l-2 border-yellow-200 dark:border-yellow-700 ${language === 'Arabic' ? 'mr-6 ml-0 border-r-2 border-l-0' : ''}`}>
                {/* System Logs */}
                <Link 
                  href="/developer-tools/system-logs" 
                  className={`${getLinkClass('/developer-tools/system-logs')} pl-4 ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}
                  onClick={handleLinkClick}
                >
                  <Terminal className="h-4 w-4" />
                  <span>{translations.SystemLogs}</span>
                </Link>
                
                {/* Database Console - Coming Soon */}
                <div className={`${getLinkClass('')} pl-4 opacity-50 cursor-not-allowed ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}>
                  <Database className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    {language === 'English' ? 'Database Console' : 'وحدة تحكم قاعدة البيانات'}
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded">
                      {language === 'English' ? 'Soon' : 'قريباً'}
                    </span>
                  </span>
                </div>
                
                {/* API Tester - Coming Soon */}
                <div className={`${getLinkClass('')} pl-4 opacity-50 cursor-not-allowed ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}>
                  <Zap className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    {language === 'English' ? 'API Tester' : 'مختبر API'}
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded">
                      {language === 'English' ? 'Soon' : 'قريباً'}
                    </span>
                  </span>
                </div>
                
                {/* Performance Monitor - Coming Soon */}
                <div className={`${getLinkClass('')} pl-4 opacity-50 cursor-not-allowed ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}>
                  <Activity className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    {language === 'English' ? 'Performance Monitor' : 'مراقب الأداء'}
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded">
                      {language === 'English' ? 'Soon' : 'قريباً'}
                    </span>
                  </span>
                </div>
                
                {/* Cache Manager - Coming Soon */}
                <div className={`${getLinkClass('')} pl-4 opacity-50 cursor-not-allowed ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}>
                  <FileCode className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    {language === 'English' ? 'Cache Manager' : 'مدير ذاكرة التخزين المؤقت'}
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded">
                      {language === 'English' ? 'Soon' : 'قريباً'}
                    </span>
                  </span>
                </div>
                
                {/* Config Editor - Coming Soon */}
                <div className={`${getLinkClass('')} pl-4 opacity-50 cursor-not-allowed ${language === 'Arabic' ? 'pr-4 pl-0' : ''}`}>
                  <Settings className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    {language === 'English' ? 'Config Editor' : 'محرر التكوين'}
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded">
                      {language === 'English' ? 'Soon' : 'قريباً'}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </RoleGuard>
      </nav>

      <div className="mt-auto p-4">
        <div className="flex items-center justify-center p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-col items-center text-center">
            <span className="text-primary font-bold text-lg">ELADWYSOFT</span>
            <span className="text-xs text-gray-500">
              SimpleIT {getVersionString()}
            </span>
          </div>
        </div>
      </div>
          </aside>
    </>
  );
}