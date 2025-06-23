import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import FloatingActionButton from '../common/FloatingActionButton';
import { useMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/lib/authContext';

interface LayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

export default function Layout({ children, hideSidebar = false }: LayoutProps) {
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile && !hideSidebar);
  const { user } = useAuth();

  // Update sidebar state when mobile state changes or hideSidebar prop changes
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
        
        <main className={`flex-1 transition-all duration-300 ${!hideSidebar && isSidebarOpen ? 'lg:ml-64' : ''}`}>
          {children}
        </main>
      </div>
      
      {/* Only show FAB if user is authenticated */}
      {user && <FloatingActionButton />}
    </div>
  );
}
