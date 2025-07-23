import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  AlertCircle, Edit3, Save, X, Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

interface AssetResponse {
  id: number;
  assetId: string;
  type: string;
  brand: string;
  model: string;
  status: string;
  assignedToEmployee?: number;
}

// Form validation schema
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
  
  const [autoSaving, setAutoSaving] = useState(false);
  const isCreateMode = mode === 'create';

  // Fetch data
  const { data: users = [] } = useQuery<UserResponse[]>({ queryKey: ['/api/users'] });
  const { data: assets = [] } = useQuery<AssetResponse[]>({ queryKey: ['/api/assets'] });
  const { data: requestTypes = [] } = useQuery<Array<{id: number, name: string}>>({ queryKey: ['/api/custom-request-types'] });
  
  // Form setup
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      submittedById: ticket?.submittedById?.toString() || user?.employeeId?.toString() || '',
      assignedToId: ticket?.assignedToId?.toString() || 'unassigned',
      relatedAssetId: ticket?.relatedAssetId?.toString() || 'none',
      requestType: ticket?.requestType || '',
      category: ticket?.category || 'Incident',
      priority: ticket?.priority || 'Medium',
      urgency: ticket?.urgency || 'Medium',
      impact: ticket?.impact || 'Medium',
      status: ticket?.status || 'Open',
      summary: ticket?.summary || '',
      description: ticket?.description || '',
      rootCause: ticket?.rootCause || '',
      workaround: ticket?.workaround || '',
      resolution: ticket?.resolution || '',
      resolutionNotes: ticket?.resolutionNotes || '',
      dueDate: ticket?.dueDate || '',
      slaTarget: ticket?.slaTarget || '',
      escalationLevel: ticket?.escalationLevel || '0',
      tags: ticket?.tags || '',
      privateNotes: ticket?.privateNotes || '',
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: TicketFormData) => {
      // Convert special values back to empty strings for API
      const apiData = {
        ...data,
        assignedToId: data.assignedToId === 'unassigned' ? '' : data.assignedToId,
        relatedAssetId: data.relatedAssetId === 'none' ? '' : data.relatedAssetId,
      };
      return apiRequest(`/api/tickets`, 'POST', apiData);
    },
    onSuccess: (result) => {
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: language === 'English' ? 'Ticket created successfully' : 'تم إنشاء التذكرة بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to create ticket' : 'فشل في إنشاء التذكرة'),
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: TicketFormData) => {
      // Convert special values back to empty strings for API
      const apiData = {
        ...data,
        assignedToId: data.assignedToId === 'unassigned' ? '' : data.assignedToId,
        relatedAssetId: data.relatedAssetId === 'none' ? '' : data.relatedAssetId,
      };
      return apiRequest(`/api/tickets/${ticket?.id}`, 'PUT', apiData);
    },
    onSuccess: (result) => {
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: language === 'English' ? 'Ticket updated successfully' : 'تم تحديث التذكرة بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      if (onTicketUpdate) onTicketUpdate(result);
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to update ticket' : 'فشل في تحديث التذكرة'),
        variant: 'destructive',
      });
    },
  });

  const handleFormSubmit = (data: TicketFormData) => {
    if (isCreateMode) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
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
            : (language === 'English' ? 'Edit ticket details and click Update to save changes' : 'عدّل تفاصيل التذكرة واضغط تحديث لحفظ التغييرات')
          }
        </p>
      </div>

      {/* Single comprehensive form for both create and edit modes */}
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
                          <SelectValue placeholder={language === 'English' ? 'Select assignee (optional)' : 'اختر المكلف (اختياري)'} />
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
                    <FormLabel>{language === 'English' ? 'Related Asset' : 'الأصول ذات الصلة'}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'English' ? 'Select asset (optional)' : 'اختر الأصل (اختياري)'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{language === 'English' ? 'No asset' : 'لا يوجد أصل'}</SelectItem>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id.toString()}>
                            {asset.assetId} - {asset.type} ({asset.brand} {asset.model})
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
                        placeholder={language === 'English' ? 'Brief summary of the ticket' : 'ملخص مختصر للتذكرة'}
                        maxLength={200}
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
                        placeholder={language === 'English' ? 'Detailed description of the issue or request' : 'وصف مفصل للمشكلة أو الطلب'}
                        rows={4}
                        maxLength={2000}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Priority & Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'English' ? 'Priority & Status' : 'الأولوية والحالة'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          <SelectValue placeholder={language === 'English' ? 'Select status' : 'اختر الحالة'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Open">{language === 'English' ? 'Open' : 'مفتوح'}</SelectItem>
                        <SelectItem value="In Progress">{language === 'English' ? 'In Progress' : 'قيد التنفيذ'}</SelectItem>
                        <SelectItem value="Waiting">{language === 'English' ? 'Waiting' : 'في الانتظار'}</SelectItem>
                        <SelectItem value="Closed">{language === 'English' ? 'Closed' : 'مغلق'}</SelectItem>
                        <SelectItem value="Resolved">{language === 'English' ? 'Resolved' : 'محلول'}</SelectItem>
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
                          <SelectValue placeholder={language === 'English' ? 'Select category' : 'اختر الفئة'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Incident">{language === 'English' ? 'Incident' : 'حادث'}</SelectItem>
                        <SelectItem value="Request">{language === 'English' ? 'Request' : 'طلب'}</SelectItem>
                        <SelectItem value="Change">{language === 'English' ? 'Change' : 'تغيير'}</SelectItem>
                        <SelectItem value="Problem">{language === 'English' ? 'Problem' : 'مشكلة'}</SelectItem>
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
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                <X className="h-4 w-4 mr-2" />
                {language === 'English' ? 'Cancel' : 'إلغاء'}
              </Button>
            )}
            
            <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              {isCreateMode 
                ? (language === 'English' ? 'Create Ticket' : 'إنشاء التذكرة')
                : (language === 'English' ? 'Update Ticket' : 'تحديث التذكرة')
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}