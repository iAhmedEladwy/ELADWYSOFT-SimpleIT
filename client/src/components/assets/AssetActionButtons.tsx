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
import CheckOutDialog from './BulkActions/dialogs/CheckOutDialog';
import CheckInDialog from './BulkActions/dialogs/CheckInDialog';

interface AssetActionButtonsProps {
  asset: any;
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

export default function AssetActionButtons({ asset }: AssetActionButtonsProps) {
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
         <CheckOutDialog
          open={showCheckOutDialog}
          onOpenChange={setShowCheckOutDialog}
          assets={[asset]}  // Single asset in an array
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
            queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
            queryClient.invalidateQueries({ queryKey: ['/api/asset-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
          }}
        />

      {/* Check-in dialog */}
      <CheckInDialog
        open={showCheckInDialog}
        onOpenChange={setShowCheckInDialog}
        assets={[asset]}  // Single asset in an array
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
          queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
          queryClient.invalidateQueries({ queryKey: ['/api/asset-transactions'] });
          queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
        }}
         />
    </>
  );
}