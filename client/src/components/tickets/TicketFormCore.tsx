import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/hooks/use-language';
import { useTicketTranslations } from '@/lib/translations/tickets';
import { calculatePriority } from '@/lib/utils/ticketUtils';
import type { TicketCreateRequest, TicketUpdateRequest, TicketResponse } from '@shared/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Save, Loader2 } from 'lucide-react';

// v0.4.0 Simplified Ticket Schema Validation
const ticketFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['Incident', 'Service Request', 'Problem', 'Change']),
  category: z.enum(['Hardware', 'Software', 'Network', 'Access', 'Other']),
  urgency: z.enum(['Low', 'Medium', 'High', 'Critical']),
  impact: z.enum(['Low', 'Medium', 'High', 'Critical']),
  submittedById: z.number(),
  assignedToId: z.number().optional(),
  relatedAssetId: z.number().optional(),
  resolution: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketFormCoreProps {
  ticket?: TicketResponse;
  onSubmit: (data: TicketCreateRequest | TicketUpdateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export default function TicketFormCore({
  ticket,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create'
}: TicketFormCoreProps) {
  const { language } = useLanguage();
  const t = useTicketTranslations(language);
  const [calculatedPriority, setCalculatedPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: ticket?.title || '',
      description: ticket?.description || '',
      type: ticket?.type || 'Incident',
      category: ticket?.category || 'Other',
      urgency: ticket?.urgency || 'Medium',
      impact: ticket?.impact || 'Medium',
      submittedById: ticket?.submittedById || 0,
      assignedToId: ticket?.assignedToId || undefined,
      relatedAssetId: ticket?.relatedAssetId || undefined,
      resolution: ticket?.resolution || '',
    },
  });

  // Watch urgency and impact to calculate priority automatically
  const urgency = form.watch('urgency');
  const impact = form.watch('impact');

  useEffect(() => {
    if (urgency && impact) {
      const newPriority = calculatePriority(urgency, impact);
      setCalculatedPriority(newPriority);
    }
  }, [urgency, impact]);

  const handleSubmit = async (data: TicketFormData) => {
    try {
      // Add calculated priority to the data
      const submitData = {
        ...data,
        priority: calculatedPriority,
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting ticket:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === 'create' ? t.createTicket : t.editTicket}
          {mode === 'edit' && ticket && (
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
              #{ticket.ticketId}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.title_field}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.titlePlaceholder}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.description_field}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t.descriptionPlaceholder}
                      rows={4}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Type Field */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.type}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectType} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Incident">{t.typeIncident}</SelectItem>
                        <SelectItem value="Service Request">{t.typeServiceRequest}</SelectItem>
                        <SelectItem value="Problem">{t.typeProblem}</SelectItem>
                        <SelectItem value="Change">{t.typeChange}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category Field */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.category}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectCategory} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hardware">{t.categoryHardware}</SelectItem>
                        <SelectItem value="Software">{t.categorySoftware}</SelectItem>
                        <SelectItem value="Network">{t.categoryNetwork}</SelectItem>
                        <SelectItem value="Access">{t.categoryAccess}</SelectItem>
                        <SelectItem value="Other">{t.categoryOther}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Urgency Field */}
              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.urgency}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectUrgency} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">{t.urgencyLow}</SelectItem>
                        <SelectItem value="Medium">{t.urgencyMedium}</SelectItem>
                        <SelectItem value="High">{t.urgencyHigh}</SelectItem>
                        <SelectItem value="Critical">{t.urgencyCritical}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Impact Field */}
              <FormField
                control={form.control}
                name="impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.impact}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectImpact} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">{t.impactLow}</SelectItem>
                        <SelectItem value="Medium">{t.impactMedium}</SelectItem>
                        <SelectItem value="High">{t.impactHigh}</SelectItem>
                        <SelectItem value="Critical">{t.impactCritical}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Calculated Priority Display */}
              <div className="space-y-2">
                <Label>{t.priority}</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary text-primary-foreground">
                    {calculatedPriority === 'Low' && t.priorityLow}
                    {calculatedPriority === 'Medium' && t.priorityMedium}
                    {calculatedPriority === 'High' && t.priorityHigh}
                    {calculatedPriority === 'Critical' && t.priorityCritical}
                  </span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    (Auto-calculated)
                  </span>
                </div>
              </div>

            </div>

            {/* Resolution Field (only for edit mode) */}
            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="resolution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.resolution}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.resolutionPlaceholder}
                        rows={3}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {t.save}
              </Button>
            </div>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
}