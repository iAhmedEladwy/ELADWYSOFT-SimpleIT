import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/lib/currencyContext';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  type: z.string(),
  brand: z.string().min(1, 'Brand is required'),
  modelNumber: z.string().optional(),
  modelName: z.string().optional(),
  serialNumber: z.string().min(1, 'Serial number is required'),
  specs: z.string().optional(),
  status: z.string(),
  purchaseDate: z.string().optional(),
  buyPrice: z.union([z.string(), z.number()]).optional()
    .transform(value => {
      if (value === "" || value === undefined || value === null) return undefined;
      return typeof value === "string" ? value : String(value);
    })
    .refine(
      (value) => !value || /^\d+(\.\d{1,2})?$/.test(value),
      { message: "Enter a valid price (e.g., 999.99)" }
    ),
  warrantyExpiryDate: z.string().optional()
    .transform(value => value === "" ? undefined : value)
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      { message: "Invalid date format" }
    ),
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
  const { formatCurrency, symbol } = useCurrency();
  const isEditMode = !!initialData;

  // Fetch employees list for assignment dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch custom asset types, brands, and statuses
  const { data: customAssetTypes = [] } = useQuery({
    queryKey: ['/api/custom-asset-types'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: customAssetBrands = [] } = useQuery({
    queryKey: ['/api/custom-asset-brands'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: customAssetStatuses = [] } = useQuery({
    queryKey: ['/api/custom-asset-statuses'],
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
      outOfBoxOs: initialData.outOfBoxOs || '',
      assignedEmployeeId: initialData.assignedEmployeeId ? initialData.assignedEmployeeId.toString() : '',
    };
  };

  // Initialize form with default values
  const form = useForm<z.infer<typeof assetFormSchema>>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: getFormattedInitialData() || {
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
              {/* Asset ID is auto-generated, removed input field */}

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
                        <ScrollArea className="h-72">
                          {/* Custom asset types only */}
                          {customAssetTypes && customAssetTypes.length > 0 ? (
                            customAssetTypes.map((type: any) => (
                              <SelectItem key={type.id} value={type.name}>
                                {type.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              {language === 'English' ? 'No asset types configured' : 'لا توجد أنواع أصول مكونة'}
                            </div>
                          )}
                          
                          {/* Other option */}
                          <SelectItem value="Other">
                            {language === 'English' ? 'Other' : 'أخرى'}
                          </SelectItem>
                        </ScrollArea>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.brand} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-72">
                          {/* Custom brands only */}
                          {customAssetBrands && customAssetBrands.length > 0 ? (
                            customAssetBrands.map((brand: any) => (
                              <SelectItem key={brand.id} value={brand.name}>
                                {brand.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              {language === 'English' ? 'No brands configured' : 'لا توجد علامات تجارية مكونة'}
                            </div>
                          )}
                          
                          {/* Other option */}
                          <SelectItem value="Other">
                            {language === 'English' ? 'Other' : 'أخرى'}
                          </SelectItem>
                        </ScrollArea>
                      </SelectContent>
                    </Select>
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
                        <ScrollArea className="h-72">
                          {/* Custom statuses only */}
                          {customAssetStatuses && customAssetStatuses.length > 0 ? (
                            customAssetStatuses.map((status: any) => (
                              <SelectItem 
                                key={status.id} 
                                value={status.name}
                                className="flex items-center"
                              >
                                {status.color && (
                                  <span 
                                    className="w-3 h-3 rounded-full inline-block mr-2" 
                                    style={{ backgroundColor: status.color }}
                                  />
                                )}
                                {status.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              {language === 'English' ? 'No statuses configured' : 'لا توجد حالات مكونة'}
                            </div>
                          )}
                        </ScrollArea>
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
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500">{symbol}</span>
                        </div>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01" 
                          value={field.value || ''} 
                          className="pl-8" 
                        />
                      </div>
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
                    <FormLabel>{language === 'English' ? 'Installed OS' : 'نظام التشغيل المثبت'}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''} 
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder={language === 'English' ? 'e.g., Windows 11 Pro, Ubuntu 22.04' : 'مثال: Windows 11 Pro، Ubuntu 22.04'} 
                      />
                    </FormControl>
                    <FormDescription>{language === 'English' ? 'Operating system currently installed on the asset (optional)' : 'نظام التشغيل المثبت حالياً على الأصل (اختياري)'}</FormDescription>
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
                        <SelectItem value="none">{translations.none}</SelectItem>
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
