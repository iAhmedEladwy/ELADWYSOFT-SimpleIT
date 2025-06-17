import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
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

// Define schema for form validation with proper transformations
const employeeFormSchema = z.object({
  empId: z.string().optional(),
  englishName: z.string().min(2, 'Name must be at least 2 characters'),
  arabicName: z.string().optional().or(z.literal('')),
  department: z.string().min(1, 'Department is required'),
  idNumber: z.string().min(3, 'ID number is required'),
  title: z.string().min(1, 'Job title is required'),
  directManager: z.string().optional().or(z.literal('')),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Intern']),
  joiningDate: z.string(),
  exitDate: z.string().optional().or(z.literal('')),
  status: z.enum(['Active', 'Resigned', 'Terminated', 'On Leave']),
  personalMobile: z.string().optional().or(z.literal('')),
  workMobile: z.string().optional().or(z.literal('')),
  personalEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  corporateEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  userId: z.string().optional().or(z.literal('')),
});

interface EmployeeFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isSubmitting: boolean;
}

export default function EmployeeForm({ onSubmit, initialData, isSubmitting }: EmployeeFormProps) {
  const { language } = useLanguage();
  const isEditMode = !!initialData;

  // Fetch users list for user assignment dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch employees list for manager dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch system configuration for departments
  const { data: systemConfig } = useQuery({
    queryKey: ['/api/system-config'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Translations
  const translations = {
    generalInfo: language === 'English' ? 'General Information' : 'معلومات عامة',
    contactInfo: language === 'English' ? 'Contact Information' : 'معلومات الاتصال',
    employeeID: language === 'English' ? 'Employee ID' : 'رقم الموظف',
    idDesc: language === 'English' ? 'Auto-generated if left blank' : 'يتم إنشاؤه تلقائيًا إذا تُرك فارغًا',
    englishName: language === 'English' ? 'English Name' : 'الاسم بالإنجليزية',
    arabicName: language === 'English' ? 'Arabic Name' : 'الاسم بالعربية',
    arabicNameDesc: language === 'English' ? 'Optional' : 'اختياري',
    department: language === 'English' ? 'Department' : 'القسم',
    idNumber: language === 'English' ? 'ID Number' : 'رقم الهوية',
    idNumberDesc: language === 'English' ? 'National ID, Passport, etc.' : 'الهوية الوطنية أو جواز السفر إلخ',
    jobTitle: language === 'English' ? 'Job Title' : 'المسمى الوظيفي',
    directManager: language === 'English' ? 'Direct Manager' : 'المدير المباشر',
    directManagerDesc: language === 'English' ? 'Optional' : 'اختياري',
    none: language === 'English' ? 'None' : 'لا يوجد',
    employmentType: language === 'English' ? 'Employment Type' : 'نوع التوظيف',
    fullTime: language === 'English' ? 'Full-time' : 'دوام كامل',
    partTime: language === 'English' ? 'Part-time' : 'دوام جزئي',
    contract: language === 'English' ? 'Contract' : 'عقد',
    intern: language === 'English' ? 'Intern' : 'متدرب',
    joiningDate: language === 'English' ? 'Joining Date' : 'تاريخ الالتحاق',
    exitDate: language === 'English' ? 'Exit Date' : 'تاريخ المغادرة',
    exitDateDesc: language === 'English' ? 'Leave blank if not applicable' : 'اتركه فارغًا إذا لم ينطبق',
    status: language === 'English' ? 'Status' : 'الحالة',
    active: language === 'English' ? 'Active' : 'نشط',
    resigned: language === 'English' ? 'Resigned' : 'استقال',
    terminated: language === 'English' ? 'Terminated' : 'تم إنهاء الخدمة',
    onLeave: language === 'English' ? 'On Leave' : 'في إجازة',
    personalMobile: language === 'English' ? 'Personal Mobile' : 'رقم الجوال الشخصي',
    workMobile: language === 'English' ? 'Work Mobile' : 'رقم الجوال الخاص بالعمل',
    personalEmail: language === 'English' ? 'Personal Email' : 'البريد الإلكتروني الشخصي',
    corporateEmail: language === 'English' ? 'Corporate Email' : 'البريد الإلكتروني للشركة',
    userAccount: language === 'English' ? 'User Account' : 'حساب المستخدم',
    userAccountDesc: language === 'English' ? 'Link to a user account for system access' : 'ربط بحساب مستخدم للوصول إلى النظام',
    create: language === 'English' ? 'Create Employee' : 'إنشاء موظف',
    save: language === 'English' ? 'Save Changes' : 'حفظ التغييرات',
    submitting: language === 'English' ? 'Submitting...' : 'جاري الإرسال...',
  };

  // Convert initial data to form format 
  // (convert dates to string format and ids to strings)
  const getFormattedInitialData = () => {
    if (!initialData) return undefined;
    
    console.log('Initial data received:', initialData);
    
    return {
      empId: initialData.employeeId || '',
      englishName: initialData.name || '',
      arabicName: initialData.arabicName || '',
      department: initialData.department || '',
      idNumber: initialData.idNumber || '',
      title: initialData.position || '',
      directManager: initialData.directManager ? initialData.directManager.toString() : '',
      employmentType: initialData.employmentType || 'Full-time',
      joiningDate: initialData.joiningDate ? new Date(initialData.joiningDate).toISOString().split('T')[0] : '',
      exitDate: initialData.exitDate ? new Date(initialData.exitDate).toISOString().split('T')[0] : '',
      status: (initialData.isActive !== false ? 'Active' : 'Resigned') as 'Active' | 'Resigned' | 'Terminated' | 'On Leave',
      personalMobile: initialData.phone || '',
      workMobile: initialData.workMobile || '',
      personalEmail: initialData.email || '',
      corporateEmail: initialData.corporateEmail || '',
      userId: initialData.userId ? initialData.userId.toString() : '',
    };
  };

  // Initialize form with default values
  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      empId: '',
      englishName: '',
      arabicName: '',
      department: '',
      idNumber: '',
      title: '',
      directManager: '',
      employmentType: 'Full-time',
      joiningDate: new Date().toISOString().split('T')[0],
      exitDate: '',
      status: 'Active',
      personalMobile: '',
      workMobile: '',
      personalEmail: '',
      corporateEmail: '',
      userId: '',
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      const formattedData = getFormattedInitialData();
      if (formattedData) {
        form.reset(formattedData);
      }
    } else {
      // Reset to default values for create mode
      form.reset({
        empId: '',
        englishName: '',
        arabicName: '',
        department: '',
        idNumber: '',
        title: '',
        directManager: '',
        employmentType: 'Full-time',
        joiningDate: new Date().toISOString().split('T')[0],
        exitDate: '',
        status: 'Active',
        personalMobile: '',
        workMobile: '',
        personalEmail: '',
        corporateEmail: '',
        userId: '',
      });
    }
  }, [initialData]);

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof employeeFormSchema>) => {
    console.log('Raw form values:', values);
    
    // Format the data for the server according to the database schema
    const formattedData = {
      // Required fields
      englishName: values.englishName,
      department: values.department,
      idNumber: values.idNumber,
      title: values.title,
      employmentType: values.employmentType,
      status: values.status,
      
      // Parse the date strings into proper format
      joiningDate: values.joiningDate || new Date().toISOString().split('T')[0],
      
      // Optional fields with proper null handling
      empId: values.empId || undefined,
      arabicName: values.arabicName || null,
      directManager: values.directManager && values.directManager !== '' ? parseInt(values.directManager) : null,
      exitDate: values.exitDate && values.exitDate !== '' ? values.exitDate : null,
      personalMobile: values.personalMobile || null,
      workMobile: values.workMobile || null,
      personalEmail: values.personalEmail || null,
      corporateEmail: values.corporateEmail || null,
      userId: values.userId && values.userId !== '' ? parseInt(values.userId) : null,
    };
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2 max-h-[60vh] overflow-y-auto px-1">
        <Tabs defaultValue="general">
          <TabsList className="mb-4 grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="general">{translations.generalInfo}</TabsTrigger>
            <TabsTrigger value="contact">{translations.contactInfo}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mx-1">
              <FormField
                control={form.control}
                name="empId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.employeeID}</FormLabel>
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
                name="englishName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.englishName}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arabicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.arabicName}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>{translations.arabicNameDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.department}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.department} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(systemConfig as any)?.departments?.map((dept: string) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                        {(!(systemConfig as any)?.departments || (systemConfig as any)?.departments?.length === 0) && (
                          <SelectItem value="General">General</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {language === 'English' ? 
                        'Select from departments defined in System Configuration' : 
                        'اختر من الأقسام المعرفة في إعدادات النظام'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.idNumber}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>{translations.idNumberDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.jobTitle}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="directManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.directManager}</FormLabel>
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
                        {(employees as any[])?.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.name || employee.englishName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{translations.directManagerDesc}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.employmentType}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.employmentType} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Full-time">{translations.fullTime}</SelectItem>
                        <SelectItem value="Part-time">{translations.partTime}</SelectItem>
                        <SelectItem value="Contract">{translations.contract}</SelectItem>
                        <SelectItem value="Intern">{translations.intern}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="joiningDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.joiningDate}</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.exitDate}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} type="date" />
                    </FormControl>
                    <FormDescription>{translations.exitDateDesc}</FormDescription>
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
                        <SelectItem value="Active">{translations.active}</SelectItem>
                        <SelectItem value="Resigned">{translations.resigned}</SelectItem>
                        <SelectItem value="Terminated">{translations.terminated}</SelectItem>
                        <SelectItem value="On Leave">{translations.onLeave}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mx-1">
              <FormField
                control={form.control}
                name="personalMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.personalMobile}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.workMobile}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personalEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.personalEmail}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="corporateEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.corporateEmail}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.userAccount}</FormLabel>
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
                        {(users as any[])?.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{translations.userAccountDesc}</FormDescription>
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
