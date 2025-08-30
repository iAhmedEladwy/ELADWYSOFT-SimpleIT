import { useLanguage } from '@/hooks/use-language';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Laptop } from 'lucide-react';

interface RecentAssetsProps {
  assets: any[];
  isLoading: boolean;
  onViewAll?: () => void;
}

export default function RecentAssets({ assets, isLoading, onViewAll }: RecentAssetsProps) {
  const { language } = useLanguage();

  // Translations
  const translations = {
    recentAssets: language === 'English' ? 'Recent Assets' : 'الأصول الحديثة',
    assetId: language === 'English' ? 'Asset ID' : 'معرف الأصل',
    type: language === 'English' ? 'Type' : 'النوع',
    status: language === 'English' ? 'Status' : 'الحالة',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
    noAssets: language === 'English' ? 'No recent assets' : 'لا توجد أصول حديثة',
  };

  // Get status variant for badge
  const getStatusVariant = (status: string): any => {
    switch (status) {
      case 'Available': return 'success';
      case 'In Use': return 'secondary';
      case 'Under Maintenance': return 'warning';
      case 'Retired': return 'destructive';
      default: return 'default';
    }
  };

  // Get maintenance indicator badge
  const getMaintenanceIndicator = (asset: any) => {
    if (asset.currentMaintenanceStatus === 'inProgress') {
      return <Badge variant="warning" className="text-xs ml-2">In Maintenance</Badge>;
    }
    if (asset.currentMaintenanceStatus === 'scheduled') {
      return <Badge variant="secondary" className="text-xs ml-2">Scheduled</Badge>;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Laptop className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{translations.recentAssets}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll || (() => window.location.href = '/assets')}
        >
          {translations.viewAll}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : assets && assets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.assetId}</TableHead>
                <TableHead>{translations.type}</TableHead>
                <TableHead>{translations.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* THIS IS WHERE THE TABLE BODY ENHANCEMENT GOES */}
              {assets.slice(0, 5).map((asset) => (
                <TableRow 
                  key={asset.id} 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => window.location.href = `/assets?search=${asset.assetId}`}
                >
                  <TableCell className="font-medium">{asset.assetId}</TableCell>
                  <TableCell>{asset.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Badge variant={getStatusVariant(asset.status)}>
                        {asset.status}
                      </Badge>
                      {getMaintenanceIndicator(asset)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {translations.noAssets}
          </div>
        )}
      </CardContent>
    </Card>
  );
}