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
import { AlertCircle, User, UserX } from 'lucide-react';

export default function BulkAssignDialog({
  open,
  onOpenChange,
  selectedAssets,
  onSuccess,
  onCancel
}: BulkActionDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
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
  const activeEmployees = employees.filter((emp: any) => emp.status === 'Active');

  const translations = {
    title: language === 'English' ? 'Assign Assets to Employee' : 'تكليف الأصول للموظف',
    selectEmployee: language === 'English' ? 'Select Employee' : 'اختر الموظف',
    unassign: language === 'English' ? 'Unassign All' : 'إلغاء التكليف',
    summary: language === 'English' ? 'Summary' : 'ملخص',
    assets: language === 'English' ? 'assets' : 'أصول',
    types: language === 'English' ? 'Types' : 'أنواع',
    statuses: language === 'English' ? 'Statuses' : 'حالات',
    assigned: language === 'English' ? 'Assigned' : 'مُكلف',
    unassigned: language === 'English' ? 'Unassigned' : 'غير مُكلف',
    warning: language === 'English' ? 'Warning' : 'تحذير',
    assignmentWarning: language === 'English' 
      ? 'Assigning assets will transfer ownership to the selected employee.' 
      : 'تكليف الأصول سينقل الملكية للموظف المحدد.',
    unassignWarning: language === 'English' 
      ? 'Unassigning will remove ownership from all selected assets.' 
      : 'إلغاء التكليف سيزيل الملكية من جميع الأصول المحددة.',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    assign: language === 'English' ? 'Assign Assets' : 'تكليف الأصول',
    unassignConfirm: language === 'English' ? 'Unassign Assets' : 'إلغاء تكليف الأصول',
    processing: language === 'English' ? 'Processing...' : 'جاري المعالجة...',
    success: language === 'English' ? 'Success' : 'نجح',
    error: language === 'English' ? 'Error' : 'خطأ',
    assetsAssigned: language === 'English' ? 'Assets assigned successfully' : 'تم تكليف الأصول بنجاح',
    assetsUnassigned: language === 'English' ? 'Assets unassigned successfully' : 'تم إلغاء تكليف الأصول بنجاح',
    assignmentFailed: language === 'English' ? 'Failed to assign assets' : 'فشل في تكليف الأصول',
    unassignmentFailed: language === 'English' ? 'Failed to unassign assets' : 'فشل في إلغاء تكليف الأصول',
  };

  const handleAssign = async () => {
    if (!selectedEmployee) {
      toast({
        title: translations.error,
        description: 'Please select an employee',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const results = await Promise.allSettled(
        selectedAssets.map(id => 
          apiRequest(`/api/assets/${id}`, 'PUT', { assignedEmployeeId: parseInt(selectedEmployee) })
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

      const employee = activeEmployees.find((emp: any) => emp.id.toString() === selectedEmployee);
      const employeeName = employee ? employee.englishName : 'Unknown';

      let result: BulkActionResult;

      if (failed === 0) {
        result = createSuccessResult(
          translations.assetsAssigned,
          succeeded,
          failed,
          errors
        );
        toast({
          title: translations.success,
          description: `Successfully assigned ${succeeded} assets to ${employeeName}`,
        });
      } else if (succeeded > 0) {
        result = createSuccessResult(
          `Partially successful: ${succeeded} assigned, ${failed} failed`,
          succeeded,
          failed,
          errors
        );
        toast({
          title: 'Partial Success',
          description: `Assigned ${succeeded} assets, ${failed} failed`,
          variant: 'destructive',
        });
      } else {
        result = createErrorResult(
          translations.assignmentFailed,
          errors
        );
        toast({
          title: translations.error,
          description: translations.assignmentFailed,
          variant: 'destructive',
        });
      }

      onSuccess(result);
      onOpenChange(false);
    } catch (error: any) {
      const result = createErrorResult(
        translations.assignmentFailed,
        [error.message || 'Unknown error']
      );
      toast({
        title: translations.error,
        description: translations.assignmentFailed,
        variant: 'destructive',
      });
      onSuccess(result);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnassign = async () => {
    setIsProcessing(true);

    try {
      const results = await Promise.allSettled(
        selectedAssets.map(id => 
          apiRequest(`/api/assets/${id}`, 'PUT', { assignedEmployeeId: null })
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
          translations.assetsUnassigned,
          succeeded,
          failed,
          errors
        );
        toast({
          title: translations.success,
          description: `Successfully unassigned ${succeeded} assets`,
        });
      } else if (succeeded > 0) {
        result = createSuccessResult(
          `Partially successful: ${succeeded} unassigned, ${failed} failed`,
          succeeded,
          failed,
          errors
        );
        toast({
          title: 'Partial Success',
          description: `Unassigned ${succeeded} assets, ${failed} failed`,
          variant: 'destructive',
        });
      } else {
        result = createErrorResult(
          translations.unassignmentFailed,
          errors
        );
        toast({
          title: translations.error,
          description: translations.unassignmentFailed,
          variant: 'destructive',
        });
      }

      onSuccess(result);
      onOpenChange(false);
    } catch (error: any) {
      const result = createErrorResult(
        translations.unassignmentFailed,
        [error.message || 'Unknown error']
      );
      toast({
        title: translations.error,
        description: translations.unassignmentFailed,
        variant: 'destructive',
      });
      onSuccess(result);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setSelectedEmployee('');
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

          {/* Employee Selection */}
          <div className="space-y-2">
            <Label htmlFor="employee-select">{translations.selectEmployee}</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder={translations.selectEmployee} />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((employee: any) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{employee.englishName}</div>
                        <div className="text-sm text-gray-500">{employee.department} - {employee.title}</div>
                      </div>
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
              {translations.assignmentWarning}
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleUnassign}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <UserX className="h-4 w-4" />
              {translations.unassignConfirm}
            </Button>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isProcessing}
              >
                {translations.cancel}
              </Button>
              <Button 
                onClick={handleAssign}
                disabled={!selectedEmployee || isProcessing}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {isProcessing ? translations.processing : translations.assign}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
