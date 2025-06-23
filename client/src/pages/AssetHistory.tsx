import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/hooks/use-language';
import Layout from '@/components/layout/Layout';
import TransactionHistoryTable from '@/components/assets/TransactionHistoryTable';

export default function AssetHistory() {
  const { language } = useLanguage();
  
  // Translations
  const translations = {
    title: language === 'English' ? 'Asset History' : 'سجل الأصول',
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

      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{translations.title}</h1>
              <p className="text-gray-600 mt-1">{translations.metaDescription}</p>
            </div>
          </div>
          
          {/* Transaction History Table */}
          <div className="bg-white rounded-lg shadow">
            <TransactionHistoryTable />
          </div>
        </div>
      </Layout>
    </>
  );
}