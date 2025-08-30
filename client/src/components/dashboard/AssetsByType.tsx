import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from '@/components/ui/skeleton';

interface AssetsByTypeProps {
  assetsByType: Record<string, number>;
  isLoading: boolean;
}

export default function AssetsByType({ assetsByType, isLoading }: AssetsByTypeProps) {
  const { language } = useLanguage();

  // Translations
  const translations = {
    assetsByType: language === 'English' ? 'Assets by Type' : 'الأصول حسب النوع',
    laptops: language === 'English' ? 'Laptops' : 'أجهزة محمولة',
    desktops: language === 'English' ? 'Desktops' : 'أجهزة سطح المكتب',
    mobileDevices: language === 'English' ? 'Mobile Devices' : 'الأجهزة المحمولة',
    otherHardware: language === 'English' ? 'Other Hardware' : 'أجهزة أخرى',
    noData: language === 'English' ? 'No asset data available' : 'لا توجد بيانات أصول متاحة',
  };

      const handleChartClick = (data: any) => {
      if (onTypeClick && data.activeLabel) {
        onTypeClick(data.activeLabel);
      }
    };


  // Calculate percentages if data exists
  const totalAssets = Object.values(assetsByType).reduce((sum, count) => sum + count, 0) || 1;
  
  // Map all available asset types from actual data
  const assetTypeKeys = Object.keys(assetsByType);
  const assetTypes = assetTypeKeys.length > 0 ? assetTypeKeys.map((key, index) => {
    const colors = [
      { className: 'bg-blue-100 text-blue-800', color: 'bg-blue-500' },
      { className: 'bg-green-100 text-green-800', color: 'bg-green-500' },
      { className: 'bg-purple-100 text-purple-800', color: 'bg-purple-500' },
      { className: 'bg-orange-100 text-orange-800', color: 'bg-orange-500' },
      { className: 'bg-pink-100 text-pink-800', color: 'bg-pink-500' },
      { className: 'bg-indigo-100 text-indigo-800', color: 'bg-indigo-500' },
      { className: 'bg-red-100 text-red-800', color: 'bg-red-500' },
      { className: 'bg-yellow-100 text-yellow-800', color: 'bg-yellow-500' },
      { className: 'bg-teal-100 text-teal-800', color: 'bg-teal-500' }
    ];
    return {
      key,
      name: key,
      className: colors[index % colors.length].className,
      color: colors[index % colors.length].color
    };
  }) : [
    { key: 'Laptop', name: translations.laptops, className: 'bg-blue-100 text-blue-800', color: 'bg-blue-500' },
    { key: 'Desktop', name: translations.desktops, className: 'bg-green-100 text-green-800', color: 'bg-green-500' },
    { key: 'Mobile', name: translations.mobileDevices, className: 'bg-purple-100 text-purple-800', color: 'bg-purple-500' },
    { key: 'Other', name: translations.otherHardware, className: 'bg-orange-100 text-orange-800', color: 'bg-orange-500' },
  ];

  // Get percentage for each type - if the type doesn't exist, default to 0
  const getAssetPercentage = (key: string): number => {
    const count = assetsByType[key] || 0;
    return Math.round((count / totalAssets) * 100);
  };

  // Get actual count for display
  const getAssetCount = (key: string): number => {
    return assetsByType[key] || 0;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg text-gray-900">{translations.assetsByType}</h3>
      </div>
      <div className="p-6 grid grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="col-span-2 md:col-span-1 h-56" />
            <Skeleton className="col-span-2 md:col-span-1 h-56" />
          </>
        ) : Object.keys(assetsByType).length > 0 ? (
          <>
            <div className="col-span-2 md:col-span-1">
              {assetTypes.map((type) => {
                const percentage = getAssetPercentage(type.key);
                return (
                  <div className="relative pt-1 mb-4" key={type.key}>
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${type.className}`}>
                          {type.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold inline-block ${type.className}`}>
                          {getAssetCount(type.key)} ({percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className={`overflow-hidden h-2 mb-4 text-xs flex rounded ${type.className}`}>
                      <div style={{ width: `${percentage}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${type.color}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="col-span-2 md:col-span-1 flex items-center justify-center">
              {/* Concentric circles visualization */}
              <div className="w-48 h-48 rounded-full border-8 border-primary relative flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border-8 border-secondary relative flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-8 border-accent relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-warning"></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-2 flex items-center justify-center h-56 text-gray-500">
            {translations.noData}
          </div>
        )}
      </div>
    </div>
  );
}
