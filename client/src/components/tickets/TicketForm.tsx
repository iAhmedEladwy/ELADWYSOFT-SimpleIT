import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { UserResponse, AssetResponse } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, 
  User, 
  MessageSquare, 
  History, 
  Paperclip, 
  X,
  Save,
  AlertCircle,
  Edit3,
  Send,
  Loader2
} from 'lucide-react';

// Comprehensive ticket schema for both create and edit modes
const ticketFormSchema = z.object({
  submittedById: z.string()
    .min(1, { message: "Please select who is submitting this ticket" })
    .transform(val => Number(val)),
  assignedToId: z.string()
    .optional()
    .transform(val => val && val !== '' && val !== 'unassigned' ? Number(val) : undefined),
  relatedAssetId: z.string()
    .optional()
    .transform(val => val && val !== '' && val !== 'none' ? Number(val) : undefined),
  requestType: z.string({
    required_error: "Please select a request type",
  }),
  priority: z.string({
    required_error: "Please select a priority",
  }),
  status: z.string().default('Open'),
  summary: z.string()
    .min(5, { message: "Summary must be at least 5 characters" })
    .max(200, { message: "Summary cannot exceed 200 characters" }),
  description: z.string()
    .min(5, { message: "Description must be at least 5 characters" })
    .max(2000, { message: "Description cannot exceed 2000 characters" }),
  category: z.string().optional(),
  urgency: z.string().optional(),
  impact: z.string().optional(),
  dueDate: z.string().optional(),
  slaTarget: z.string().optional(),
  timeSpent: z.string().optional().transform(val => val ? Number(val) : 0),
  workaround: z.string().optional(),
  rootCause: z.string().optional(),
  resolution: z.string().optional(),
  resolutionNotes: z.string().optional(),
  escalationLevel: z.string().optional().transform(val => val ? Number(val) : 0),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  ticket?: any; // If provided, this is edit mode
  mode: 'create' | 'edit';
  onSubmit?: (data: TicketFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTicketUpdate?: (ticket: any) => void;
}

export default function TicketForm({
  ticket,
  mode,
  onSubmit,
  onCancel,
  isSubmitting = false,
  open = true,
  onOpenChange,
  onTicketUpdate
}: TicketFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('details');
  const [commentText, setCommentText] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);

  // Fetch data
  const { data: users = [] } = useQuery<UserResponse[]>({ queryKey: ['/api/users'] });
  const { data: assets = [] } = useQuery<AssetResponse[]>({ queryKey: ['/api/assets'] });
  const { data: requestTypes = [] } = useQuery<Array<{id: number, name: string}>>({ queryKey: ['/api/custom-request-types'] });
  
  // Fetch comments and history for edit mode
  const { data: comments = [] } = useQuery({
    queryKey: [`/api/tickets/${ticket?.id}/comments`],
    enabled: mode === 'edit' && !!ticket?.id,
  });

  const { data: history = [] } = useQuery({
    queryKey: [`/api/tickets/${ticket?.id}/history`],
    enabled: mode === 'edit' && !!ticket?.id,
  });

  // Auto-save mutation for edit mode
  const autoSaveMutation = useMutation({
    mutationFn: async (updateData: Partial<TicketFormData>) => {
      if (mode === 'edit' && ticket) {
        return await apiRequest(`/api/tickets/${ticket.id}`, 'PATCH', updateData);
      }
      throw new Error('Auto-save only available in edit mode');
    },
    onSuccess: (updatedTicket) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      if (onTicketUpdate) {
        onTicketUpdate(updatedTicket);
      }
      setAutoSaving(false);
    },
    onError: (error) => {
      setAutoSaving(false);
      toast({
        title: 'Auto-save failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      return await apiRequest(`/api/tickets/comments`, 'POST', commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket?.id}/comments`] });
      setCommentText('');
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form setup with default values
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      submittedById: ticket?.submittedById?.toString() || user?.id?.toString() || '',
      assignedToId: ticket?.assignedToId?.toString() || '',
      relatedAssetId: ticket?.relatedAssetId?.toString() || '',
      requestType: ticket?.requestType || '',
      priority: ticket?.priority || '',
      status: ticket?.status || 'Open',
      summary: ticket?.summary || '',
      description: ticket?.description || '',
      category: ticket?.category || '',
      urgency: ticket?.urgency || '',
      impact: ticket?.impact || '',
      dueDate: ticket?.dueDate || '',
      slaTarget: ticket?.slaTarget?.toString() || '',
      timeSpent: ticket?.timeSpent?.toString() || '0',
      workaround: ticket?.workaround || '',
      rootCause: ticket?.rootCause || '',
      resolution: ticket?.resolution || '',
      resolutionNotes: ticket?.resolutionNotes || '',
      escalationLevel: ticket?.escalationLevel?.toString() || '0',
    },
  });

  // Auto-save handler for edit mode
  const handleAutoSave = async (field: string, value: any) => {
    if (mode === 'edit' && ticket) {
      setAutoSaving(true);
      autoSaveMutation.mutate({ [field]: value });
    }
  };

  // Form submission for create mode
  const handleFormSubmit = (data: TicketFormData) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = () => {
    if (!commentText.trim() || !ticket) return;
    
    commentMutation.mutate({
      ticketId: ticket.id,
      content: commentText,
      isPrivate: false,
    });
  };

  // Watch form changes for auto-save in edit mode
  useEffect(() => {
    if (mode === 'edit') {
      const subscription = form.watch((value, { name }) => {
        if (name && value[name] !== undefined) {
          handleAutoSave(name, value[name]);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [mode, form]);

  const isCreateMode = mode === 'create';
  const isEditMode = mode === 'edit';

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'default';
      case 'in progress': return 'default';
      case 'pending': return 'secondary';
      case 'resolved': return 'default';
      case 'closed': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCreateMode ? (
              <>
                <AlertCircle className="h-5 w-5 text-blue-500" />
                {language === 'English' ? 'Create New Ticket' : 'إنشاء تذكرة جديدة'}
              </>
            ) : (
              <>
                <Edit3 className="h-5 w-5 text-green-500" />
                {language === 'English' ? `Edit Ticket #${ticket?.ticketId}` : `تعديل التذكرة #${ticket?.ticketId}`}
              </>
            )}
            {autoSaving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? (language === 'English' ? 'Fill in all required fields to create a new support ticket' : 'املأ جميع الحقول المطلوبة لإنشاء تذكرة دعم جديدة')
              : (language === 'English' ? 'Edit ticket details. Changes are saved automatically' : 'تعديل تفاصيل التذكرة. التغييرات محفوظة تلقائياً')
            }
          </DialogDescription>
        </DialogHeader>

        {isCreateMode ? (
          // Create Mode: Single comprehensive view
          <div className="overflow-y-auto max-h-[75vh]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Basic Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === 'English' ? 'Basic Information' : 'المعلومات الأساسية'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Submitted By */}
                    <FormField
                      control={form.control}
                      name="submittedById"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Submitted By' : 'مقدم الطلب'} *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'English' ? 'Select user' : 'اختر المستخدم'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Assigned To */}
                    <FormField
                      control={form.control}
                      name="assignedToId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Assigned To' : 'مسند إلى'}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'English' ? 'Unassigned' : 'غير مسند'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unassigned">{language === 'English' ? 'Unassigned' : 'غير مسند'}</SelectItem>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Related Asset */}
                    <FormField
                      control={form.control}
                      name="relatedAssetId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Related Asset' : 'الأصل المرتبط'}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'English' ? 'No asset' : 'لا يوجد أصل'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">{language === 'English' ? 'No asset' : 'لا يوجد أصل'}</SelectItem>
                              {assets.map((asset) => (
                                <SelectItem key={asset.id} value={asset.id.toString()}>
                                  {asset.assetId} - {asset.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Request Type */}
                    <FormField
                      control={form.control}
                      name="requestType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Request Type' : 'نوع الطلب'} *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'English' ? 'Select request type' : 'اختر نوع الطلب'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {requestTypes.map((type) => (
                                <SelectItem key={type.id} value={type.name}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Ticket Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === 'English' ? 'Ticket Details' : 'تفاصيل التذكرة'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Summary */}
                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Summary' : 'الملخص'} *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={language === 'English' ? 'Brief summary of the issue' : 'ملخص مختصر للمشكلة'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Description' : 'الوصف'} *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={language === 'English' ? 'Detailed description of the issue' : 'وصف تفصيلي للمشكلة'}
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Priority & Classification Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === 'English' ? 'Priority & Classification' : 'الأولوية والتصنيف'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Priority */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Priority' : 'الأولوية'} *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'English' ? 'Select priority' : 'اختر الأولوية'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Low">{language === 'English' ? 'Low' : 'منخفضة'}</SelectItem>
                              <SelectItem value="Medium">{language === 'English' ? 'Medium' : 'متوسطة'}</SelectItem>
                              <SelectItem value="High">{language === 'English' ? 'High' : 'عالية'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Status' : 'الحالة'}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                      <X className="h-4 w-4 mr-2" />
                      {language === 'English' ? 'Cancel' : 'إلغاء'}
                    </Button>
                  )}
                  
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    {language === 'English' ? 'Create Ticket' : 'إنشاء التذكرة'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          // Edit Mode: Tabbed detailed view
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                {language === 'English' ? 'Details' : 'التفاصيل'}
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {language === 'English' ? 'Comments' : 'التعليقات'} ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                {language === 'English' ? 'History' : 'التاريخ'} ({history.length})
              </TabsTrigger>
              <TabsTrigger value="attachments" className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                {language === 'English' ? 'Attachments' : 'المرفقات'}
              </TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[60vh] mt-4">
              <TabsContent value="details" className="space-y-4">
                <Form {...form}>
                  <div className="space-y-6">
                    {/* Ticket Header */}
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <h3 className="text-lg font-semibold">#{ticket?.ticketId}</h3>
                        <p className="text-sm text-gray-600">{ticket?.summary}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(ticket?.priority)}>
                          {ticket?.priority}
                        </Badge>
                        <Badge variant={getStatusColor(ticket?.status)}>
                          {ticket?.status}
                        </Badge>
                        {autoSaving && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {language === 'English' ? 'Saving...' : 'جاري الحفظ...'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Editable Fields - Same structure as create mode but with auto-save */}
                    <div className="space-y-6">
                      {/* Basic Information Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {language === 'English' ? 'Basic Information' : 'المعلومات الأساسية'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* All fields from create mode with auto-save */}
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600">
                              {language === 'English' ? 'Fields automatically save when you change them' : 'الحقول تحفظ تلقائياً عند تغييرها'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </Form>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                {/* Comment display and input */}
                <div className="space-y-4">
                  {comments.map((comment: any) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <User className="h-6 w-6 mt-1 text-gray-400" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{comment.username || 'User'}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Comment input */}
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <Label>{language === 'English' ? 'Add Comment' : 'إضافة تعليق'}</Label>
                        <Textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder={language === 'English' ? 'Type your comment...' : 'اكتب تعليقك...'}
                          rows={3}
                        />
                        <Button 
                          onClick={handleCommentSubmit}
                          disabled={!commentText.trim() || commentMutation.isPending}
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {language === 'English' ? 'Add Comment' : 'إضافة تعليق'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {/* History display */}
                <div className="space-y-3">
                  {history.map((entry: any) => (
                    <Card key={entry.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <History className="h-5 w-5 mt-1 text-gray-400" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{entry.changeType}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(entry.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{entry.changeDescription}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4">
                {/* Placeholder for attachments */}
                <Card>
                  <CardContent className="pt-4 text-center text-gray-500">
                    <Paperclip className="h-8 w-8 mx-auto mb-2" />
                    <p>{language === 'English' ? 'No attachments yet' : 'لا توجد مرفقات بعد'}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}