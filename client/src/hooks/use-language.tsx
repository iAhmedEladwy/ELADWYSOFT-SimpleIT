import React, { createContext, useState, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type LanguageContextType = {
  language: string;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState<string>('English');

  // Fetch current config
  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/system-config'],
    onSuccess: (data) => {
      if (data?.language) {
        setLanguage(data.language);
      }
    },
  });

  // Update language mutation
  const updateLanguageMutation = useMutation({
    mutationFn: async (newLanguage: string) => {
      const res = await apiRequest('PUT', '/api/system-config', { language: newLanguage });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-config'] });
    },
  });

  const toggleLanguage = () => {
    const newLanguage = language === 'English' ? 'Arabic' : 'English';
    setLanguage(newLanguage);
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
