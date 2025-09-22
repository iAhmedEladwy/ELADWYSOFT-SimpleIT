import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { 
  Menu, 
  Globe, 
  FileText, 
  User, 
  LogOut, 
  Shield, 
  Mail, 
  Hash,
  Bell,
  UserCheck,
  Building
} from 'lucide-react';
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

  // Translation object for Header component
  const translations = {
    loggedOutSuccessfully: language === 'English' ? "Logged out successfully" : "تم تسجيل الخروج بنجاح",
    loggedOutDescription: language === 'English' 
      ? "You have been logged out of your account."
      : "لقد تم تسجيل خروجك من حسابك.",
    logoutFailed: language === 'English' ? "Logout failed" : "فشل تسجيل الخروج",
    logoutFailedDescription: language === 'English' 
      ? "There was an error logging out. Please try again."
      : "حدث خطأ في تسجيل الخروج. يرجى المحاولة مرة أخرى.",
    toggleMenu: language === 'English' ? "Toggle menu" : "تبديل القائمة",
    clickToPinHover: language === 'English' ? 'Click to pin/unpin • Hover to peek' : 'انقر للتثبيت • مرر للمعاينة',
    systemTitle: language === 'English' ? 'IT Asset Management System' : 'نظام إدارة أصول تكنولوجيا المعلومات',
    organization: language === 'English' ? 'Organization:' : 'المؤسسة:',
    defaultOrganization: language === 'English' ? 'Organization' : 'المؤسسة',
    employeeId: language === 'English' ? 'Employee ID:' : 'معرف الموظف:',
    accountMenu: language === 'English' ? 'Account Menu' : 'قائمة الحساب',
    profile: language === 'English' ? 'Profile' : 'الملف الشخصي',
    changesLog: language === 'English' ? 'Changes Log' : 'سجل التغييرات',
    notifications: language === 'English' ? 'Notifications' : 'الإشعارات',
    pendingApprovals: language === 'English' ? 'Pending Approvals' : 'الموافقات المعلقة',
    logOut: language === 'English' ? 'Log out' : 'تسجيل الخروج'
  };

  // Fetch system configuration for company display settings
  const { data: systemConfig } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => apiRequest<any>('/api/system-config')
  });
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: translations.loggedOutSuccessfully,
        description: translations.loggedOutDescription,
      });
    } catch (error) {
      toast({
        title: translations.logoutFailed,
        description: translations.logoutFailedDescription,
        variant: "destructive",
      });
    }
  };

  // Get initials from username for avatar
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || 'User';
  };

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'agent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'employee':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-20 h-[57px]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {!hideSidebar && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={isMobile ? toggleSidebar : toggleSidebar}
                    onMouseEnter={!isMobile && onMenuHover ? () => onMenuHover(true) : undefined}
                    onMouseLeave={!isMobile && onMenuHover ? () => onMenuHover(false) : undefined}
                    className="p-2 rounded-md text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors"
                    aria-label={translations.toggleMenu}
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side={language === 'Arabic' ? 'left' : 'right'}>
                  <p>
                    {isMobile 
                      ? translations.toggleMenu
                      : translations.clickToPinHover
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="text-blue-600 font-bold text-xl mr-1">SimpleIT</span>
            </div>
            <span className="text-gray-500 text-xs -mt-1">
              {translations.systemTitle}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Company Badge - Configurable Display */}
          {systemConfig?.showCompanyInHeader && systemConfig?.companyDisplayLocation === 'badge' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="hidden md:flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <Building className="h-3 w-3" />
                    <span className="max-w-32 truncate">
                      {systemConfig?.companyName || translations.defaultOrganization}
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side={language === 'Arabic' ? 'left' : 'right'}>
                  <p>
                    {`${translations.organization} ${systemConfig?.companyName || translations.defaultOrganization}`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

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
                <span className="hidden md:inline">{getUserDisplayName()}</span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white font-semibold">
                    {user ? getInitials(getUserDisplayName()) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {/* Enhanced User Info Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                      {user ? getInitials(getUserDisplayName()) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {getUserDisplayName()}
                      </p>
                      {user?.role && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-0.5 ${getRoleColor(user.role)}`}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {formatRole(user.role)}
                        </Badge>
                      )}
                    </div>
                    {user?.email && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                    {user?.employeeId && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Hash className="h-3 w-3" />
                        <span>{translations.employeeId} {user.employeeId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DropdownMenuLabel className="px-4 py-2 text-xs text-gray-500 font-medium">
                {translations.accountMenu}
              </DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => setLocation('/profile')} className="px-4 py-2 cursor-pointer">
                <User className="mr-3 h-4 w-4" />
                {translations.profile}
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setLocation('/changes-log')} className="px-4 py-2 cursor-pointer">
                <FileText className="mr-3 h-4 w-4" />
                {translations.changesLog}
              </DropdownMenuItem>

              {/* Status Indicators Section */}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="px-4 py-2 text-xs text-gray-500 font-medium">
                {translations.notifications}
              </DropdownMenuLabel>
              
              <DropdownMenuItem className="px-4 py-2 cursor-pointer">
                <Bell className="mr-3 h-4 w-4" />
                <span className="flex-1">{translations.notifications}</span>
                <Badge variant="secondary" className="ml-2 px-2 py-0.5 text-xs">
                  0
                </Badge>
              </DropdownMenuItem>

              <DropdownMenuItem className="px-4 py-2 cursor-pointer">
                <UserCheck className="mr-3 h-4 w-4" />
                <span className="flex-1">{translations.pendingApprovals}</span>
                <Badge variant="secondary" className="ml-2 px-2 py-0.5 text-xs">
                  0
                </Badge>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="px-4 py-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="mr-3 h-4 w-4" />
                {translations.logOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}