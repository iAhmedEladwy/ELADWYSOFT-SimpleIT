import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreHorizontal, Wrench, ArrowUp, FileText, LogOut, LogIn, Edit, Calendar, User, Settings, CheckCircle, AlertCircle, Eye, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import MaintenanceForm from './MaintenanceForm';
import { UpgradeForm } from './UpgradeForm';
import AssetDetailView from './AssetDetailView';

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
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
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
      type: 'Check-Out'
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
      type: 'Check-In'
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

  const handleMaintenance = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowMaintenanceForm(true);
  };

  const handleUpgrade = () => {
    setShowUpgradeForm(true);
  };

  const handleViewHistory = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowHistoryDialog(true);
  };

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (onEdit) {
      onEdit(asset);
    }
  };

  const handleCheckOut = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowCheckOutDialog(true);
  };

  const handleCheckIn = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowCheckInDialog(true);
  };

  const handleViewDetails = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowDetailsDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleEdit();
          }}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Asset
          </DropdownMenuItem>

          <DropdownMenuItem onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleViewDetails();
          }}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {asset.status === 'Available' && (
            <DropdownMenuItem onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCheckOut();
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              Check Out
            </DropdownMenuItem>
          )}
          
          {asset.status === 'In Use' && (
            <DropdownMenuItem onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCheckIn();
            }}>
              <LogIn className="mr-2 h-4 w-4" />
              Check In
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMaintenance();
          }}>
            <Wrench className="mr-2 h-4 w-4" />
            Schedule Maintenance
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleViewHistory();
          }}>
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
                      {employee.empId} - {employee.englishName || employee.name}
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

      {/* Asset Detail View dialog */}
      <AssetDetailDialog
        asset={asset}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />

      {/* Asset History Dialog */}
      <AssetHistoryDialog 
        open={showHistoryDialog} 
        onOpenChange={setShowHistoryDialog}
        asset={asset}
      />
    </>
  );
}

// Asset History Dialog Component
function AssetHistoryDialog({ open, onOpenChange, asset }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  asset: any; 
}) {
  const { toast } = useToast();
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<any>(null);
  // Fetch asset transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/asset-transactions', asset.id],
    queryFn: () => apiRequest(`/api/asset-transactions?assetId=${asset.id}`),
    enabled: open
  });

  // Fetch asset maintenance records
  const { data: maintenanceRecords = [], refetch: refetchMaintenance } = useQuery({
    queryKey: ['/api/assets', asset.id, 'maintenance'],
    queryFn: () => apiRequest(`/api/assets/${asset.id}/maintenance`),
    enabled: open
  });

  // Fetch employees for name lookup
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    enabled: open
  });

  const getEmployeeName = (employeeId: number) => {
    const employee = (employees as any[]).find((e: any) => e.id === employeeId);
    return employee ? employee.englishName || employee.name : 'Unknown';
  };

  // Maintenance mutations
  const addMaintenanceMutation = useMutation({
    mutationFn: async (maintenanceData: any) => {
      return apiRequest(`/api/assets/${asset.id}/maintenance`, 'POST', maintenanceData);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Maintenance record added successfully' });
      refetchMaintenance();
      setShowMaintenanceForm(false);
      setEditingMaintenance(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.message || 'Failed to add maintenance record', variant: 'destructive' });
    }
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/maintenance/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Maintenance record updated successfully' });
      refetchMaintenance();
      setShowMaintenanceForm(false);
      setEditingMaintenance(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.message || 'Failed to update maintenance record', variant: 'destructive' });
    }
  });

  const deleteMaintenanceMutation = useMutation({
    mutationFn: async (maintenanceId: number) => {
      return apiRequest(`/api/maintenance/${maintenanceId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Maintenance record deleted successfully' });
      refetchMaintenance();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.message || 'Failed to delete maintenance record', variant: 'destructive' });
    }
  });

  const handleAddMaintenance = () => {
    setEditingMaintenance(null);
    setShowMaintenanceForm(true);
  };

  const handleEditMaintenance = (record: any) => {
    setEditingMaintenance(record);
    setShowMaintenanceForm(true);
  };

  const handleDeleteMaintenance = (record: any) => {
    if (confirm('Are you sure you want to delete this maintenance record?')) {
      deleteMaintenanceMutation.mutate(record.id);
    }
  };

  const handleMaintenanceSubmit = (data: any) => {
    if (editingMaintenance) {
      updateMaintenanceMutation.mutate({ ...data, id: editingMaintenance.id });
    } else {
      addMaintenanceMutation.mutate(data);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'Check Out': return <LogOut className="h-4 w-4 text-blue-500" />;
      case 'Check In': return <LogIn className="h-4 w-4 text-green-500" />;
      case 'Assignment': return <User className="h-4 w-4 text-purple-500" />;
      case 'Maintenance': return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'Upgrade': return <ArrowUp className="h-4 w-4 text-indigo-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMaintenanceIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'In Progress': return <Settings className="h-4 w-4 text-blue-500" />;
      case 'Scheduled': return <Calendar className="h-4 w-4 text-orange-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Asset History - {asset.assetId}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Asset Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Type:</span>
                <div>{asset.type}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Brand:</span>
                <div>{asset.brand}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Model:</span>
                <div>{asset.modelName || '-'}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Status:</span>
                <Badge className={
                  asset.status === 'Available' ? 'bg-green-100 text-green-800' :
                  asset.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                  asset.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {asset.status}
                </Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">
                Check-In/Out History ({transactions.length})
              </TabsTrigger>
              <TabsTrigger value="maintenance">
                Maintenance Records ({maintenanceRecords.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(transaction.type)}
                              <span className="font-medium">{transaction.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              {getEmployeeName(transaction.employeeId)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {transaction.date ? format(new Date(transaction.date), 'MMM dd, yyyy HH:mm') : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {transaction.notes || '-'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <FileText className="h-8 w-8 mb-2" />
                    <p>No transaction history found</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="maintenance" className="space-y-4">
              {/* Add Maintenance Button */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Manage maintenance records for {asset.assetId}
                </div>
                <Button onClick={handleAddMaintenance} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Maintenance
                </Button>
              </div>
              <ScrollArea className="h-[360px]">
                {maintenanceRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRecords.map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getMaintenanceIcon(record.status)}
                              <span className="font-medium">{record.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={record.description}>
                              {record.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {record.date ? format(new Date(record.date), 'MMM dd, yyyy') : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.cost ? `$${Number(record.cost).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{record.providerName || 'N/A'}</div>
                              <div className="text-gray-500">{record.providerType}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditMaintenance(record)}
                                title="Edit maintenance record"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMaintenance(record)}
                                title="Delete maintenance record"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <Wrench className="h-8 w-8 mb-2" />
                    <p>No maintenance records found</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Maintenance Form Dialog */}
      <Dialog open={showMaintenanceForm} onOpenChange={setShowMaintenanceForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMaintenance ? 'Edit Maintenance Record' : 'Add Maintenance Record'} - {asset.assetId}
            </DialogTitle>
          </DialogHeader>
          <MaintenanceForm
            onSubmit={handleMaintenanceSubmit}
            isSubmitting={addMaintenanceMutation.isPending || updateMaintenanceMutation.isPending}
            assetId={asset.id}
            assetName={`${asset.assetId} - ${asset.type}`}
            initialData={editingMaintenance}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Asset Detail View Dialog Component
function AssetDetailDialog({ 
  asset, 
  open, 
  onOpenChange 
}: { 
  asset: any; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  return (
    <AssetDetailView
      assetId={asset?.id || null}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}