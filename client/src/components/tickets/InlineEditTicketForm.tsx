import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import InlineEditableField from './InlineEditableField';
import { 
  Clock, 
  User, 
  MessageSquare, 
  History, 
  Paperclip, 
  X
} from 'lucide-react';

interface Ticket {
  id: number;
  ticketId: string;
  summary?: string;
  description: string;
  requestType: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
  submittedById: number;
  assignedToId?: number;
  relatedAssetId?: number;
  rootCause?: string;
  workaround?: string;
  resolution?: string;
  resolutionNotes?: string;
  slaTarget?: string;
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
  timeSpent?: number;
  dueDate?: string;
}

interface InlineEditTicketFormProps {
  ticket: Ticket | null;
  onClose: () => void;
  employees: any[];
  assets: any[];
  users: any[];
  onTicketUpdate?: (updatedTicket: Ticket) => void;
}

export default function InlineEditTicketForm({ 
  ticket, 
  onClose, 
  employees, 
  assets, 
  users, 
  onTicketUpdate 
}: InlineEditTicketFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Update mutation for individual fields
  const updateFieldMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: any }) => {
      const updateData = { [field]: value };
      return await apiRequest('PATCH', `/api/tickets/${ticket?.id}`, updateData);
    },
    onSuccess: (updatedTicket, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: 'Field updated',
        description: `Field updated successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch request types
  const { data: requestTypes = [] } = useQuery({
    queryKey: ['/api/custom-request-types'],
  });

  const handleFieldUpdate = async (field: string, value: string) => {
    let processedValue: any = value;
    
    // Process value based on field type
    if (field === 'assignedToId') {
      processedValue = value && value !== 'unassigned' ? parseInt(value) : null;
    } else if (field === 'submittedById') {
      processedValue = value ? parseInt(value) : null;
    } else if (field === 'relatedAssetId') {
      processedValue = value && value !== 'none' ? parseInt(value) : null;
    } else if (field === 'timeSpent') {
      processedValue = value ? parseInt(value) : 0;
    } else if (field === 'slaTarget') {
      processedValue = value ? parseInt(value) : null;
    } else if (field === 'escalationLevel') {
      processedValue = value ? parseInt(value) : 0;
    } else if (field === 'dueDate') {
      processedValue = value ? value : null;
    }

    await updateFieldMutation.mutateAsync({ field, value: processedValue });
  };

  const getAssignedUserName = (userId?: number) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'Unknown';
  };

  const getSubmittedByName = (employeeId?: number) => {
    if (!employeeId) return 'Unknown';
    const employee = employees.find(e => e.id === employeeId);
    return employee ? (employee.englishName || employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim()) : 'Unknown';
  };

  const getAssetName = (assetId?: number) => {
    if (!assetId) return 'None';
    const asset = assets.find(a => a.id === assetId);
    return asset ? `${asset.name || asset.modelName || 'Asset'} (${asset.assetId})` : 'Unknown';
  };



  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!ticket) return null;

  // Prepare options for select fields
  const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' }
  ];

  const statusOptions = [
    { value: 'New', label: 'New' },
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
  ];

  const userOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...users.map(user => ({ value: user.id.toString(), label: user.username }))
  ];

  const employeeOptions = [
    ...employees.map(emp => ({ 
      value: emp.id.toString(), 
      label: emp.englishName || emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
    }))
  ];

  const assetOptions = [
    { value: 'none', label: 'None' },
    ...assets.map(asset => ({ 
      value: asset.id.toString(), 
      label: `${asset.name || asset.modelName || 'Asset'} (${asset.assetId})`
    }))
  ];

  const requestTypeOptions = requestTypes.map((type: any) => ({
    value: type.name,
    label: type.name
  }));

  return (
    <Dialog open={!!ticket} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ticket {ticket.ticketId}</span>
            <div className="flex items-center gap-2">
              <Badge variant={
                ticket.priority === 'High' ? 'destructive' : 
                ticket.priority === 'Medium' ? 'default' : 
                'secondary'
              }>
                {ticket.priority}
              </Badge>
              <Badge variant="outline">{ticket.status}</Badge>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Click any field to edit it. Changes save automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Summary</div>
                    <InlineEditableField
                      value={ticket.summary || ''}
                      onSave={(value) => handleFieldUpdate('summary', value)}
                      placeholder="Click to add summary"
                      className="min-h-[2rem]"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Request Type</div>
                    <InlineEditableField
                      value={ticket.requestType}
                      onSave={(value) => handleFieldUpdate('requestType', value)}
                      type="select"
                      options={requestTypeOptions}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Submitted By</div>
                    <InlineEditableField
                      value={ticket.submittedById?.toString() || ''}
                      displayValue={getSubmittedByName(ticket.submittedById)}
                      onSave={(value) => handleFieldUpdate('submittedById', value)}
                      type="select"
                      options={employeeOptions}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Related Asset</div>
                    <InlineEditableField
                      value={ticket.relatedAssetId?.toString() || 'none'}
                      displayValue={getAssetName(ticket.relatedAssetId)}
                      onSave={(value) => handleFieldUpdate('relatedAssetId', value)}
                      type="select"
                      options={assetOptions}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                  <InlineEditableField
                    value={ticket.description}
                    onSave={(value) => handleFieldUpdate('description', value)}
                    type="textarea"
                    placeholder="Click to edit description"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Priority & Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Priority & Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Priority</div>
                    <InlineEditableField
                      value={ticket.priority}
                      onSave={(value) => handleFieldUpdate('priority', value)}
                      type="select"
                      options={priorityOptions}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Status</div>
                    <InlineEditableField
                      value={ticket.status}
                      onSave={(value) => handleFieldUpdate('status', value)}
                      type="select"
                      options={statusOptions}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Assigned To</div>
                    <InlineEditableField
                      value={ticket.assignedToId?.toString() || 'unassigned'}
                      displayValue={getAssignedUserName(ticket.assignedToId)}
                      onSave={(value) => handleFieldUpdate('assignedToId', value)}
                      type="select"
                      options={userOptions}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Urgency</div>
                    <InlineEditableField
                      value={ticket.urgency || 'Medium'}
                      onSave={(value) => handleFieldUpdate('urgency', value)}
                      type="select"
                      options={[
                        { value: 'Critical', label: 'Critical' },
                        { value: 'High', label: 'High' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'Low', label: 'Low' }
                      ]}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Impact</div>
                    <InlineEditableField
                      value={ticket.impact || 'Medium'}
                      onSave={(value) => handleFieldUpdate('impact', value)}
                      type="select"
                      options={[
                        { value: 'Critical', label: 'Critical' },
                        { value: 'High', label: 'High' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'Low', label: 'Low' }
                      ]}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Escalation Level</div>
                    <InlineEditableField
                      value={ticket.escalationLevel?.toString() || '0'}
                      onSave={(value) => handleFieldUpdate('escalationLevel', value)}
                      type="number"
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time & Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle>Time & Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Time Spent (minutes)</div>
                    <InlineEditableField
                      value={ticket.timeSpent?.toString() || '0'}
                      displayValue={formatTime(ticket.timeSpent || 0)}
                      onSave={(value) => handleFieldUpdate('timeSpent', value)}
                      type="number"
                      placeholder="0 minutes"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Due Date</div>
                    <InlineEditableField
                      value={ticket.dueDate ? new Date(ticket.dueDate).toISOString().slice(0, 16) : ''}
                      displayValue={ticket.dueDate ? new Date(ticket.dueDate).toLocaleString() : 'No due date'}
                      onSave={(value) => handleFieldUpdate('dueDate', value)}
                      type="datetime-local"
                      placeholder="Select date and time"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">SLA Target (hours)</div>
                    <InlineEditableField
                      value={ticket.slaTarget?.toString() || ''}
                      onSave={(value) => handleFieldUpdate('slaTarget', value)}
                      type="number"
                      placeholder="Hours until deadline"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ITIL Solutions */}
            <Card>
              <CardHeader>
                <CardTitle>ITIL Solutions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Workaround</div>
                    <InlineEditableField
                      value={ticket.workaround || ''}
                      onSave={(value) => handleFieldUpdate('workaround', value)}
                      type="textarea"
                      placeholder="Click to add temporary solution"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Root Cause</div>
                    <InlineEditableField
                      value={ticket.rootCause || ''}
                      onSave={(value) => handleFieldUpdate('rootCause', value)}
                      type="textarea"
                      placeholder="Click to add root cause analysis"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Resolution</div>
                    <InlineEditableField
                      value={ticket.resolution || ''}
                      onSave={(value) => handleFieldUpdate('resolution', value)}
                      type="textarea"
                      placeholder="Click to add final resolution"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Resolution Notes</div>
                    <InlineEditableField
                      value={ticket.resolutionNotes || ''}
                      onSave={(value) => handleFieldUpdate('resolutionNotes', value)}
                      type="textarea"
                      placeholder="Click to add resolution notes"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Read-only Information */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <div className="font-medium">Submitted By</div>
                <p>{getAssignedUserName(ticket.submittedById)}</p>
              </div>
              <div>
                <div className="font-medium">Related Asset</div>
                <p>{getAssetName(ticket.relatedAssetId)}</p>
              </div>
              <div>
                <div className="font-medium">Created</div>
                <p>{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <div className="font-medium">Last Updated</div>
                <p>{new Date(ticket.updatedAt).toLocaleString()}</p>
              </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}