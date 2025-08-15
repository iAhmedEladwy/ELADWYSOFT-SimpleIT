import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/lib/currencyContext';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

// Define schema for maintenance form validation
const maintenanceFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.string().min(1, 'Maintenance type is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  cost: z.string().optional()
    .transform(value => {
      if (value === "" || value === undefined || value === null) return "0";
      return value;
    })
    .refine(
      (value) => /^\d+(\.\d{1,2})?$/.test(value),
      { message: "Enter a valid cost (e.g., 99.99)" }
    ),
  providerType: z.string().min(1, 'Provider type is required'),
  providerName: z.string().min(1, 'Provider name is required'),
  status: z.string().optional().default('Completed')
});

interface MaintenanceFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  assetId: number;
  assetName?: string;
  initialData?: {
    date?: string;
    type?: string;
    description?: string;
    cost?: string;
    providerType?: string;
    providerName?: string;
    status?: string;
  };
}

export default function MaintenanceForm({ onSubmit, isSubmitting, assetId, assetName, initialData }: MaintenanceFormProps) {
  const { language } = useLanguage();
  const { symbol } = useCurrency();

  // Translations
  const translations = {
    title: language === 'English' ? 'Add Maintenance Record' : 'إضافة سجل صيانة',
    assetInfo: language === 'English' ? 'Asset Information' : 'معلومات الأصل',
    assetId: language === 'English' ? 'Asset ID' : 'معرف الأصل',
    date: language === 'English' ? 'Maintenance Date' : 'تاريخ الصيانة',
    dateDesc: language === 'English' ? 'When was the maintenance performed?' : 'متى تم تنفيذ الصيانة؟',
    type: language === 'English' ? 'Maintenance Type' : 'نوع الصيانة',
    typeDesc: language === 'English' ? 'Select the type of maintenance' : 'اختر نوع الصيانة',
    preventive: language === 'English' ? 'Preventive' : 'وقائية',
    corrective: language === 'English' ? 'Corrective' : 'تصحيحية',
    upgrade: language === 'English' ? 'Upgrade' : 'ترقية',
    repair: language === 'English' ? 'Repair' : 'إصلاح',
    inspection: language === 'English' ? 'Inspection' : 'فحص',
    cleaning: language === 'English' ? 'Cleaning' : 'تنظيف',
    replacement: language === 'English' ? 'Replacement' : 'استبدال',
    description: language === 'English' ? 'Description' : 'الوصف',
    descriptionDesc: language === 'English' ? 'Detailed description of the maintenance work performed' : 'وصف مفصل لأعمال الصيانة المنجزة',
    cost: language === 'English' ? 'Cost' : 'التكلفة',
    costDesc: language === 'English' ? 'Total cost of maintenance (optional)' : 'التكلفة الإجمالية للصيانة (اختياري)',
    providerType: language === 'English' ? 'Provider Type' : 'نوع مقدم الخدمة',
    providerTypeDesc: language === 'English' ? 'Who performed the maintenance?' : 'من قام بالصيانة؟',
    internal: language === 'English' ? 'Internal' : 'داخلي',
    external: language === 'English' ? 'External' : 'خارجي',
    providerName: language === 'English' ? 'Provider Name' : 'اسم مقدم الخدمة',
    providerNameDesc: language === 'English' ? 'Name of person/company who performed maintenance' : 'اسم الشخص/الشركة التي قامت بالصيانة',
    status: language === 'English' ? 'Status' : 'الحالة',
    completed: language === 'English' ? 'Completed' : 'مكتمل',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    scheduled: language === 'English' ? 'Scheduled' : 'مجدول',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    save: language === 'English' ? 'Save Maintenance Record' : 'حفظ سجل الصيانة',
    saving: language === 'English' ? 'Saving...' : 'جاري الحفظ...',
  };

  // Initialize form with default values
  const form = useForm<z.infer<typeof maintenanceFormSchema>>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split('T')[0],
      type: initialData?.type || 'Preventive',
      description: initialData?.description || '',
      cost: initialData?.cost || '0',
      providerType: initialData?.providerType || 'Internal',
      providerName: initialData?.providerName || 'IT Department',
      status: initialData?.status || 'Completed'
    },
  });

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof maintenanceFormSchema>) => {
    const formattedData = {
      assetId: assetId,
      date: values.date,
      type: values.type,
      description: values.description,
      cost: values.cost || '0', // Keep as string for backend validation
      providerType: values.providerType,
      providerName: values.providerName,
      status: values.status || 'Completed'
    };
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Asset Information */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">{translations.assetInfo}</h4>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{translations.assetId}:</span> {assetId}
            {assetName && (
              <>
                <br />
                <span className="font-medium">{language === 'English' ? 'Asset Name' : 'اسم الأصل'}:</span> {assetName}
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.date}</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormDescription>{translations.dateDesc}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.type}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.type} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Preventive">{translations.preventive}</SelectItem>
                    <SelectItem value="Corrective">{translations.corrective}</SelectItem>
                    <SelectItem value="Upgrade">{translations.upgrade}</SelectItem>
                    <SelectItem value="Repair">{translations.repair}</SelectItem>
                    <SelectItem value="Inspection">{translations.inspection}</SelectItem>
                    <SelectItem value="Cleaning">{translations.cleaning}</SelectItem>
                    <SelectItem value="Replacement">{translations.replacement}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{translations.typeDesc}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.cost}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">{symbol}</span>
                    </div>
                    <Input 
                      {...field} 
                      type="number" 
                      step="0.01" 
                      className="pl-8" 
                      placeholder="0.00"
                    />
                  </div>
                </FormControl>
                <FormDescription>{translations.costDesc}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="providerType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.providerType}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.providerType} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Internal">{translations.internal}</SelectItem>
                    <SelectItem value="External">{translations.external}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{translations.providerTypeDesc}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="providerName"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{translations.providerName}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={language === 'English' ? 'e.g., IT Department, TechCorp Ltd' : 'مثال: قسم تقنية المعلومات، شركة التقنية المحدودة'} />
                </FormControl>
                <FormDescription>{translations.providerNameDesc}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.description}</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  rows={4} 
                  placeholder={language === 'English' ? 'Describe the maintenance work performed, parts replaced, issues resolved, etc.' : 'صف أعمال الصيانة المنجزة، القطع المستبدلة، المشاكل المحلولة، إلخ.'}
                />
              </FormControl>
              <FormDescription>{translations.descriptionDesc}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.status}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.status} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Completed">{translations.completed}</SelectItem>
                  <SelectItem value="In Progress">{translations.inProgress}</SelectItem>
                  <SelectItem value="Scheduled">{translations.scheduled}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? translations.saving : translations.save}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}