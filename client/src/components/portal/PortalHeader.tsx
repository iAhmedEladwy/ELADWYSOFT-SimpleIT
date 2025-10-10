/**
 * Employee Portal Header Component
 * 
 * Context: SimpleIT v0.4.3 - Navigation header for employee portal
 * 
 * Features:
 * - Portal navigation links (My Assets, My Tickets, My Profile)
 * - Language switcher
 * - Logout button
 * - Displays current employee name
 * - Responsive design for mobile
 * - Bilingual support (English/Arabic)
 */

import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Menu, User, LogOut, Languages } from 'lucide-react';

export default function PortalHeader() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [location, navigate] = useLocation();

  const translations = {
    portalTitle: language === 'English' ? 'Employee Portal' : 'بوابة الموظفين',
    dashboard: language === 'English' ? 'Dashboard' : 'لوحة التحكم',
    myAssets: language === 'English' ? 'My Assets' : 'أصولي',
    myTickets: language === 'English' ? 'My Tickets' : 'تذاكري',
    myProfile: language === 'English' ? 'My Profile' : 'ملفي الشخصي',
    logout: language === 'English' ? 'Logout' : 'تسجيل الخروج',
    welcome: language === 'English' ? 'Welcome' : 'مرحباً',
    menu: language === 'English' ? 'Menu' : 'القائمة',
  };

  const navItems = [
    { path: '/portal/dashboard', label: translations.dashboard, icon: '📊' },
    { path: '/portal/my-assets', label: translations.myAssets, icon: '📦' },
    { path: '/portal/my-tickets', label: translations.myTickets, icon: '🎫' },
    { path: '/portal/my-profile', label: translations.myProfile, icon: '👤' },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="text-xl font-bold text-primary -mt-1">
                {translations.portalTitle}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side: Language & User Menu */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleLanguage()}
              className="hidden sm:flex items-center gap-2"
            >
              <Languages className="h-4 w-4" />
              {language === 'English' ? 'عربي' : 'English'}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {translations.welcome}, {user?.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/portal/my-profile')}>
                  <User className="h-4 w-4 mr-2" />
                  {translations.myProfile}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => toggleLanguage()}
                  className="sm:hidden"
                >
                  <Languages className="h-4 w-4 mr-2" />
                  {language === 'English' ? 'عربي' : 'English'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {translations.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="outline" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navItems.map((item) => (
                  <DropdownMenuItem 
                    key={item.path}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}