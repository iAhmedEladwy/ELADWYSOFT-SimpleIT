import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, DollarSign, Check } from 'lucide-react';

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Hooks and utilities
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/queryClient';

// Define comprehensive upgrade types based on requirements
const HARDWARE_UPGRADES = {
  'Memory (RAM) Upgrade': 'Increase system memory capacity',
  'Storage Upgrade': 'SSD/HDD replacement or expansion',
  'CPU Upgrade': 'Processor replacement or upgrade',
  'Graphics Card Upgrade': 'GPU enhancement',
  'Display Upgrade': 'Monitor or screen replacement',
  'Battery Replacement': 'For laptops and mobile devices',
  'Power Supply Upgrade': 'PSU enhancement',
  'Motherboard Replacement': 'System board upgrade',
  'Network Card Upgrade': 'WiFi/Ethernet enhancement',
  'Peripheral Upgrade': 'Keyboard, mouse, webcam upgrades',
};

const SOFTWARE_UPGRADES = {
  'Operating System Upgrade': 'Windows/Linux/macOS updates',
  'Application Suite Upgrade': 'Office/Creative software',
  'Security Software Update': 'Antivirus/firewall upgrades',
  'Database Upgrade': 'Database version updates',
  'License Upgrade': 'From standard to professional editions',
  'Firmware Update': 'BIOS/UEFI updates',
  'Driver Updates': 'Hardware driver upgrades',
};

// Simplified upgrade form schema
const upgradeFormSchema = z.object({
  category: z.enum(['Hardware', 'Software']),
  upgradeType: z.string().min(1, 'Please select upgrade type'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  priority: z.enum(['Low', 'Medium', 'High']),
  scheduledDate: z.date({
    required_error: 'Please select a scheduled date',
  }),
  purchaseRequired: z.boolean().default(false),
  estimatedCost: z.number().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  justification: z.string().min(20, 'Justification must be at least 20 characters'),
  approvedById: z.number().optional(),
  approvalDate: z.date().optional(),
});

type UpgradeFormData = z.infer<typeof upgradeFormSchema>;

interface UpgradeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: number;
  assetInfo: {
    assetId: string;
    type: string;
    brand: string;
    modelName?: string;
    serialNumber?: string;
  };
  mode?: 'create' | 'edit';
  upgradeData?: any;
}

export function UpgradeForm({ 
  open, 
  onOpenChange, 
  assetId, 
  assetInfo,
  mode = 'create',
  upgradeData 
}: UpgradeFormProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<'Hardware' | 'Software'>('Hardware');
  const [autoTitle, setAutoTitle] = useState(true);

  // Translations
  const translations = {
    title: language === 'English' ? 'Upgrade Request' : 'طلب ترقية',
    editTitle: language === 'English' ? 'Edit Upgrade Request' : 'تعديل طلب الترقية',
    category: language === 'English' ? 'Upgrade Category' : 'فئة الترقية',
    hardware: language === 'English' ? 'Hardware' : 'أجهزة',
    software: language === 'English' ? 'Software' : 'برمجيات',
    upgradeType: language === 'English' ? 'Upgrade Type' : 'نوع الترقية',
    formTitle: language === 'English' ? 'Title' : 'العنوان',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    low: language === 'English' ? 'Low' : 'منخفض',
    medium: language === 'English' ? 'Medium' : 'متوسط',
    high: language === 'English' ? 'High' : 'عالي',
    scheduledDate: language === 'English' ? 'Scheduled Date' : 'التاريخ المجدول',
    purchaseRequired: language === 'English' ? 'Purchase Required' : 'يتطلب شراء',
    estimatedCost: language === 'English' ? 'Estimated Cost' : 'التكلفة المقدرة',
    description: language === 'English' ? 'Description' : 'الوصف',
    justification: language === 'English' ? 'Justification' : 'المبرر',
    approvedBy: language === 'English' ? 'Approved By' : 'الموافق عليه من قبل',
    approvalDate: language === 'English' ? 'Approval Date' : 'تاريخ الموافقة',
    submit: language === 'English' ? 'Submit Request' : 'إرسال الطلب',
    update: language === 'English' ? 'Update Request' : 'تحديث الطلب',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    selectDate: language === 'English' ? 'Select date' : 'اختر التاريخ',
    selectType: language === 'English' ? 'Select upgrade type' : 'اختر نوع الترقية',
    selectUser: language === 'English' ? 'Select approver' : 'اختر الموافق',
    optional: language === 'English' ? 'Optional' : 'اختياري',
    usingExisting: language === 'English' ? 'Using existing items' : 'باستخدام العناصر الموجودة',
    newPurchase: language === 'English' ? 'New purchase needed' : 'يتطلب شراء جديد',
    autoGenerated: language === 'English' ? 'Auto-generated' : 'تلقائي',
    approved: language === 'English' ? 'Approved' : 'موافق عليه',
  };

  // Fetch users for approver selection
  const { data: users = [] } = useQuery({
    queryKey: ['users-managers'],
    queryFn: () => apiRequest<any[]>('/api/users?role=manager'),
  });

  // Form setup
  const form = useForm<UpgradeFormData>({
    resolver: zodResolver(upgradeFormSchema),
    defaultValues: {
      category: upgradeData?.category || 'Hardware',
      upgradeType: upgradeData?.upgradeType || '',
      title: upgradeData?.title || '',
      priority: upgradeData?.priority || 'Medium',
      scheduledDate: upgradeData?.scheduledDate ? new Date(upgradeData.scheduledDate) : undefined,
      purchaseRequired: upgradeData?.purchaseRequired || false,
      estimatedCost: upgradeData?.estimatedCost || undefined,
      description: upgradeData?.description || '',
      justification: upgradeData?.justification || '',
      approvedById: upgradeData?.approvedById || undefined,
      approvalDate: upgradeData?.approvalDate ? new Date(upgradeData.approvalDate) : undefined,
    },
  });

  // Watch form fields
  const category = form.watch('category');
  const upgradeType = form.watch('upgradeType');
  const purchaseRequired = form.watch('purchaseRequired');
  const approvedById = form.watch('approvedById');

  // Update selected category
  useEffect(() => {
    setSelectedCategory(category);
  }, [category]);

  // Auto-generate title based on upgrade type
  useEffect(() => {
    if (autoTitle && upgradeType && !upgradeData) {
      const generatedTitle = `${upgradeType} - ${assetInfo.assetId}`;
      form.setValue('title', generatedTitle);
    }
  }, [upgradeType, autoTitle, form, assetInfo.assetId, upgradeData]);

  // Auto-set approval date when approver is selected
  useEffect(() => {
    if (approvedById && !form.getValues('approvalDate')) {
      form.setValue('approvalDate', new Date());
    }
  }, [approvedById, form]);

  // Get upgrade options based on category
  const getUpgradeOptions = () => {
    return selectedCategory === 'Hardware' ? HARDWARE_UPGRADES : SOFTWARE_UPGRADES;
  };

  // Create/Update upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: async (data: UpgradeFormData) => {
      const endpoint = mode === 'create' 
        ? `/api/assets/${assetId}/upgrade`
        : `/api/upgrades/${upgradeData?.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const requestData = {
        ...data,
        scheduledDate: format(data.scheduledDate, 'yyyy-MM-dd'),
        approvalDate: data.approvalDate ? format(data.approvalDate, 'yyyy-MM-dd') : null,
        assetId: assetId,
        status: data.approvedById ? 'Approved' : 'Pending Approval',
        createdById: mode === 'create' ? user?.id : upgradeData?.createdById,
        updatedById: user?.id,
      };

      return apiRequest(endpoint, method, requestData);
    },
    onSuccess: () => {
      const successMessage = mode === 'create'
        ? language === 'English' ? 'Upgrade request created successfully' : 'تم إنشاء طلب الترقية بنجاح'
        : language === 'English' ? 'Upgrade request updated successfully' : 'تم تحديث طلب الترقية بنجاح';
      
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: successMessage,
      });
      
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] });
      queryClient.invalidateQueries({ queryKey: ['upgrades'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || 'Failed to save upgrade request',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UpgradeFormData) => {
    upgradeMutation.mutate(data);
  };

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'High': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {mode === 'edit' ? translations.editTitle : translations.title}
            {approvedById && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <Check className="w-3 h-3 mr-1" />
                {translations.approved}
              </Badge>
            )}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{assetInfo.assetId}</Badge>
            <Badge variant="outline">{assetInfo.type}</Badge>
            <Badge variant="outline">{assetInfo.brand}</Badge>
            {assetInfo.modelName && <Badge variant="outline">{assetInfo.modelName}</Badge>}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Category Toggle Buttons */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.category}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={field.value === 'Hardware' ? 'default' : 'outline'}
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={() => {
                          field.onChange('Hardware');
                          form.setValue('upgradeType', '');
                        }}
                      >
                        <HardDrive className="w-4 h-4" />
                        {translations.hardware}
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'Software' ? 'default' : 'outline'}
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={() => {
                          field.onChange('Software');
                          form.setValue('upgradeType', '');
                        }}
                      >
                        <Code className="w-4 h-4" />
                        {translations.software}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upgrade Type Dropdown */}
            <FormField
              control={form.control}
              name="upgradeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {translations.upgradeType} <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={translations.selectType} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(getUpgradeOptions()).map(([type, description]) => (
                        <SelectItem key={type} value={type}>
                          <div>
                            <div className="font-medium">{type}</div>
                            <div className="text-xs text-muted-foreground">{description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title - Auto-generated or Custom */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>
                      {translations.formTitle} <span className="text-red-500">*</span>
                    </span>
                    {!upgradeData && (
                      <span className="text-xs text-muted-foreground">
                        {autoTitle && translations.autoGenerated}
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={language === 'English' ? 'e.g., RAM Upgrade - 8GB to 16GB' : 'مثال: ترقية الذاكرة - 8GB إلى 16GB'} 
                      {...field}
                      onFocus={() => setAutoTitle(false)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority with Color-coded badges */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.priority}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {['Low', 'Medium', 'High'].map((priority) => (
                        <Button
                          key={priority}
                          type="button"
                          variant={field.value === priority ? 'default' : 'outline'}
                          className={cn(
                            "flex-1 transition-all",
                            field.value === priority && getPriorityColor(priority)
                          )}
                          onClick={() => field.onChange(priority)}
                        >
                          {priority === 'Low' && '🟢'} 
                          {priority === 'Medium' && '🟡'} 
                          {priority === 'High' && '🔴'} 
                          {' '}
                          {translations[priority.toLowerCase() as 'low' | 'medium' | 'high']}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scheduled Date */}
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {translations.scheduledDate} <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : translations.selectDate}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purchase Required Toggle */}
            <FormField
              control={form.control}
              name="purchaseRequired"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-accent/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base cursor-pointer">
                        {translations.purchaseRequired}
                      </FormLabel>
                      <FormDescription className="flex items-center gap-2">
                        {field.value ? (
                          <>
                            <DollarSign className="w-4 h-4 text-yellow-600" />
                            <span className="text-yellow-600">{translations.newPurchase}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">{translations.usingExisting}</span>
                        )}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* Estimated Cost - Only show if purchase required */}
            {purchaseRequired && (
              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem className="animate-in slide-in-from-top-2">
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {translations.estimatedCost}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {translations.description} <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={language === 'English' 
                        ? 'Brief description of the upgrade'
                        : 'وصف موجز للترقية'}
                      className="min-h-[80px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Justification */}
            <FormField
              control={form.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {translations.justification} <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={language === 'English' 
                        ? 'Why is this upgrade needed?'
                        : 'لماذا هذه الترقية مطلوبة؟'}
                      className="min-h-[100px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Approval Section */}
            <div className="grid grid-cols-2 gap-4">
              {/* Approved By */}
              <FormField
                control={form.control}
                name="approvedById"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {translations.approvedBy}
                      <span className="text-muted-foreground ml-1">({translations.optional})</span>
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                      value={field.value?.toString() || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.selectUser} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username} - {user.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Approval Date */}
              <FormField
                control={form.control}
                name="approvalDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {translations.approvalDate}
                      <span className="text-muted-foreground ml-1">({translations.optional})</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!approvedById}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : translations.selectDate}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('2020-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={upgradeMutation.isPending}
              >
                {translations.cancel}
              </Button>
              <Button 
                type="submit" 
                disabled={upgradeMutation.isPending}
              >
                {upgradeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === 'edit' ? translations.update : translations.submit}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}