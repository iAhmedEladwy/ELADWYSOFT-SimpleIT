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

  // Translated check-out reasons
  const checkOutReasons = [
    language === 'English' ? 'Assigned for work use' : 'مخصص للاستخدام في العمل',
    language === 'English' ? 'Temporary loan' : 'إعارة مؤقتة',
    language === 'English' ? 'Replacement for faulty asset' : 'بديل لأصل معطل',
    language === 'English' ? 'Project-based use' : 'استخدام في مشروع',
    language === 'English' ? 'Remote work setup' : 'إعداد للعمل عن بُعد',
    language === 'English' ? 'New employee onboarding' : 'إعداد موظف جديد',
  ];

  // Translated check-in reasons
  const checkInReasons = [
    language === 'English' ? 'End of assignment' : 'انتهاء المهمة',
    language === 'English' ? 'Employee exit' : 'مغادرة الموظف',
    language === 'English' ? 'Asset not needed anymore' : 'لم يعد الأصل مطلوباً',
    language === 'English' ? 'Asset upgrade/replacement' : 'ترقية/استبدال الأصل',
    language === 'English' ? 'Faulty/Needs repair' : 'معطل/يحتاج إصلاح',
    language === 'English' ? 'Loan period ended' : 'انتهت فترة الإعارة',
  ];

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