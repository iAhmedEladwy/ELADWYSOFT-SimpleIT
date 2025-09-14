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
import ActiveEmployeeSelect from '@/components/employees/ActiveEmployee';
import {
  Package,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
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

interface EnhancedCheckOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  onSuccess?: () => void;
}

// Check-out reason options

interface ProcessingResult {
  assetId: string;
  success: boolean;
  message?: string;
}

export default function EnhancedCheckOutDialog({
  open,
  onOpenChange,
  assets,
  onSuccess
}: EnhancedCheckOutDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showAssetDetails, setShowAssetDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Determine if bulk mode
  const isBulkMode = assets.length > 1;
  const validAssets = assets.filter(asset => asset.status === 'Available');
  const invalidAssets = assets.filter(asset => asset.status !== 'Available');

  // Translations
  const translations = {
    // Title variations
    titleSingle: language === 'English' ? 'Check Out Asset' : 'تسليم الأصل',
    titleBulk: language === 'English' 
      ? `Check Out ${assets.length} Assets` 
      : `تسليم ${assets.length} أصل`,
    
    // Descriptions
    descSingle: language === 'English' 
      ? 'Assign this asset to an employee' 
      : 'تخصيص هذا الأصل لموظف',
    descBulk: language === 'English' 
      ? `Assign ${validAssets.length} assets to the same employee` 
      : `تخصيص ${validAssets.length} أصل لنفس الموظف`,
    
    // Form fields
    selectEmployee: language === 'English' ? 'Select Employee' : 'اختر الموظف',
    reasonLabel: language === 'English' ? 'Reason for Check-Out' : 'سبب التسليم',
    selectReason: language === 'English' ? 'Select reason...' : 'اختر السبب...',
    notes: language === 'English' ? 'Notes (Optional)' : 'ملاحظات (اختياري)',
    notesPlaceholder: language === 'English' 
      ? 'Additional notes about this transaction...' 
      : 'ملاحظات إضافية حول هذه العملية...',
    
    // Asset summary
    assetSummary: language === 'English' ? 'Assets Summary' : 'ملخص الأصول',
    showDetails: language === 'English' ? 'Show Details' : 'عرض التفاصيل',
    hideDetails: language === 'English' ? 'Hide Details' : 'إخفاء التفاصيل',
    available: language === 'English' ? 'Available' : 'متاح',
    unavailable: language === 'English' ? 'Unavailable' : 'غير متاح',
    
    // Warnings
    someAssetsUnavailable: language === 'English' 
      ? `${invalidAssets.length} asset(s) cannot be checked out (not available)` 
      : `${invalidAssets.length} أصل لا يمكن تسليمه (غير متاح)`,
    
    // Buttons
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    checkOut: language === 'English' ? 'Check Out' : 'تسليم',
    checkOutAll: language === 'English' 
      ? `Check Out ${validAssets.length} Assets` 
      : `تسليم ${validAssets.length} أصل`,
    processing: language === 'English' ? 'Processing...' : 'جاري المعالجة...',
    
    // Progress
    processingAssets: language === 'English' 
      ? 'Processing assets...' 
      : 'جاري معالجة الأصول...',
    
    // Results
    successCount: language === 'English' ? 'Successful' : 'نجح',
    failedCount: language === 'English' ? 'Failed' : 'فشل',
    retry: language === 'English' ? 'Retry Failed' : 'إعادة المحاولة',
    done: language === 'English' ? 'Done' : 'تم',
    
    // Success/Error messages
    successMessage: language === 'English' 
      ? 'Assets checked out successfully' 
      : 'تم تسليم الأصول بنجاح',
    partialSuccess: language === 'English' 
      ? 'Some assets were checked out successfully' 
      : 'تم تسليم بعض الأصول بنجاح',
    errorMessage: language === 'English' 
      ? 'Failed to check out assets' 
      : 'فشل تسليم الأصول',

    // Check-out reasons
    assignedWork: language === 'English' ? 'Assigned for work use' : 'مخصص للاستخدام العمل',
    temporaryLoan: language === 'English' ? 'Temporary loan' : 'إعارة مؤقتة',
    replacement: language === 'English' ? 'Replacement for faulty asset' : 'استبدال لأصل معطل',
    projectUse: language === 'English' ? 'Project-based use' : 'استخدام حسب المشروع',
    remoteWork: language === 'English' ? 'Remote work setup' : 'إعداد العمل عن بُعد',
    onboarding: language === 'English' ? 'New employee onboarding' : 'إعداد موظف جديد'
  };

  // Get check-out reasons with translations
  const getCheckOutReasons = () => [
    translations.assignedWork,
    translations.temporaryLoan,
    translations.replacement,
    translations.projectUse,
    translations.remoteWork,
    translations.onboarding
  ];

  // Process check-out for single or bulk
  const handleCheckOut = async () => {
    if (!selectedEmployeeId || !reason) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingResults([]);

    try {
      if (isBulkMode) {
        // Bulk operation
        const totalAssets = validAssets.length;
        const results: ProcessingResult[] = [];

        for (let i = 0; i < validAssets.length; i++) {
          const asset = validAssets[i];
          
          try {
            await apiRequest(`/api/assets/${asset.id}/check-out`, 'POST', {
              employeeId: parseInt(selectedEmployeeId),
              reason,
              notes,
              transactionDate: new Date().toISOString(),
            });

            results.push({
              assetId: asset.assetId,
              success: true,
            });
          } catch (error: any) {
            results.push({
              assetId: asset.assetId,
              success: false,
              message: error.message || 'Failed to check out',
            });
          }

          // Update progress
          setProcessingProgress(((i + 1) / totalAssets) * 100);
        }

        setProcessingResults(results);
        const successCount = results.filter(r => r.success).length;
        
        // Show results
        setShowResults(true);

        // Show toast
        if (successCount === totalAssets) {
          toast({
            title: translations.successMessage,
            description: `${successCount} ${language === 'English' ? 'assets checked out' : 'أصل تم تسليمه'}`,
          });
        } else if (successCount > 0) {
          toast({
            title: translations.partialSuccess,
            description: `${successCount} ${language === 'English' ? 'of' : 'من'} ${totalAssets} ${language === 'English' ? 'assets checked out' : 'أصل تم تسليمه'}`,
            variant: 'default',
          });
        } else {
          toast({
            title: translations.errorMessage,
            variant: 'destructive',
          });
        }

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
        
        if (successCount > 0 && onSuccess) {
          onSuccess();
        }
      } else {
        // Single asset operation
        const asset = validAssets[0];
        await apiRequest(`/api/assets/${asset.id}/check-out`, 'POST', {
          employeeId: parseInt(selectedEmployeeId),
          reason,
          notes,
          transactionDate: new Date().toISOString(),
        });

        toast({
          title: translations.successMessage,
          description: `${asset.assetId} ${language === 'English' ? 'checked out successfully' : 'تم تسليمه بنجاح'}`,
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
    setSelectedEmployeeId('');
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
              {/* Warning for unavailable assets */}
              {invalidAssets.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {translations.someAssetsUnavailable}
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
                    <ScrollArea className="h-[150px] border rounded-lg p-3">
                      <div className="space-y-2">
                        {assets.map((asset) => (
                          <div key={asset.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {asset.assetId} - {asset.type} {asset.brand}
                              </span>
                            </div>
                            <Badge
                              variant={asset.status === 'Available' ? 'default' : 'secondary'}
                            >
                              {asset.status === 'Available' 
                                ? translations.available 
                                : translations.unavailable}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* Form fields */}
              <div className="space-y-4">
                {/* Employee selection */}
                <div className="grid gap-2">
                  <Label htmlFor="employee">{translations.selectEmployee}</Label>
                  <ActiveEmployeeSelect
                    value={selectedEmployeeId}
                    onValueChange={setSelectedEmployeeId}
                    placeholder={translations.selectEmployee}
                    showDepartment={true}
                    showPosition={false}
                    required={true}
                  />
                </div>

                {/* Reason selection */}
                <div className="grid gap-2">
                  <Label htmlFor="reason">{translations.reasonLabel}</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger id="reason">
                      <SelectValue placeholder={translations.selectReason} />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5}>
                      {getCheckOutReasons().map((reason, index) => (
                        <SelectItem key={index} value={reason}>{reason}</SelectItem>
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
                onClick={handleCheckOut}
                disabled={
                  !selectedEmployeeId || 
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
                  isBulkMode ? translations.checkOutAll : translations.checkOut
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}