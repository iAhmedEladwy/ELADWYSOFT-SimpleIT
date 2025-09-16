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
import type { UrgencyLevel, ImpactLevel } from '@shared/priorityUtils';

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
  ChevronsUpDown,
  CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// v0.4.0 Compliant Ticket Form Schema - Fixed field names and validation
const ticketFormSchema = z.object({
  // Core Identity - Numbers (not strings) - Fixed validation
  submittedById: z.number().min(1, "Submitted by is required"),
  assignedToId: z.number().optional(),
  relatedAssetId: z.number().optional(),
  
  // Request Classification - Fixed enums
  type: z.enum(['Incident', 'Service Request', 'Problem', 'Change']).default('Incident'),
  category: z.string().min(1, 'Category is required').default('General'),
  
  // Priority Management - Proper enums (priority calculated automatically)
  urgency: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  impact: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  
  // Content - Fixed length limits to match schema (title field)
  title: z.string().min(1, "Title is required").max(255, "Title cannot exceed 255 characters"),
  description: z.string().min(1, "Description is required"),
  resolution: z.string().optional(),
  
  // Status & Workflow - Proper enum
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']).default('Open'),
  
  // Time Management - Fixed types with proper conversion
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
  const [calculatedPriority, setCalculatedPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  // Initialize form with proper defaults - Fixed field mapping
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
      title: ticket?.title || '', // Fixed: using title instead of summary
      description: ticket?.description || '',
      resolution: ticket?.resolution || '',
      timeSpent: ticket?.timeSpent || undefined,
      dueDate: ticket?.dueDate ? format(new Date(ticket.dueDate), 'yyyy-MM-dd') : '',
      slaTarget: ticket?.slaTarget ? format(new Date(ticket.slaTarget), 'yyyy-MM-dd') : '',
    },
  });

  // Data queries
  const { data: employees = [] } = useQuery<EmployeeResponse[]>({
    queryKey: ['/api/employees'],
    staleTime: 300000, // 5 minutes
  });

  const { data: users = [] } = useQuery<UserResponse[]>({
    queryKey: ['/api/users'],
    staleTime: 300000, // 5 minutes
  });

  const { data: assets = [] } = useQuery<AssetResponse[]>({
    queryKey: ['/api/assets'],
    staleTime: 300000, // 5 minutes
  });

  // Filter assets by selected employee
  const submittedById = form.watch('submittedById');
  const filteredAssets = submittedById 
    ? assets.filter(asset => {
        const employeeIdNum = parseInt(submittedById.toString());
        if (isNaN(employeeIdNum)) return false;
        // Check if asset is assigned to this employee
        return asset.assignedEmployeeId === employeeIdNum;
      })
    : [];

  // Comments and History queries - RESTORED
  const { data: comments = [] } = useQuery({
    queryKey: ['/api/tickets', ticket?.id, 'comments'],
    queryFn: () => apiRequest(`/api/tickets/${ticket?.id}/comments`),
    enabled: mode === 'edit' && !!ticket?.id,
    staleTime: 30000, // 30 seconds
  });

  const { data: history = [] } = useQuery({
    queryKey: ['/api/tickets', ticket?.id, 'history'],
    queryFn: () => apiRequest(`/api/tickets/${ticket?.id}/history`),
    enabled: mode === 'edit' && !!ticket?.id,
    staleTime: 30000, // 30 seconds
  });

  // Watch urgency and impact to calculate priority - RESTORED
  const urgency = form.watch('urgency');
  const impact = form.watch('impact');

  useEffect(() => {
    if (urgency && impact) {
      const newPriority = calculatePriority(urgency as UrgencyLevel, impact as ImpactLevel);
      setCalculatedPriority(newPriority);
    }
  }, [urgency, impact]);

  // Reset form when ticket changes - RESTORED
  useEffect(() => {
    if (ticket) {
      form.reset({
        submittedById: ticket.submittedById,
        assignedToId: ticket.assignedToId || undefined,
        relatedAssetId: ticket.relatedAssetId || undefined,
        type: ticket.type,
        category: ticket.category,
        urgency: ticket.urgency,
        impact: ticket.impact,
        status: ticket.status,
        title: ticket.title,
        description: ticket.description,
        resolution: ticket.resolution || '',
        timeSpent: ticket.timeSpent || undefined,
        dueDate: ticket.dueDate ? format(new Date(ticket.dueDate), 'yyyy-MM-dd') : '',
        slaTarget: ticket.slaTarget ? format(new Date(ticket.slaTarget), 'yyyy-MM-dd') : '',
      });
    }
  }, [ticket, form]);

  // Create/Update ticket mutations - RESTORED with correct endpoints
  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketCreateRequest) => {
      return apiRequest('/api/tickets', 'POST', {
        ...data,
        priority: calculatedPriority, // Backend will also calculate this
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: t.success,
        description: t.ticketCreated,
      });
      if (onSuccess) onSuccess(data);
      if (onOpenChange) onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || t.errorCreating,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (data: TicketUpdateRequest) => {
      if (!ticket?.id) throw new Error('Ticket ID is required for update');
      return apiRequest(`/api/tickets/${ticket.id}`, 'PATCH', {
        ...data,
        priority: calculatedPriority, // Include calculated priority
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket?.id}`] });
      toast({
        title: t.success,
        description: t.ticketUpdated,
      });
      if (onSuccess) onSuccess(data);
      if (onOpenChange) onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || t.errorUpdating,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Add comment mutation - RESTORED
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!ticket?.id) throw new Error('Ticket ID is required');
      return apiRequest(`/api/tickets/${ticket.id}/comments`, 'POST', { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticket?.id, 'comments'] });
      setNewComment('');
      toast({
        title: t.success,
        description: t.commentAdded,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || t.errorAddingComment,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setAddingComment(false);
    },
  });

  // Form submit handler - RESTORED
  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    
    try {
      // Prepare data for submission
      const submitData = {
        ...data,
        priority: calculatedPriority,
      };

      if (mode === 'create') {
        await createTicketMutation.mutateAsync(submitData as TicketCreateRequest);
      } else {
        await updateTicketMutation.mutateAsync(submitData as TicketUpdateRequest);
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Form submission error:', error);
    }
  };

  // Helper functions - RESTORED
  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find((emp: any) => emp.id === employeeId);
    return employee ? (employee.englishName || employee.name || `Employee ${employeeId}`) : t.selectEmployee;
  };

  const getUserName = (userId: number) => {
    const foundUser = users.find((u: any) => u.id === userId);
    return foundUser ? (foundUser.username || `User ${userId}`) : t.selectUser;
  };

  const getAssetName = (assetId: number) => {
    const asset = assets.find((a: any) => a.id === assetId);
    return asset ? (asset.name || asset.assetId || `Asset ${assetId}`) : t.selectAsset;
  };

  // Add comment handler - RESTORED
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setAddingComment(true);
    addCommentMutation.mutate(newComment.trim());
  };

  // Filter active employees and assignable users - RESTORED
  const activeEmployees = useMemo(() => {
    return employees.filter((emp: any) => emp.status === 'Active' || !emp.status);
  }, [employees]);

  const assignableUsers = useMemo(() => {
    return users.filter((user: any) => ['agent', 'manager', 'admin'].includes(user.role));
  }, [users]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {mode === 'create' ? t.createTicket : t.editTicket}
            {ticket && (
              <Badge variant="outline" className="ml-2">
                {ticket.ticketId}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">{t.ticketDetails}</TabsTrigger>
            {mode === 'edit' && (
              <>
                <TabsTrigger value="comments">{t.comments}</TabsTrigger>
                <TabsTrigger value="history">{t.history}</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Main Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.basicInformation}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Title Field - Fixed field name */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.title} *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t.titlePlaceholder}
                              {...field}
                              disabled={isSubmitting}
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
                          <FormLabel>{t.description} *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t.descriptionPlaceholder}
                              rows={4}
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Type and Category Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.type} *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
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

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.category} *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t.categoryPlaceholder}
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Assignment Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.assignmentInformation}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Submitted By and Assigned To Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Submitted By (Employee) */}
                      <FormField
                        control={form.control}
                        name="submittedById"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.submittedBy} *</FormLabel>
                            <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    disabled={isSubmitting}
                                  >
                                    {field.value
                                      ? activeEmployees.find((employee: EmployeeResponse) => employee.id === field.value)?.englishName || 
                                        activeEmployees.find((employee: EmployeeResponse) => employee.id === field.value)?.name ||
                                        `Employee ${field.value}`
                                      : t.selectEmployee
                                    }
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                  <CommandInput placeholder={t.searchEmployee} />
                                  <CommandEmpty>{t.noEmployeeFound}</CommandEmpty>
                                  <CommandGroup className="max-h-64 overflow-y-auto">
                                    {activeEmployees.map((employee: EmployeeResponse) => (
                                      <CommandItem
                                        key={employee.id}
                                        value={`${employee.englishName || employee.name || ''} ${employee.department || ''}`}
                                        onSelect={() => {
                                          const newValue = employee.id.toString();
                                          field.onChange(parseInt(newValue));
                                          setEmployeeSearchOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === employee.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span>{employee.englishName || employee.name || 'Unknown'}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {employee.department || t.noDepartment}
                                          </span>
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

                      {/* Assigned To (User) */}
                      <FormField
                        control={form.control}
                        name="assignedToId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.assignedTo}</FormLabel>
                            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    disabled={isSubmitting}
                                  >
                                    {field.value
                                      ? assignableUsers.find((user: UserResponse) => user.id === field.value)?.username || `User ${field.value}`
                                      : t.selectUser
                                    }
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                  <CommandInput placeholder={t.searchUser} />
                                  <CommandEmpty>{t.noUserFound}</CommandEmpty>
                                  <CommandGroup className="max-h-64 overflow-y-auto">
                                    <CommandItem
                                      value="unassigned"
                                      onSelect={() => {
                                        field.onChange(undefined);
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
                                    {assignableUsers.map((assignableUser: UserResponse) => (
                                      <CommandItem
                                        key={assignableUser.id}
                                        value={assignableUser.username || `user-${assignableUser.id}`}
                                        onSelect={() => {
                                          field.onChange(assignableUser.id);
                                          setUserSearchOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === assignableUser.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {assignableUser.username || `User ${assignableUser.id}`}
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
                    </div>

                    {/* Related Asset - FIXED: No empty string values */}
                    <FormField
                      control={form.control}
                      name="relatedAssetId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.relatedAsset}</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              // FIXED: Proper value handling without empty strings
                              if (value === 'none') {
                                field.onChange(undefined);
                              } else {
                                field.onChange(parseInt(value));
                              }
                            }}
                            value={field.value ? field.value.toString() : 'none'}
                            disabled={isSubmitting || !form.watch('submittedById')}
                          >
                            <FormControl>
                              <SelectTrigger>
                               <SelectValue placeholder={
                                  !form.watch('submittedById') ? t.selectEmployeeFirst : 
                                  filteredAssets.length === 0 ? t.noAssetsForEmployee :
                                  t.selectAsset
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-64">
                              {/* FIXED: Use 'none' instead of empty string */}
                              <SelectItem value="none">{t.noAsset}</SelectItem>
                              {filteredAssets.map((asset: AssetResponse) => {
                                // Enhanced asset display format: "AST-001, Laptop Dell XPS 13"
                                const displayParts = [asset.assetId || `Asset ${asset.id}`];
                                const deviceInfo = [];
                                
                                if (asset.type) deviceInfo.push(asset.type);
                                if (asset.brand) deviceInfo.push(asset.brand);
                                if (asset.modelName) deviceInfo.push(asset.modelName);
                                
                                const displayString = deviceInfo.length > 0 
                                  ? `${asset.assetId}, ${deviceInfo.join(' ')}`
                                  : asset.assetId;
                                
                                return (
                                  <SelectItem key={asset.id} value={asset.id.toString()}>
                                    {displayString}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Priority Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.priorityManagement}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Urgency and Impact Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="urgency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.urgency} *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
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

                      <FormField
                        control={form.control}
                        name="impact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.impact} *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
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

                    {/* Calculated Priority Display */}
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Label>{t.calculatedPriority}:</Label>
                        <Badge variant={getPriorityBadgeVariant(calculatedPriority)}>
                          {calculatedPriority === 'Low' ? t.priorityLow :
                           calculatedPriority === 'Medium' ? t.priorityMedium :
                           calculatedPriority === 'High' ? t.priorityHigh :
                           t.priorityCritical}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {getPriorityExplanation(urgency, impact, language)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Status and Resolution */}
                {mode === 'edit' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t.statusAndResolution}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      {/* Status and Time Spent Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.status}</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isSubmitting}
                              >
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

                        <FormField
                          control={form.control}
                          name="timeSpent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.timeSpent} ({t.minutes})</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? undefined : parseInt(value));
                                  }}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Resolution Field */}
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
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Dates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.dateInformation}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Due Date */}
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.dueDate}</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                disabled={isSubmitting}
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
                              <Input
                                type="date"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange?.(false)}
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {mode === 'create' ? t.creating : t.updating}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {mode === 'create' ? t.createTicket : t.saveChanges}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Comments Tab - RESTORED COMPLETE */}
          {mode === 'edit' && (
            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {t.comments}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Add Comment */}
                  <div className="space-y-2">
                    <Label htmlFor="new-comment">{t.addComment}</Label>
                    <Textarea
                      id="new-comment"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={t.commentPlaceholder}
                      rows={3}
                      disabled={addingComment}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addingComment}
                      size="sm"
                    >
                      {addingComment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t.adding}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {t.addComment}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Array.isArray(comments) && comments.length > 0 ? (
                      comments.map((comment: any) => (
                        <div key={comment.id} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {comment.user?.username || t.unknownUser}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {comment.createdAt && format(new Date(comment.createdAt), 'PPp')}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>{t.noComments}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* History Tab - RESTORED COMPLETE */}
          {mode === 'edit' && (
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    {t.ticketHistory}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Array.isArray(history) && history.length > 0 ? (
                      history.map((entry: any) => (
                        <div key={entry.id} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {entry.user?.username || t.systemUser}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {entry.action}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground ml-auto">
                              {entry.createdAt && format(new Date(entry.createdAt), 'PPp')}
                            </span>
                          </div>
                          {entry.fieldChanged && (
                            <div className="text-sm">
                              <span className="font-medium">{entry.fieldChanged}:</span>
                              {entry.oldValue && (
                                <span className="text-red-600 mx-1">
                                  {entry.oldValue}
                                </span>
                              )}
                              {entry.oldValue && entry.newValue && (
                                <span className="mx-1">→</span>
                              )}
                              {entry.newValue && (
                                <span className="text-green-600 mx-1">
                                  {entry.newValue}
                                </span>
                              )}
                            </div>
                          )}
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>{t.noHistory}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}