import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/hooks/use-language';

interface LayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

export default function Layout({ children, hideSidebar = false }: LayoutProps) {
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile && !hideSidebar);
  const { user } = useAuth();
  const { language } = useLanguage();

  // Update sidebar state when mobile state changes
  useEffect(() => {
    setIsSidebarOpen(!isMobile && !hideSidebar);
  }, [isMobile, hideSidebar]);

  const toggleSidebar = () => {
    if (!hideSidebar) {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header toggleSidebar={toggleSidebar} hideSidebar={hideSidebar} />
      
      <div className="flex flex-1 pt-[57px]">
        {!hideSidebar && <Sidebar isSidebarOpen={isSidebarOpen} />}
        
        {/* Updated main content with RTL support */}
        <main className={`
          flex-1 transition-all duration-300
          ${!hideSidebar && isSidebarOpen && language === 'English' ? 'lg:ml-64' : ''}
          ${!hideSidebar && isSidebarOpen && language === 'Arabic' ? 'lg:mr-64' : ''}
          ${hideSidebar ? 'ml-0 mr-0' : ''}
        `}>
          {children}
        </main>
      </div>
    </div>
  );
}