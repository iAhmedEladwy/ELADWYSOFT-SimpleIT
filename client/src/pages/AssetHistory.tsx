import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/hooks/use-language';
import TransactionHistoryTable from '@/components/assets/TransactionHistoryTable';

export default function AssetHistory() {
  const { language } = useLanguage();
  
  // Translations
  const translations = {
    title: language === 'English' ? 'Asset History' : 'سجل الأصول',
    description: language === 'English' 
      ? 'Track and manage all asset check-in and check-out activities with detailed history and reports' 
      : 'تتبع وإدارة جميع أنشطة تسجيل الوصول والمغادرة للأصول مع سجل تفصيلي وتقارير',
    metaDescription: language === 'English' 
      ? 'Track and manage all asset check-in and check-out activities with detailed history and reports' 
      : 'تتبع وإدارة جميع أنشطة تسجيل الوصول والمغادرة للأصول مع سجل تفصيلي وتقارير',
  };

  return (
    <>
      <Helmet>
        <title>{translations.title} | SimpleIT</title>
        <meta name="description" content={translations.metaDescription} />
      </Helmet>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{translations.title}</h1>
            <p className="text-gray-600">{translations.description}</p>
          </div>
        </div>
        
        {/* Transaction History Table */}
        <TransactionHistoryTable />
      </div>
    </>
  );
}