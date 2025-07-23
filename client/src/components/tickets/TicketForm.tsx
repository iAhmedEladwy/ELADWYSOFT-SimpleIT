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
// Dialog imports removed - form now renders inline
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

// Ticket form schema with all ITIL-compliant fields
const ticketFormSchema = z.object({
  submittedById: z.string().min(1, "Please select who is submitting this ticket"),
  assignedToId: z.string().optional(),
  relatedAssetId: z.string().optional(),
  requestType: z.string().min(1, "Please select a request type"),
  category: z.string().default('Incident'),
  priority: z.string().min(1, "Please select a priority"),
  urgency: z.string().default('Medium'),
  impact: z.string().default('Medium'),
  status: z.string().default('Open'),
  summary: z.string().min(5, "Summary must be at least 5 characters").max(200, "Summary cannot exceed 200 characters"),
  description: z.string().min(5, "Description must be at least 5 characters").max(2000, "Description cannot exceed 2000 characters"),
  rootCause: z.string().optional(),
  workaround: z.string().optional(),
  resolution: z.string().optional(),
  resolutionNotes: z.string().optional(),
  dueDate: z.string().optional(),
  slaTarget: z.string().optional(),
  escalationLevel: z.string().default('0'),
  tags: z.string().optional(),
  privateNotes: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  ticket?: any; // If provided, this is edit mode
  mode: 'create' | 'edit';
  onSubmit?: (data: TicketFormData) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  isSubmitting?: boolean;
  onTicketUpdate?: (ticket: any) => void;
}

interface CommentData {
  id: number;
  content: string;
  username: string;
  createdAt: string;
}

interface HistoryData {
  id: number;
  changeType: string;
  changeDescription: string;
  createdAt: string;
}

export default function TicketForm({
  ticket,
  mode,
  onSubmit,
  onCancel,
  onSuccess,
  isSubmitting = false,
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
  const { data: comments = [] } = useQuery<CommentData[]>({
    queryKey: [`/api/tickets/${ticket?.id}/comments`],
    enabled: mode === 'edit' && !!ticket?.id,
  });

  const { data: history = [] } = useQuery<HistoryData[]>({
    queryKey: [`/api/tickets/${ticket?.id}/history`],
    enabled: mode === 'edit' && !!ticket?.id,
  });

  // Auto-save mutation for edit mode
  const autoSaveMutation = useMutation({
    mutationFn: async (updateData: Partial<TicketFormData>) => {
      if (mode === 'edit' && ticket) {
        return await apiRequest(`/api/tickets/${ticket.id}/enhanced`, 'PUT', updateData);
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
      assignedToId: ticket?.assignedToId?.toString() || 'unassigned',
      relatedAssetId: ticket?.relatedAssetId?.toString() || 'none',
      requestType: ticket?.requestType || '',
      category: ticket?.category || 'Incident',
      priority: ticket?.priority || '',
      urgency: ticket?.urgency || 'Medium',
      impact: ticket?.impact || 'Medium',
      status: ticket?.status || 'Open',
      summary: ticket?.summary || '',
      description: ticket?.description || '',
      rootCause: ticket?.rootCause || '',
      workaround: ticket?.workaround || '',
      resolution: ticket?.resolution || '',
      resolutionNotes: ticket?.resolutionNotes || '',
      dueDate: ticket?.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '',
      slaTarget: ticket?.slaTarget?.toString() || '',
      escalationLevel: ticket?.escalationLevel?.toString() || '0',
      tags: ticket?.tags?.join(', ') || '',
      privateNotes: ticket?.privateNotes || '',
    },
  });

  // Auto-save handler for edit mode
  const handleAutoSave = async (field: string, value: any) => {
    if (mode === 'edit' && ticket) {
      setAutoSaving(true);
      // Convert string values back to appropriate types for API
      let processedValue = value;
      if (field === 'submittedById' || field === 'assignedToId' || field === 'relatedAssetId') {
        processedValue = value && value !== '' && value !== 'unassigned' && value !== 'none' ? parseInt(value) : null;
      }
      autoSaveMutation.mutate({ [field]: processedValue });
    }
  };

  // Form submission for create mode
  const handleFormSubmit = (data: TicketFormData) => {
    if (onSubmit) {
      // Convert string IDs back to numbers for submission
      const processedData = {
        ...data,
        submittedById: parseInt(data.submittedById),
        assignedToId: data.assignedToId && data.assignedToId !== 'unassigned' ? parseInt(data.assignedToId) : null,
        relatedAssetId: data.relatedAssetId && data.relatedAssetId !== 'none' ? parseInt(data.relatedAssetId) : null,
        slaTarget: data.slaTarget ? parseInt(data.slaTarget) : null,
        escalationLevel: parseInt(data.escalationLevel || '0'),
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      onSubmit(processedData as any);
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
    <div className={isCreateMode ? "overflow-y-auto max-h-[75vh]" : "max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-lg"}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {isCreateMode ? (
            <>
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <h2 className="text-2xl font-bold">{language === 'English' ? 'Create New Ticket' : 'إنشاء تذكرة جديدة'}</h2>
            </>
          ) : (
            <>
              <Edit3 className="h-5 w-5 text-green-500" />
              <h2 className="text-2xl font-bold">{language === 'English' ? `Edit Ticket #${ticket?.ticketId}` : `تعديل التذكرة #${ticket?.ticketId}`}</h2>
            </>
          )}
          {autoSaving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </div>
        <p className="text-gray-600">
          {isCreateMode
            ? (language === 'English' ? 'Fill in all required fields to create a new support ticket' : 'املأ جميع الحقول المطلوبة لإنشاء تذكرة دعم جديدة')
            : (language === 'English' ? 'Edit ticket details. Changes are saved automatically' : 'تعديل تفاصيل التذكرة. التغييرات محفوظة تلقائياً')
          }
        </p>
      </div>

        {isCreateMode ? (
          // Create Mode: Single comprehensive view
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'English' ? 'No asset' : 'لا يوجد أصل'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">{language === 'English' ? 'No asset' : 'لا يوجد أصل'}</SelectItem>
                              {assets.map((asset) => (
                                <SelectItem key={asset.id} value={asset.id.toString()}>
                                  {asset.assetId} - {asset.name || 'Unknown'}
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Priority */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Priority' : 'الأولوية'} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'English' ? 'Select priority' : 'اختر الأولوية'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Low">{language === 'English' ? 'Low' : 'منخفضة'}</SelectItem>
                              <SelectItem value="Medium">{language === 'English' ? 'Medium' : 'متوسطة'}</SelectItem>
                              <SelectItem value="High">{language === 'English' ? 'High' : 'عالية'}</SelectItem>
                              <SelectItem value="Critical">{language === 'English' ? 'Critical' : 'حرجة'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Urgency */}
                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Urgency' : 'الإلحاح'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Low">{language === 'English' ? 'Low' : 'منخفض'}</SelectItem>
                              <SelectItem value="Medium">{language === 'English' ? 'Medium' : 'متوسط'}</SelectItem>
                              <SelectItem value="High">{language === 'English' ? 'High' : 'عالي'}</SelectItem>
                              <SelectItem value="Critical">{language === 'English' ? 'Critical' : 'حرج'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Impact */}
                    <FormField
                      control={form.control}
                      name="impact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Impact' : 'التأثير'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Low">{language === 'English' ? 'Low' : 'منخفض'}</SelectItem>
                              <SelectItem value="Medium">{language === 'English' ? 'Medium' : 'متوسط'}</SelectItem>
                              <SelectItem value="High">{language === 'English' ? 'High' : 'عالي'}</SelectItem>
                              <SelectItem value="Critical">{language === 'English' ? 'Critical' : 'حرج'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Category */}
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Category' : 'الفئة'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Incident">{language === 'English' ? 'Incident' : 'حادث'}</SelectItem>
                              <SelectItem value="Service Request">{language === 'English' ? 'Service Request' : 'طلب خدمة'}</SelectItem>
                              <SelectItem value="Problem">{language === 'English' ? 'Problem' : 'مشكلة'}</SelectItem>
                              <SelectItem value="Change">{language === 'English' ? 'Change' : 'تغيير'}</SelectItem>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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

                    {/* Escalation Level */}
                    <FormField
                      control={form.control}
                      name="escalationLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Escalation Level' : 'مستوى التصعيد'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">{language === 'English' ? 'None' : 'لا يوجد'}</SelectItem>
                              <SelectItem value="1">{language === 'English' ? 'Level 1' : 'المستوى 1'}</SelectItem>
                              <SelectItem value="2">{language === 'English' ? 'Level 2' : 'المستوى 2'}</SelectItem>
                              <SelectItem value="3">{language === 'English' ? 'Level 3' : 'المستوى 3'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* ITIL Management Fields Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === 'English' ? 'ITIL Management & Resolution' : 'إدارة ITIL والحلول'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Root Cause */}
                    <FormField
                      control={form.control}
                      name="rootCause"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Root Cause' : 'السبب الجذري'}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={language === 'English' ? 'Root cause analysis (ITIL Problem Management)' : 'تحليل السبب الجذري (إدارة المشاكل ITIL)'}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Workaround */}
                    <FormField
                      control={form.control}
                      name="workaround"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Workaround' : 'الحل المؤقت'}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={language === 'English' ? 'Temporary workaround solution (ITIL Incident Management)' : 'الحل المؤقت (إدارة الحوادث ITIL)'}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Resolution */}
                    <FormField
                      control={form.control}
                      name="resolution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Resolution' : 'الحل'}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={language === 'English' ? 'Final resolution details' : 'تفاصيل الحل النهائي'}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Resolution Notes */}
                    <FormField
                      control={form.control}
                      name="resolutionNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Resolution Notes' : 'ملاحظات الحل'}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={language === 'English' ? 'Additional notes about the resolution' : 'ملاحظات إضافية حول الحل'}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* SLA & Scheduling Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === 'English' ? 'SLA & Scheduling' : 'اتفاقية مستوى الخدمة والجدولة'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Due Date */}
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Due Date' : 'تاريخ الاستحقاق'}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* SLA Target (hours) */}
                    <FormField
                      control={form.control}
                      name="slaTarget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'SLA Target (hours)' : 'هدف اتفاقية مستوى الخدمة (ساعات)'}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="720"
                              {...field}
                              placeholder={language === 'English' ? 'SLA target in hours' : 'الهدف بالساعات'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Additional Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === 'English' ? 'Additional Information' : 'معلومات إضافية'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Tags */}
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Tags' : 'العلامات'}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={language === 'English' ? 'Comma-separated tags (e.g., urgent, hardware, network)' : 'علامات مفصولة بفواصل (مثل: عاجل، أجهزة، شبكة)'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Private Notes */}
                    <FormField
                      control={form.control}
                      name="privateNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'English' ? 'Private Notes (Staff Only)' : 'ملاحظات خاصة (للموظفين فقط)'}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={language === 'English' ? 'Internal notes visible only to staff members' : 'ملاحظات داخلية مرئية للموظفين فقط'}
                              rows={3}
                            />
                          </FormControl>
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

                    {/* Editable Fields */}
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {language === 'English' ? 'Ticket Information' : 'معلومات التذكرة'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-sm text-gray-600">
                            {language === 'English' ? 'Click any field to edit. Changes save automatically.' : 'انقر على أي حقل للتعديل. التغييرات تحفظ تلقائياً.'}
                          </div>
                          {/* All form fields would go here with auto-save */}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </Form>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                {/* Comment display and input */}
                <div className="space-y-4">
                  {Array.isArray(comments) && comments.map((comment: any) => (
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
                  {Array.isArray(history) && history.map((entry: any) => (
                    <Card key={entry.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <History className="h-5 w-5 mt-1 text-gray-400" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{entry.changeType || entry.action}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(entry.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{entry.changeDescription || entry.notes}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {(!Array.isArray(history) || history.length === 0) && (
                    <Card>
                      <CardContent className="pt-4 text-center text-gray-500">
                        <History className="h-8 w-8 mx-auto mb-2" />
                        <p>{language === 'English' ? 'No history yet' : 'لا يوجد تاريخ بعد'}</p>
                      </CardContent>
                    </Card>
                  )}
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
    </div>
  );
}