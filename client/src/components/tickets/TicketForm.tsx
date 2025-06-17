import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Loader2 } from 'lucide-react';

// Define the form schema with more flexible validation
const ticketFormSchema = z.object({
  submittedById: z.string()
    .min(1, { message: "Please select who is submitting this ticket" })
    .transform(val => Number(val)),
  relatedAssetId: z.string()
    .optional()
    .transform(val => val ? Number(val) : undefined),
  requestType: z.string({
    required_error: "Please select a request type",
  }),
  priority: z.string({
    required_error: "Please select a priority",
  }),
  description: z.string()
    .min(5, { message: "Description must be at least 5 characters" })
    .max(2000, { message: "Description cannot exceed 2000 characters" }),
});

// Define props for the component
interface TicketFormProps {
  onSubmit: (data: z.infer<typeof ticketFormSchema>) => void;
  isSubmitting: boolean;
  employees: any[];
  assets: any[];
  initialData?: z.infer<typeof ticketFormSchema>;
}

export default function TicketForm({
  onSubmit,
  isSubmitting,
  employees,
  assets,
  initialData
}: TicketFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();

  // Fetch custom request types
  const { data: requestTypes = [] } = useQuery({
    queryKey: ['/api/request-types'],
    enabled: true
  });

  // Translations
  const translations = {
    submitter: language === 'English' ? 'Submitted By' : 'مقدم من',
    selectEmployee: language === 'English' ? 'Select employee' : 'اختر الموظف',
    relatedAsset: language === 'English' ? 'Related Asset (Optional)' : 'الأصل المرتبط (اختياري)',
    selectAsset: language === 'English' ? 'Select asset' : 'اختر الأصل',
    none: language === 'English' ? 'None' : 'لا يوجد',
    requestType: language === 'English' ? 'Request Type' : 'نوع الطلب',
    selectRequestType: language === 'English' ? 'Select request type' : 'اختر نوع الطلب',
    hardware: language === 'English' ? 'Hardware' : 'أجهزة',
    software: language === 'English' ? 'Software' : 'برمجيات',
    network: language === 'English' ? 'Network' : 'شبكة',
    other: language === 'English' ? 'Other' : 'أخرى',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    selectPriority: language === 'English' ? 'Select priority' : 'اختر الأولوية',
    low: language === 'English' ? 'Low' : 'منخفض',
    medium: language === 'English' ? 'Medium' : 'متوسط',
    high: language === 'English' ? 'High' : 'مرتفع',
    description: language === 'English' ? 'Description' : 'الوصف',
    descriptionPlaceholder: language === 'English' 
      ? 'Describe the issue in detail...'
      : 'وصف المشكلة بالتفصيل...',
    submit: language === 'English' ? 'Submit Ticket' : 'إرسال التذكرة',
    submitting: language === 'English' ? 'Submitting...' : 'جاري الإرسال...',
  };

  // Create form with validation
  const form = useForm<z.infer<typeof ticketFormSchema>>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: initialData || {
      submittedById: '',
      relatedAssetId: undefined,
      requestType: undefined,
      priority: undefined,
      description: '',
    },
  });

  // Filter employees that the current user has access to
  const userAccessLevel = user ? parseInt(user.accessLevel) : 0;
  
  // Get user-specific or all employees based on access level
  const filteredEmployees = userAccessLevel >= 2 
    ? employees 
    : employees.filter(emp => emp.userId === user?.id);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="submittedById"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.submitter}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value ? field.value.toString() : undefined}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.selectEmployee} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.englishName} - {employee.department}
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
              <FormLabel>{translations.relatedAsset}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value?.toString()}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.selectAsset} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{translations.none}</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id.toString()}>
                      {asset.name} - {asset.assetId} ({asset.type})
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
              <FormLabel>{translations.requestType}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
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

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.priority}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.description}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={translations.descriptionPlaceholder}
                  disabled={isSubmitting}
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {translations.submitting}
            </>
          ) : (
            translations.submit
          )}
        </Button>
      </form>
    </Form>
  );
}