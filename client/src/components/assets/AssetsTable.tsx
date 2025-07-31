import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import AssetActionButtons from '@/components/assets/AssetActionButtons';
import AssetDetailView from '@/components/assets/AssetDetailView';
import { AssetActionsMenu } from '@/components/assets/AssetActionsMenu';
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

  // Get status badge with color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            {translations.available}
          </Badge>
        );
      case 'In Use':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            {translations.inUse}
          </Badge>
        );
      case 'Maintenance':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            {translations.maintenance}
          </Badge>
        );
      case 'Damaged':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            {translations.damaged}
          </Badge>
        );
      case 'Sold':
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            {translations.sold}
          </Badge>
        );
      case 'Retired':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            {translations.retired}
          </Badge>
        );
      default:
        return null;
    }
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
    <div className="rounded-md border">
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
            <TableHead>Specs</TableHead>
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
                className="group hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 border-transparent hover:border-l-blue-500"
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
                    onClick={() => onEdit(asset)}
                    className="text-gray-900 hover:text-gray-700 hover:bg-gray-50 px-2 py-1 rounded cursor-pointer transition-colors"
                  >
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
                <TableCell>{getStatusBadge(asset.status)}</TableCell>
                <TableCell>
                  {(() => {
                    if (!asset.assignedEmployeeId) return '-';
                    const employee = employees.find((e: any) => e.id === asset.assignedEmployeeId);
                    return employee ? `${employee.empId} - ${employee.englishName || employee.name}` : '-';
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Check-in/Check-out buttons using AssetActionButtons component */}
                    <AssetActionButtons 
                      asset={asset} 
                      employees={employees}
                    />
                    <AssetActionsMenu 
                      asset={asset} 
                      employees={employees}
                      onEdit={onEdit}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={hasAccess(3) ? 9 : 8} className="text-center h-24 text-muted-foreground">
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

      {/* Assign Asset Dialog */}
      <Dialog open={!!assetToAssign} onOpenChange={(open) => !open && setAssetToAssign(null)}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translations.assignAsset}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee-select">{translations.selectEmployee}</Label>
                <Select
                  value={employeeId}
                  onValueChange={setEmployeeId}
                >
                  <SelectTrigger id="employee-select">
                    <SelectValue placeholder={translations.selectEmployee} />
                  </SelectTrigger>
                  <SelectContent>
                    {(employees || [])
                      .filter((employee: any) => employee?.status === 'Active')
                      .map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.englishName} ({employee.empId})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{translations.cancel}</Button>
            </DialogClose>
            <Button 
              onClick={handleAssignConfirm} 
              disabled={!employeeId}
            >
              {translations.assign}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Maintenance Dialog */}
      <Dialog open={!!assetToMaintenance} onOpenChange={(open) => !open && setAssetToMaintenance(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translations.addMaintenance}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenance-date">{translations.date}</Label>
                  <Input
                    id="maintenance-date"
                    type="date"
                    value={maintenanceData.date}
                    onChange={(e) => setMaintenanceData({
                      ...maintenanceData,
                      date: e.target.value,
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maintenance-type">{translations.maintenanceType}</Label>
                  <Select
                    value={maintenanceData.type}
                    onValueChange={(value) => setMaintenanceData({
                      ...maintenanceData,
                      type: value,
                    })}
                  >
                    <SelectTrigger id="maintenance-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hardware">{translations.hardware}</SelectItem>
                      <SelectItem value="Software">{translations.software}</SelectItem>
                      <SelectItem value="Both">{translations.both}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="maintenance-description">{translations.description}</Label>
                <Textarea
                  id="maintenance-description"
                  value={maintenanceData.description}
                  onChange={(e) => setMaintenanceData({
                    ...maintenanceData,
                    description: e.target.value,
                  })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="maintenance-cost">{translations.cost}</Label>
                <Input
                  id="maintenance-cost"
                  type="number"
                  value={maintenanceData.cost}
                  onChange={(e) => setMaintenanceData({
                    ...maintenanceData,
                    cost: e.target.value,
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider-type">{translations.providerType}</Label>
                  <Select
                    value={maintenanceData.providerType}
                    onValueChange={(value) => setMaintenanceData({
                      ...maintenanceData,
                      providerType: value,
                    })}
                  >
                    <SelectTrigger id="provider-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Internal">{translations.internal}</SelectItem>
                      <SelectItem value="External">{translations.external}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {maintenanceData.providerType === 'External' && (
                  <div>
                    <Label htmlFor="provider-name">{translations.providerName}</Label>
                    <Input
                      id="provider-name"
                      value={maintenanceData.providerName}
                      onChange={(e) => setMaintenanceData({
                        ...maintenanceData,
                        providerName: e.target.value,
                      })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{translations.cancel}</Button>
            </DialogClose>
            <Button 
              onClick={handleMaintenanceSave}
              disabled={!maintenanceData.description}
            >
              {translations.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Detail View */}
      <AssetDetailView 
        assetId={assetToView} 
        open={showDetailView} 
        onOpenChange={setShowDetailView} 
      />
    </div>
  );
}