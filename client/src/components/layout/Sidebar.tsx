import { useLocation, Link } from 'wouter';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/hooks/use-language';
import { RoleGuard, hasPermission } from '@/components/auth/RoleGuard';
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
    AuditLogs: language === 'English' ? 'Audit Logs' : 'سجلات التدقيق',
    Profile: language === 'English' ? 'My Profile' : 'الملف الشخصي',
    ManageYourIT: language === 'English' ? 'Manage Your IT' : 'إدارة تكنولوجيا المعلومات',
    PinSidebar: language === 'English' ? 'Pin Sidebar' : 'تثبيت الشريط الجانبي',
    UnpinSidebar: language === 'English' ? 'Unpin Sidebar' : 'إلغاء تثبيت الشريط الجانبي',
  };

  // Get class for sidebar item based on active path
  const getLinkClass = (path: string) => {
    const baseClass = "flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:text-primary rounded-lg transition-all duration-300";
    const activeClass = "bg-gradient-to-r from-primary/20 to-transparent text-primary font-medium shadow-sm";
    
    return location === path 
      ? `${baseClass} ${activeClass}` 
      : baseClass;
  };

  // Handle link click
  const handleLinkClick = () => {
    if (onPageSelect) {
      onPageSelect();
    }
  };

  // If sidebar is hidden, don't render anything
  if (!isSidebarOpen) {
    return null;
  }

  return (
    <aside 
      onMouseEnter={() => onHover && onHover(true)}
      onMouseLeave={() => onHover && onHover(false)}
      className={`
        fixed top-[57px] bottom-0 w-64 bg-gradient-to-b from-white to-gray-50 
        shadow-md overflow-y-auto flex flex-col z-10 border-gray-100 
        transition-all duration-300 ease-in-out
        ${language === 'Arabic' ? 'right-0 border-l' : 'left-0 border-r'}
        ${isSidebarOpen ? 'translate-x-0' : language === 'Arabic' ? 'translate-x-full' : '-translate-x-full'}
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
        
        <RoleGuard allowedRoles={['admin', 'manager', 'agent']}>
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
        
        <RoleGuard allowedRoles={['admin', 'manager', 'agent']}>
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
        
        <RoleGuard allowedRoles={['admin', 'manager']}>
          <div className={`transform transition-transform duration-200 ${language === 'English' ? 'hover:translate-x-1' : 'hover:-translate-x-1'}`}>
            <Link href="/reports" className={getLinkClass('/reports')} onClick={handleLinkClick}>
              <BarChart2 className="h-5 w-5" />
              <span>{translations.Reports}</span>
            </Link>
          </div>
        </RoleGuard>
        
        <RoleGuard allowedRoles={['admin']}>
          <div className={`transform transition-transform duration-200 ${language === 'English' ? 'hover:translate-x-1' : 'hover:-translate-x-1'}`}>
            <Link href="/system-config" className={getLinkClass('/system-config')} onClick={handleLinkClick}>
              <Settings className="h-5 w-5" />
              <span>{translations.SystemConfig}</span>
            </Link>
          </div>
        </RoleGuard>
        
        <RoleGuard allowedRoles={['admin', 'manager']}>
          <div className={`transform transition-transform duration-200 ${language === 'English' ? 'hover:translate-x-1' : 'hover:-translate-x-1'}`}>
            <Link href="/audit-logs" className={getLinkClass('/audit-logs')} onClick={handleLinkClick}>
              <FileText className="h-5 w-5" />
              <span>{translations.AuditLogs}</span>
            </Link>
          </div>
        </RoleGuard>

        <div className={`transform transition-transform duration-200 ${language === 'English' ? 'hover:translate-x-1' : 'hover:-translate-x-1'}`}>
          <Link href="/profile" className={getLinkClass('/profile')} onClick={handleLinkClick}>
            <User className="h-5 w-5" />
            <span>{translations.Profile}</span>
          </Link>
        </div>
      </nav>

      <div className="mt-auto p-4">
        <div className="flex items-center justify-center p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-col items-center text-center">
            <span className="text-primary font-bold text-lg">ELADWYSOFT</span>
            <span className="text-xs text-gray-500">SimpleIT v0.2.5</span>
          </div>
        </div>
      </div>
    </aside>
  );
}