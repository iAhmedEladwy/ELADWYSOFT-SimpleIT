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

  // Calculate percentages if data exists
  const totalAssets = Object.values(assetsByType).reduce((sum, count) => sum + count, 0) || 1;
  
  // Prepare data in a structured way
  const assetTypes = [
    { key: 'Laptop', name: translations.laptops, className: 'bg-primary bg-opacity-10 text-primary', color: 'bg-primary' },
    { key: 'Desktop', name: translations.desktops, className: 'bg-secondary bg-opacity-10 text-secondary', color: 'bg-secondary' },
    { key: 'Mobile', name: translations.mobileDevices, className: 'bg-accent bg-opacity-10 text-accent', color: 'bg-accent' },
    { key: 'Other', name: translations.otherHardware, className: 'bg-warning bg-opacity-10 text-warning', color: 'bg-warning' },
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
