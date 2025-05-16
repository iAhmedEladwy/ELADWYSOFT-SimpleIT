import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import FloatingActionButton from '../common/FloatingActionButton';
import { useMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/lib/authContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();

  // Update sidebar state when mobile state changes
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 pt-[57px]">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
          {children}
        </main>
      </div>
      
      {/* Only show FAB if user is authenticated */}
      {user && <FloatingActionButton />}
    </div>
  );
}
