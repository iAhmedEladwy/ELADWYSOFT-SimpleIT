import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { format } from 'date-fns';
import { useCurrency } from '@/lib/currencyContext';
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
import { Laptop, Wrench, Receipt, History,DollarSign, Package } from 'lucide-react';

interface AssetDetailViewProps {
  assetId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssetDetailView({ assetId, open, onOpenChange }: AssetDetailViewProps) {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
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
      // Additional field translations
    basicInformation: language === 'English' ? 'Basic Information' : 'المعلومات الأساسية',
    technicalSpecs: language === 'English' ? 'Technical Specifications' : 'المواصفات الفنية',
    purchaseInformation: language === 'English' ? 'Purchase Information' : 'معلومات الشراء',
    assignmentDetails: language === 'English' ? 'Assignment Details' : 'تفاصيل التخصيص',
    systemInformation: language === 'English' ? 'System Information' : 'معلومات النظام',
    
    // Additional fields
    assetAge: language === 'English' ? 'Asset Age' : 'عمر الأصل',
    lifespan: language === 'English' ? 'Expected Lifespan' : 'العمر المتوقع',
    cpu: language === 'English' ? 'Processor (CPU)' : 'المعالج',
    ram: language === 'English' ? 'Memory (RAM)' : 'الذاكرة',
    storage: language === 'English' ? 'Storage' : 'التخزين',
    createdAt: language === 'English' ? 'Created' : 'تاريخ الإنشاء',
    updatedAt: language === 'English' ? 'Last Updated' : 'آخر تحديث',
    department: language === 'English' ? 'Department' : 'القسم',
    employeeId: language === 'English' ? 'Employee ID' : 'معرف الموظف',
    employeeName: language === 'English' ? 'Employee Name' : 'اسم الموظف',
    unassigned: language === 'English' ? 'Unassigned' : 'غير مخصص',
    years: language === 'English' ? 'years' : 'سنوات',
    months: language === 'English' ? 'months' : 'شهور',
    days: language === 'English' ? 'days' : 'أيام',
    warrantyStatus: language === 'English' ? 'Warranty Status' : 'حالة الضمان',
    activeWarranty: language === 'English' ? 'Active' : 'نشط',
    expiredWarranty: language === 'English' ? 'Expired' : 'منتهي',
    remainingWarranty: language === 'English' ? 'Remaining' : 'متبقي',
    saleInformation: language === 'English' ? 'Sale Information' : 'معلومات البيع',
    retirementInformation: language === 'English' ? 'Retirement Information' : 'معلومات التقاعد',
    buyer: language === 'English' ? 'Buyer' : 'المشتري',
    saleDate: language === 'English' ? 'Sale Date' : 'تاريخ البيع',
    salePrice: language === 'English' ? 'Sale Price' : 'سعر البيع',
    retirementReason: language === 'English' ? 'Retirement Reason' : 'سبب التقاعد',
    retirementDate: language === 'English' ? 'Retirement Date' : 'تاريخ التقاعد',
    notes: language === 'English' ? 'Notes' : 'ملاحظات',
    
    // Additional maintenance/transaction translations
    employee: language === 'English' ? 'Employee' : 'الموظف',
    performedBy: language === 'English' ? 'Performed by' : 'تم بواسطة',
    cost: language === 'English' ? 'Cost' : 'التكلفة',
    noDescription: language === 'English' ? 'No description provided' : 'لا يوجد وصف متاح',
    checkedOut: language === 'English' ? 'Checked Out' : 'تم التسليم',
    checkedIn: language === 'English' ? 'Checked In' : 'تم الاستلام',
    dateNotAvailable: language === 'English' ? 'Date not available' : 'التاريخ غير متاح',
    maintenanceType: language === 'English' ? 'Maintenance' : 'صيانة',
    noMaintenanceHistory: language === 'English' ? 'This asset has no maintenance history' : 'هذا الأصل ليس له تاريخ صيانة',
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
const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
  queryKey: ['/api/assets/:id/transactions', assetId],
  queryFn: async () => {
    if (!assetId) return [];
    
    const response = await fetch(`/api/assets/${assetId}/transactions`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch transactions');
      return [];
    }
    
    const data = await response.json();
    
    // Handle both array and error response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.message) {
      console.error('Error response:', data.message);
      return [];
    }
    
    return [];
  },
  enabled: !!assetId && open && activeTab === 'transactions',
});

  // Fetch custom asset statuses for dynamic colors
  const { data: assetStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-statuses'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Helper for getting status badge color from custom statuses
  const getStatusColor = (status: string) => {
    const statusConfig = assetStatuses.find(s => s.name === status);
    if (statusConfig?.color) {
      // Convert hex color to Tailwind-compatible classes
      const hexColor = statusConfig.color.replace('#', '');
      return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white`;
    }
    // Fallback for unknown statuses
    return 'bg-gray-100 text-gray-800';
  };

  // Add this query to fetch employee data if asset is assigned
const { data: assignedEmployee } = useQuery({
  queryKey: ['/api/employees', asset?.assignedEmployeeId],
  queryFn: async () => {
    if (!asset?.assignedEmployeeId) return null;
    const response = await fetch(`/api/employees/${asset.assignedEmployeeId}`);
    if (!response.ok) return null;
    return response.json();
  },
  enabled: !!asset?.assignedEmployeeId && open && activeTab === 'general',
});

// Helper function to calculate asset age
const calculateAssetAge = (purchaseDate: string | null) => {
  if (!purchaseDate) return null;
  
  const purchase = new Date(purchaseDate);
  const now = new Date();
  const diffMs = now.getTime() - purchase.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = diffDays % 30;
  
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? translations.years.slice(0, -1) : translations.years}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? translations.months.slice(0, -1) : translations.months}`);
  if (days > 0) parts.push(`${days} ${days === 1 ? translations.days.slice(0, -1) : translations.days}`);
  
  return parts.join(', ') || '0 ' + translations.days;
};

// Helper function to check warranty status
const getWarrantyStatus = (warrantyDate: string | null) => {
  if (!warrantyDate) return null;
  
  const warranty = new Date(warrantyDate);
  const now = new Date();
  const isActive = warranty > now;
  
  if (isActive) {
    const diffMs = warranty.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return {
      status: translations.activeWarranty,
      color: 'text-green-600',
      remaining: `${diffDays} ${translations.days} ${translations.remainingWarranty}`
    };
  } else {
    return {
      status: translations.expiredWarranty,
      color: 'text-red-600',
      remaining: null
    };
  }
};

  // Helper to get the background color style for custom colors
  const getStatusStyle = (status: string) => {
    const statusConfig = assetStatuses.find(s => s.name === status);
    if (statusConfig?.color) {
      return { backgroundColor: statusConfig.color };
    }
    return { backgroundColor: '#6b7280' }; // Default gray
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {translations.assetDetails}
            {asset && ` - ${asset.assetId}`}
          </DialogTitle>
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
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Laptop className="h-4 w-4" />
                <span className="hidden sm:inline">{translations.general}</span>
                <span className="sm:hidden">
                  <Laptop className="h-4 w-4" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="depreciation" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">{translations.depreciation}</span>
                <span className="sm:hidden">
                  <Receipt className="h-4 w-4" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">{translations.maintenance}</span>
                <span className="sm:hidden">
                  <Wrench className="h-4 w-4" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">{translations.transactions}</span>
                <span className="sm:hidden">
                  <History className="h-4 w-4" />
                </span>
              </TabsTrigger>
            </TabsList>
            
            <div className="min-h-[500px]">
           <TabsContent value="general" className="space-y-6">
            {/* Basic Information Card */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                {translations.basicInformation}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{translations.type}:</span>
                    <span className="text-sm">{asset.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{translations.brand}:</span>
                    <span className="text-sm">{asset.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{translations.model}:</span>
                    <span className="text-sm">{asset.modelName || asset.modelNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{translations.serialNumber}:</span>
                    <span className="text-sm font-mono">{asset.serialNumber}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{translations.status}:</span>
                    <Badge 
                      className={getStatusColor(asset.status)}
                      style={getStatusStyle(asset.status)}
                    >
                      {asset.status}
                    </Badge>
                  </div>
                  {asset.outOfBoxOs && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{translations.operatingSystem}:</span>
                      <span className="text-sm">{asset.outOfBoxOs}</span>
                    </div>
                  )}
                  {asset.purchaseDate && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{translations.assetAge}:</span>
                      <span className="text-sm">{calculateAssetAge(asset.purchaseDate)}</span>
                    </div>
                  )}
                  {asset.lifeSpan && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{translations.lifespan}:</span>
                      <span className="text-sm">{asset.lifeSpan} {translations.months}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Technical Specifications Card */}
            {(asset.cpu || asset.ram || asset.storage || asset.specs) && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  {translations.technicalSpecs}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {asset.cpu && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{translations.cpu}:</span>
                      <span className="text-sm">{asset.cpu}</span>
                    </div>
                  )}
                  {asset.ram && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{translations.ram}:</span>
                      <span className="text-sm">{asset.ram}</span>
                    </div>
                  )}
                  {asset.storage && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{translations.storage}:</span>
                      <span className="text-sm">{asset.storage}</span>
                    </div>
                  )}
                </div>
                {asset.specs && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2">{translations.specs}:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {asset.specs}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Purchase Information Card */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                {translations.purchaseInformation}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{translations.purchaseDate}:</span>
                    <span className="text-sm">
                      {asset.purchaseDate 
                        ? format(new Date(asset.purchaseDate), 'PPP') 
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{translations.price}:</span>
                    <span className="text-sm font-semibold">
                      {asset.buyPrice ? formatCurrency(asset.buyPrice) : '-'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{translations.warranty}:</span>
                    <span className="text-sm">
                      {asset.warrantyExpiryDate 
                        ? format(new Date(asset.warrantyExpiryDate), 'PPP')
                        : '-'}
                    </span>
                  </div>
                  {asset.warrantyExpiryDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{translations.warrantyStatus}:</span>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${getWarrantyStatus(asset.warrantyExpiryDate)?.color}`}>
                          {getWarrantyStatus(asset.warrantyExpiryDate)?.status}
                        </span>
                        {getWarrantyStatus(asset.warrantyExpiryDate)?.remaining && (
                          <p className="text-xs text-muted-foreground">
                            {getWarrantyStatus(asset.warrantyExpiryDate)?.remaining}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sale Information - Only show if asset is sold */}
            {asset.status === 'Sold' && transactions && transactions.length > 0 && (() => {
              const saleTransaction = transactions.find(t => t.type === 'Sale');
              const saleInfo = saleTransaction?.deviceSpecs as any;
              
              if (saleTransaction && saleInfo) {
                return (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {translations.saleInformation}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">{translations.buyer}:</span>
                        <p className="font-medium">{saleInfo.buyer || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">{translations.saleDate}:</span>
                        <p className="font-medium">
                          {saleInfo.saleDate ? format(new Date(saleInfo.saleDate), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">{translations.salePrice}:</span>
                        <p className="font-medium">{formatCurrency(saleInfo.salePrice || saleInfo.totalAmount || 0)}</p>
                      </div>
                      {saleInfo.notes && (
                        <div className="col-span-2">
                          <span className="text-gray-600">{translations.notes}:</span>
                          <p className="font-medium">{saleInfo.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Retirement Information - Only show if asset is retired */}
            {asset.status === 'Retired' && transactions && transactions.length > 0 && (() => {
              const retireTransaction = transactions.find(t => t.type === 'Retirement');
              const retireInfo = retireTransaction?.deviceSpecs as any;
              
              if (retireTransaction && retireInfo) {
                return (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {translations.retirementInformation}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">{translations.retirementReason}:</span>
                        <p className="font-medium">{retireInfo.retirementReason || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">{translations.retirementDate}:</span>
                        <p className="font-medium">
                          {retireInfo.retirementDate ? format(new Date(retireInfo.retirementDate), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                      </div>
                      {retireInfo.notes && (
                        <div className="col-span-2">
                          <span className="text-gray-600">{translations.notes}:</span>
                          <p className="font-medium">{retireInfo.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Assignment Details Card */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                {translations.assignmentDetails}
              </h3>
              {asset.assignedEmployeeId && assignedEmployee ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{translations.employeeId}:</span>
                      <span className="text-sm font-mono">{assignedEmployee.empId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{translations.employeeName}:</span>
                      <span className="text-sm">
                        {language === 'English' 
                          ? assignedEmployee.englishName 
                          : assignedEmployee.arabicName || assignedEmployee.englishName}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{translations.department}:</span>
                      <span className="text-sm">{assignedEmployee.department || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{translations.status}:</span>
                      <Badge variant={assignedEmployee.status === 'Active' ? 'default' : 'secondary'}>
                        {assignedEmployee.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Badge variant="outline" className="text-muted-foreground">
                    {translations.unassigned}
                  </Badge>
                </div>
              )}
            </div>

            {/* System Information */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                {translations.systemInformation}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{translations.createdAt}:</span>
                  <span className="text-sm">
                    {asset.createdAt 
                      ? format(new Date(asset.createdAt), 'PPp')
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{translations.updatedAt}:</span>
                  <span className="text-sm">
                    {asset.updatedAt 
                      ? format(new Date(asset.updatedAt), 'PPp')
                      : '-'}
                  </span>
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
                  <span className="ml-2">{translations.loading}</span>
                </div>
              ) : !maintenanceRecords || maintenanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{translations.noMaintenance}</p>
                  <p className="text-sm mt-2">{translations.noMaintenanceHistory}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {maintenanceRecords.map((record: any) => (
                    <div key={record.id} className="border rounded-md p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{record.maintenanceType || record.type} {translations.maintenanceType}</h4>
                          <p className="text-sm text-muted-foreground">
                            {record.date ? format(new Date(record.date), 'PPP') : translations.dateNotAvailable}
                          </p>
                          {record.performerName && (
                            <p className="text-xs text-gray-500 mt-1">
                              {translations.performedBy}: {record.performerName}
                            </p>
                          )}
                        </div>
                        <Badge variant={record.maintenanceType === 'Completed' ? 'default' : 'secondary'}>
                          {record.providerType || record.maintenanceType || translations.maintenanceType}
                        </Badge>
                      </div>
                      <Separator className="my-3" />
                      <p className="text-sm">{record.description || translations.noDescription}</p>
                      {record.cost && (
                        <p className="text-sm font-medium mt-2">
                          {translations.cost}: {formatCurrency(record.cost)}
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
                            {transaction.type === 'Check-Out' ? translations.checkedOut : translations.checkedIn}
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
                          <span className="font-medium">{translations.employee}: </span>
                          {transaction.employee.englishName}
                        </p>
                      )}
                      {transaction.conditionNotes && (
                        <p className="text-sm mt-2">
                          <span className="font-medium">{translations.notes}: </span>
                          {transaction.conditionNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}