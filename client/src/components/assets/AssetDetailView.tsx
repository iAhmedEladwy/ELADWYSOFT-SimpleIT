import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/assetUtils';
import AssetDepreciationInfo from './AssetDepreciationInfo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Laptop, Wrench, Receipt, History } from 'lucide-react';

interface AssetDetailViewProps {
  assetId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssetDetailView({ assetId, open, onOpenChange }: AssetDetailViewProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');

  // Translations
  const translations = {
    assetDetails: language === 'English' ? 'Asset Details' : 'تفاصيل الأصل',
    viewCompleteInfo: language === 'English' 
      ? 'View complete information about this asset' 
      : 'عرض معلومات كاملة عن هذا الأصل',
    general: language === 'English' ? 'General' : 'عام',
    depreciation: language === 'English' ? 'Depreciation' : 'الإهلاك',
    maintenance: language === 'English' ? 'Maintenance' : 'الصيانة',
    transactions: language === 'English' ? 'Transactions' : 'المعاملات',
    type: language === 'English' ? 'Type' : 'النوع',
    brand: language === 'English' ? 'Brand' : 'العلامة التجارية',
    model: language === 'English' ? 'Model' : 'الموديل',
    serialNumber: language === 'English' ? 'Serial Number' : 'الرقم التسلسلي',
    status: language === 'English' ? 'Status' : 'الحالة',
    purchaseDate: language === 'English' ? 'Purchase Date' : 'تاريخ الشراء',
    warranty: language === 'English' ? 'Warranty Until' : 'الضمان حتى',
    price: language === 'English' ? 'Purchase Price' : 'سعر الشراء',
    assignedTo: language === 'English' ? 'Assigned To' : 'معين إلى',
    specs: language === 'English' ? 'Specifications' : 'المواصفات',
    loading: language === 'English' ? 'Loading asset details...' : 'جاري تحميل تفاصيل الأصل...',
    noData: language === 'English' ? 'No data available' : 'لا توجد بيانات متاحة',
    lastMaintenance: language === 'English' ? 'Last Maintenance' : 'آخر صيانة',
    noMaintenance: language === 'English' ? 'No maintenance records found' : 'لم يتم العثور على سجلات صيانة',
    noTransactions: language === 'English' ? 'No transaction history found' : 'لم يتم العثور على سجل معاملات',
    operatingSystem: language === 'English' ? 'Operating System' : 'نظام التشغيل',
  };

  // Fetch asset data
  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ['/api/assets', assetId],
    queryFn: async () => {
      if (!assetId) return null;
      const response = await fetch(`/api/assets/${assetId}`);
      if (!response.ok) throw new Error('Failed to fetch asset details');
      return response.json();
    },
    enabled: !!assetId && open,
  });

  // Fetch asset maintenance records
  const { data: maintenanceRecords, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['/api/assets/maintenance', assetId],
    queryFn: async () => {
      if (!assetId) return [];
      const response = await fetch(`/api/assets/${assetId}/maintenance`);
      if (!response.ok) throw new Error('Failed to fetch maintenance records');
      return response.json();
    },
    enabled: !!assetId && open && activeTab === 'maintenance',
  });

  // Fetch asset transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/assets/transactions', assetId],
    queryFn: async () => {
      if (!assetId) return [];
      const response = await fetch(`/api/assets/${assetId}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!assetId && open && activeTab === 'transactions',
  });

  // Helper for getting status badge color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'In Use': return 'bg-blue-100 text-blue-800';
      case 'Damaged': return 'bg-red-100 text-red-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Sold': return 'bg-purple-100 text-purple-800';
      case 'Retired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{translations.assetDetails}</DialogTitle>
          <DialogDescription>{translations.viewCompleteInfo}</DialogDescription>
        </DialogHeader>
        
        {assetLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-3">{translations.loading}</span>
          </div>
        ) : !asset ? (
          <div className="text-center py-8 text-muted-foreground">{translations.noData}</div>
        ) : (
          <Tabs 
            defaultValue="general" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Laptop className="h-4 w-4" />
                <span>{translations.general}</span>
              </TabsTrigger>
              <TabsTrigger value="depreciation" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span>{translations.depreciation}</span>
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <span>{translations.maintenance}</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>{translations.transactions}</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{asset.assetId}</h3>
                    <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="font-medium">{translations.type}:</div>
                    <div>{asset.type}</div>
                    
                    <div className="font-medium">{translations.brand}:</div>
                    <div>{asset.brand}</div>
                    
                    <div className="font-medium">{translations.model}:</div>
                    <div>{asset.modelName || asset.modelNumber || '-'}</div>
                    
                    <div className="font-medium">{translations.serialNumber}:</div>
                    <div>{asset.serialNumber}</div>
                    
                    <div className="font-medium">{translations.price}:</div>
                    <div>{asset.buyPrice ? formatCurrency(asset.buyPrice) : '-'}</div>
                    
                    <div className="font-medium">{translations.purchaseDate}:</div>
                    <div>
                      {asset.purchaseDate 
                        ? format(new Date(asset.purchaseDate), 'PPP') 
                        : '-'}
                    </div>
                    
                    <div className="font-medium">{translations.warranty}:</div>
                    <div>
                      {asset.warrantyExpiryDate 
                        ? format(new Date(asset.warrantyExpiryDate), 'PPP')
                        : '-'}
                    </div>
                    
                    <div className="font-medium">{translations.operatingSystem}:</div>
                    <div>{asset.outOfBoxOs || '-'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">{translations.specs}</h4>
                  <div className="bg-gray-50 p-3 rounded-md min-h-[100px]">
                    {asset.specs || translations.noData}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="depreciation">
              <AssetDepreciationInfo asset={asset} />
            </TabsContent>
            
            <TabsContent value="maintenance">
              {maintenanceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : !maintenanceRecords || maintenanceRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{translations.noMaintenance}</div>
              ) : (
                <div className="space-y-4">
                  {maintenanceRecords.map((record: any) => (
                    <div key={record.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{record.type} Maintenance</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(record.date), 'PPP')}
                          </p>
                        </div>
                        <Badge>{record.providerType}</Badge>
                      </div>
                      <Separator className="my-3" />
                      <p className="text-sm">{record.description}</p>
                      {record.cost && (
                        <p className="text-sm font-medium mt-2">
                          Cost: {formatCurrency(record.cost)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="transactions">
              {transactionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{translations.noTransactions}</div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction: any) => (
                    <div key={transaction.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">
                            {transaction.type === 'Check-Out' ? 'Checked Out' : 'Checked In'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.transactionDate), 'PPP p')}
                          </p>
                        </div>
                        <Badge variant={transaction.type === 'Check-Out' ? 'default' : 'outline'}>
                          {transaction.type}
                        </Badge>
                      </div>
                      <Separator className="my-3" />
                      {transaction.employee && (
                        <p className="text-sm">
                          <span className="font-medium">Employee: </span>
                          {transaction.employee.englishName}
                        </p>
                      )}
                      {transaction.conditionNotes && (
                        <p className="text-sm mt-2">
                          <span className="font-medium">Notes: </span>
                          {transaction.conditionNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}