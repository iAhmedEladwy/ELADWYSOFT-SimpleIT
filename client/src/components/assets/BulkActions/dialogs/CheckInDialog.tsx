import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  LogIn,
} from 'lucide-react';

interface Asset {
  id: number;
  assetId: string;
  type: string;
  brand: string;
  modelName: string;
  status: string;
  assignedEmployeeId?: number;
  assignedEmployee?: any;
}

interface EnhancedCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  onSuccess?: () => void;
}

// Check-in reason options
interface ProcessingResult {
  assetId: string;
  employeeName?: string;
  success: boolean;
  message?: string;
}

export default function EnhancedCheckInDialog({
  open,
  onOpenChange,
  assets,
  onSuccess
}: EnhancedCheckInDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showAssetDetails, setShowAssetDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [showResults, setShowResults] = useState(false);

 // Determine if bulk mode
  const isBulkMode = assets.length > 1;
  const validAssets = assets.filter(asset => 
    asset.status === 'In Use'
  );
  const invalidAssets = assets.filter(asset => 
    asset.status !== 'In Use'
  );

  // Group assets by employee for bulk mode
  const assetsByEmployee = validAssets.reduce((acc, asset) => {
    const employeeId = asset.assignedEmployeeId || 'unassigned';
    const employeeName = asset.assignedEmployee?.englishName || 'Unknown';
    
    if (!acc[employeeId]) {
      acc[employeeId] = {
        employeeName,
        assets: []
      };
    }
    acc[employeeId].assets.push(asset);
    return acc;
  }, {} as Record<string, { employeeName: string; assets: Asset[] }>);

  const multipleEmployees = Object.keys(assetsByEmployee).length > 1;

  // Translations
  const translations = {
    // Title variations
    titleSingle: language === 'English' ? 'Check In Asset' : 'استلام الأصل',
    titleBulk: language === 'English' 
      ? `Check In ${assets.length} Assets` 
      : `استلام ${assets.length} أصل`,
    
    // Descriptions
    descSingle: language === 'English' 
      ? 'Return this asset to inventory' 
      : 'إعادة هذا الأصل إلى المخزون',
    descBulk: language === 'English' 
      ? `Return ${validAssets.length} assets to inventory` 
      : `إعادة ${validAssets.length} أصل إلى المخزون`,
    
    // Form fields
    reasonLabel: language === 'English' ? 'Reason for Check-In' : 'سبب الاستلام',
    selectReason: language === 'English' ? 'Select reason...' : 'اختر السبب...',
    notes: language === 'English' ? 'Notes (Optional)' : 'ملاحظات (اختياري)',
    notesPlaceholder: language === 'English' 
      ? 'Additional notes about the return condition...' 
      : 'ملاحظات إضافية حول حالة الإرجاع...',
    
    // Asset summary
    assetSummary: language === 'English' ? 'Assets Summary' : 'ملخص الأصول',
    showDetails: language === 'English' ? 'Show Details' : 'عرض التفاصيل',
    hideDetails: language === 'English' ? 'Hide Details' : 'إخفاء التفاصيل',
    currentlyWith: language === 'English' ? 'Currently with' : 'حالياً مع',
    notCheckedOut: language === 'English' ? 'Not checked out' : 'غير مسلم',
    
    // Warnings
    someAssetsNotCheckedOut: language === 'English' 
      ? `${invalidAssets.length} asset(s) cannot be checked in (not checked out)` 
      : `${invalidAssets.length} أصل لا يمكن استلامه (غير مسلم)`,
    multipleEmployeesWarning: language === 'English'
      ? 'Assets are currently assigned to different employees. They will all be returned.'
      : 'الأصول مخصصة حالياً لموظفين مختلفين. سيتم إرجاعها جميعاً.',
    cannotCheckIn: language === 'English' ? 'Cannot check in' : 'لا يمكن الاستلام',
    
    // Employee groups
    assetsCount: language === 'English' ? 'assets' : 'أصول',
    
    // Buttons
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    checkIn: language === 'English' ? 'Check In' : 'استلام',
    checkInAll: language === 'English' 
      ? `Check In ${validAssets.length} Assets` 
      : `استلام ${validAssets.length} أصل`,
    processing: language === 'English' ? 'Processing...' : 'جاري المعالجة...',
    
    // Progress
    processingAssets: language === 'English' 
      ? 'Processing returns...' 
      : 'جاري معالجة الإرجاع...',
    
    // Results
    successCount: language === 'English' ? 'Successful' : 'نجح',
    failedCount: language === 'English' ? 'Failed' : 'فشل',
    retry: language === 'English' ? 'Retry Failed' : 'إعادة المحاولة',
    done: language === 'English' ? 'Done' : 'تم',
    returnedFrom: language === 'English' ? 'Returned from' : 'تم الإرجاع من',
    
    // Success/Error messages
    successMessage: language === 'English' 
      ? 'Assets checked in successfully' 
      : 'تم استلام الأصول بنجاح',
    partialSuccess: language === 'English' 
      ? 'Some assets were checked in successfully' 
      : 'تم استلام بعض الأصول بنجاح',
    errorMessage: language === 'English' 
      ? 'Failed to check in assets' 
      : 'فشل استلام الأصول',

    // Check-in reasons
    endOfAssignment: language === 'English' ? 'End of assignment' : 'انتهاء التكليف',
    employeeExit: language === 'English' ? 'Employee exit' : 'خروج الموظف',
    notNeeded: language === 'English' ? 'Asset not needed anymore' : 'الأصل لم يعد مطلوباً',
    upgrade: language === 'English' ? 'Asset upgrade/replacement' : 'ترقية/استبدال الأصل',
    faulty: language === 'English' ? 'Faulty/Needs repair' : 'معطل/يحتاج إصلاح',
    loanEnded: language === 'English' ? 'Loan period ended' : 'انتهت فترة الإعارة'
  };

  // Get check-in reasons with translations
  const getCheckInReasons = () => [
    translations.endOfAssignment,
    translations.employeeExit,
    translations.notNeeded,
    translations.upgrade,
    translations.faulty,
    translations.loanEnded
  ];

  // Process check-in for single or bulk
  const handleCheckIn = async () => {
    if (!reason) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingResults([]);

    try {
      if (isBulkMode) {
        // Bulk operation - use bulk endpoint
        const response = await apiRequest('/api/assets/bulk/check-in', 'POST', {
          assetIds: validAssets.map(a => a.id),
          reason,
          notes,
        });

        // Handle response
        const successCount = response.successful || 0;
        const failedCount = response.failed || 0;
        
        // Show toast based on results
        if (successCount > 0 && failedCount === 0) {
          toast({
            title: translations.successMessage,
            description: `${successCount} ${language === 'English' ? 'assets checked in' : 'أصل تم استلامه'}`,
          });
        } else if (successCount > 0 && failedCount > 0) {
          toast({
            title: translations.partialSuccess,
            description: `${successCount} ${language === 'English' ? 'of' : 'من'} ${validAssets.length} ${language === 'English' ? 'assets checked in' : 'أصل تم استلامه'}`,
            variant: 'default',
          });
        } else {
          toast({
            title: translations.errorMessage,
            description: response.message || 'Failed to check in assets',
            variant: 'destructive',
          });
        }

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
        queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
        
        if (successCount > 0 && onSuccess) {
          onSuccess();
        }
        
        // Close dialog
        onOpenChange(false);
      } else {
        // Single asset operation
        const asset = validAssets[0];
        await apiRequest(`/api/assets/${asset.id}/check-in`, 'POST', {
          reason,
          notes,
          transactionDate: new Date().toISOString(),
        });

        toast({
          title: translations.successMessage,
          description: `${asset.assetId} ${language === 'English' ? 'checked in successfully' : 'تم استلامه بنجاح'}`,
        });

        queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
        onOpenChange(false);
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      if (!isBulkMode) {
        toast({
          title: translations.errorMessage,
          description: error.message || 'An error occurred',
          variant: 'destructive',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setReason('');
    setNotes('');
    setShowAssetDetails(false);
    setShowResults(false);
    setProcessingResults([]);
    setProcessingProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {isBulkMode ? translations.titleBulk : translations.titleSingle}
          </DialogTitle>
          <DialogDescription>
            {isBulkMode ? translations.descBulk : translations.descSingle}
          </DialogDescription>
        </DialogHeader>

        {/* Show results if processing completed */}
        {showResults && processingResults.length > 0 ? (
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4">
                <div className="flex-1 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      {translations.successCount}: {processingResults.filter(r => r.success).length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">
                      {translations.failedCount}: {processingResults.filter(r => !r.success).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed results */}
              <ScrollArea className="h-[300px] border rounded-lg p-4">
                <div className="space-y-2">
                  {processingResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">{result.assetId}</span>
                        {result.employeeName && (
                          <span className="text-xs text-muted-foreground">
                            ({translations.returnedFrom} {result.employeeName})
                          </span>
                        )}
                      </div>
                      {result.message && (
                        <span className="text-xs text-muted-foreground">{result.message}</span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {/* Warning for invalid assets */}
              {invalidAssets.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {translations.someAssetsNotCheckedOut}
                  </AlertDescription>
                </Alert>
              )}

              {/* Warning for multiple employees */}
              {multipleEmployees && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {translations.multipleEmployeesWarning}
                  </AlertDescription>
                </Alert>
              )}

              {/* Asset summary for bulk mode */}
              {isBulkMode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{translations.assetSummary}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAssetDetails(!showAssetDetails)}
                    >
                      {showAssetDetails ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          {translations.hideDetails}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          {translations.showDetails}
                        </>
                      )}
                    </Button>
                  </div>

                  {showAssetDetails && (
                    <ScrollArea className="h-[200px] border rounded-lg p-3">
                      <div className="space-y-4">
                        {/* Group by employee */}
                        {Object.entries(assetsByEmployee).map(([employeeId, group]) => (
                          <div key={employeeId} className="space-y-2">
                            <div className="flex items-center gap-2 font-medium">
                              <User className="h-4 w-4" />
                              <span className="text-sm">
                                {group.employeeName} ({group.assets.length} {translations.assetsCount})
                              </span>
                            </div>
                            <div className="pl-6 space-y-1">
                              {group.assets.map((asset) => (
                                <div key={asset.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Package className="h-3 w-3" />
                                  <span>
                                    {asset.assetId} - {asset.type} {asset.brand}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {Object.keys(assetsByEmployee).length > 1 && 
                             employeeId !== Object.keys(assetsByEmployee)[Object.keys(assetsByEmployee).length - 1] && (
                              <Separator className="mt-2" />
                            )}
                          </div>
                        ))}

                        {/* Show invalid assets */}
                        {invalidAssets.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                {translations.cannotCheckIn}:
                              </span>
                              {invalidAssets.map((asset) => (
                                <div key={asset.id} className="flex items-center gap-2 text-sm text-muted-foreground line-through">
                                  <Package className="h-3 w-3" />
                                  <span>
                                    {asset.assetId} - {asset.type} {asset.brand}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* Single asset details */}
              {!isBulkMode && validAssets[0] && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">
                        {validAssets[0].assetId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm">
                        {validAssets[0].assignedEmployee?.englishName || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form fields */}
              <div className="space-y-4">
                {/* Reason selection */}
                <div className="grid gap-2">
                  <Label htmlFor="reason">{translations.reasonLabel}</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger id="reason">
                      <SelectValue placeholder={translations.selectReason} />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5}>
                      {getCheckInReasons().map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                  <Label htmlFor="notes">{translations.notes}</Label>
                  <Textarea
                    id="notes"
                    placeholder={translations.notesPlaceholder}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px] max-h-[120px] resize-none"
                  />
                </div>
              </div>

              {/* Progress bar for bulk processing */}
              {isProcessing && isBulkMode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{translations.processingAssets}</span>
                    <span>
                      {Math.floor(processingProgress)}% 
                    </span>
                  </div>
                  <Progress value={processingProgress} />
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex-shrink-0">
          {showResults ? (
            <>
              {processingResults.some(r => !r.success) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Retry failed assets
                    const failedAssets = assets.filter(a => 
                      processingResults.find(r => r.assetId === a.assetId && !r.success)
                    );
                    // Reset and retry with failed assets
                    setShowResults(false);
                    // You would update the assets prop here to only include failed ones
                  }}
                >
                  {translations.retry}
                </Button>
              )}
              <Button onClick={handleClose}>
                {translations.done}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={isProcessing}
              >
                {translations.cancel}
              </Button>
              <Button
                onClick={handleCheckIn}
                disabled={
                  !reason || 
                  isProcessing || 
                  validAssets.length === 0
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {translations.processing}
                  </>
                ) : (
                  isBulkMode ? translations.checkInAll : translations.checkIn
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}