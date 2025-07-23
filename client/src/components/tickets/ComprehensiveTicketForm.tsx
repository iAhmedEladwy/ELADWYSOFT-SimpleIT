import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { UserResponse, AssetResponse } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, X, Edit3, Clock, User, MessageSquare, AlertCircle } from 'lucide-react';

// Comprehensive form schema supporting all ticket operations
const comprehensiveTicketSchema = z.object({
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

type ComprehensiveTicketFormData = z.infer<typeof comprehensiveTicketSchema>;

interface ComprehensiveTicketFormProps {
  ticket?: any; // If provided, this is edit mode
  mode: 'create' | 'edit';
  onSubmit?: (data: ComprehensiveTicketFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ComprehensiveTicketForm({
  ticket,
  mode,
  onSubmit,
  onCancel,
  isSubmitting = false,
  open = true,
  onOpenChange
}: ComprehensiveTicketFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);

  // Fetch data
  const { data: users = [] } = useQuery<UserResponse[]>({ queryKey: ['/api/users'] });
  const { data: assets = [] } = useQuery<AssetResponse[]>({ queryKey: ['/api/assets'] });
  const { data: requestTypes = [] } = useQuery<Array<{id: number, name: string}>>({ queryKey: ['/api/custom-request-types'] });

  // Auto-save mutation for edit mode
  const autoSaveMutation = useMutation({
    mutationFn: async (updateData: Partial<ComprehensiveTicketFormData>) => {
      if (mode === 'edit' && ticket) {
        return await apiRequest(`/api/tickets/${ticket.id}`, 'PATCH', updateData);
      }
      throw new Error('Auto-save only available in edit mode');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
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

  // Form setup with default values
  const form = useForm<ComprehensiveTicketFormData>({
    resolver: zodResolver(comprehensiveTicketSchema),
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

  // Handle field click for inline editing
  const handleFieldClick = (fieldName: string) => {
    if (mode === 'edit') {
      setEditingField(fieldName);
    }
  };

  // Handle field blur for auto-save
  const handleFieldBlur = (fieldName: string) => {
    setEditingField(null);
    if (mode === 'edit') {
      const value = form.getValues(fieldName as any);
      handleAutoSave(fieldName, value);
    }
  };

  // Form submission for create mode
  const handleFormSubmit = (data: ComprehensiveTicketFormData) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  // Get asset display name
  const getAssetDisplayName = (assetId: number | string) => {
    const asset = assets.find(a => a.id === Number(assetId));
    return asset ? `${asset.assetId} - ${asset.name}` : assetId;
  };

  // Get user display name  
  const getUserDisplayName = (userId: number | string) => {
    const user = users.find(u => u.id === Number(userId));
    return user ? user.username : userId;
  };

  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCreateMode ? (
              <>
                <AlertCircle className="h-5 w-5 text-blue-500" />
                {language === 'ar' ? 'إنشاء تذكرة جديدة' : 'Create New Ticket'}
              </>
            ) : (
              <>
                <Edit3 className="h-5 w-5 text-green-500" />
                {language === 'ar' ? `تعديل التذكرة #${ticket?.ticketId}` : `Edit Ticket #${ticket?.ticketId}`}
              </>
            )}
            {autoSaving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? (language === 'ar' ? 'املأ جميع الحقول المطلوبة لإنشاء تذكرة جديدة' : 'Fill in all required fields to create a new ticket')
              : (language === 'ar' ? 'انقر على أي حقل لتعديله. التغييرات محفوظة تلقائياً' : 'Click any field to edit it. Changes are auto-saved')
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ticket ID (Read-only for edit mode) */}
                {isEditMode && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'ar' ? 'رقم التذكرة' : 'Ticket ID'}
                    </label>
                    <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-700">
                      #{ticket?.ticketId}
                    </div>
                  </div>
                )}

                {/* Submitted By */}
                <FormField
                  control={form.control}
                  name="submittedById"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === 'ar' ? 'مقدم الطلب' : 'Submitted By'} *
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isEditMode && editingField !== 'submittedById'}
                        onOpenChange={(open) => !open && handleFieldBlur('submittedById')}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={isEditMode ? "cursor-pointer hover:bg-gray-50" : ""}
                            onClick={() => handleFieldClick('submittedById')}
                          >
                            <SelectValue placeholder={language === 'ar' ? 'اختر المستخدم' : 'Select user'} />
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
                      <FormLabel>
                        {language === 'ar' ? 'مسند إلى' : 'Assigned To'}
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isEditMode && editingField !== 'assignedToId'}
                        onOpenChange={(open) => !open && handleFieldBlur('assignedToId')}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={isEditMode ? "cursor-pointer hover:bg-gray-50" : ""}
                            onClick={() => handleFieldClick('assignedToId')}
                          >
                            <SelectValue placeholder={language === 'ar' ? 'غير مسند' : 'Unassigned'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            {language === 'ar' ? 'غير مسند' : 'Unassigned'}
                          </SelectItem>
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
                      <FormLabel>
                        {language === 'ar' ? 'الأصل المرتبط' : 'Related Asset'}
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isEditMode && editingField !== 'relatedAssetId'}
                        onOpenChange={(open) => !open && handleFieldBlur('relatedAssetId')}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={isEditMode ? "cursor-pointer hover:bg-gray-50" : ""}
                            onClick={() => handleFieldClick('relatedAssetId')}
                          >
                            <SelectValue placeholder={language === 'ar' ? 'لا يوجد أصل' : 'No asset'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            {language === 'ar' ? 'لا يوجد أصل' : 'No asset'}
                          </SelectItem>
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
                      <FormLabel>
                        {language === 'ar' ? 'نوع الطلب' : 'Request Type'} *
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isEditMode && editingField !== 'requestType'}
                        onOpenChange={(open) => !open && handleFieldBlur('requestType')}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={isEditMode ? "cursor-pointer hover:bg-gray-50" : ""}
                            onClick={() => handleFieldClick('requestType')}
                          >
                            <SelectValue placeholder={language === 'ar' ? 'اختر نوع الطلب' : 'Select request type'} />
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

            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'ar' ? 'تفاصيل التذكرة' : 'Ticket Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === 'ar' ? 'الملخص' : 'Summary'} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={language === 'ar' ? 'ملخص مختصر للمشكلة' : 'Brief summary of the issue'}
                          className={isEditMode ? "cursor-pointer hover:bg-gray-50" : ""}
                          onClick={() => handleFieldClick('summary')}
                          onBlur={() => handleFieldBlur('summary')}
                          disabled={isEditMode && editingField !== 'summary' && editingField !== null}
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
                      <FormLabel>
                        {language === 'ar' ? 'الوصف' : 'Description'} *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={language === 'ar' ? 'وصف تفصيلي للمشكلة' : 'Detailed description of the issue'}
                          rows={4}
                          className={isEditMode ? "cursor-pointer hover:bg-gray-50" : ""}
                          onClick={() => handleFieldClick('description')}
                          onBlur={() => handleFieldBlur('description')}
                          disabled={isEditMode && editingField !== 'description' && editingField !== null}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Priority & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'ar' ? 'الأولوية والحالة' : 'Priority & Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Priority */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === 'ar' ? 'الأولوية' : 'Priority'} *
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isEditMode && editingField !== 'priority'}
                        onOpenChange={(open) => !open && handleFieldBlur('priority')}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={isEditMode ? "cursor-pointer hover:bg-gray-50" : ""}
                            onClick={() => handleFieldClick('priority')}
                          >
                            <SelectValue placeholder={language === 'ar' ? 'اختر الأولوية' : 'Select priority'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">
                            {language === 'ar' ? 'منخفضة' : 'Low'}
                          </SelectItem>
                          <SelectItem value="Medium">
                            {language === 'ar' ? 'متوسطة' : 'Medium'}
                          </SelectItem>
                          <SelectItem value="High">
                            {language === 'ar' ? 'عالية' : 'High'}
                          </SelectItem>
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
                      <FormLabel>
                        {language === 'ar' ? 'الحالة' : 'Status'}
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isEditMode && editingField !== 'status'}
                        onOpenChange={(open) => !open && handleFieldBlur('status')}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={isEditMode ? "cursor-pointer hover:bg-gray-50" : ""}
                            onClick={() => handleFieldClick('status')}
                          >
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

                {/* Time Spent */}
                {isEditMode && (
                  <FormField
                    control={form.control}
                    name="timeSpent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === 'ar' ? 'الوقت المستغرق (دقائق)' : 'Time Spent (minutes)'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            className={isEditMode ? "cursor-pointer hover:bg-gray-50" : ""}
                            onClick={() => handleFieldClick('timeSpent')}
                            onBlur={() => handleFieldBlur('timeSpent')}
                            disabled={isEditMode && editingField !== 'timeSpent' && editingField !== null}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Additional Fields for Edit Mode */}
            {isEditMode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? 'تفاصيل إضافية' : 'Additional Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Workaround */}
                  <FormField
                    control={form.control}
                    name="workaround"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === 'ar' ? 'الحل المؤقت' : 'Workaround'}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={2}
                            placeholder={language === 'ar' ? 'الحل المؤقت المطبق' : 'Temporary solution applied'}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleFieldClick('workaround')}
                            onBlur={() => handleFieldBlur('workaround')}
                            disabled={editingField !== 'workaround' && editingField !== null}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Root Cause */}
                  <FormField
                    control={form.control}
                    name="rootCause"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === 'ar' ? 'السبب الجذري' : 'Root Cause'}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={2}
                            placeholder={language === 'ar' ? 'السبب الجذري للمشكلة' : 'Root cause of the issue'}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleFieldClick('rootCause')}
                            onBlur={() => handleFieldBlur('rootCause')}
                            disabled={editingField !== 'rootCause' && editingField !== null}
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
                        <FormLabel>
                          {language === 'ar' ? 'الحل' : 'Resolution'}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={2}
                            placeholder={language === 'ar' ? 'الحل النهائي المطبق' : 'Final solution applied'}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleFieldClick('resolution')}
                            onBlur={() => handleFieldBlur('resolution')}
                            disabled={editingField !== 'resolution' && editingField !== null}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              )}
              
              {isCreateMode && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'إنشاء التذكرة' : 'Create Ticket'}
                </Button>
              )}

              {isEditMode && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {autoSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {language === 'ar' ? 'جاري الحفظ...' : 'Auto-saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {language === 'ar' ? 'محفوظ تلقائياً' : 'Auto-saved'}
                    </>
                  )}
                </div>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}