import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/hooks/use-language';
import Layout from '@/components/layout/Layout';
import TransactionHistoryTable from '@/components/assets/TransactionHistoryTable';

export default function AssetTransactions() {
  const { language } = useLanguage();
  
  // Translations
  const translations = {
    title: language === 'English' ? 'Asset Transactions' : 'معاملات الأصول',
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
        <div className="container mx-auto py-6 space-y-6">
          <TransactionHistoryTable />
        </div>
      </Layout>
    </>
  );
}