/**
 * Employee Portal Layout Component
 * 
 * Context: SimpleIT v0.4.3 - Wrapper layout for employee portal pages
 * 
 * Requirements:
 * - Only accessible to users with 'Employee' role
 * - Redirects non-employees to main system
 * - Uses existing useLanguage() hook for translations
 * - Includes portal-specific header and navigation
 * - Bilingual support (English/Arabic)
 * 
 * Props:
 * - children: React.ReactNode - Page content to render
 */

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import PortalHeader from './PortalHeader';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const [, navigate] = useLocation();

  // Handle redirects with useEffect to avoid render issues
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    } else if (!isLoading && user && user.role?.toLowerCase() !== 'employee') {
      navigate('/');
    }
  }, [isLoading, user, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          {language === 'English' ? 'Loading...' : 'جاري التحميل...'}
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user || user.role?.toLowerCase() !== 'employee') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={language === 'Arabic' ? 'rtl' : 'ltr'}>
      <PortalHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          {language === 'English' 
            ? '© 2025 ELADWYSOFT SimpleIT - Employee Portal' 
            : '© 2025 ELADWYSOFT SimpleIT - بوابة الموظفين'}
        </div>
      </footer>
    </div>
  );
}