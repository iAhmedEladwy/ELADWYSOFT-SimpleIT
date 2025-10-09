/**
 * My Assets Page - Employee Portal
 * 
 * Context: SimpleIT v0.4.3 - View assets assigned to authenticated employee
 * 
 * Features:
 * - Displays all assets assigned to the employee
 * - Shows asset details (ID, type, brand, model, serial number)
 * - "Report Issue" button to create ticket for asset
 * - Empty state when no assets assigned
 * - Loading state while fetching data
 * - Error handling
 * - Bilingual support (English/Arabic)
 * 
 * API Endpoint: GET /api/portal/my-assets
 * Authorization: Employee role (handled by backend)
 */

import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package } from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';

export default function MyAssets() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();

  const translations = {
    title: language === 'English' ? 'My Assigned Assets' : 'الأصول المخصصة لي',
    noAssets: language === 'English' 
      ? 'No assets are currently assigned to you' 
      : 'لا توجد أصول مخصصة لك حالياً',
    loading: language === 'English' ? 'Loading your assets...' : 'جاري تحميل أصولك...',
    error: language === 'English' ? 'Failed to load assets' : 'فشل تحميل الأصول',
    assetId: language === 'English' ? 'Asset ID' : 'رقم الأصل',
    type: language === 'English' ? 'Type' : 'النوع',
    brand: language === 'English' ? 'Brand' : 'العلامة التجارية',
    model: language === 'English' ? 'Model' : 'الموديل',
    serialNumber: language === 'English' ? 'Serial Number' : 'الرقم التسلسلي',
    status: language === 'English' ? 'Status' : 'الحالة',
    reportIssue: language === 'English' ? 'Report Issue' : 'الإبلاغ عن مشكلة',
  };

  // Fetch employee's assets
  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['/api/portal/my-assets'],
    queryFn: async () => {
      const response = await fetch('/api/portal/my-assets', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      
      return response.json();
    },
  });

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">{translations.title}</h1>
          <p className="text-gray-600 mt-2">
            {language === 'English' 
              ? 'View and manage the IT assets assigned to you'
              : 'عرض وإدارة أصول تكنولوجيا المعلومات المخصصة لك'}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">{translations.loading}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600">{translations.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && assets?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">{translations.noAssets}</p>
            </CardContent>
          </Card>
        )}

        {/* Assets Grid */}
        {!isLoading && !error && assets?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset: any) => (
              <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{asset.assetId}</span>
                    <Badge variant={asset.status === 'Available' ? 'default' : 'secondary'}>
                      {asset.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{translations.type}:</span>
                      <span className="font-medium">{asset.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{translations.brand}:</span>
                      <span className="font-medium">{asset.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{translations.model}:</span>
                      <span className="font-medium">{asset.modelName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{translations.serialNumber}:</span>
                      <span className="font-medium text-xs">{asset.serialNumber}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => navigate(`/portal/create-ticket?assetId=${asset.id}`)}
                  >
                    {translations.reportIssue}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}