import { useState, useEffect, useRef } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const { user } = useAuth();
  const { language } = useLanguage();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close sidebar on mobile when screen size changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  // Handle hamburger menu hover
  const handleMenuHover = (hovering: boolean) => {
    if (!hideSidebar && !isMobile) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (hovering) {
        setIsHovering(true);
        setIsSidebarOpen(true);
      } else {
        // Add a small delay before closing to prevent flickering
        timeoutRef.current = setTimeout(() => {
          if (!isHovering) {
            setIsSidebarOpen(false);
          }
        }, 300);
      }
    }
  };

  // Handle sidebar hover
  const handleSidebarHover = (hovering: boolean) => {
    if (!hideSidebar && !isMobile) {
      setIsHovering(hovering);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!hovering) {
        timeoutRef.current = setTimeout(() => {
          setIsSidebarOpen(false);
        }, 300);
      }
    }
  };

  // Toggle sidebar for mobile (click instead of hover)
  const toggleSidebar = () => {
    if (!hideSidebar && isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  // Close sidebar when a page is selected
  const handlePageSelect = () => {
    setIsSidebarOpen(false);
    setIsHovering(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        toggleSidebar={toggleSidebar} 
        hideSidebar={hideSidebar}
        onMenuHover={handleMenuHover}
      />
      
      <div className="flex flex-1 pt-[57px]">
        {!hideSidebar && (
          <Sidebar 
            isSidebarOpen={isSidebarOpen} 
            onHover={handleSidebarHover}
            onPageSelect={handlePageSelect}
          />
        )}
        
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