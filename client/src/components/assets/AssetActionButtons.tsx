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

interface AssetActionButtonsProps {
  asset: any;
  employees: any[];
}

export default function AssetActionButtons({ asset, employees }: AssetActionButtonsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openCheckOutDialog, setOpenCheckOutDialog] = useState(false);
  const [openCheckInDialog, setOpenCheckInDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [notes, setNotes] = useState('');

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
    notes: language === 'English' ? 'Notes' : 'ملاحظات',
    optionalNotes: language === 'English' ? 'Optional notes about this transaction' : 'ملاحظات اختيارية حول هذه العملية',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    confirm: language === 'English' ? 'Confirm' : 'تأكيد',
    processing: language === 'English' ? 'Processing...' : 'جاري المعالجة...',
    checkOutSuccess: language === 'English' ? 'Asset checked out successfully' : 'تم تسليم الأصل بنجاح',
    checkInSuccess: language === 'English' ? 'Asset checked in successfully' : 'تم استلام الأصل بنجاح',
  };

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/assets/${asset.id}/check-out`, {
        employeeId: parseInt(selectedEmployeeId),
        notes: notes.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.checkOutSuccess,
      });
      setOpenCheckOutDialog(false);
      setSelectedEmployeeId('');
      setNotes('');
    },
    onError: (error: any) => {
      toast({
        title: translations.checkOut,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/assets/${asset.id}/check-in`, {
        notes: notes.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.checkInSuccess,
      });
      setOpenCheckInDialog(false);
      setNotes('');
    },
    onError: (error: any) => {
      toast({
        title: translations.checkIn,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle check-out button click
  const handleCheckOut = () => {
    setOpenCheckOutDialog(true);
  };

  // Handle check-in button click
  const handleCheckIn = () => {
    setOpenCheckInDialog(true);
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
      <Dialog open={openCheckOutDialog} onOpenChange={setOpenCheckOutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{translations.checkOutTitle}</DialogTitle>
            <DialogDescription>{translations.checkOutDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="employee">{translations.selectEmployee}</Label>
              <Select 
                value={selectedEmployeeId} 
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder={translations.selectEmployee} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.englishName}
                    </SelectItem>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCheckOutDialog(false)}>
              {translations.cancel}
            </Button>
            <Button 
              onClick={handleCheckOutSubmit} 
              disabled={checkOutMutation.isPending || !selectedEmployeeId}
            >
              {checkOutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translations.processing}
                </>
              ) : (
                translations.confirm
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-in dialog */}
      <Dialog open={openCheckInDialog} onOpenChange={setOpenCheckInDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{translations.checkInTitle}</DialogTitle>
            <DialogDescription>{translations.checkInDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="check-in-notes">{translations.notes}</Label>
              <Textarea
                id="check-in-notes"
                placeholder={translations.optionalNotes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCheckInDialog(false)}>
              {translations.cancel}
            </Button>
            <Button 
              onClick={handleCheckInSubmit} 
              disabled={checkInMutation.isPending}
            >
              {checkInMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translations.processing}
                </>
              ) : (
                translations.confirm
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}