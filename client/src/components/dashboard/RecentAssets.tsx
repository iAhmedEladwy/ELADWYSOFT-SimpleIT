import { useLanguage } from '@/hooks/use-language';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

interface RecentAssetsProps {
  assets: any[];
  isLoading: boolean;
}

export default function RecentAssets({ assets, isLoading }: RecentAssetsProps) {
  const { language } = useLanguage();

  // Translations
  const translations = {
    recentAssets: language === 'English' ? 'Recent Assets' : 'الأصول الحديثة',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
    asset: language === 'English' ? 'Asset' : 'الأصل',
    type: language === 'English' ? 'Type' : 'النوع',
    status: language === 'English' ? 'Status' : 'الحالة',
    assignedTo: language === 'English' ? 'Assigned To' : 'معين إلى',
    noData: language === 'English' ? 'No recent assets' : 'لا توجد أصول حديثة',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Use':
        return 'bg-green-100 text-success';
      case 'Available':
        return 'bg-blue-100 text-info';
      case 'Maintenance':
        return 'bg-yellow-100 text-warning';
      case 'Damaged':
        return 'bg-red-100 text-error';
      case 'Sold':
        return 'bg-purple-100 text-purple-600';
      case 'Retired':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-900">{translations.recentAssets}</h3>
        <Link href="/assets" className="text-primary text-sm hover:underline">
          {translations.viewAll}
        </Link>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-[216px] w-full" />
          ) : assets && assets.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.asset}
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.type}
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.status}
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.assignedTo}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.slice(0, 4).map((asset) => (
                  <tr key={asset.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {asset.assetId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {asset.type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="outline" className={`px-2 py-1 ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {asset.assignedEmployeeId ? "Assigned" : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-[216px] text-gray-500">
              {translations.noData}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
