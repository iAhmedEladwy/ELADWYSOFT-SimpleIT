import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

// Define schema for form validation
const assetFormSchema = z.object({
  assetId: z.string().optional(),
  type: z.string(),
  brand: z.string().min(1, 'Brand is required'),
  modelNumber: z.string().optional(),
  modelName: z.string().optional(),
  serialNumber: z.string().min(1, 'Serial number is required'),
  specs: z.string().optional(),
  status: z.string(),
  purchaseDate: z.string().optional(),
  buyPrice: z.string().optional(),
  warrantyExpiryDate: z.string().optional(),
  lifeSpan: z.string().optional(),
  outOfBoxOs: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
});

interface AssetFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isSubmitting: boolean;
}

export default function AssetForm({ onSubmit, initialData, isSubmitting }: AssetFormProps) {
  const { language } = useLanguage();
  const isEditMode = !!initialData;

  // Fetch employees list for assignment dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Translations
  const translations = {
    basicInfo: language === 'English' ? 'Basic Information' : 'معلومات أساسية',
    purchaseInfo: language === 'English' ? 'Purchase Information' : 'معلومات الشراء',
    additionalInfo: language === 'English' ? 'Additional Information' : 'معلومات إضافية',
    assetID: language === 'English' ? 'Asset ID' : 'معرف الأصل',
    idDesc: language === 'English' ? 'Auto-generated if left blank' : 'يتم إنشاؤه تلقائيًا إذا تُرك فارغًا',
    type: language === 'English' ? 'Type' : 'النوع',
    laptop: language === 'English' ? 'Laptop' : 'جهاز محمول',
    desktop: language === 'English' ? 'Desktop' : 'جهاز سطح المكتب',
    mobile: language === 'English' ? 'Mobile' : 'جهاز جوال',
    tablet: language === 'English' ? 'Tablet' : 'جهاز لوحي',
    monitor: language === 'English' ? 'Monitor' : 'شاشة',
    printer: language === 'English' ? 'Printer' : 'طابعة',
    server: language === 'English' ? 'Server' : 'خادم',
    network: language === 'English' ? 'Network' : 'شبكة',
    other: language === 'English' ? 'Other' : 'أخرى',
    brand: language === 'English' ? 'Brand' : 'العلامة التجارية',
    modelNumber: language === 'English' ? 'Model Number' : 'رقم الطراز',
    modelNumberDesc: language === 'English' ? 'Optional' : 'اختياري',
    modelName: language === 'English' ? 'Model Name' : 'اسم الطراز',
    modelNameDesc: language === 'English' ? 'Optional' : 'اختياري',
    serialNumber: language === 'English' ? 'Serial Number' : 'الرقم التسلسلي',
    specs: language === 'English' ? 'Specifications' : 'المواصفات',
    specsDesc: language === 'English' ? 'Processor, RAM, Disk, etc.' : 'المعالج، ذاكرة الوصول العشوائي، القرص، إلخ.',
    status: language === 'English' ? 'Status' : 'الحالة',
    available: language === 'English' ? 'Available' : 'متاح',
    inUse: language === 'English' ? 'In Use' : 'قيد الاستخدام',
    maintenance: language === 'English' ? 'Maintenance' : 'صيانة',
    damaged: language === 'English' ? 'Damaged' : 'تالف',
    sold: language === 'English' ? 'Sold' : 'تم بيعه',
    retired: language === 'English' ? 'Retired' : 'متقاعد',
    purchaseDate: language === 'English' ? 'Purchase Date' : 'تاريخ الشراء',
    purchaseDateDesc: language === 'English' ? 'Optional' : 'اختياري',
    buyPrice: language === 'English' ? 'Purchase Price' : 'سعر الشراء',
    buyPriceDesc: language === 'English' ? 'Optional' : 'اختياري',
    warrantyExpiry: language === 'English' ? 'Warranty Expiry Date' : 'تاريخ انتهاء الضمان',
    warrantyExpiryDesc: language === 'English' ? 'Optional' : 'اختياري',
    lifeSpan: language === 'English' ? 'Life Span (months)' : 'العمر الافتراضي (شهور)',
    lifeSpanDesc: language === 'English' ? 'Expected useful life in months' : 'العمر المتوقع بالأشهر',
    outOfBoxOs: language === 'English' ? 'Factory OS' : 'نظام التشغيل الأصلي',
    outOfBoxOsDesc: language === 'English' ? 'OS that came with the device' : 'نظام التشغيل الذي أتى مع الجهاز',
    assignedTo: language === 'English' ? 'Assigned To' : 'معين إلى',
    assignedToDesc: language === 'English' ? 'Employee using this asset' : 'الموظف الذي يستخدم هذا الأصل',
    none: language === 'English' ? 'None' : 'لا يوجد',
    create: language === 'English' ? 'Create Asset' : 'إنشاء أصل',
    save: language === 'English' ? 'Save Changes' : 'حفظ التغييرات',
    submitting: language === 'English' ? 'Submitting...' : 'جاري الإرسال...',
  };

  // Convert initial data to form format
  const getFormattedInitialData = () => {
    if (!initialData) return undefined;
    
    return {
      ...initialData,
      purchaseDate: initialData.purchaseDate ? new Date(initialData.purchaseDate).toISOString().split('T')[0] : '',
      warrantyExpiryDate: initialData.warrantyExpiryDate ? new Date(initialData.warrantyExpiryDate).toISOString().split('T')[0] : '',
      buyPrice: initialData.buyPrice ? initialData.buyPrice.toString() : '',
      lifeSpan: initialData.lifeSpan ? initialData.lifeSpan.toString() : '',
      assignedEmployeeId: initialData.assignedEmployeeId ? initialData.assignedEmployeeId.toString() : '',
    };
  };

  // Initialize form with default values
  const form = useForm<z.infer<typeof assetFormSchema>>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: getFormattedInitialData() || {
      assetId: '',
      type: 'Laptop',
      brand: '',
      modelNumber: '',
      modelName: '',
      serialNumber: '',
      specs: '',
      status: 'Available',
      purchaseDate: new Date().toISOString().split('T')[0],
      buyPrice: '',
      warrantyExpiryDate: '',
      lifeSpan: '',
      outOfBoxOs: '',
      assignedEmployeeId: '',
    },
  });

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof assetFormSchema>) => {
    // Convert string values to appropriate types for submission
    const formattedData = {
      ...values,
      buyPrice: values.buyPrice ? parseFloat(values.buyPrice) : null,
      lifeSpan: values.lifeSpan ? parseInt(values.lifeSpan) : null,
      assignedEmployeeId: values.assignedEmployeeId ? parseInt(values.assignedEmployeeId) : null,
    };
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">{translations.basicInfo}</TabsTrigger>
            <TabsTrigger value="purchase">{translations.purchaseInfo}</TabsTrigger>
            <TabsTrigger value="additional">{translations.additionalInfo}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.assetID}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>{translations.idDesc}</FormDescription>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.type} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Laptop">{translations.laptop}</SelectItem>
                        <SelectItem value="Desktop">{translations.desktop}</SelectItem>
                        <SelectItem value="Mobile">{translations.mobile}</SelectItem>
                        <SelectItem value="Tablet">{translations.tablet}</SelectItem>
                        <SelectItem value="Monitor">{translations.monitor}</SelectItem>
                        <SelectItem value="Printer">{translations.printer}</SelectItem>
                        <SelectItem value="Server">{translations.server}</SelectItem>
                        <SelectItem value="Network">{translations.network}</SelectItem>
                        <SelectItem value="Other">{translations.other}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.brand}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.serialNumber}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.modelNumber}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>{translations.modelNumberDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.modelName}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>{translations.modelNameDesc}</FormDescription>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.status} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Available">{translations.available}</SelectItem>
                        <SelectItem value="In Use">{translations.inUse}</SelectItem>
                        <SelectItem value="Maintenance">{translations.maintenance}</SelectItem>
                        <SelectItem value="Damaged">{translations.damaged}</SelectItem>
                        <SelectItem value="Sold">{translations.sold}</SelectItem>
                        <SelectItem value="Retired">{translations.retired}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specs"
                render={({ field }) => (
                  <FormItem className="col-span-1 sm:col-span-2">
                    <FormLabel>{translations.specs}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ''} rows={3} />
                    </FormControl>
                    <FormDescription>{translations.specsDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="purchase" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.purchaseDate}</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" value={field.value || ''} />
                    </FormControl>
                    <FormDescription>{translations.purchaseDateDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buyPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.buyPrice}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" value={field.value || ''} />
                    </FormControl>
                    <FormDescription>{translations.buyPriceDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warrantyExpiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.warrantyExpiry}</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" value={field.value || ''} />
                    </FormControl>
                    <FormDescription>{translations.warrantyExpiryDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lifeSpan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.lifeSpan}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" value={field.value || ''} />
                    </FormControl>
                    <FormDescription>{translations.lifeSpanDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="additional" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="outOfBoxOs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.outOfBoxOs}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>{translations.outOfBoxOsDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedEmployeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.assignedTo}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.none} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{translations.none}</SelectItem>
                        {employees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.englishName} ({employee.empId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{translations.assignedToDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? translations.submitting : isEditMode ? translations.save : translations.create}
        </Button>
      </form>
    </Form>
  );
}
