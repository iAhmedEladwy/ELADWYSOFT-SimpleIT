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
import { Menu, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  toggleSidebar: () => void;
  hideSidebar?: boolean;
}

export default function Header({ toggleSidebar, hideSidebar = false }: HeaderProps) {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get initials from username for avatar
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10 h-[57px]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {!hideSidebar && (
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-primary hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="text-blue-600 font-bold text-xl mr-1">SimpleIT</span>
            </div>
            <span className="text-gray-500 text-xs -mt-1">IT Asset Management System</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-sm">
                <span className="hidden md:inline">{user?.username || 'User'}</span>
                <Avatar className="h-8 w-8 bg-primary text-white">
                  <AvatarFallback>{user ? getInitials(user.username) : 'U'}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.username || 'User'}</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs text-gray-500">{user?.email || ''}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
