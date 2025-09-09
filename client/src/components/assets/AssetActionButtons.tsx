import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, Loader2 } from 'lucide-react';
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
import ActiveEmployeeSelect from '@/components/employees/ActiveEmployee';

interface AssetActionButtonsProps {
  asset: any;
  employees: any[]; // This prop is no longer needed but kept for compatibility
}

// Check-out reason options - matching AssetActionsMenu
const CHECK_OUT_REASONS = [
  'Assigned for work use',
  'Temporary loan',
  'Replacement for faulty asset',
  'Project-based use',
  'Remote work setup',
  'New employee onboarding'
];

// Check-in reason options - matching AssetActionsMenu
const CHECK_IN_REASONS = [
  'End of assignment',
  'Employee exit',
  'Asset not needed anymore',
  'Asset upgrade/replacement',
  'Faulty/Needs repair',
  'Loan period ended'
];

export default function AssetActionButtons({ asset, employees }: AssetActionButtonsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState<string>('');

  // Translations
  const translations = {
    checkOut: language === 'English' ? 'Check Out' : 'تسليم',
    checkIn: language === 'English' ? 'Check In' : 'استلام',
    checkOutTitle: language === 'English' ? 'Check Out Asset' : 'تسليم الأصل',
    checkInTitle: language === 'English' ? 'Check In Asset' : 'استلام الأصل',
    checkOutDesc: language === 'English' 
      ? 'Assign this asset to an employee' 
      : 'تخصيص هذا الأصل لموظف',
    checkInDesc: language === 'English' 
      ? 'Return this asset back to inventory' 
      : 'إعادة هذا الأصل إلى المخزون',
    selectEmployee: language === 'English' ? 'Select Employee' : 'اختر الموظف',
    reasonLabel: language === 'English' ? 'Reason' : 'السبب',
    selectReason: language === 'English' ? 'Select reason' : 'اختر السبب',
    notes: language === 'English' ? 'Notes' : 'ملاحظات',
    optionalNotes: language === 'English' ? 'Optional notes about this transaction' : 'ملاحظات اختيارية حول هذه العملية',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    confirm: language === 'English' ? 'Confirm' : 'تأكيد',
    processing: language === 'English' ? 'Processing...' : 'جاري المعالجة...',
    checkOutSuccess: language === 'English' ? 'Asset checked out successfully' : 'تم تسليم الأصل بنجاح',
    checkInSuccess: language === 'English' ? 'Asset checked in successfully' : 'تم استلام الأصل بنجاح',
  };

  // Check-out mutation - matching AssetActionsMenu exactly
  const checkOutMutation = useMutation({
    mutationFn: () => apiRequest(`/api/assets/${asset.id}/check-out`, 'POST', {
      employeeId: parseInt(selectedEmployeeId),
      notes: notes || reason,
      type: 'Check-Out'
    }),
    onSuccess: () => {
      toast({ title: 'Success', description: translations.checkOutSuccess });
      // Invalidate all asset-related queries to ensure full refresh
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
      queryClient.invalidateQueries({ queryKey: ['/api/asset-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] }); // In case employee assignment counts are shown
      // Force refetch if specific asset is being viewed
      queryClient.invalidateQueries({ queryKey: ['/api/assets', asset.id] });
      setShowCheckOutDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.message || 'Failed to check out asset', variant: 'destructive' });
    }
  });

  // Check-in mutation - matching AssetActionsMenu exactly
   const checkInMutation = useMutation({
    mutationFn: () => apiRequest(`/api/assets/${asset.id}/check-in`, 'POST', {
      notes: notes || reason,
      type: 'Check-In'
    }),
    onSuccess: () => {
      toast({ title: 'Success', description: translations.checkInSuccess });
      // Invalidate all asset-related queries to ensure full refresh
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
      queryClient.invalidateQueries({ queryKey: ['/api/asset-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] }); // In case employee assignment counts are shown
      // Force refetch if specific asset is being viewed
      queryClient.invalidateQueries({ queryKey: ['/api/assets', asset.id] });
      setShowCheckInDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.message || 'Failed to check in asset', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setSelectedEmployeeId('');
    setNotes('');
    setReason('');
  };

  // Handle check-out button click
  const handleCheckOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowCheckOutDialog(true);
  };

  // Handle check-in button click
  const handleCheckIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowCheckInDialog(true);
  };

  // Handle check-out form submit
  const handleCheckOutSubmit = () => {
    if (!selectedEmployeeId) return;
    checkOutMutation.mutate();
  };

  // Handle check-in form submit
  const handleCheckInSubmit = () => {
    checkInMutation.mutate();
  };

  // Render action buttons based on asset status
  return (
    <>
      {asset.status === 'Available' && (
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2"
          onClick={handleCheckOut}
        >
          <LogOut className="h-4 w-4 mr-1" />
          {translations.checkOut}
        </Button>
      )}

      {asset.status === 'In Use' && (
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2"
          onClick={handleCheckIn}
        >
          <LogIn className="h-4 w-4 mr-1" />
          {translations.checkIn}
        </Button>
      )}

      {/* Check-out dialog */}
       <Dialog open={showCheckOutDialog} onOpenChange={setShowCheckOutDialog}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{translations.checkOutTitle}</DialogTitle>
            <DialogDescription>{translations.checkOutDesc}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="employee">{translations.selectEmployee}</Label>
                <ActiveEmployeeSelect
                  value={selectedEmployeeId}
                  onValueChange={setSelectedEmployeeId}
                  placeholder={translations.selectEmployee}
                  required={true}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">{translations.reasonLabel}</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reason">
                    <SelectValue placeholder={translations.selectReason} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    {CHECK_OUT_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">{translations.notes}</Label>
                <Textarea
                  id="notes"
                  placeholder={translations.optionalNotes}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px] max-h-[120px] resize-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowCheckOutDialog(false)}>
              {translations.cancel}
            </Button>
            <Button 
              onClick={handleCheckOutSubmit} 
              disabled={!selectedEmployeeId || !reason || checkOutMutation.isPending}
            >
              {checkOutMutation.isPending ? translations.checkingOut : translations.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-in dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{translations.checkInTitle}</DialogTitle>
            <DialogDescription>{translations.checkInDesc}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="checkin-reason">{translations.reasonLabel}</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="checkin-reason">
                    <SelectValue placeholder={translations.selectReason} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    {CHECK_IN_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkin-notes">{translations.notes}</Label>
                <Textarea
                  id="checkin-notes"
                  placeholder={translations.optionalNotes}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px] max-h-[120px] resize-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowCheckInDialog(false)}>
              {translations.cancel}
            </Button>
            <Button 
              onClick={handleCheckInSubmit} 
              disabled={!reason || checkInMutation.isPending}
            >
              {checkInMutation.isPending ? translations.checkingIn : translations.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}