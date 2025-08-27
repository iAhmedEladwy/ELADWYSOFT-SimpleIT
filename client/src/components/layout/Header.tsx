import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/hooks/use-language';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Menu, Globe, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  toggleSidebar: () => void;
  hideSidebar?: boolean;
  onMenuHover?: (hovering: boolean) => void;
}

export default function Header({ toggleSidebar, hideSidebar = false, onMenuHover }: HeaderProps) {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isMobile = useMobile();
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: language === 'English' ? "Logged out successfully" : "تم تسجيل الخروج بنجاح",
        description: language === 'English' 
          ? "You have been logged out of your account."
          : "لقد تم تسجيل خروجك من حسابك.",
      });
    } catch (error) {
      toast({
        title: language === 'English' ? "Logout failed" : "فشل تسجيل الخروج",
        description: language === 'English' 
          ? "There was an error logging out. Please try again."
          : "حدث خطأ في تسجيل الخروج. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  // Get initials from username for avatar
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-20 h-[57px]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {!hideSidebar && (
            <button 
              onClick={isMobile ? toggleSidebar : undefined}
              onMouseEnter={!isMobile && onMenuHover ? () => onMenuHover(true) : undefined}
              onMouseLeave={!isMobile && onMenuHover ? () => onMenuHover(false) : undefined}
              className="p-2 rounded-md text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors"
              aria-label={language === 'English' ? "Toggle menu" : "تبديل القائمة"}
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="text-blue-600 font-bold text-xl mr-1">SimpleIT</span>
            </div>
            <span className="text-gray-500 text-xs -mt-1">
              {language === 'English' ? 'IT Asset Management System' : 'نظام إدارة أصول تكنولوجيا المعلومات'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <Select value={language} onValueChange={toggleLanguage}>
            <SelectTrigger className="w-[140px] h-9">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Arabic">العربية</SelectItem>
            </SelectContent>
          </Select>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity">
                <span className="hidden md:inline">{user?.username || 'User'}</span>
                <Avatar className="h-8 w-8 bg-primary text-white">
                  <AvatarFallback>{user ? getInitials(user.username) : 'U'}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {language === 'English' ? 'My Account' : 'حسابي'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/profile')}>
                {language === 'English' ? 'Profile' : 'الملف الشخصي'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/changes-log')}>
                <FileText className="mr-2 h-4 w-4" />
                {language === 'English' ? 'Changes Log' : 'سجل التغييرات'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                {language === 'English' ? 'Log out' : 'تسجيل الخروج'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}