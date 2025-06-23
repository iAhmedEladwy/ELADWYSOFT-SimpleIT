import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Paperclip, Send, User, FileText } from 'lucide-react';

const ticketUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']),
  priority: z.enum(['Low', 'Medium', 'High']),
  assignedToId: z.number().optional(),
  estimatedHours: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
  comment: z.string().optional(),
  isPrivateComment: z.boolean().default(false),
  timeEntry: z.object({
    hours: z.number().min(0).optional(),
    description: z.string().optional(),
  }).optional(),
});

type TicketUpdateFormData = z.infer<typeof ticketUpdateSchema>;

interface TicketUpdateFormProps {
  ticket: any;
  users: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TicketUpdateForm({ ticket, users, onSuccess, onCancel }: TicketUpdateFormProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TicketUpdateFormData>({
    resolver: zodResolver(ticketUpdateSchema),
    defaultValues: {
      title: ticket.title || '',
      description: ticket.description || '',
      status: ticket.status || 'Open',
      priority: ticket.priority || 'Medium',
      assignedToId: ticket.assignedToId || undefined,
      estimatedHours: ticket.estimatedHours || undefined,
      dueDate: ticket.dueDate ? ticket.dueDate.split('T')[0] : '',
      tags: ticket.tags?.join(', ') || '',
      comment: '',
      isPrivateComment: false,
      timeEntry: {
        hours: 0,
        description: '',
      },
    },
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (data: TicketUpdateFormData) => {
      // Prepare update data
      const updateData = {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assignedToId: data.assignedToId,
        estimatedHours: data.estimatedHours,
        dueDate: data.dueDate || null,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };

      // Update ticket
      const response = await apiRequest('PATCH', `/api/tickets/${ticket.id}`, updateData);
      const updatedTicket = await response.json();

      // Add comment if provided
      if (data.comment?.trim()) {
        await apiRequest('/api/tickets/comments', 'POST', {
          ticketId: ticket.id,
          content: data.comment,
          isPrivate: data.isPrivateComment,
          attachments: attachments.map(file => file.name), // In real app, upload files first
        });
      }

      // Add time entry if provided
      if (data.timeEntry?.hours && data.timeEntry.hours > 0) {
        await apiRequest(`/api/tickets/${ticket.id}/time`, 'POST', {
          hours: data.timeEntry.hours,
          description: data.timeEntry.description || 'Time entry',
        });
      }

      return updatedTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/enhanced'] });
      toast({
        title: "Ticket updated successfully",
        description: "All changes have been saved and notifications sent.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign ticket mutation
  const assignTicketMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/tickets/${ticket.id}/assign`, 'POST', { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/enhanced'] });
      toast({
        title: "Ticket assigned successfully",
        description: "Assignment notification has been sent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error assigning ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TicketUpdateFormData) => {
    updateTicketMutation.mutate(data);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickAssign = (userId: number) => {
    assignTicketMutation.mutate(userId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Update Ticket #{ticket.ticketId}</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={updateTicketMutation.isPending}
          >
            {updateTicketMutation.isPending ? 'Updating...' : 'Update Ticket'}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ticket title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName} ({user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Ticket description"
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="estimatedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Hours</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.5"
                      min="0"
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeEntry.hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add Time (Hours)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.25"
                      min="0"
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="timeEntry.description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Entry Description</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="What work was done..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma separated)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="urgent, hardware, network..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Comment Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Add Comment</h4>
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Add a comment or update..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2 mt-2">
              <FormField
                control={form.control}
                name="isPrivateComment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Private comment (internal only)</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* File Attachments */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">File Attachments</h4>
            
            <div className="space-y-2">
              <Label htmlFor="files">Attach Files</Label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
              />
              
              {attachments.length > 0 && (
                <div className="space-y-1">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAssign(user.id)}
                  disabled={assignTicketMutation.isPending}
                  className="flex items-center gap-1"
                >
                  <User className="h-3 w-3" />
                  Assign to {user.firstName}
                </Button>
              ))}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}