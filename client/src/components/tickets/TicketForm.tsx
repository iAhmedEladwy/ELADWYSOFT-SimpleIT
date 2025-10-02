import { useState, useEffect, useMemo } from 'react';
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
  categoryId: z.number().min(1, 'Category is required'), // Reference to categories table
  
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
      categoryId: ticket?.categoryId || 0, // 0 will trigger validation error if no category selected
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

  // FIXED: Categories query for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
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
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['/api/tickets', ticket?.id, 'comments'],
    queryFn: () => apiRequest(`/api/tickets/${ticket?.id}/comments`),
    enabled: mode === 'edit' && !!ticket?.id,
    staleTime: 0, // Always consider stale to ensure fresh data
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
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

  // Reset form when ticket changes or mode changes - FIXED
  useEffect(() => {
    if (ticket && mode === 'edit') {
      // Edit mode: populate form with ticket data
      form.reset({
        submittedById: ticket.submittedById,
        assignedToId: ticket.assignedToId || undefined,
        relatedAssetId: ticket.relatedAssetId || undefined,
        type: ticket.type,
        categoryId: ticket.categoryId || undefined,
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
    } else if (mode === 'create') {
      // Create mode: reset form to default values
      form.reset({
        submittedById: user?.employeeId || 0,
        assignedToId: undefined,
        relatedAssetId: undefined,
        type: 'Incident',
        categoryId: 0,
        urgency: 'Medium',
        impact: 'Medium',
        status: 'Open',
        title: '',
        description: '',
        resolution: '',
        timeSpent: undefined,
        dueDate: '',
        slaTarget: '',
      });
    }
  }, [ticket, mode, form, user]);

  // Reset form when dialog opens - ensures clean slate for create mode
  useEffect(() => {
    if (open && mode === 'create') {
      // Force reset when create dialog opens
      form.reset({
        submittedById: user?.employeeId || 0,
        assignedToId: undefined,
        relatedAssetId: undefined,
        type: 'Incident',
        categoryId: 0,
        urgency: 'Medium',
        impact: 'Medium',
        status: 'Open',
        title: '',
        description: '',
        resolution: '',
        timeSpent: undefined,
        dueDate: '',
        slaTarget: '',
      });
      // Reset state variables
      setActiveTab('details');
      setNewComment('');
    }
  }, [open, mode, form, user]);

  // Create/Update ticket mutations - FIXED: Remove duplicate date conversion
  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketCreateRequest) => {
      return apiRequest('/api/tickets', 'POST', {
        ...data,
        // Priority is already included in submitData
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
        // Priority is already included in submitData
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
      return apiRequest('/api/tickets/comments', 'POST', { 
        ticketId: ticket.id,
        content 
      });
    },
    onSuccess: async (data, variables, context) => {
      const ticketId = ticket?.id;
      if (ticketId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticketId, 'comments'] });
        // Also manually refetch to ensure immediate update
        await refetchComments();
      }
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

  // Form submit handler - FIXED: Proper date handling
  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    
    try {
      // Prepare data for submission with proper date conversion
      const submitData = {
        ...data,
        priority: calculatedPriority,
        // FIXED: Proper date conversion for modern Calendar component
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        slaTarget: data.slaTarget ? new Date(data.slaTarget).toISOString() : undefined,
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
          <DialogDescription>
            {mode === 'create' ? t.createNewTicketDescription || 'Fill out the form below to create a new support ticket.' : t.editTicketDescription || 'Update the ticket information below.'}
          </DialogDescription>
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

          {/* FIXED: Consistent content container for all tabs */}
          <div className="mt-4 min-h-[600px]">
            {/* Main Details Tab - FIXED: Flat layout without Card wrappers */}
            <TabsContent value="details" className="space-y-3">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  
                  {/* Basic Information Section - FIXED: No Card wrapper */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium border-b pb-2">{t.basicInformation}</h3>
                    
                    {/* Title Field - FIXED: Correct label */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.title_field} *</FormLabel>
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

                    {/* Description Field - FIXED: Correct label */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.description_field} *</FormLabel>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                      {/* FIXED: Category dropdown with API data */}
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.category} *</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                              disabled={isSubmitting}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t.selectCategory} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.length === 0 && (
                                  <SelectItem value="1" disabled>Loading categories...</SelectItem>
                                )}
                                {categories.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
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

                  {/* Assignment Information Section - FIXED: Single Assigned To field */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium border-b pb-2">{t.assignmentInformation}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Submitted By (Employee) - FIXED: Direct ID assignment */}
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
                                          field.onChange(employee.id);
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

                      {/* Assigned To (User) - VERIFIED: Single instance only */}
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
                  </div>

                  {/* Priority Management Section */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium border-b pb-2">{t.priorityManagement}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Label>{t.calculatedPriority}:</Label>
                        <Badge variant={getPriorityBadgeVariant(calculatedPriority)}>
                          {calculatedPriority === 'Low' ? t.priorityLow :
                           calculatedPriority === 'Medium' ? t.priorityMedium :
                           calculatedPriority === 'High' ? t.priorityHigh :
                           t.priorityCritical}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getPriorityExplanation(urgency, impact, language)}
                      </p>
                    </div>
                  </div>

                  {/* Status and Resolution Section (edit mode only) */}
                  {mode === 'edit' && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium border-b pb-2">{t.statusAndResolution}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    </div>
                  )}

                  {/* Dates Section - Modern datepicker */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium border-b pb-2">{t.dateInformation}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Due Date - Modern datepicker */}
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
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* SLA Target - Modern datepicker */}
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
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

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

            {/* Comments Tab */}
            {mode === 'edit' && (
              <TabsContent value="comments" className="space-y-4 min-h-[600px]">
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

            {/* History Tab */}
            {mode === 'edit' && (
              <TabsContent value="history" className="space-y-4 min-h-[600px]">
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
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}