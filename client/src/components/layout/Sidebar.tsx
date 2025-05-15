import { useLocation, Link } from 'wouter';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/hooks/use-language';
import {
  Home,
  Users,
  UserPlus,
  Laptop,
  Ticket,
  BarChart2,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
}

export default function Sidebar({ isSidebarOpen }: SidebarProps) {
  const [location] = useLocation();
  const { hasAccess } = useAuth();
  const { language } = useLanguage();

  // Link translations
  const translations = {
    Dashboard: language === 'English' ? 'Dashboard' : 'لوحة التحكم',
    Users: language === 'English' ? 'Users' : 'المستخدمين',
    Employees: language === 'English' ? 'Employees' : 'الموظفين',
    Assets: language === 'English' ? 'Assets' : 'الأصول',
    Tickets: language === 'English' ? 'Tickets' : 'التذاكر',
    Reports: language === 'English' ? 'Reports' : 'التقارير',
    SystemConfig: language === 'English' ? 'System Config' : 'إعدادات النظام',
    ManageYourIT: language === 'English' ? 'Manage Your IT' : 'إدارة تكنولوجيا المعلومات',
  };

  // Add any additional state or variables here

  // Get class for sidebar item based on active path
  const getLinkClass = (path: string) => {
    const baseClass = "flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:text-primary rounded-lg transition-all duration-300";
    const activeClass = "bg-gradient-to-r from-primary/20 to-transparent text-primary font-medium shadow-sm";
    
    return location === path 
      ? `${baseClass} ${activeClass}` 
      : baseClass;
  };

  // If sidebar is hidden on mobile, don't render anything
  if (!isSidebarOpen) {
    return null;
  }

  return (
    <aside className="fixed top-[57px] bottom-0 left-0 w-64 bg-gradient-to-b from-white to-gray-50 shadow-md overflow-y-auto flex flex-col z-10 border-r border-gray-100 transition-all duration-300">
      <div className="pt-6 pb-2 px-4">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          {translations.ManageYourIT}
        </h2>
        <div className="h-0.5 w-1/2 bg-gradient-to-r from-primary to-transparent mt-2"></div>
      </div>
      
      <nav className="py-4 flex flex-col gap-2 px-3">
        <div className="transform hover:translate-x-1 transition-transform duration-200">
          <Link href="/">
            <a className={getLinkClass('/')}>
              <Home className="h-5 w-5" />
              <span>{translations.Dashboard}</span>
            </a>
          </Link>
        </div>
        
        {hasAccess(3) && (
          <div className="transform hover:translate-x-1 transition-transform duration-200">
            <Link href="/users">
              <a className={getLinkClass('/users')}>
                <Users className="h-5 w-5" />
                <span>{translations.Users}</span>
              </a>
            </Link>
          </div>
        )}
        
        <div className="transform hover:translate-x-1 transition-transform duration-200">
          <Link href="/employees">
            <a className={getLinkClass('/employees')}>
              <UserPlus className="h-5 w-5" />
              <span>{translations.Employees}</span>
            </a>
          </Link>
        </div>
        
        <div className="transform hover:translate-x-1 transition-transform duration-200">
          <Link href="/assets">
            <a className={getLinkClass('/assets')}>
              <Laptop className="h-5 w-5" />
              <span>{translations.Assets}</span>
            </a>
          </Link>
        </div>
        
        <div className="transform hover:translate-x-1 transition-transform duration-200">
          <Link href="/tickets">
            <a className={getLinkClass('/tickets')}>
              <Ticket className="h-5 w-5" />
              <span>{translations.Tickets}</span>
            </a>
          </Link>
        </div>
        
        {hasAccess(2) && (
          <div className="transform hover:translate-x-1 transition-transform duration-200">
            <Link href="/reports">
              <a className={getLinkClass('/reports')}>
                <BarChart2 className="h-5 w-5" />
                <span>{translations.Reports}</span>
              </a>
            </Link>
          </div>
        )}
        
        {hasAccess(3) && (
          <div className="transform hover:translate-x-1 transition-transform duration-200">
            <Link href="/system-config">
              <a className={getLinkClass('/system-config')}>
                <Settings className="h-5 w-5" />
                <span>{translations.SystemConfig}</span>
              </a>
            </Link>
          </div>
        )}
      </nav>

      <div className="mt-auto p-4">
        <div className="flex items-center justify-center p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-col items-center text-center">
            <span className="text-primary font-bold text-lg">ELADWYSOFT</span>
            <span className="text-xs text-gray-500">SimpleIT v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
