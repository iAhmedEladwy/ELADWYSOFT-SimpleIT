import { useState, useMemo } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { UserResponse, AssetResponse } from '@shared/types';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Loader2, Clock, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Unified form schema supporting both create and update operations
const unifiedTicketFormSchema = z.object({
  submittedById: z.string()
    .min(1, { message: "Please select who is submitting this ticket" })
    .transform(val => Number(val)),
  assignedToId: z.string()
    .optional()
    .transform(val => val && val !== '' ? Number(val) : undefined),
  relatedAssetId: z.string()
    .optional()
    .transform(val => val && val !== '' ? Number(val) : undefined),
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
  dueDate: z.string().optional(),
  slaTarget: z.string().optional(),
  timeSpent: z.string().optional().transform(val => val ? Number(val) : 0),
  workaround: z.string().optional(),
  rootCause: z.string().optional(),
});

type UnifiedTicketFormData = z.infer<typeof unifiedTicketFormSchema>;

interface UnifiedTicketFormProps {
  ticket?: any; // If provided, this is edit mode
  onSubmit: (data: UnifiedTicketFormData) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
}

export default function UnifiedTicketForm({
  ticket,
  onSubmit,
  onCancel,
  isSubmitting,
  mode
}: UnifiedTicketFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();

  // Fetch required data
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 10,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    staleTime: 1000 * 60 * 10,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['/api/assets'],
    staleTime: 1000 * 60 * 10,
  });

  // Fetch custom request types from system config
  const { data: requestTypes = [] } = useQuery({
    queryKey: ['/api/custom-request-types'],
    staleTime: 1000 * 60 * 5,
  });



  // Translations
  const translations = {
    submitter: language === 'English' ? 'Submitted By' : 'مقدم من',
    selectEmployee: language === 'English' ? 'Select employee' : 'اختر الموظف',
    assignedTo: language === 'English' ? 'Assigned To' : 'مكلف إلى',
    selectUser: language === 'English' ? 'Select user' : 'اختر المستخدم',
    unassigned: language === 'English' ? 'Unassigned' : 'غير معين',
    relatedAsset: language === 'English' ? 'Related Asset (Optional)' : 'الأصل المرتبط (اختياري)',
    selectAsset: language === 'English' ? 'Select asset' : 'اختر الأصل',
    none: language === 'English' ? 'None' : 'لا يوجد',
    requestType: language === 'English' ? 'Request Type' : 'نوع الطلب',
    selectRequestType: language === 'English' ? 'Select request type' : 'اختر نوع الطلب',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    selectPriority: language === 'English' ? 'Select priority' : 'اختر الأولوية',
    status: language === 'English' ? 'Status' : 'الحالة',
    selectStatus: language === 'English' ? 'Select status' : 'اختر الحالة',
    low: language === 'English' ? 'Low' : 'منخفض',
    medium: language === 'English' ? 'Medium' : 'متوسط',
    high: language === 'English' ? 'High' : 'مرتفع',
    open: language === 'English' ? 'Open' : 'مفتوح',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    resolved: language === 'English' ? 'Resolved' : 'محلول',
    closed: language === 'English' ? 'Closed' : 'مغلق',
    summary: language === 'English' ? 'Summary' : 'الملخص',
    summaryPlaceholder: language === 'English' 
      ? 'Brief summary of the issue...'
      : 'ملخص موجز للمشكلة...',
    description: language === 'English' ? 'Description' : 'الوصف',
    descriptionPlaceholder: language === 'English' 
      ? 'Detailed description of the issue, steps to reproduce, error messages, etc.'
      : 'وصف تفصيلي للمشكلة، خطوات إعادة الإنتاج، رسائل الخطأ، إلخ.',
    dueDate: language === 'English' ? 'Due Date (Optional)' : 'تاريخ الاستحقاق (اختياري)',
    slaTarget: language === 'English' ? 'SLA Target Hours (Optional)' : 'هدف اتفاقية مستوى الخدمة بالساعات (اختياري)',
    timeSpent: language === 'English' ? 'Time Spent (minutes)' : 'الوقت المستغرق (بالدقائق)',
    workaround: language === 'English' ? 'Workaround (Optional)' : 'حل مؤقت (اختياري)',
    rootCause: language === 'English' ? 'Root Cause (Optional)' : 'السبب الجذري (اختياري)',
    createTicket: language === 'English' ? 'Create Ticket' : 'إنشاء تذكرة',
    updateTicket: language === 'English' ? 'Update Ticket' : 'تحديث التذكرة',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    saving: language === 'English' ? 'Saving...' : 'جارٍ الحفظ...',
    updating: language === 'English' ? 'Updating...' : 'جارٍ التحديث...',
  };

  const form = useForm<UnifiedTicketFormData>({
    resolver: zodResolver(unifiedTicketFormSchema),
    defaultValues: {
      submittedById: ticket?.submittedById?.toString() || user?.employeeId?.toString() || '',
      assignedToId: ticket?.assignedToId?.toString() || '',
      relatedAssetId: ticket?.relatedAssetId?.toString() || '',
      requestType: ticket?.requestType || '',
      priority: ticket?.priority || 'Medium',
      status: ticket?.status || 'Open',
      summary: ticket?.summary || '',
      description: ticket?.description || '',
      dueDate: ticket?.dueDate ? new Date(ticket.dueDate).toISOString().slice(0, 16) : '',
      slaTarget: ticket?.slaTarget?.toString() || '',
      timeSpent: ticket?.timeSpent?.toString() || '0',
      workaround: ticket?.workaround || '',
      rootCause: ticket?.rootCause || '',
    },
  });

  // Filter assets based on selected employee (submitter)
  const submittedById = form.watch('submittedById');
  const filteredAssets = useMemo(() => {
    if (!assets || !submittedById) {
      return assets || [];
    }
    
    // Show only assets assigned to the selected employee (submitter)
    return assets.filter((asset: any) => {
      // Check if asset is assigned to the selected employee
      return asset.assignedEmployeeId && asset.assignedEmployeeId.toString() === submittedById;
    });
  }, [assets, submittedById]);

  const handleSubmit = (data: UnifiedTicketFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submitted By */}
          <FormField
            control={form.control}
            name="submittedById"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.submitter} *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.selectEmployee} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name || `${employee.firstName} ${employee.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Assigned To (Users only) */}
          <FormField
            control={form.control}
            name="assignedToId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.assignedTo}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'unassigned'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.selectUser} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">{translations.unassigned}</SelectItem>
                    {users.map((user: UserResponse) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.username}
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
                <FormLabel>{translations.relatedAsset}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.selectAsset} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">{translations.none}</SelectItem>
                    {filteredAssets.map((asset: any) => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        {asset.assetId} - {asset.type} ({asset.brand})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Request Type (from system config) */}
          <FormField
            control={form.control}
            name="requestType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.requestType} *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.selectRequestType} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {requestTypes.map((type: any) => (
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

          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.priority} *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.selectPriority} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Low">{translations.low}</SelectItem>
                    <SelectItem value="Medium">{translations.medium}</SelectItem>
                    <SelectItem value="High">{translations.high}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status (only in edit mode) */}
          {mode === 'edit' && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.status}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={translations.selectStatus} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Open">{translations.open}</SelectItem>
                      <SelectItem value="In Progress">{translations.inProgress}</SelectItem>
                      <SelectItem value="Resolved">{translations.resolved}</SelectItem>
                      <SelectItem value="Closed">{translations.closed}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Due Date */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.dueDate}</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SLA Target */}
          <FormField
            control={form.control}
            name="slaTarget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.slaTarget}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="24"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Spent (Manual Input) */}
          {mode === 'edit' && (
            <FormField
              control={form.control}
              name="timeSpent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Clock className="inline h-4 w-4 mr-1" />
                    {translations.timeSpent}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      {...field}
                      value={field.value || '0'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Summary */}
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.summary} *</FormLabel>
              <FormControl>
                <Input {...field} placeholder={translations.summaryPlaceholder} />
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
              <FormLabel>{translations.description} *</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder={translations.descriptionPlaceholder}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Workaround (edit mode only) */}
        {mode === 'edit' && (
          <FormField
            control={form.control}
            name="workaround"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.workaround}</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Temporary solution or workaround..."
                    rows={2}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Root Cause (edit mode only) */}
        {mode === 'edit' && (
          <FormField
            control={form.control}
            name="rootCause"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.rootCause}</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Root cause analysis..."
                    rows={2}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              {translations.cancel}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? translations.saving : translations.updating}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === 'create' ? translations.createTicket : translations.updateTicket}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}