import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/hooks/use-language';
import Layout from '@/components/layout/Layout';
import TransactionHistoryTable from '@/components/assets/TransactionHistoryTable';
import { History } from 'lucide-react';

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
        <div className="container mx-auto py-6">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <History className="h-6 w-6 mr-2" />
              <h1 className="text-2xl font-bold">{translations.title}</h1>
            </div>
          </div>
          
          {/* Transaction History Table */}
          <TransactionHistoryTable />
        </div>
      </Layout>
    </>
  );
}