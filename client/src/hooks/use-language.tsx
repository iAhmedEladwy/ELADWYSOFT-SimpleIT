import React, { createContext, useState, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type LanguageContextType = {
  language: string;
  toggleLanguage: (newLang?: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState<string>('English');

  // Helper to check if session exists
  const hasSession = () => {
    return document.cookie.includes('connect.sid');
  };

  // Fetch current config - only if authenticated
  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/system-config'],
    enabled: hasSession(), // Only fetch if session exists
  });

  // Update language when config changes
  useEffect(() => {
    if (config && (config as any).language) {
      const dbLanguage = (config as any).language;
      
      // Handle both abbreviated codes (en/ar) and full names (English/Arabic)
      let newLanguage: string;
      
      if (dbLanguage === 'en' || dbLanguage === 'English') {
        newLanguage = 'English';
      } else if (dbLanguage === 'ar' || dbLanguage === 'Arabic') {
        newLanguage = 'Arabic';
      } else {
        // Default to English for any unknown value
        newLanguage = 'English';
      }
      
      setLanguage(newLanguage);
    } else if (!isLoading) {
      // Only set default when we're sure config has loaded but language is not set
      setLanguage('English');
    }
  }, [config, isLoading]);

  // Update language mutation
  const updateLanguageMutation = useMutation({
    mutationFn: async (newLanguage: string) => {
      // SystemConfig expects 'en' or 'ar' format
      const languageCode = newLanguage === 'English' ? 'en' : 'ar';
      const res = await apiRequest('/api/system-config', 'PUT', { language: languageCode });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-config'] });
    },
  });

  const toggleLanguage = (newLang?: string) => {
    // If a specific language is provided, use it; otherwise toggle
    const newLanguage = newLang || (language === 'English' ? 'Arabic' : 'English');
    setLanguage(newLanguage);
    
    // Send the update to the backend
    updateLanguageMutation.mutate(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}