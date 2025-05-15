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
  };

  // Get class for sidebar item based on active path
  const getLinkClass = (path: string) => {
    const baseClass = "flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-primary rounded-md transition-all";
    const activeClass = "bg-primary bg-opacity-10 text-primary font-medium";
    
    return location === path 
      ? `${baseClass} ${activeClass}` 
      : baseClass;
  };

  // If sidebar is hidden on mobile, don't render anything
  if (!isSidebarOpen) {
    return null;
  }

  return (
    <aside className="fixed top-[57px] bottom-0 left-0 w-64 bg-white shadow-sm overflow-y-auto flex flex-col z-10">
      <nav className="py-4 flex flex-col gap-1 px-2">
        <Link href="/">
          <a className={getLinkClass('/')}>
            <Home className="h-5 w-5" />
            <span>{translations.Dashboard}</span>
          </a>
        </Link>
        
        {hasAccess(3) && (
          <Link href="/users">
            <a className={getLinkClass('/users')}>
              <Users className="h-5 w-5" />
              <span>{translations.Users}</span>
            </a>
          </Link>
        )}
        
        <Link href="/employees">
          <a className={getLinkClass('/employees')}>
            <UserPlus className="h-5 w-5" />
            <span>{translations.Employees}</span>
          </a>
        </Link>
        
        <Link href="/assets">
          <a className={getLinkClass('/assets')}>
            <Laptop className="h-5 w-5" />
            <span>{translations.Assets}</span>
          </a>
        </Link>
        
        <Link href="/tickets">
          <a className={getLinkClass('/tickets')}>
            <Ticket className="h-5 w-5" />
            <span>{translations.Tickets}</span>
          </a>
        </Link>
        
        {hasAccess(2) && (
          <Link href="/reports">
            <a className={getLinkClass('/reports')}>
              <BarChart2 className="h-5 w-5" />
              <span>{translations.Reports}</span>
            </a>
          </Link>
        )}
        
        {hasAccess(3) && (
          <Link href="/system-config">
            <a className={getLinkClass('/system-config')}>
              <Settings className="h-5 w-5" />
              <span>{translations.SystemConfig}</span>
            </a>
          </Link>
        )}
      </nav>
    </aside>
  );
}
