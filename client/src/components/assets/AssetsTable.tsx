import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import AssetActionButtons from '@/components/assets/AssetActionButtons';
import AssetDetailView from '@/components/assets/AssetDetailView';
import { AssetActionsMenu } from '@/components/assets/AssetActionsMenu';
import ActiveEmployeeSelect from '@/components/employees/ActiveEmployee';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Drill,
  Info,
  QrCode,
  LogOut,
  LogIn
} from 'lucide-react';

interface AssetsTableProps {
  assets: any[];
  employees: any[];
  selectedAssets: number[];
  setSelectedAssets: (assets: number[]) => void;
  onEdit: (asset: any) => void;
  onDelete: (assetId: number) => void;
  onAssign: (assetId: number, employeeId: number) => void;
  onUnassign: (assetId: number) => void;
  onAddMaintenance: (assetId: number, maintenanceData: any) => void;

}

export default function AssetsTable({ 
  assets = [], 
  employees = [],
  selectedAssets = [],
  setSelectedAssets = () => {},
  onEdit, 
  onDelete,
  onAssign,
  onUnassign,
  onAddMaintenance
}: AssetsTableProps) {
  const { language } = useLanguage();
  const { hasAccess } = useAuth();
  const [assetToDelete, setAssetToDelete] = useState<any>(null);
  const [assetToAssign, setAssetToAssign] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [assetToMaintenance, setAssetToMaintenance] = useState<any>(null);
  const [assetToView, setAssetToView] = useState<number | null>(null);
  const [showDetailView, setShowDetailView] = useState<boolean>(false);
  const [maintenanceData, setMaintenanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Hardware',
    description: '',
    cost: '',
    providerType: 'Internal',
    providerName: '',
  });

  // Translations
  const translations = {
    assetID: language === 'English' ? 'Asset ID' : 'معرف الأصل',
    type: language === 'English' ? 'Type' : 'النوع',
    brand: language === 'English' ? 'Brand' : 'العلامة التجارية',
    modelName: language === 'English' ? 'Model' : 'الطراز',
    serialNumber: language === 'English' ? 'Serial Number' : 'الرقم التسلسلي',
    status: language === 'English' ? 'Status' : 'الحالة',
    hardwarespecs: language === 'English' ? 'Hardware' : 'المواصفات',
    moredetails: language === 'English' ? 'More Details' : 'تفاصيل',
    assignedTo: language === 'English' ? 'Assigned To' : 'معين إلى',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    edit: language === 'English' ? 'Edit' : 'تعديل',
    delete: language === 'English' ? 'Delete' : 'حذف',
    assign: language === 'English' ? 'Assign' : 'تعيين',
    unassign: language === 'English' ? 'Unassign' : 'إلغاء التعيين',
    addMaintenanceShort: language === 'English' ? 'Add Maintenance' : 'إضافة صيانة',
    details: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    qrCode: language === 'English' ? 'Generate QR Code' : 'إنشاء رمز QR',
    selectEmployee: language === 'English' ? 'Select Employee' : 'اختر الموظف',
    assignAsset: language === 'English' ? 'Assign Asset' : 'تعيين الأصل',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    confirmDelete: language === 'English' ? 'Confirm Deletion' : 'تأكيد الحذف',
    deleteWarning: language === 'English' 
      ? 'Are you sure you want to delete this asset? This action cannot be undone.' 
      : 'هل أنت متأكد أنك تريد حذف هذا الأصل؟ لا يمكن التراجع عن هذا الإجراء.',
    addMaintenance: language === 'English' ? 'Add Maintenance Record' : 'إضافة سجل صيانة',
    date: language === 'English' ? 'Date' : 'التاريخ',
    maintenanceType: language === 'English' ? 'Maintenance Type' : 'نوع الصيانة',
    hardware: language === 'English' ? 'Hardware' : 'أجهزة',
    software: language === 'English' ? 'Software' : 'برمجيات',
    both: language === 'English' ? 'Both' : 'كلاهما',
    description: language === 'English' ? 'Description' : 'الوصف',
    cost: language === 'English' ? 'Cost' : 'التكلفة',
    providerType: language === 'English' ? 'Provider Type' : 'نوع المزود',
    internal: language === 'English' ? 'Internal' : 'داخلي',
    external: language === 'English' ? 'External' : 'خارجي',
    providerName: language === 'English' ? 'Provider Name' : 'اسم المزود',
    save: language === 'English' ? 'Save' : 'حفظ',
    noAssets: language === 'English' ? 'No assets found' : 'لم يتم العثور على أصول',
    available: language === 'English' ? 'Available' : 'متاح',
    inUse: language === 'English' ? 'In Use' : 'قيد الاستخدام',
    maintenance: language === 'English' ? 'Maintenance' : 'صيانة',
    damaged: language === 'English' ? 'Damaged' : 'تالف',
    sold: language === 'English' ? 'Sold' : 'تم بيعه',
    retired: language === 'English' ? 'Retired' : 'متقاعد',
  };

  // Fetch asset statuses for dynamic badges
  const { data: assetStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-statuses'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get status badge with flexible colors
  const getStatusBadge = (status: string) => {
    // Find the status configuration
    const statusConfig = assetStatuses.find(s => s.name === status);
    
    if (statusConfig?.color) {
      // Use the configured color for the badge
      const color = statusConfig.color;
      const lightColor = color + '20'; // Adding transparency
      const textColor = color;
      
      return (
        <Badge 
          variant="outline" 
          className="border"
          style={{ 
            backgroundColor: lightColor,
            color: textColor,
            borderColor: color + '40'
          }}
        >
          <span 
            className="w-2 h-2 rounded-full inline-block mr-1" 
            style={{ backgroundColor: color }}
          />
          {status}
        </Badge>
      );
    }

    // Fallback for status without configuration or unknown status
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
        {status || 'N/A'}
      </Badge>
    );
  };

  // Find assigned employee name - Updated to handle proper field mapping
  const getAssignedEmployeeName = (employeeId: number | null) => {
    if (!employeeId) return '-';
    const employee = employees.find((e: any) => e.id === employeeId);
    return employee ? (employee.englishName || employee.name) : '-';
  };

  // Handle asset selection for multi-select operations
  const handleSelectAsset = (assetId: number) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets?.filter(id => id !== assetId) || []);
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  // Handle select all assets
  const handleSelectAll = () => {
    if (!assets || assets.length === 0) return;
    if (selectedAssets.length === assets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(assets.map(asset => asset.id));
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (assetToDelete) {
      onDelete(assetToDelete.id);
      setAssetToDelete(null);
    }
  };

  // Handle assign confirmation
  const handleAssignConfirm = () => {
    if (assetToAssign && employeeId) {
      onAssign(assetToAssign.id, parseInt(employeeId));
      setAssetToAssign(null);
      setEmployeeId('');
    }
  };

  // Handle maintenance save
  const handleMaintenanceSave = () => {
    if (assetToMaintenance) {
      onAddMaintenance(
        assetToMaintenance.id, 
        {
          ...maintenanceData,
          cost: maintenanceData.cost ? parseFloat(maintenanceData.cost) : null,
        }
      );
      setAssetToMaintenance(null);
      setMaintenanceData({
        date: new Date().toISOString().split('T')[0],
        type: 'Hardware',
        description: '',
        cost: '',
        providerType: 'Internal',
        providerName: '',
      });
    }
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {hasAccess(3) && (
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={assets && assets.length > 0 && selectedAssets.length === assets.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all assets"
                />
              </TableHead>
            )}
            <TableHead>{translations.assetID}</TableHead>
            <TableHead>{translations.type}</TableHead>
            <TableHead>{translations.brand}</TableHead>
            <TableHead>{translations.modelName}</TableHead>
            <TableHead>{translations.serialNumber}</TableHead>
            <TableHead>{translations.hardwarespecs}</TableHead>
            <TableHead>{translations.moredetails}</TableHead> 
            <TableHead>{translations.status}</TableHead>
            <TableHead>{translations.assignedTo}</TableHead>
            <TableHead className="text-right">{translations.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets && assets.length > 0 ? (
            assets.map((asset) => (
              <TableRow 
                key={asset.id}
                className={`group hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 hover:border-l-blue-500 cursor-pointer ${
                  // Add maintenance status highlighting
                  (() => {
                    const today = new Date();
                    const nextMaintenance = asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate) : null;
                    const weekFromNow = new Date();
                    weekFromNow.setDate(today.getDate() + 7);
                    
                    if (nextMaintenance) {
                      if (nextMaintenance < today) {
                        return 'border-l-red-400 bg-red-50/30'; // Overdue - red background
                      } else if (nextMaintenance <= weekFromNow) {
                        return 'border-l-yellow-400 bg-yellow-50/30'; // Due soon - yellow background
                      }
                    }
                    return 'border-transparent';
                  })()
                }`}
                onClick={(e) => {
                  // Prevent row click when clicking on interactive elements or dialog overlays
                  if (e.target instanceof HTMLElement && 
                      (e.target.closest('input[type="checkbox"]') || 
                       e.target.closest('button') || 
                       e.target.closest('[role="button"]') ||
                       e.target.closest('.dropdown-menu') ||
                       e.target.closest('[data-radix-collection-item]') ||
                       e.target.closest('[role="menuitem"]') ||
                       e.target.closest('[data-state]') ||
                       e.target.closest('[role="dialog"]') ||
                       e.target.closest('[data-radix-dialog-overlay]') ||
                       e.target.closest('[data-radix-dialog-content]') ||
                       e.target.closest('.maintenance-dialog') ||
                       e.target.closest('[data-dialog]'))) {
                    e.preventDefault();  
                    e.stopPropagation();
                    return;
                  }
                  onEdit(asset);
                }}
              >
                {hasAccess(3) && (
                  <TableCell>
                    <Checkbox 
                      checked={selectedAssets.includes(asset.id)}
                      onCheckedChange={() => handleSelectAsset(asset.id)}
                      aria-label={`Select asset ${asset.assetId}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(asset);
                    }}
                    className="text-gray-900 hover:text-gray-700 hover:bg-gray-50 px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-2"
                  >
                    {/* Add maintenance indicators */}
                    {(() => {
                      const today = new Date();
                      const nextMaintenance = asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate) : null;
                      const weekFromNow = new Date();
                      weekFromNow.setDate(today.getDate() + 7);
                      
                      if (nextMaintenance) {
                        if (nextMaintenance < today) {
                          // Overdue
                          return <span title="Maintenance overdue!" className="text-red-500">⏰</span>;
                        } else if (nextMaintenance <= weekFromNow) {
                          // Due soon
                          return <span title="Maintenance due this week" className="text-yellow-500">🛠️</span>;
                        } else {
                          // Scheduled
                          return <span title="Maintenance scheduled" className="text-blue-500">📅</span>;
                        }
                      }
                      return null;
                    })()}
                    {asset.assetId}
                  </button>
                </TableCell>
                <TableCell>{asset.type}</TableCell>
                <TableCell>{asset.brand}</TableCell>
                <TableCell>{asset.modelName || '-'}</TableCell>
                <TableCell>{asset.serialNumber || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs">
                    {asset.cpu && (
                      <span className="text-xs text-muted-foreground">
                        CPU: {asset.cpu}
                      </span>
                    )}
                    {asset.ram && (
                      <span className="text-xs text-muted-foreground">
                        RAM: {asset.ram}
                      </span>
                    )}
                    {asset.storage && (
                      <span className="text-xs text-muted-foreground">
                        Storage: {asset.storage}
                      </span>
                    )}
                    {!asset.cpu && !asset.ram && !asset.storage && '-'}
                  </div>
                </TableCell>
                <TableCell>
                    <div className="max-w-xs">
                      {asset.specs ? (
                        <div className="text-sm truncate" title={asset.specs}>
                          📋 {asset.specs}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                     )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(asset.status)}</TableCell>
                <TableCell>
                  {(() => {
                    if (!asset.assignedEmployeeId) return '-';
                    const employee = employees.find((e: any) => e.id === asset.assignedEmployeeId);
                    return employee ? `${employee.empId} - ${employee.englishName || employee.name}` : '-';
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()} 
                  >
                    {/* Check-in/Check-out buttons using AssetActionButtons component */}
                    <AssetActionButtons asset={asset} />
                    <AssetActionsMenu 
                      asset={asset} 
                      onEdit={onEdit}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={hasAccess(3) ? 11 : 10} className="text-center h-24 text-muted-foreground">
                {translations.noAssets}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Asset Detail View */}
      <AssetDetailView 
        assetId={assetToView} 
        open={showDetailView} 
        onOpenChange={setShowDetailView} 
      />
    </div>
  );
}