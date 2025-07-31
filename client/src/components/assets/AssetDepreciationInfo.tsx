import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/lib/currencyContext';
import { calculateAssetValue, getDepreciationStatusColor, getDepreciationStatusText } from '@/lib/assetUtils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

interface AssetDepreciationInfoProps {
  asset: {
    id: number;
    assetId: string;
    purchaseDate: string | null;
    buyPrice: number | null;
    lifeSpan: number | null;
    type: string;
    brand: string;
    modelName: string | null;
    status: string;
  };
  className?: string;
}

export default function AssetDepreciationInfo({ asset, className = '' }: AssetDepreciationInfoProps) {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [depreciationInfo, setDepreciationInfo] = useState({
    currentValue: 0,
    depreciationAmount: 0,
    depreciationPercentage: 0,
    remainingLifePercentage: 100,
    ageInMonths: 0,
    isFullyDepreciated: false
  });

  // Translations
  const translations = {
    title: language === 'English' ? 'Asset Depreciation' : 'إهلاك الأصول',
    description: language === 'English' 
      ? 'Calculated based on purchase date, price, and expected lifespan'
      : 'محسوبة على أساس تاريخ الشراء والسعر والعمر المتوقع',
    originalValue: language === 'English' ? 'Original Value' : 'القيمة الأصلية',
    currentValue: language === 'English' ? 'Current Value' : 'القيمة الحالية',
    depreciationAmount: language === 'English' ? 'Depreciation Amount' : 'مبلغ الإهلاك',
    lifeRemaining: language === 'English' ? 'Life Remaining' : 'العمر المتبقي',
    ageMonths: language === 'English' ? 'Age (Months)' : 'العمر (بالأشهر)',
    fullyDepreciated: language === 'English' ? 'Fully Depreciated' : 'مستهلك بالكامل',
    yes: language === 'English' ? 'Yes' : 'نعم',
    no: language === 'English' ? 'No' : 'لا',
    notAvailable: language === 'English' ? 'N/A' : 'غير متوفر',
    assetLife: language === 'English' ? 'Asset Life Cycle Status' : 'حالة دورة حياة الأصل',
    months: language === 'English' ? 'months' : 'شهر',
    lifespan: language === 'English' ? 'Expected Lifespan' : 'العمر المتوقع',
  };

  useEffect(() => {
    // Calculate depreciation whenever the asset changes
    if (asset) {
      const info = calculateAssetValue(
        asset.purchaseDate,
        asset.buyPrice,
        asset.lifeSpan
      );
      setDepreciationInfo(info);
    }
  }, [asset]);

  // Skip rendering if the asset doesn't have the necessary data
  if (!asset.purchaseDate || !asset.buyPrice || !asset.lifeSpan) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle>{translations.title}</CardTitle>
          <CardDescription>{translations.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 items-center justify-center py-4">
            <p className="text-center text-muted-foreground">
              {language === 'English'
                ? 'Insufficient data to calculate depreciation.'
                : 'بيانات غير كافية لحساب الإهلاك.'}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              {language === 'English'
                ? 'Please ensure purchase date, price, and lifespan are set.'
                : 'يرجى التأكد من تاريخ الشراء والسعر والعمر المتوقع.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColor = getDepreciationStatusColor(depreciationInfo.remainingLifePercentage);
  const statusText = getDepreciationStatusText(depreciationInfo.remainingLifePercentage);

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle>{translations.title}</CardTitle>
        <CardDescription>{translations.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{translations.originalValue}</h4>
            <p className="text-2xl font-bold">
              {formatCurrency(Math.round(asset.buyPrice || 0))}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{translations.currentValue}</h4>
            <p className="text-2xl font-bold">
              {formatCurrency(Math.round(depreciationInfo.currentValue))}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{translations.lifeRemaining}</span>
              <span className="text-sm font-medium">{depreciationInfo.remainingLifePercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={depreciationInfo.remainingLifePercentage} 
              className="h-2"
              // Using standard classes for the indicator
              style={{
                '--progress-foreground': `linear-gradient(to right, rgb(239, 68, 68), rgb(34, 197, 94))`,
              } as React.CSSProperties}
            />
          </div>
          
          <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">{translations.assetLife}</h3>
              <p 
                className="text-xl font-bold" 
                style={{ color: statusColor }}
              >
                {statusText}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{translations.depreciationAmount}:</p>
            <p className="font-medium">{formatCurrency(Math.round(depreciationInfo.depreciationAmount))}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{translations.ageMonths}:</p>
            <p className="font-medium">{depreciationInfo.ageInMonths}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{translations.lifespan}:</p>
            <p className="font-medium">{asset.lifeSpan} {translations.months}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{translations.fullyDepreciated}:</p>
            <p className="font-medium">
              {depreciationInfo.isFullyDepreciated ? translations.yes : translations.no}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}