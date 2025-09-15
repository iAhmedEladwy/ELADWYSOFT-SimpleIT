import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { BulkActionResult } from '../types';

interface BulkStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssets: number[];
  onSuccess: (result: BulkActionResult) => void;
  onCancel: () => void;
}

export default function BulkStatusDialog({
  open,
  onOpenChange,
  selectedAssets,
  onSuccess,
  onCancel,
}: BulkStatusDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const translations = {
    title: language === 'English' ? 'Change Asset Status' : 'تغيير حالة الأصول',
    description: language === 'English' 
      ? `Change status for ${selectedAssets.length} selected asset(s)` 
      : `تغيير الحالة لـ ${selectedAssets.length} أصل محدد`,
    selectStatus: language === 'English' ? 'Select Status' : 'اختر الحالة',
    newStatus: language === 'English' ? 'New Status' : 'الحالة الجديدة',
    available: language === 'English' ? 'Available' : 'متاح',
    inUse: language === 'English' ? 'In Use' : 'قيد الاستخدام',
    maintenance: language === 'English' ? 'Under Maintenance' : 'تحت الصيانة',
    damaged: language === 'English' ? 'Damaged' : 'تالف',
    lost: language === 'English' ? 'Lost' : 'مفقود',
    warning: language === 'English' 
      ? 'This will change the status of all selected assets. This action cannot be undone.' 
      : 'سيؤدي هذا إلى تغيير حالة جميع الأصول المحددة. لا يمكن التراجع عن هذا الإجراء.',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    change: language === 'English' ? 'Change Status' : 'تغيير الحالة',
    processing: language === 'English' ? 'Processing...' : 'جاري المعالجة...',
  };

  const statusOptions = [
    { value: 'Available', label: translations.available },
    { value: 'In Use', label: translations.inUse },
    { value: 'Under Maintenance', label: translations.maintenance },
    { value: 'Damaged', label: translations.damaged },
    { value: 'Lost', label: translations.lost },
  ];

  const handleSubmit = async () => {
    if (!selectedStatus) return;

    setIsProcessing(true);
    try {
      const response = await apiRequest('/api/assets/bulk/status', 'POST', {
        assetIds: selectedAssets,
        status: selectedStatus,
      });

      const result: BulkActionResult = {
        success: true,
        message: `Successfully changed status to ${selectedStatus} for ${selectedAssets.length} assets`,
        details: {
          succeeded: selectedAssets.length,
          failed: 0,
        }
      };

      onSuccess(result);
      onOpenChange(false);
    } catch (error: any) {
      const result: BulkActionResult = {
        success: false,
        message: error.message || 'Failed to change status',
        details: {
          succeeded: 0,
          failed: selectedAssets.length,
        }
      };
      onSuccess(result);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{translations.title}</DialogTitle>
          <DialogDescription>{translations.description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">{translations.newStatus}</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder={translations.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {translations.warning}
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {translations.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStatus || isProcessing}
          >
            {isProcessing ? translations.processing : translations.change}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}