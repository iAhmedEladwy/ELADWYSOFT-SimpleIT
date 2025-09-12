import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { apiRequest } from '@/lib/queryClient';
import { BulkActionDialogProps, BulkActionResult } from '../types';
import { createSuccessResult, createErrorResult, getAssetSummary } from '../utils';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function BulkStatusDialog({
  open,
  onOpenChange,
  selectedAssets,
  onSuccess,
  onCancel
}: BulkActionDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch available asset statuses
  const { data: assetStatuses = [] } = useQuery({
    queryKey: ['/api/asset-statuses'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch selected assets data for summary
  const { data: assets = [] } = useQuery({
    queryKey: ['/api/assets'],
    staleTime: 5 * 60 * 1000,
  });

  const selectedAssetData = assets.filter((asset: any) => 
    selectedAssets.includes(asset.id)
  );

  const assetSummary = getAssetSummary(selectedAssetData);

  const translations = {
    title: language === 'English' ? 'Change Asset Status' : 'تغيير حالة الأصول',
    selectStatus: language === 'English' ? 'Select New Status' : 'اختر الحالة الجديدة',
    currentStatus: language === 'English' ? 'Current Status' : 'الحالة الحالية',
    newStatus: language === 'English' ? 'New Status' : 'الحالة الجديدة',
    summary: language === 'English' ? 'Summary' : 'ملخص',
    assets: language === 'English' ? 'assets' : 'أصول',
    types: language === 'English' ? 'Types' : 'أنواع',
    statuses: language === 'English' ? 'Statuses' : 'حالات',
    assigned: language === 'English' ? 'Assigned' : 'مُكلف',
    unassigned: language === 'English' ? 'Unassigned' : 'غير مُكلف',
    warning: language === 'English' ? 'Warning' : 'تحذير',
    statusChangeWarning: language === 'English' 
      ? 'Changing status may affect asset availability and assignments.' 
      : 'تغيير الحالة قد يؤثر على توفر الأصول والتكليفات.',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    update: language === 'English' ? 'Update Status' : 'تحديث الحالة',
    processing: language === 'English' ? 'Processing...' : 'جاري المعالجة...',
    success: language === 'English' ? 'Success' : 'نجح',
    error: language === 'English' ? 'Error' : 'خطأ',
    statusUpdated: language === 'English' ? 'Asset status updated successfully' : 'تم تحديث حالة الأصول بنجاح',
    updateFailed: language === 'English' ? 'Failed to update asset status' : 'فشل في تحديث حالة الأصول',
  };

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast({
        title: translations.error,
        description: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const results = await Promise.allSettled(
        selectedAssets.map(id => 
          apiRequest(`/api/assets/${id}`, 'PUT', { status: selectedStatus })
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

      let result: BulkActionResult;

      if (failed === 0) {
        result = createSuccessResult(
          translations.statusUpdated,
          succeeded,
          failed,
          errors
        );
        toast({
          title: translations.success,
          description: `Successfully updated ${succeeded} assets to ${selectedStatus}`,
        });
      } else if (succeeded > 0) {
        result = createSuccessResult(
          `Partially successful: ${succeeded} updated, ${failed} failed`,
          succeeded,
          failed,
          errors
        );
        toast({
          title: 'Partial Success',
          description: `Updated ${succeeded} assets, ${failed} failed`,
          variant: 'destructive',
        });
      } else {
        result = createErrorResult(
          translations.updateFailed,
          errors
        );
        toast({
          title: translations.error,
          description: translations.updateFailed,
          variant: 'destructive',
        });
      }

      onSuccess(result);
      onOpenChange(false);
    } catch (error: any) {
      const result = createErrorResult(
        translations.updateFailed,
        [error.message || 'Unknown error']
      );
      toast({
        title: translations.error,
        description: translations.updateFailed,
        variant: 'destructive',
      });
      onSuccess(result);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setSelectedStatus('');
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{translations.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">{translations.summary}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{translations.assets}:</span>
                <div className="font-medium">{assetSummary.count}</div>
              </div>
              <div>
                <span className="text-gray-600">{translations.types}:</span>
                <div className="font-medium">{assetSummary.types.join(', ')}</div>
              </div>
              <div>
                <span className="text-gray-600">{translations.statuses}:</span>
                <div className="space-y-1">
                  {assetSummary.statuses.map(status => (
                    <Badge key={status} variant="outline" className="text-xs">
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-600">{translations.assigned}:</span>
                <div className="font-medium">
                  {assetSummary.assigned} / {assetSummary.unassigned}
                </div>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status-select">{translations.selectStatus}</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder={translations.selectStatus} />
              </SelectTrigger>
              <SelectContent>
                {assetStatuses.map((status: any) => (
                  <SelectItem key={status.id} value={status.name}>
                    <div className="flex items-center gap-2">
                      {status.color && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                      )}
                      {status.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {translations.statusChangeWarning}
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isProcessing}
            >
              {translations.cancel}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedStatus || isProcessing}
            >
              {isProcessing ? translations.processing : translations.update}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
