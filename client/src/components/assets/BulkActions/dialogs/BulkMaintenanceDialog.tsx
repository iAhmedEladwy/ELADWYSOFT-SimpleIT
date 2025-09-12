import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { apiRequest } from '@/lib/queryClient';
import { BulkActionDialogProps, BulkActionResult } from '../types';
import { createSuccessResult, createErrorResult, getAssetSummary } from '../utils';
import { AlertCircle, CheckCircle, Calendar } from 'lucide-react';

export default function BulkMaintenanceDialog({
  open,
  onOpenChange,
  selectedAssets,
  onSuccess,
  onCancel
}: BulkActionDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [maintenanceData, setMaintenanceData] = useState({
    type: '',
    description: '',
    scheduledDate: '',
    estimatedCost: '',
    priority: 'Medium',
    notes: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch maintenance types
  const { data: maintenanceTypes = [] } = useQuery({
    queryKey: ['/api/maintenance-types'],
    queryFn: async () => {
      // Return common maintenance types if API doesn't exist
      return [
        { id: 'preventive', name: 'Preventive Maintenance' },
        { id: 'corrective', name: 'Corrective Maintenance' },
        { id: 'emergency', name: 'Emergency Repair' },
        { id: 'upgrade', name: 'Upgrade/Enhancement' },
        { id: 'inspection', name: 'Inspection' },
        { id: 'cleaning', name: 'Cleaning' },
        { id: 'calibration', name: 'Calibration' },
        { id: 'other', name: 'Other' }
      ];
    }
  });

  const translations = {
    title: language === 'English' ? 'Schedule Bulk Maintenance' : 'جدولة الصيانة المجمعة',
    description: language === 'English' ? 'Schedule maintenance for selected assets' : 'جدولة الصيانة للأصول المحددة',
    type: language === 'English' ? 'Maintenance Type' : 'نوع الصيانة',
    descriptionLabel: language === 'English' ? 'Description' : 'الوصف',
    scheduledDate: language === 'English' ? 'Scheduled Date' : 'التاريخ المجدول',
    estimatedCost: language === 'English' ? 'Estimated Cost' : 'التكلفة المقدرة',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    notes: language === 'English' ? 'Notes' : 'ملاحظات',
    schedule: language === 'English' ? 'Schedule Maintenance' : 'جدولة الصيانة',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    processing: language === 'English' ? 'Scheduling maintenance...' : 'جاري جدولة الصيانة...',
    success: language === 'English' ? 'Maintenance scheduled successfully' : 'تم جدولة الصيانة بنجاح',
    error: language === 'English' ? 'Error' : 'خطأ',
    fillRequiredFields: language === 'English' ? 'Please fill in all required fields' : 'يرجى ملء جميع الحقول المطلوبة',
    assetSummary: language === 'English' ? 'Selected Assets' : 'الأصول المحددة',
    high: language === 'English' ? 'High' : 'عالي',
    medium: language === 'English' ? 'Medium' : 'متوسط',
    low: language === 'English' ? 'Low' : 'منخفض'
  };

  const handleSubmit = async () => {
    // Validation
    if (!maintenanceData.type || !maintenanceData.description || !maintenanceData.scheduledDate) {
      toast({
        title: translations.error,
        description: translations.fillRequiredFields,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiRequest('/api/assets/bulk/maintenance', 'POST', {
        assetIds: selectedAssets,
        type: maintenanceData.type,
        description: maintenanceData.description,
        scheduledDate: maintenanceData.scheduledDate,
        estimatedCost: maintenanceData.estimatedCost ? parseFloat(maintenanceData.estimatedCost) : null,
        priority: maintenanceData.priority,
        notes: maintenanceData.notes
      });

      const result = createSuccessResult(
        response.message || translations.success,
        selectedAssets.length,
        0
      );

      onSuccess(result);

      // Reset form
      setMaintenanceData({
        type: '',
        description: '',
        scheduledDate: '',
        estimatedCost: '',
        priority: 'Medium',
        notes: ''
      });

    } catch (error: any) {
      console.error('Bulk maintenance error:', error);
      
      const result = createErrorResult(
        error.message || 'Failed to schedule maintenance',
        [error.message || 'Unknown error']
      );

      onSuccess(result);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setMaintenanceData({
      type: '',
      description: '',
      scheduledDate: '',
      estimatedCost: '',
      priority: 'Medium',
      notes: ''
    });
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{translations.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Summary */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{translations.assetSummary}</Label>
            <div className="flex flex-wrap gap-2">
              {selectedAssets.map((assetId, index) => (
                <Badge key={assetId} variant="secondary">
                  Asset #{assetId}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Maintenance Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              {translations.type} *
            </Label>
            <Select
              value={maintenanceData.type}
              onValueChange={(value) => setMaintenanceData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.type} />
              </SelectTrigger>
              <SelectContent>
                {maintenanceTypes.map((type: any) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {translations.descriptionLabel} *
            </Label>
            <Textarea
              id="description"
              value={maintenanceData.description}
              onChange={(e) => setMaintenanceData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the maintenance work to be performed..."
              rows={3}
            />
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduledDate" className="text-sm font-medium">
              {translations.scheduledDate} *
            </Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              value={maintenanceData.scheduledDate}
              onChange={(e) => setMaintenanceData(prev => ({ ...prev, scheduledDate: e.target.value }))}
            />
          </div>

          {/* Estimated Cost */}
          <div className="space-y-2">
            <Label htmlFor="estimatedCost" className="text-sm font-medium">
              {translations.estimatedCost}
            </Label>
            <Input
              id="estimatedCost"
              type="number"
              step="0.01"
              min="0"
              value={maintenanceData.estimatedCost}
              onChange={(e) => setMaintenanceData(prev => ({ ...prev, estimatedCost: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium">
              {translations.priority}
            </Label>
            <Select
              value={maintenanceData.priority}
              onValueChange={(value) => setMaintenanceData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">{translations.low}</SelectItem>
                <SelectItem value="Medium">{translations.medium}</SelectItem>
                <SelectItem value="High">{translations.high}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              {translations.notes}
            </Label>
            <Textarea
              id="notes"
              value={maintenanceData.notes}
              onChange={(e) => setMaintenanceData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or instructions..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            {translations.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? translations.processing : translations.schedule}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
