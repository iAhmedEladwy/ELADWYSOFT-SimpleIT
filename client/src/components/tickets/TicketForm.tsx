import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTicketTranslations } from '@/lib/translations/tickets';
import { calculatePriority, getPriorityBadgeVariant, getPriorityExplanation } from '@shared/priorityUtils';

import type { TicketResponse, TicketCreateRequest, TicketUpdateRequest, UserResponse, AssetResponse, EmployeeResponse } from '@shared/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { 
  Save, 
  Loader2, 
  X, 
  User, 
  MessageSquare, 
  History,
  AlertCircle,
  Send,
  Check,
  ChevronsUpDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// v0.4.0 Compliant Ticket Form Schema
const ticketFormSchema = z.object({
  // Core Identity - Numbers (not strings)
  submittedById: z.number().min(1, "Submitted by is required"),
  assignedToId: z.number().optional(),
  relatedAssetId: z.number().optional(),
  
  // Request Classification - Proper enums
  type: z.enum(['Incident', 'Service Request', 'Problem', 'Change']).default('Incident'),
  category: z.string().default('General'),
  
  // Priority Management - Proper enums (priority calculated automatically)
  urgency: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  impact: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  
  // Content - Fixed length limits to match schema
  title: z.string().min(1, "Title is required").max(255, "Title cannot exceed 255 characters"),
  description: z.string().min(1, "Description is required"),
  resolution: z.string().optional(),
  
  // Status & Workflow - Proper enum
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']).default('Open'),
  
  // Time Management - Proper types with safe conversion
  timeSpent: z.union([
    z.number().min(0, "Time spent cannot be negative"),
    z.string().transform((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) return undefined;
      return parsed >= 0 ? parsed : undefined;
    })
  ]).optional(),
  
  dueDate: z.string().optional(),
  slaTarget: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  ticket?: TicketResponse;
  mode: 'create' | 'edit';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (ticket: TicketResponse) => void;
}

export default function TicketForm({ 
  ticket, 
  mode, 
  open = false, 
  onOpenChange, 
  onSuccess 
}: TicketFormProps) {
  const { language } = useLanguage();
  const { user, hasAccess } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTicketTranslations(language);

  // Local state
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  // Initialize form with proper defaults
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      submittedById: ticket?.submittedById || 0,
      assignedToId: ticket?.assignedToId || undefined,
      relatedAssetId: ticket?.relatedAssetId || undefined,
      type: ticket?.type || 'Incident',
      category: ticket?.category || 'General',
      urgency: ticket?.urgency || 'Medium',
      impact: ticket?.impact || 'Medium',
      status: ticket?.status || 'Open',
      title: ticket?.title || '',
      description: ticket?.description || '',
      resolution: ticket?.resolution || '',
      timeSpent: ticket?.timeSpent || undefined,
      dueDate: ticket?.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '',
      slaTarget: ticket?.slaTarget ? new Date(ticket.slaTarget).toISOString().split('T')[0] : '',
    },
  });

  // Watch urgency and impact for priority calculation
  const urgency = form.watch('urgency');
  const impact = form.watch('impact');
  const calculatedPriority = calculatePriority(urgency as any, impact as any);

  // Queries for form data
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiRequest('/api/employees'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest('/api/users'),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => apiRequest('/api/assets'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest('/api/categories'),
  });

  // Get comments and history for edit mode
  const { data: comments = [] } = useQuery({
    queryKey: ['ticket-comments', ticket?.id],
    queryFn: () => apiRequest(`/api/tickets/${ticket?.id}/comments`),
    enabled: mode === 'edit' && !!ticket?.id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['ticket-history', ticket?.id],
    queryFn: () => apiRequest(`/api/tickets/${ticket?.id}/history`),
    enabled: mode === 'edit' && !!ticket?.id,
  });

  // Filter active employees
  const activeEmployees = useMemo(() => 
    employees.filter((emp: EmployeeResponse) => emp.status === 'Active'),
    [employees]
  );

  // Filter assets based on selected employee
  const selectedEmployeeId = form.watch('submittedById');
  const filteredAssets = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return assets.filter((asset: AssetResponse) => 
      asset.assignedEmployee?.id === selectedEmployeeId || asset.assignedToId === selectedEmployeeId
    );
  }, [assets, selectedEmployeeId]);

  // Available categories (custom + default)
  const availableCategories = useMemo(() => {
    const customCategories = categories.map((cat: any) => ({
      value: cat.name,
      label: cat.name,
    }));
    
    const defaultCategories = [
      { value: 'General', label: language === 'English' ? 'General' : 'عام' },
      { value: 'Hardware', label: t.categoryHardware },
      { value: 'Software', label: t.categorySoftware },
      { value: 'Network', label: t.categoryNetwork },
      { value: 'Access', label: t.categoryAccess },
      { value: 'Other', label: t.categoryOther },
    ];

    // If no custom categories, return defaults with "General" first
    if (customCategories.length === 0) {
      return defaultCategories;
    }

    // Merge custom and default, avoiding duplicates
    const allCategories = [...customCategories];
    defaultCategories.forEach(defaultCat => {
      if (!allCategories.some(cat => cat.value === defaultCat.value)) {
        allCategories.push(defaultCat);
      }
    });

    return allCategories;
  }, [categories, language, t]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: TicketCreateRequest) => apiRequest('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({ title: t.success, description: t.ticketCreated });
      onSuccess?.(newTicket);
      onOpenChange?.(false);
    },
    onError: (error: any) => {
      toast({ 
        title: t.error, 
        description: error.message || 'Failed to create ticket',
        variant: 'destructive' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: TicketUpdateRequest) => apiRequest(`/api/tickets/${ticket?.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: (updatedTicket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket?.id] });
      toast({ title: t.success, description: t.ticketUpdated });
      onSuccess?.(updatedTicket);
    },
    onError: (error: any) => {
      toast({ 
        title: t.error, 
        description: error.message || 'Failed to update ticket',
        variant: 'destructive' 
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => apiRequest(`/api/tickets/${ticket?.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticket?.id] });
      setNewComment('');
      toast({ title: t.success, description: t.commentAdded });
    },
    onError: (error: any) => {
      toast({ 
        title: t.error, 
        description: error.message || 'Failed to add comment',
        variant: 'destructive' 
      });
    },
  });

  // Handle form submission
  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    
    try {
      // Calculate priority
      const priority = calculatePriority(data.urgency as any, data.impact as any);
      
      // Prepare data for API
      const submitData = {
        ...data,
        priority,
        // Convert dates to ISO format if provided
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        slaTarget: data.slaTarget ? new Date(data.slaTarget).toISOString() : undefined,
        // Ensure proper number types
        timeSpent: data.timeSpent ? Number(data.timeSpent) : undefined,
      };

      if (mode === 'create') {
        await createMutation.mutateAsync(submitData as TicketCreateRequest);
      } else {
        await updateMutation.mutateAsync(submitData as TicketUpdateRequest);
      }
    } catch (error) {
      // Error handling is done in mutations
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setAddingComment(true);
    try {
      await addCommentMutation.mutateAsync(newComment.trim());
    } finally {
      setAddingComment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? t.createTicket : t.editTicket}
            {mode === 'edit' && ticket && (
              <Badge variant="outline">
                #{ticket.ticketId}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? t.description : t.editTicketDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {mode === 'edit' ? (
            // Edit Mode with Tabs
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t.ticketDetails}
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t.comments} ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  {t.history} ({history.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <TicketFormContent 
                  form={form}
                  t={t}
                  language={language}
                  mode={mode}
                  calculatedPriority={calculatedPriority}
                  activeEmployees={activeEmployees}
                  users={users}
                  filteredAssets={filteredAssets}
                  availableCategories={availableCategories}
                  employeeSearchOpen={employeeSearchOpen}
                  setEmployeeSearchOpen={setEmployeeSearchOpen}
                  userSearchOpen={userSearchOpen}
                  setUserSearchOpen={setUserSearchOpen}
                />
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <CommentsTab
                  comments={comments}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  addingComment={addingComment}
                  onAddComment={handleAddComment}
                  t={t}
                  language={language}
                />
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <HistoryTab
                  history={history}
                  t={t}
                  language={language}
                />
              </TabsContent>
            </Tabs>
          ) : (
            // Create Mode - Single Form
            <TicketFormContent 
              form={form}
              t={t}
              language={language}
              mode={mode}
              calculatedPriority={calculatedPriority}
              activeEmployees={activeEmployees}
              users={users}
              filteredAssets={filteredAssets}
              availableCategories={availableCategories}
              employeeSearchOpen={employeeSearchOpen}
              setEmployeeSearchOpen={setEmployeeSearchOpen}
              userSearchOpen={userSearchOpen}
              setUserSearchOpen={setUserSearchOpen}
            />
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          {mode === 'edit' && activeTab === 'details' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              {t.priority}: <Badge variant={getPriorityBadgeVariant(calculatedPriority)}>
                {calculatedPriority === 'Low' ? t.priorityLow :
                 calculatedPriority === 'Medium' ? t.priorityMedium :
                 calculatedPriority === 'High' ? t.priorityHigh :
                 t.priorityCritical}
              </Badge>
              {getPriorityExplanation(urgency as any, impact as any, language)}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isSubmitting}
            >
              {t.cancel}
            </Button>
            
            {(mode === 'create' || activeTab === 'details') && (
              <Button
                type="submit"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {mode === 'create' ? t.create : t.save}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Ticket Form Content Component
function TicketFormContent({ 
  form, 
  t, 
  language, 
  mode, 
  calculatedPriority,
  activeEmployees,
  users,
  filteredAssets,
  availableCategories,
  employeeSearchOpen,
  setEmployeeSearchOpen,
  userSearchOpen,
  setUserSearchOpen
}: any) {
  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Priority Display */}
        {mode === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t.priority}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={getPriorityBadgeVariant(calculatedPriority)}>
                  {calculatedPriority === 'Low' ? t.priorityLow :
                   calculatedPriority === 'Medium' ? t.priorityMedium :
                   calculatedPriority === 'High' ? t.priorityHigh :
                   t.priorityCritical}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getPriorityExplanation(form.watch('urgency'), form.watch('impact'), language)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t.ticketDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
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
                  <FormLabel>{t.description_field}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t.descriptionPlaceholder}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resolution (Edit mode only) */}
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Assignment & Classification */}
        <Card>
          <CardHeader>
            <CardTitle>{t.assignmentClassification}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Submitted By */}
              <FormField
                control={form.control}
                name="submittedById"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t.submittedBy}</FormLabel>
                    <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn("justify-between", !field.value && "text-muted-foreground")}
                          >
                            {field.value
                              ? activeEmployees.find((emp: EmployeeResponse) => emp.id === field.value)?.englishName
                              : t.selectEmployee}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder={t.searchEmployee} />
                          <CommandEmpty>{t.noEmployeeFound}</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {activeEmployees.map((employee: EmployeeResponse) => (
                              <CommandItem
                                key={employee.id}
                                value={employee.englishName}
                                onSelect={() => {
                                  form.setValue("submittedById", employee.id);
                                  form.setValue("relatedAssetId", undefined); // Reset asset when employee changes
                                  setEmployeeSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === employee.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div>
                                  <div className="font-medium">{employee.englishName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {employee.department || t.noDepartment} • {employee.position}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assigned To */}
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t.assignedTo}</FormLabel>
                    <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn("justify-between", !field.value && "text-muted-foreground")}
                          >
                            {field.value
                              ? users.find((user: UserResponse) => user.id === field.value)?.username
                              : t.unassigned}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder={t.selectUser} />
                          <CommandEmpty>{t.noUserFound}</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            <CommandItem
                              value=""
                              onSelect={() => {
                                form.setValue("assignedToId", undefined);
                                setUserSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  !field.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {t.unassigned}
                            </CommandItem>
                            {users.map((user: UserResponse) => (
                              <CommandItem
                                key={user.id}
                                value={user.username}
                                onSelect={() => {
                                  form.setValue("assignedToId", user.id);
                                  setUserSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === user.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div>
                                  <div className="font-medium">{user.username}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {user.role} • {user.email}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.type}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.category}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectCategory} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories.map((category: any) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Impact */}
              <FormField
                control={form.control}
                name="impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.impact}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>

            {/* Related Asset */}
            <FormField
              control={form.control}
              name="relatedAssetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.relatedAsset}</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === 'none' ? undefined : parseInt(value))} 
                    value={field.value?.toString() || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectAssetOptional} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t.noAsset}</SelectItem>
                      {filteredAssets.length === 0 && form.watch('submittedById') && (
                        <SelectItem value="none" disabled>
                          {t.noAssetsForEmployee}
                        </SelectItem>
                      )}
                      {filteredAssets.map((asset: AssetResponse) => (
                        <SelectItem key={asset.id} value={asset.id.toString()}>
                          {asset.name} ({asset.assetId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {!form.watch('submittedById') 
                      ? t.selectEmployeeFirst
                      : filteredAssets.length === 0 
                        ? t.noAssetsForEmployee
                        : language === 'English' 
                          ? 'Optional: Select an asset related to this ticket'
                          : 'اختياري: اختر أصل متعلق بهذه التذكرة'
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status (Edit mode only) */}
            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.status}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectStatus} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Open">{t.statusOpen}</SelectItem>
                        <SelectItem value="In Progress">{t.statusInProgress}</SelectItem>
                        <SelectItem value="Resolved">{t.statusResolved}</SelectItem>
                        <SelectItem value="Closed">{t.statusClosed}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Time Management */}
        <Card>
          <CardHeader>
            <CardTitle>{t.timeManagement}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Time Spent */}
              <FormField
                control={form.control}
                name="timeSpent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.timeSpent} ({t.minutesLabel})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
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
                      <Calendar
                        mode="picker"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t.selectDueDate}
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
                    <FormLabel>{t.slaTarget}</FormLabel>
                    <FormControl>
                      <Calendar
                        mode="picker"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t.selectSlaTarget}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}

// Comments Tab Component
function CommentsTab({ comments, newComment, setNewComment, addingComment, onAddComment, t, language }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t.comments}</h3>
        <Badge variant="outline">{comments.length}</Badge>
      </div>

      {/* Add Comment */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Textarea
              placeholder={t.addCommentPlaceholder}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={onAddComment}
                disabled={!newComment.trim() || addingComment}
                size="sm"
                className="flex items-center gap-2"
              >
                {addingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {t.addComment}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {t.noComments}
            </CardContent>
          </Card>
        ) : (
          comments.map((comment: any) => (
            <Card key={comment.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{comment.user?.username || 'Unknown User'}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleString(language === 'English' ? 'en-US' : 'ar-SA')}
                  </div>
                </div>
                <p className="text-sm">{comment.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// History Tab Component
function HistoryTab({ history, t, language }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t.history}</h3>
        <Badge variant="outline">{history.length}</Badge>
      </div>

      <div className="space-y-3">
        {history.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {t.noHistoryEntries}
            </CardContent>
          </Card>
        ) : (
          history.map((entry: any) => (
            <Card key={entry.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{entry.user?.username || 'System'}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString(language === 'English' ? 'en-US' : 'ar-SA')}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-blue-600">{entry.action}</div>
                  {entry.fieldChanged && (
                    <div className="mt-1">
                      <span className="text-muted-foreground">{entry.fieldChanged}: </span>
                      <span className="line-through text-red-500">{entry.oldValue}</span>
                      <span className="mx-2">→</span>
                      <span className="text-green-600">{entry.newValue}</span>
                    </div>
                  )}
                  {entry.notes && (
                    <div className="mt-1 text-muted-foreground">{entry.notes}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}