import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/lib/currencyContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, Calendar, DollarSign, Settings, Wrench } from 'lucide-react';
import MaintenanceForm from '@/components/assets/MaintenanceForm';

interface MaintenanceRecord {
  id: number;
  assetId: number;
  date: string;
  type: string;
  description: string;
  cost: string;
  providerType: string;
  providerName: string;
  performerName: string;
  canEdit: boolean;
  assetInfo: {
    assetId: string;
    type: string;
    brand: string;
    modelName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function Maintenance() {
  const { language } = useLanguage();
  const { symbol } = useCurrency();
  const { toast } = useToast();
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  // Translations
  const translations = {
    title: language === 'English' ? 'Maintenance Management' : 'إدارة الصيانة',
    description: language === 'English' ? 'Track and manage all asset maintenance records' : 'تتبع وإدارة جميع سجلات صيانة الأصول',
    assetId: language === 'English' ? 'Asset ID' : 'معرف الأصل',
    assetType: language === 'English' ? 'Asset Type' : 'نوع الأصل',
    maintenanceType: language === 'English' ? 'Type' : 'النوع',
    date: language === 'English' ? 'Date' : 'التاريخ',
    description: language === 'English' ? 'Description' : 'الوصف',
    cost: language === 'English' ? 'Cost' : 'التكلفة',
    provider: language === 'English' ? 'Provider' : 'مقدم الخدمة',
    performedBy: language === 'English' ? 'Performed By' : 'نفذ بواسطة',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    editAction: language === 'English' ? 'Edit' : 'تعديل',
    viewAction: language === 'English' ? 'View' : 'عرض',
    loading: language === 'English' ? 'Loading...' : 'جاري التحميل...',
    noRecords: language === 'English' ? 'No maintenance records found' : 'لم يتم العثور على سجلات صيانة',
    editMaintenance: language === 'English' ? 'Edit Maintenance Record' : 'تعديل سجل الصيانة',
    success: language === 'English' ? 'Success' : 'نجح',
    error: language === 'English' ? 'Error' : 'خطأ',
    updateSuccess: language === 'English' ? 'Maintenance record updated successfully' : 'تم تحديث سجل الصيانة بنجاح',
    updateError: language === 'English' ? 'Failed to update maintenance record' : 'فشل في تحديث سجل الصيانة'
  };

  // Fetch all maintenance records
  const { data: maintenanceRecords = [], isLoading } = useQuery({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      const res = await fetch('/api/maintenance', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch maintenance records');
      return res.json();
    }
  });

  // Update maintenance mutation
  const updateMaintenanceMutation = useMutation({
    mutationFn: async (maintenanceData: any) => {
      const { id, ...data } = maintenanceData;
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update maintenance record');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setOpenEditDialog(false);
      setEditingMaintenance(null);
      toast({
        title: translations.success,
        description: translations.updateSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.updateError,
        variant: 'destructive',
      });
    }
  });

  const handleEditMaintenance = (record: MaintenanceRecord) => {
    setEditingMaintenance(record);
    setOpenEditDialog(true);
  };

  const handleMaintenanceUpdate = (formData: any) => {
    if (editingMaintenance) {
      updateMaintenanceMutation.mutate({
        id: editingMaintenance.id,
        ...formData
      });
    }
  };

  const getMaintenanceTypeBadge = (type: string) => {
    const colors = {
      'Preventive': 'bg-green-100 text-green-800',
      'Corrective': 'bg-yellow-100 text-yellow-800',
      'Upgrade': 'bg-blue-100 text-blue-800',
      'Repair': 'bg-red-100 text-red-800',
      'Inspection': 'bg-purple-100 text-purple-800',
      'Cleaning': 'bg-cyan-100 text-cyan-800',
      'Replacement': 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{translations.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">{translations.title}</h1>
        </div>
        <p className="text-muted-foreground">{translations.description}</p>
      </div>

      {/* Maintenance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {language === 'English' ? 'All Maintenance Records' : 'جميع سجلات الصيانة'}
          </CardTitle>
          <CardDescription>
            {language === 'English' 
              ? `${maintenanceRecords.length} maintenance record${maintenanceRecords.length !== 1 ? 's' : ''} found`
              : `تم العثور على ${maintenanceRecords.length} سجل صيانة`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {maintenanceRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {translations.noRecords}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.assetId}</TableHead>
                  <TableHead>{translations.assetType}</TableHead>
                  <TableHead>{translations.maintenanceType}</TableHead>
                  <TableHead>{translations.date}</TableHead>
                  <TableHead>{translations.description}</TableHead>
                  <TableHead>{translations.cost}</TableHead>
                  <TableHead>{translations.provider}</TableHead>
                  <TableHead>{translations.performedBy}</TableHead>
                  <TableHead>{translations.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRecords.map((record: MaintenanceRecord) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.assetInfo?.assetId || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{record.assetInfo?.type}</span>
                        <span className="text-sm text-muted-foreground">
                          {record.assetInfo?.brand} {record.assetInfo?.modelName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMaintenanceTypeBadge(record.type)}>
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={record.description}>
                      {record.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {symbol}{parseFloat(record.cost || '0').toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{record.providerType}</span>
                        <span className="text-sm text-muted-foreground">{record.providerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{record.performerName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {record.canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMaintenance(record)}
                            title={translations.editAction}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* Handle view details */}}
                          title={translations.viewAction}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Maintenance Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{translations.editMaintenance}</DialogTitle>
            <DialogDescription>
              {language === 'English' 
                ? 'Update the maintenance record details below'
                : 'قم بتحديث تفاصيل سجل الصيانة أدناه'
              }
            </DialogDescription>
          </DialogHeader>
          {editingMaintenance && (
            <MaintenanceForm
              onSubmit={handleMaintenanceUpdate}
              isSubmitting={updateMaintenanceMutation.isPending}
              assetId={editingMaintenance.assetId}
              assetName={editingMaintenance.assetInfo?.assetId}
              initialData={{
                date: editingMaintenance.date,
                type: editingMaintenance.type,
                description: editingMaintenance.description,
                cost: editingMaintenance.cost,
                providerType: editingMaintenance.providerType,
                providerName: editingMaintenance.providerName
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}