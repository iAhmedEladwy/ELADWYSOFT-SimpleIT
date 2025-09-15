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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AssetFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isSubmitting: boolean;
}

export default function AssetForm({ onSubmit, initialData, isSubmitting }: AssetFormProps) {
  const { language } = useLanguage();
  const { formatCurrency, symbol } = useCurrency();
  const isEditMode = !!initialData;

  // Translations - moved before createAssetFormSchema to fix initialization order
  const translations = {
    basicInfo: language === 'English' ? 'Basic Information' : 'معلومات أساسية',
    purchaseInfo: language === 'English' ? 'Purchase Information' : 'معلومات الشراء',
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
    network: language === 'English' ? 'Network Equipment' : 'معدات الشبكة',
    accessory: language === 'English' ? 'Accessory' : 'ملحق',
    other: language === 'English' ? 'Other' : 'أخرى',
    brand: language === 'English' ? 'Brand' : 'العلامة التجارية',
    modelNumber: language === 'English' ? 'Model Number' : 'رقم الموديل',
    modelName: language === 'English' ? 'Model Name' : 'اسم الموديل',
    serialNumber: language === 'English' ? 'Serial Number' : 'الرقم التسلسلي',
    technicalSpecs: language === 'English' ? 'Technical Specifications' : 'المواصفات التقنية',
    status: language === 'English' ? 'Status' : 'الحالة',
    available: language === 'English' ? 'Available' : 'متاح',
    inUse: language === 'English' ? 'In Use' : 'قيد الاستخدام',
    maintenance: language === 'English' ? 'Under Maintenance' : 'تحت الصيانة',
    damaged: language === 'English' ? 'Damaged' : 'تالف',
    lost: language === 'English' ? 'Lost' : 'مفقود',
    purchaseDate: language === 'English' ? 'Purchase Date' : 'تاريخ الشراء',
    purchasePrice: language === 'English' ? 'Purchase Price' : 'سعر الشراء',
    warrantyExpiry: language === 'English' ? 'Warranty Expiry Date' : 'تاريخ انتهاء الضمان',
    lifeSpan: language === 'English' ? 'Expected Lifespan (months)' : 'العمر المتوقع (شهور)',
    operatingSystem: language === 'English' ? 'Operating System' : 'نظام التشغيل',
    assignedEmployee: language === 'English' ? 'Assigned Employee' : 'الموظف المخصص',
    selectEmployee: language === 'English' ? 'Select employee...' : 'اختر الموظف...',
    unassigned: language === 'English' ? 'Unassigned' : 'غير مخصص',
    processor: language === 'English' ? 'Processor (CPU)' : 'المعالج',
    memory: language === 'English' ? 'Memory (RAM)' : 'الذاكرة',
    storage: language === 'English' ? 'Storage' : 'التخزين',
    specifications: language === 'English' ? 'Additional Specifications' : 'مواصفات إضافية',
    specsPlaceholder: language === 'English' ? 'Enter additional specifications...' : 'أدخل المواصفات الإضافية...',
    submit: language === 'English' ? 'Submit' : 'إرسال',
    save: language === 'English' ? 'Save Changes' : 'حفظ التغييرات',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    create: language === 'English' ? 'Create Asset' : 'إنشاء أصل',
    update: language === 'English' ? 'Update Asset' : 'تحديث الأصل',
    
    // Additional missing translations
    modelNumberDesc: language === 'English' ? 'Optional' : 'اختياري',
    modelNameDesc: language === 'English' ? 'Optional' : 'اختياري',
    specs: language === 'English' ? 'Specifications' : 'المواصفات',
    specsDesc: language === 'English' ? 'Processor, RAM, Disk, etc.' : 'المعالج، ذاكرة الوصول العشوائي، القرص، إلخ.',
    sold: language === 'English' ? 'Sold' : 'تم بيعه',
    retired: language === 'English' ? 'Retired' : 'متقاعد',
    purchaseDateDesc: language === 'English' ? 'Optional' : 'اختياري',
    buyPrice: language === 'English' ? 'Purchase Price' : 'سعر الشراء',
    buyPriceDesc: language === 'English' ? 'Optional' : 'اختياري',
    warrantyExpiryDesc: language === 'English' ? 'Optional' : 'اختياري',
    lifeSpanDesc: language === 'English' ? 'Expected useful life in months' : 'العمر المتوقع بالأشهر',
    outOfBoxOs: language === 'English' ? 'Factory OS' : 'نظام التشغيل الأصلي',
    outOfBoxOsDesc: language === 'English' ? 'OS that came with the device' : 'نظام التشغيل الذي أتى مع الجهاز',
    assignedTo: language === 'English' ? 'Assigned To' : 'معين إلى',
    assignedToDesc: language === 'English' ? 'Employee using this asset' : 'الموظف الذي يستخدم هذا الأصل',
    none: language === 'English' ? 'None' : 'لا يوجد',
    submitting: language === 'English' ? 'Submitting...' : 'جاري الإرسال...',
    cpu: language === 'English' ? 'CPU' : 'المعالج',
    cpuPlaceholder: language === 'English' ? 'e.g., Intel Core i7-12700H' : 'مثال: Intel Core i7-12700H',
    cpuDesc: language === 'English' ? 'Processor model and specifications' : 'طراز المعالج ومواصفاته',
    ram: language === 'English' ? 'RAM' : 'الذاكرة',
    ramPlaceholder: language === 'English' ? 'e.g., 16GB DDR4' : 'مثال: 16GB DDR4',
    ramDesc: language === 'English' ? 'Memory capacity and type' : 'سعة الذاكرة ونوعها',
    storagePlaceholder: language === 'English' ? 'e.g., 512GB NVMe SSD' : 'مثال: 512GB NVMe SSD',
    storageDesc: language === 'English' ? 'Storage capacity and type' : 'سعة التخزين ونوعه',
    
    // Validation messages
    brandRequired: language === 'English' ? 'Brand is required' : 'العلامة التجارية مطلوبة',
    serialRequired: language === 'English' ? 'Serial number is required' : 'الرقم التسلسلي مطلوب',
    invalidDate: language === 'English' ? 'Invalid date format' : 'تنسيق التاريخ غير صحيح',
    invalidPrice: language === 'English' ? 'Enter a valid price (e.g., 999.99)' : 'أدخل سعرًا صحيحًا (مثال: 999.99)'
  };

  // Create schema with dynamic validation messages based on language
  const createAssetFormSchema = () => z.object({
    type: z.string(),
    brand: z.string().min(1, translations.brandRequired),
    modelNumber: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value),
    modelName: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value),
    serialNumber: z.string().min(1, translations.serialRequired),
    specs: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value),
    status: z.string(),
    purchaseDate: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value)
      .refine(
        (date: string | undefined) => !date || !isNaN(Date.parse(date)),
        { message: translations.invalidDate }
      ),
    buyPrice: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value)
      .refine(
        (value: string | undefined) => !value || /^\d+(\.\d{1,2})?$/.test(value),
        { message: translations.invalidPrice }
      ),
    warrantyExpiryDate: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value)
      .refine(
        (date: string | undefined) => !date || !isNaN(Date.parse(date)),
        { message: translations.invalidDate }
      ),
    lifeSpan: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value),
    outOfBoxOs: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value),
    assignedEmployeeId: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value),
    cpu: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value),
    ram: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value),
    storage: z.string().optional().or(z.literal("")).transform((value: string | undefined) => value === "" ? undefined : value),
  });

  const assetFormSchema = createAssetFormSchema();

  // Fetch employees list for assignment dropdown
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/employees'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch custom asset types, brands, and statuses
  const { data: customAssetTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-types'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: customAssetBrands = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-brands'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: assetStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-statuses'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Convert initial data to form format
  const getFormattedInitialData = () => {
    if (!initialData) return undefined;
    
    return {
      ...initialData,
      // Handle optional fields properly - convert null to empty string for form display
      modelNumber: initialData.modelNumber || '',
      modelName: initialData.modelName || '',
      purchaseDate: initialData.purchaseDate ? new Date(initialData.purchaseDate).toISOString().split('T')[0] : '',
      warrantyExpiryDate: initialData.warrantyExpiryDate ? new Date(initialData.warrantyExpiryDate).toISOString().split('T')[0] : '',
      buyPrice: initialData.buyPrice ? initialData.buyPrice.toString() : '',
      lifeSpan: initialData.lifeSpan ? initialData.lifeSpan.toString() : '',
      outOfBoxOs: initialData.outOfBoxOs || '',
      assignedEmployeeId: initialData.assignedEmployeeId ? initialData.assignedEmployeeId.toString() : '',
      cpu: initialData.cpu || '',
      ram: initialData.ram || '',
      storage: initialData.storage || '',
      specs: initialData.specs || '',
    };
  };

  // State for controlling date picker popovers
  const [purchaseDateOpen, setPurchaseDateOpen] = useState(false);
  const [warrantyDateOpen, setWarrantyDateOpen] = useState(false);

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
      cpu: '',
      ram: '',
      storage: '',
    },
  });

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof assetFormSchema>) => {
    try {
      // Convert string values to appropriate types for submission
      const formattedData = {
        ...values,
        // Handle optional fields - convert undefined to null for database compatibility
        modelNumber: values.modelNumber || null,
        modelName: values.modelName || null,
        buyPrice: values.buyPrice ? parseFloat(values.buyPrice) : null,
        lifeSpan: values.lifeSpan ? parseInt(values.lifeSpan) : null,
        assignedEmployeeId: values.assignedEmployeeId && values.assignedEmployeeId !== 'none' ? parseInt(values.assignedEmployeeId) : null,
        outOfBoxOs: values.outOfBoxOs || null,
        cpu: values.cpu || null,
        ram: values.ram || null,
        storage: values.storage || null,
        specs: values.specs || null,
        purchaseDate: values.purchaseDate || null,
        warrantyExpiryDate: values.warrantyExpiryDate || null,
      };
      
      onSubmit(formattedData);
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">{translations.basicInfo}</TabsTrigger>
            <TabsTrigger value="purchase">{translations.purchaseInfo}</TabsTrigger>
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
                          {/* Flexible asset statuses */}
                          {assetStatuses && assetStatuses.length > 0 ? (
                            assetStatuses.map((status: any) => (
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
                                {status.isDefault && (
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {language === 'English' ? 'Default' : 'افتراضي'}
                                  </span>
                                )}
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

              {/* Hardware Specifications */}
              <FormField
                control={form.control}
                name="cpu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.cpu}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder={translations.cpuPlaceholder} />
                    </FormControl>
                    <FormDescription>{translations.cpuDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.ram}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder={translations.ramPlaceholder} />
                    </FormControl>
                    <FormDescription>{translations.ramDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.storage}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder={translations.storagePlaceholder} />
                    </FormControl>
                    <FormDescription>{translations.storageDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <Popover open={purchaseDateOpen} onOpenChange={setPurchaseDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>{language === 'English' ? 'Pick purchase date' : 'اختر تاريخ الشراء'}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const isoString = date.toISOString().split('T')[0];
                                field.onChange(isoString);
                              }
                              setPurchaseDateOpen(false);
                            }}
                            disabled={(date) =>
                              date > new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                      <Popover open={warrantyDateOpen} onOpenChange={setWarrantyDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>{language === 'English' ? 'Pick warranty expiry date' : 'اختر تاريخ انتهاء الضمان'}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const isoString = date.toISOString().split('T')[0];
                                field.onChange(isoString);
                              }
                              setWarrantyDateOpen(false);
                            }}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
          

        </Tabs>

        {/* Hidden field for assignedEmployeeId to maintain backend compatibility */}
        <input 
          type="hidden" 
          {...form.register('assignedEmployeeId')} 
          value={form.watch('assignedEmployeeId') || ''} 
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? translations.submitting : isEditMode ? translations.save : translations.create}
        </Button>
      </form>
    </Form>
  );
}
