import { useState, useEffect, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Loader2,
  Calendar,
  Tag,
  FileText,
  Upload
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

// Ticket form schema
const ticketFormSchema = z.object({
  submittedById: z.string(), 
  assignedToId: z.string().optional(),
  relatedAssetId: z.string().optional(),
  requestType: z.string(),
  category: z.string().default('Incident'),
  priority: z.string(),
  urgency: z.string().default('Medium'),
  impact: z.string().default('Medium'),
  status: z.string().default('Open'),
  summary: z.string().min(1,"Summary is required").max(200,"Summary cannot exceed 200 characters"),
  description: z.string().min(1, "Description is required").max(2000, "Description cannot exceed 2000 characters"),
  resolution: z.string().optional(),
  dueDate: z.string().optional(),
  slaTarget: z.string().optional(),
  escalationLevel: z.string().default('0'),
  tags: z.string().optional(),
  privateNotes: z.string().optional(),
  timeSpent: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  ticket?: any;
  mode: 'create' | 'edit';
  onSubmit?: (data: TicketFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  onTicketUpdate?: () => void;
}

interface CommentData {
  id: number;
  content: string;
  userId: number;
  isPrivate: boolean;
  createdAt: string;
  user?: {
    username?: string;
    englishName?: string;
  };
}

interface HistoryData {
  id: number;
  ticketId: number;
  changeType: string;
  changeDescription: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  changedBy?: number;
  user?: {
    username?: string;
    englishName?: string;
  };
}

export default function TicketForm({ 
  ticket, 
  mode, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  onTicketUpdate 
}: TicketFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [commentText, setCommentText] = useState('');
  const [isPrivateComment, setIsPrivateComment] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Translations object
  const t = {
    // Form titles
    createTicket: language === 'English' ? 'Create New Ticket' : 'إنشاء تذكرة جديدة',
    editTicket: language === 'English' ? 'Edit Ticket' : 'تعديل التذكرة',
    fillRequired: language === 'English' ? 'Fill in all required fields to create a new support ticket' : 'املأ جميع الحقول المطلوبة لإنشاء تذكرة دعم جديدة',
    
    // Section headers
    basicInfo: language === 'English' ? 'Basic Information' : 'المعلومات الأساسية',
    basicInfoDesc: language === 'English' ? 'Primary ticket details and assignment' : 'تفاصيل التذكرة الأساسية والتعيين',
    ticketDetails: language === 'English' ? 'Ticket Details' : 'تفاصيل التذكرة',
    ticketDetailsDesc: language === 'English' ? 'Describe the issue or request' : 'وصف المشكلة أو الطلب',
    priorityClass: language === 'English' ? 'Priority & Classification' : 'الأولوية والتصنيف',
    priorityClassDesc: language === 'English' ? 'Set priority and categorize the ticket' : 'تعيين الأولوية وتصنيف التذكرة',
    additionalInfo: language === 'English' ? 'Additional Information' : 'معلومات إضافية',
    additionalInfoDesc: language === 'English' ? 'Optional details and metadata' : 'تفاصيل اختيارية وبيانات وصفية',
    ticketInfo: language === 'English' ? 'Ticket Information' : 'معلومات التذكرة',
    clickToEdit: language === 'English' ? 'Click any field to edit. Changes save automatically.' : 'انقر على أي حقل للتعديل. التغييرات تحفظ تلقائياً.',
    
    // Field labels
    submittedBy: language === 'English' ? 'Submitted By' : 'مقدم الطلب',
    assignedTo: language === 'English' ? 'Assigned To' : 'معين إلى',
    relatedAsset: language === 'English' ? 'Related Asset' : 'الأصل المرتبط',
    requestType: language === 'English' ? 'Request Type' : 'نوع الطلب',
    summary: language === 'English' ? 'Summary' : 'الملخص',
    description: language === 'English' ? 'Description' : 'الوصف',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    urgency: language === 'English' ? 'Urgency' : 'الاستعجال',
    impact: language === 'English' ? 'Impact' : 'التأثير',
    category: language === 'English' ? 'Category' : 'الفئة',
    status: language === 'English' ? 'Status' : 'الحالة',
    dueDate: language === 'English' ? 'Due Date' : 'تاريخ الاستحقاق',
    slaTarget: language === 'English' ? 'SLA Target (hours)' : 'هدف SLA (ساعات)',
    escalationLevel: language === 'English' ? 'Escalation Level' : 'مستوى التصعيد',
    resolution: language === 'English' ? 'Resolution' : 'الحل',
    tags: language === 'English' ? 'Tags' : 'العلامات',
    privateNotes: language === 'English' ? 'Private Notes (Staff Only)' : 'ملاحظات خاصة (للموظفين فقط)',
    timeSpent: language === 'English' ? 'Time Spent (minutes)' : 'الوقت المستغرق (دقائق)',
    
    // Placeholders
    selectEmployee: language === 'English' ? 'Select employee...' : 'اختر الموظف...',
    selectUser: language === 'English' ? 'Select user' : 'اختر المستخدم',
    selectAsset: language === 'English' ? 'Select asset' : 'اختر الأصل',
    selectRequestType: language === 'English' ? 'Select request type' : 'اختر نوع الطلب',
    selectPriority: language === 'English' ? 'Select priority' : 'اختر الأولوية',
    selectCategory: language === 'English' ? 'Select category' : 'اختر الفئة',
    briefSummary: language === 'English' ? 'Brief summary of the issue' : 'ملخص مختصر للمشكلة',
    detailedDesc: language === 'English' ? 'Detailed description of the issue' : 'وصف تفصيلي للمشكلة',
    commaSeparatedTags: language === 'English' ? 'Comma-separated tags (e.g., urgent, hardware, network)' : 'علامات مفصولة بفواصل (مثل: عاجل، أجهزة، شبكة)',
    internalNotes: language === 'English' ? 'Internal notes visible only to staff members' : 'ملاحظات داخلية مرئية للموظفين فقط',
    timeInMinutes: language === 'English' ? 'Time spent in minutes' : 'الوقت بالدقائق',
    searchEmployees: language === 'English' ? 'Search employees...' : 'البحث عن الموظفين...',
    noEmployeeFound: language === 'English' ? 'No employee found.' : 'لم يتم العثور على موظف.',
    noAsset: language === 'English' ? 'No Asset' : 'لا يوجد أصل',
    unassigned: language === 'English' ? 'Unassigned' : 'غير معين',
    noActiveEmployees: language === 'English' ? 'No active employees available' : 'لا يوجد موظفون نشطون',
    resolutionDetails: language === 'English' ? 'Resolution details' : 'تفاصيل الحل',
    
    // Options
    incident: language === 'English' ? 'Incident' : 'حادثة',
    serviceRequest: language === 'English' ? 'Service Request' : 'طلب خدمة',
    changeRequest: language === 'English' ? 'Change Request' : 'طلب تغيير',
    problem: language === 'English' ? 'Problem' : 'مشكلة',
    low: language === 'English' ? 'Low' : 'منخفض',
    medium: language === 'English' ? 'Medium' : 'متوسط',
    high: language === 'English' ? 'High' : 'عالي',
    critical: language === 'English' ? 'Critical' : 'حرج',
    open: language === 'English' ? 'Open' : 'مفتوح',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    pending: language === 'English' ? 'Pending' : 'معلق',
    resolved: language === 'English' ? 'Resolved' : 'محلول',
    closed: language === 'English' ? 'Closed' : 'مغلق',
    
    // Tabs
    details: language === 'English' ? 'Details' : 'التفاصيل',
    comments: language === 'English' ? 'Comments' : 'التعليقات',
    history: language === 'English' ? 'History' : 'التاريخ',
    attachments: language === 'English' ? 'Attachments' : 'المرفقات',
    
    // Comments section
    addComment: language === 'English' ? 'Add Comment' : 'إضافة تعليق',
    writeComment: language === 'English' ? 'Write a comment...' : 'اكتب تعليقاً...',
    privateComment: language === 'English' ? 'Private comment (visible to staff only)' : 'تعليق خاص (مرئي للموظفين فقط)',
    noComments: language === 'English' ? 'No comments yet' : 'لا توجد تعليقات بعد',
    
    // History section
    noHistory: language === 'English' ? 'No history entries' : 'لا توجد سجلات',
    changedFrom: language === 'English' ? 'changed from' : 'تغير من',
    to: language === 'English' ? 'to' : 'إلى',
    
    // Attachments section
    dropFiles: language === 'English' ? 'Drop files here or click to browse' : 'اسحب الملفات هنا أو انقر للاستعراض',
    noAttachments: language === 'English' ? 'No attachments' : 'لا توجد مرفقات',
    uploadFiles: language === 'English' ? 'Upload Files' : 'رفع الملفات',
    
    // Buttons
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    createTicketBtn: language === 'English' ? 'Create Ticket' : 'إنشاء التذكرة',
    saveChanges: language === 'English' ? 'Save Changes' : 'حفظ التغييرات',
    send: language === 'English' ? 'Send' : 'إرسال',
    
    // Messages
    ticketUpdated: language === 'English' ? 'Ticket updated successfully' : 'تم تحديث التذكرة بنجاح',
    updateFailed: language === 'English' ? 'Failed to update ticket' : 'فشل تحديث التذكرة',
    commentAdded: language === 'English' ? 'Comment added successfully' : 'تمت إضافة التعليق بنجاح',
    commentFailed: language === 'English' ? 'Failed to add comment' : 'فشل إضافة التعليق',
  };

  // Form initialization
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      submittedById: ticket?.submittedById?.toString() || user?.id?.toString() || '',
      assignedToId: ticket?.assignedToId?.toString() || '',
      relatedAssetId: ticket?.relatedAssetId?.toString() || '',
      requestType: ticket?.requestType || 'Incident',
      category: ticket?.category || 'Incident',
      priority: ticket?.priority || 'Medium',
      urgency: ticket?.urgency || 'Medium',
      impact: ticket?.impact || 'Medium',
      status: ticket?.status || 'Open',
      summary: ticket?.summary || '',
      description: ticket?.description || '',
      resolution: ticket?.resolution || '',
      dueDate: ticket?.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '',
      slaTarget: ticket?.slaTarget?.toString() || '',
      escalationLevel: ticket?.escalationLevel?.toString() || '0',
      tags: Array.isArray(ticket?.tags) ? ticket.tags.join(', ') : ticket?.tags || '',
      privateNotes: ticket?.privateNotes || '',
      timeSpent: ticket?.timeSpent?.toString() || '',
    },
  });

  // Fetch employees
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiRequest<UserResponse[]>('/api/employees'),
  });

  const activeEmployees = useMemo(() => {
    if (!employeesData || !Array.isArray(employeesData)) return [];
    return employeesData.filter(emp => emp.status === 'Active');
  }, [employeesData]);

  // Fetch assets
  const { data: assetsData, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => apiRequest<AssetResponse[]>('/api/assets'),
  });

  // Fetch request types
  const { data: requestTypes = [], isLoading: isLoadingRequestTypes } = useQuery({
    queryKey: ['custom-request-types'],
    queryFn: () => apiRequest<Array<{id: number, name: string}>>('/api/custom-request-types'),
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: () => apiRequest<Array<{id: number, name: string}>>('/api/tickets/categories'),
  });

  // Fetch comments for edit mode
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['ticket-comments', ticket?.id],
    queryFn: () => apiRequest<CommentData[]>(`/api/tickets/${ticket.id}/comments`),
    enabled: mode === 'edit' && !!ticket?.id,
  });

  // Fetch history for edit mode
  const { data: history = [] } = useQuery({
    queryKey: ['ticket-history', ticket?.id],
    queryFn: () => apiRequest<HistoryData[]>(`/api/tickets/${ticket.id}/history`),
    enabled: mode === 'edit' && !!ticket?.id,
  });

  // Update mutation for edit mode
  const updateMutation = useMutation({
    mutationFn: (data: Partial<TicketFormData>) => 
      apiRequest(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
      if (onTicketUpdate) onTicketUpdate();
      toast({
        title: t.ticketUpdated,
        description: t.ticketUpdated,
      });
    },
    onError: () => {
      toast({
        title: t.updateFailed,
        description: t.updateFailed,
        variant: 'destructive',
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (data: { ticketId: number; content: string; isPrivate: boolean }) => {
      return apiRequest('/api/tickets/comments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setCommentText('');
      setIsPrivateComment(false);
      refetchComments();
      toast({
        title: t.commentAdded,
        description: t.commentAdded,
      });
    },
    onError: () => {
      toast({
        title: t.commentFailed,
        description: t.commentFailed,
        variant: 'destructive',
      });
    },
  });

  // Auto-save for edit mode
  const handleAutoSave = (field: string, value: any) => {
    if (mode === 'edit' && ticket) {
      const updateData: any = { [field]: value };
      if (field === 'assignedToId' || field === 'relatedAssetId') {
        updateData[field] = value && value !== 'none' ? parseInt(value) : null;
      }
      updateMutation.mutate(updateData);
    }
  };

  // Watch form changes for auto-save
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

  // Form submission
  const handleFormSubmit = (data: TicketFormData) => {
    if (onSubmit) {
      const processedData = {
        ...data,
        submittedById: parseInt(data.submittedById),
        assignedToId: data.assignedToId && data.assignedToId !== 'none' ? parseInt(data.assignedToId) : null,
        relatedAssetId: data.relatedAssetId && data.relatedAssetId !== 'none' ? parseInt(data.relatedAssetId) : null,
        slaTarget: data.slaTarget ? parseInt(data.slaTarget) : null,
        escalationLevel: parseInt(data.escalationLevel || '0'),
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      onSubmit(processedData as any);
    }
  };

  // Comment submission
  const handleCommentSubmit = () => {
    if (!commentText.trim() || !ticket) return;
    
    commentMutation.mutate({
      ticketId: ticket.id,
      content: commentText,
      isPrivate: isPrivateComment,
    });
  };

  // Priority color helper
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  // Status color helper
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

  const isCreateMode = mode === 'create';
  const isEditMode = mode === 'edit';

  return (
    <div className={isCreateMode ? "space-y-6" : "pt-4"}>
      {isCreateMode ? (
        // Create Mode
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{t.basicInfo}</h3>
                <p className="text-sm text-muted-foreground">{t.basicInfoDesc}</p>
              </div>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Submitted By */}
                <FormField
                  control={form.control}
                  name="submittedById"
                  render={({ field }) => {
                    const [open, setOpen] = useState(false);
                    
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t.submittedBy} *</FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value && Array.isArray(activeEmployees)
                                  ? activeEmployees.find((employee) => employee && employee.id.toString() === field.value)?.englishName || t.selectEmployee
                                  : t.selectEmployee}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder={t.searchEmployees} />
                              <CommandEmpty>{t.noEmployeeFound}</CommandEmpty>
                              <CommandGroup>
                                {activeEmployees?.map((employee) => (
                                  <CommandItem
                                    key={employee.id}
                                    value={employee.englishName}
                                    onSelect={() => {
                                      form.setValue("submittedById", employee.id.toString());
                                      setOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === employee.id.toString() ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {employee.englishName}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Assigned To */}
                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.assignedTo}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectUser} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t.unassigned}</SelectItem>
                          {activeEmployees?.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.englishName}
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
                      <FormLabel>{t.relatedAsset}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectAsset} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t.noAsset}</SelectItem>
                          {assetsData?.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id.toString()}>
                              {asset.name} ({asset.assetId})
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
                      <FormLabel>{t.requestType} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectRequestType} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Incident">{t.incident}</SelectItem>
                          <SelectItem value="Service Request">{t.serviceRequest}</SelectItem>
                          <SelectItem value="Change Request">{t.changeRequest}</SelectItem>
                          <SelectItem value="Problem">{t.problem}</SelectItem>
                          {requestTypes?.map((type) => (
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
              </div>
            </div>

            {/* Ticket Details Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{t.ticketDetails}</h3>
                <p className="text-sm text-muted-foreground">{t.ticketDetailsDesc}</p>
              </div>
              <Separator />
              
              {/* Summary */}
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.summary} *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.briefSummary} />
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
                    <FormLabel>{t.description} *</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t.detailedDesc} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Priority & Classification Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{t.priorityClass}</h3>
                <p className="text-sm text-muted-foreground">{t.priorityClassDesc}</p>
              </div>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Priority */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.priority} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectPriority} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">{t.low}</SelectItem>
                          <SelectItem value="Medium">{t.medium}</SelectItem>
                          <SelectItem value="High">{t.high}</SelectItem>
                          <SelectItem value="Critical">{t.critical}</SelectItem>
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
                      <FormLabel>{t.urgency}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">{t.low}</SelectItem>
                          <SelectItem value="Medium">{t.medium}</SelectItem>
                          <SelectItem value="High">{t.high}</SelectItem>
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
                      <FormLabel>{t.impact}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">{t.low}</SelectItem>
                          <SelectItem value="Medium">{t.medium}</SelectItem>
                          <SelectItem value="High">{t.high}</SelectItem>
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
                      <FormLabel>{t.category}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectCategory} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Incident">{t.incident}</SelectItem>
                          <SelectItem value="Service Request">{t.serviceRequest}</SelectItem>
                          <SelectItem value="Change Request">{t.changeRequest}</SelectItem>
                          <SelectItem value="Problem">{t.problem}</SelectItem>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
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
                      <FormLabel>{t.status}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Open">{t.open}</SelectItem>
                          <SelectItem value="In Progress">{t.inProgress}</SelectItem>
                          <SelectItem value="Pending">{t.pending}</SelectItem>
                          <SelectItem value="Resolved">{t.resolved}</SelectItem>
                          <SelectItem value="Closed">{t.closed}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.dueDate}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{t.additionalInfo}</h3>
                <p className="text-sm text-muted-foreground">{t.additionalInfoDesc}</p>
              </div>
              <Separator />
              
              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.tags}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.commaSeparatedTags} />
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
                    <FormLabel>{t.privateNotes}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t.internalNotes} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Spent */}
              <FormField
                control={form.control}
                name="timeSpent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.timeSpent}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder={t.timeInMinutes} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  <X className="h-4 w-4 mr-2" />
                  {t.cancel}
                </Button>
              )}
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                {t.createTicketBtn}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        // Edit Mode
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              {t.details}
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t.comments} ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t.history} ({history.length})
            </TabsTrigger>
            <TabsTrigger value="attachments" className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              {t.attachments}
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] mt-4">
            {/* Details Tab */}
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
                      {autoSaving && (
                        <Badge variant="secondary" className="animate-pulse">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Saving...
                        </Badge>
                      )}
                      <Badge variant={getPriorityColor(ticket?.priority)}>
                        {ticket?.priority}
                      </Badge>
                      <Badge variant={getStatusColor(ticket?.status)}>
                        {ticket?.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Ticket Information Section */}
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold">{t.ticketInfo}</h4>
                    <p className="text-sm text-gray-600">{t.clickToEdit}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* All edit mode fields */}
                      <FormField
                        control={form.control}
                        name="submittedById"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.submittedBy} *</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); handleAutoSave('submittedById', value); }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t.selectUser} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingEmployees ? (
                                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                                ) : activeEmployees.length === 0 ? (
                                  <SelectItem value="no-active" disabled>{t.noActiveEmployees}</SelectItem>
                                ) : (
                                  activeEmployees.map((employee) => (
                                    <SelectItem key={employee.id} value={employee.id.toString()}>
                                      {employee.englishName}
                                    </SelectItem>
                                  ))
                                )}
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
                            <FormLabel>{t.assignedTo}</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); handleAutoSave('assignedToId', value); }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t.selectUser} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">{t.unassigned}</SelectItem>
                                {activeEmployees?.map((employee) => (
                                  <SelectItem key={employee.id} value={employee.id.toString()}>
                                    {employee.englishName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="relatedAssetId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.relatedAsset}</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); handleAutoSave('relatedAssetId', value); }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t.selectAsset} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">{t.noAsset}</SelectItem>
                                {assetsData?.map((asset) => (
                                  <SelectItem key={asset.id} value={asset.id.toString()}>
                                    {asset.name} ({asset.assetId})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requestType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.requestType} *</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); handleAutoSave('requestType', value); }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t.selectRequestType} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Incident">{t.incident}</SelectItem>
                                <SelectItem value="Service Request">{t.serviceRequest}</SelectItem>
                                <SelectItem value="Change Request">{t.changeRequest}</SelectItem>
                                <SelectItem value="Problem">{t.problem}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.priority} *</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); handleAutoSave('priority', value); }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Low">{t.low}</SelectItem>
                                <SelectItem value="Medium">{t.medium}</SelectItem>
                                <SelectItem value="High">{t.high}</SelectItem>
                                <SelectItem value="Critical">{t.critical}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.status}</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); handleAutoSave('status', value); }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Open">{t.open}</SelectItem>
                                <SelectItem value="In Progress">{t.inProgress}</SelectItem>
                                <SelectItem value="Pending">{t.pending}</SelectItem>
                                <SelectItem value="Resolved">{t.resolved}</SelectItem>
                                <SelectItem value="Closed">{t.closed}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.summary} *</FormLabel>
                          <FormControl>
                            <Input {...field} onBlur={() => handleAutoSave('summary', field.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.description} *</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} onBlur={() => handleAutoSave('description', field.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="resolution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.resolution}</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder={t.resolutionDetails} rows={3} onBlur={() => handleAutoSave('resolution', field.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Form>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              <div className="space-y-4">
                {/* Add Comment Section */}
                <div className="space-y-2">
                  <Label>{t.addComment}</Label>
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t.writeComment}
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isPrivateComment}
                        onChange={(e) => setIsPrivateComment(e.target.checked)}
                      />
                      <span className="text-sm">{t.privateComment}</span>
                    </label>
                    <Button onClick={handleCommentSubmit} disabled={!commentText.trim() || commentMutation.isPending}>
                      <Send className="h-4 w-4 mr-2" />
                      {t.send}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Comments List */}
                <ScrollArea className="h-[300px]">
                  {comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{t.noComments}</p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium text-sm">
                                {comment.user?.englishName || comment.user?.username || 'Unknown'}
                              </span>
                              {comment.isPrivate && (
                                <Badge variant="secondary" className="text-xs">Private</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className="mt-2 text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {history.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">{t.noHistory}</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {entry.user?.englishName || entry.user?.username || 'System'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm">
                            {entry.fieldChanged && (
                              <>
                                <span className="font-medium">{entry.fieldChanged}</span>
                                {entry.oldValue && entry.newValue && (
                                  <>
                                    {' '}{t.changedFrom} <span className="text-muted-foreground">{entry.oldValue}</span>
                                    {' '}{t.to} <span className="font-medium">{entry.newValue}</span>
                                  </>
                                )}
                              </>
                            )}
                            {entry.changeDescription && (
                              <span>{entry.changeDescription}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="space-y-4">
              <div className="space-y-4">
                {/* Upload Section */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t.dropFiles}</p>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles(files);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    {t.uploadFiles}
                  </Button>
                </div>

                {/* Attachments List */}
                <div className="space-y-2">
                  {selectedFiles.length === 0 && (!ticket?.attachments || ticket.attachments.length === 0) ? (
                    <p className="text-center text-muted-foreground py-4">{t.noAttachments}</p>
                  ) : (
                    <>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(2)} KB)</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}