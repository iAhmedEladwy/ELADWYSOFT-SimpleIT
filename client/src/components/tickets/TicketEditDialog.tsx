import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import { useForm } from 'react-hook-form';
import { useTicketTranslations } from '@/lib/translations/tickets';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { 
  Save, 
  X, 
  Ticket,
  User,
  Monitor,
  Clock,
  AlertCircle,
  CheckCircle,
  Timer
} from 'lucide-react';

// Form validation schema
const ticketEditSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  type: z.enum(['Incident', 'Service Request', 'Problem', 'Change']),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']),
  assignedToId: z.number().nullable().optional(),
  relatedAssetId: z.number().nullable().optional(),
  urgency: z.string().optional(),
  impact: z.string().optional(),
  resolutionNotes: z.string().optional(),
  timeSpent: z.number().optional(),
});

type TicketEditFormData = z.infer<typeof ticketEditSchema>;

interface TicketEditDialogProps {
  ticket: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: any[];
  assets: any[];
  users: any[];
}

export default function TicketEditDialog({
  ticket,
  open,
  onOpenChange,
  employees,
  assets,
  users,
}: TicketEditDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const form = useForm<TicketEditFormData>({
    resolver: zodResolver(ticketEditSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'Incident',
      category: '',
      priority: 'Medium',
      status: 'Open',
      assignedToId: null,
      relatedAssetId: null,
      urgency: 'Medium',
      impact: 'Medium',
      resolutionNotes: '',
      timeSpent: 0,
    },
  });

  // Load ticket categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('/api/categories');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Reset form when ticket changes
  useEffect(() => {
    if (ticket && open) {
      form.reset({
        title: ticket.title || '',
        description: ticket.description || '',
        type: ticket.type || 'Incident',
        category: ticket.category || '',
        priority: ticket.priority || 'Medium',
        status: ticket.status || 'Open',
        assignedToId: ticket.assignedToId || null,
        relatedAssetId: ticket.relatedAssetId || null,
        urgency: ticket.urgency || 'Medium',
        impact: ticket.impact || 'Medium',
        resolutionNotes: ticket.resolutionNotes || '',
        timeSpent: ticket.timeSpent || 0,
      });
    }
  }, [ticket, open, form]);

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (data: TicketEditFormData) => {
      if (!ticket?.id) throw new Error('No ticket selected');
      return await apiRequest(`/api/tickets/${ticket.id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket?.id}`] });
      toast({
        title: t.success,
        description: t.ticketUpdated,
      });
      onOpenChange(false);
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

  const onSubmit = async (data: TicketEditFormData) => {
    setIsSubmitting(true);
    updateTicketMutation.mutate(data);
  };

  // Helper functions
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Open': return 'default';
      case 'In Progress': return 'secondary';
      case 'Resolved': return 'outline';
      case 'Closed': return 'destructive';
      default: return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'Low': return 'secondary';
      case 'Medium': return 'default';
      case 'High': return 'destructive';
      default: return 'default';
    }
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? (employee.englishName || employee.name || `Employee ${employeeId}`) : 'Unknown';
  };

  const getUserName = (userId: number) => {
    const userFound = users.find(u => u.id === userId);
    return userFound ? (userFound.firstName && userFound.lastName 
      ? `${userFound.firstName} ${userFound.lastName}` 
      : userFound.username) : 'Unknown';
  };

  const getAssetName = (assetId: number) => {
    const asset = assets.find(a => a.id === assetId);
    return asset ? `${asset.assetId} - ${asset.modelName || asset.type}` : 'Unknown';
  };

  // Get translations
  const t = useTicketTranslations(language);

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            {t.editTicket} - {ticket.ticketId}
          </DialogTitle>
          <DialogDescription>
            {t.editTicketDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t.ticketDetails}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">{t.ticketId}</Label>
                    <p className="font-medium">{ticket.ticketId}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">{t.submittedBy}</Label>
                    <p className="font-medium">{getEmployeeName(ticket.submittedById)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">{t.createdAt}</Label>
                    <p className="font-medium">
                      {ticket.createdAt && format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t.status}</Label>
                  <Badge variant={getStatusBadgeVariant(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t.priority}</Label>
                  <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Edit Form */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t.title_field} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.titlePlaceholder} />
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
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t.description_field}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder={t.descriptionPlaceholder} />
                        </FormControl>
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
                        <FormLabel>{t.type} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <FormLabel>{t.category} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.selectCategory} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.length > 0 ? (
                              categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.name}>
                                  {category.name}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="Hardware">{t.categoryHardware}</SelectItem>
                                <SelectItem value="Software">{t.categorySoftware}</SelectItem>
                                <SelectItem value="Network">{t.categoryNetwork}</SelectItem>
                                <SelectItem value="Other">{t.categoryOther}</SelectItem>
                              </>
                            )}
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
                        <FormLabel>{t.priority}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">{t.priorityLow}</SelectItem>
                            <SelectItem value="Medium">{t.priorityMedium}</SelectItem>
                            <SelectItem value="High">{t.priorityHigh}</SelectItem>
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

                  {/* Assigned To */}
                  <FormField
                    control={form.control}
                    name="assignedToId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.assignedTo}</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === 'unassigned' ? null : parseInt(value))} 
                          value={field.value?.toString() || 'unassigned'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.selectUser} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">{t.unassigned}</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {getUserName(user.id)}
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
                        <Select 
                          onValueChange={(value) => field.onChange(value === 'none' ? null : parseInt(value))} 
                          value={field.value?.toString() || 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.selectAsset} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Asset</SelectItem>
                            {assets.map((asset) => (
                              <SelectItem key={asset.id} value={asset.id.toString()}>
                                {getAssetName(asset.id)}
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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

                  {/* Time Spent */}
                  <FormField
                    control={form.control}
                    name="timeSpent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.timeSpent}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            min="0"
                            placeholder="0"
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
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t.resolutionNotes}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder={t.resolutionPlaceholder} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? t.saving : t.save}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}