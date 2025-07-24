import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, Wrench, ArrowUp, FileText, LogOut, LogIn, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import MaintenanceForm from './MaintenanceForm';
import { UpgradeForm } from './UpgradeForm';

interface AssetActionsMenuProps {
  asset: {
    id: number;
    assetId: string;
    type: string;
    brand: string;
    modelName?: string;
    serialNumber?: string;
    status?: string;
  };
  employees?: any[];
  onEdit?: (asset: any) => void;
}

export function AssetActionsMenu({ asset, employees = [], onEdit }: AssetActionsMenuProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  // Check-out reasons
  const checkOutReasons = [
    'Assigned for work use',
    'Temporary loan',
    'Replacement for faulty asset',
    'Project-based use',
    'Remote work setup',
    'New employee onboarding'
  ];

  // Check-in reasons
  const checkInReasons = [
    'End of assignment',
    'Employee exit',
    'Asset not needed anymore',
    'Asset upgrade/replacement',
    'Faulty/Needs repair',
    'Loan period ended'
  ];

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: () => apiRequest(`/api/assets/${asset.id}/check-out`, 'POST', {
      employeeId: parseInt(selectedEmployeeId),
      notes: notes || reason,
      type: reason
    }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Asset checked out successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setShowCheckOutDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.message || 'Failed to check out asset', variant: 'destructive' });
    }
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: () => apiRequest(`/api/assets/${asset.id}/check-in`, 'POST', {
      notes: notes || reason,
      type: reason
    }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Asset checked in successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
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

  const handleMaintenance = () => {
    setShowMaintenanceForm(true);
  };

  const handleUpgrade = () => {
    setShowUpgradeForm(true);
  };

  const handleViewHistory = () => {
    setLocation(`/asset-history?assetId=${asset.id}`);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(asset);
    }
  };

  const handleCheckOut = () => {
    setShowCheckOutDialog(true);
  };

  const handleCheckIn = () => {
    setShowCheckInDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Asset
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {asset.status === 'Available' && (
            <DropdownMenuItem onClick={handleCheckOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Check Out
            </DropdownMenuItem>
          )}
          
          {asset.status === 'In Use' && (
            <DropdownMenuItem onClick={handleCheckIn}>
              <LogIn className="mr-2 h-4 w-4" />
              Check In
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleMaintenance}>
            <Wrench className="mr-2 h-4 w-4" />
            Schedule Maintenance
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleUpgrade}>
            <ArrowUp className="mr-2 h-4 w-4" />
            Request ITIL Upgrade
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleViewHistory}>
            <FileText className="mr-2 h-4 w-4" />
            View History
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Maintenance Form Dialog - using a wrapper dialog */}
      <Dialog open={showMaintenanceForm} onOpenChange={setShowMaintenanceForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance - {asset.assetId}</DialogTitle>
          </DialogHeader>
          <MaintenanceForm
            onSubmit={(data) => {
              // Handle maintenance form submission
              apiRequest(`/api/assets/${asset.id}/maintenance`, 'POST', data)
                .then(() => {
                  toast({ title: 'Success', description: 'Maintenance scheduled successfully' });
                  queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
                  setShowMaintenanceForm(false);
                })
                .catch((error) => {
                  toast({ title: 'Error', description: error?.message || 'Failed to schedule maintenance', variant: 'destructive' });
                });
            }}
            isSubmitting={false}
            assetId={asset.id}
            assetName={`${asset.assetId} - ${asset.type}`}
          />
        </DialogContent>
      </Dialog>

      {/* ITIL Upgrade Form Dialog */}
      <UpgradeForm
        open={showUpgradeForm}
        onOpenChange={setShowUpgradeForm}
        assetId={asset.id}
        assetInfo={{
          assetId: asset.assetId,
          type: asset.type,
          brand: asset.brand,
          modelName: asset.modelName,
          serialNumber: asset.serialNumber
        }}
      />

      {/* Check-out dialog */}
      <Dialog open={showCheckOutDialog} onOpenChange={setShowCheckOutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Check Out Asset - {asset.assetId}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="employee">Select Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Choose employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.englishName} ({employee.empId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {checkOutReasons.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckOutDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => checkOutMutation.mutate()} 
              disabled={checkOutMutation.isPending || !selectedEmployeeId || !reason}
            >
              {checkOutMutation.isPending ? 'Checking Out...' : 'Check Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-in dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Check In Asset - {asset.assetId}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="checkin-reason">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="checkin-reason">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {checkInReasons.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checkin-notes">Notes (Optional)</Label>
              <Textarea
                id="checkin-notes"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckInDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => checkInMutation.mutate()} 
              disabled={checkInMutation.isPending || !reason}
            >
              {checkInMutation.isPending ? 'Checking In...' : 'Check In'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}