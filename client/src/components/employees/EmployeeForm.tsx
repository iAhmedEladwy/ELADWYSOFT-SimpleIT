import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import ActiveEmployeeSelect from '@/components/employees/ActiveEmployee';
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
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface EmployeeFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isSubmitting: boolean;
}

export default function EmployeeForm({ onSubmit, initialData, isSubmitting }: EmployeeFormProps) {
  const { language } = useLanguage();
  const isEditMode = !!initialData;

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
    freelance: language === 'English' ? 'Freelance' : 'حر',
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
    general: language === 'English' ? 'General' : 'عام',
    selectDepartments: language === 'English' ? 'Select from departments defined in Settings' : 'اختر من الأقسام المحددة في الإعدادات',
    // Validation messages
    nameMinLength: language === 'English' ? 'Name must be at least 2 characters' : 'يجب أن يكون الاسم على الأقل حرفين',
    departmentRequired: language === 'English' ? 'Department is required' : 'القسم مطلوب',
    idNumberRequired: language === 'English' ? 'ID number is required' : 'رقم الهوية مطلوب',
    jobTitleRequired: language === 'English' ? 'Job title is required' : 'المسمى الوظيفي مطلوب',
    invalidEmail: language === 'English' ? 'Invalid email format' : 'تنسيق البريد الإلكتروني غير صحيح',
  };

  // Define schema for form validation with proper transformations
  const employeeFormSchema = z.object({
    englishName: z.string().min(2, translations.nameMinLength),
    arabicName: z.string().optional().or(z.literal('')),
    department: z.string().min(1, translations.departmentRequired),
    idNumber: z.string().min(3, translations.idNumberRequired),
    title: z.string().min(1, translations.jobTitleRequired),
    directManager: z.string().optional().or(z.literal('')),
    employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Intern','Freelance']),
    joiningDate: z.string(),
    exitDate: z.string().optional().or(z.literal('')),
    status: z.enum(['Active', 'Resigned', 'Terminated', 'On Leave']),
    personalMobile: z.string().optional().or(z.literal('')),
    workMobile: z.string().optional().or(z.literal('')),
    personalEmail: z.string().email(translations.invalidEmail).optional().or(z.literal('')),
    corporateEmail: z.string().email(translations.invalidEmail).optional().or(z.literal('')),
    userId: z.string().optional().or(z.literal('')),
  });

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

  // Convert initial data to form format with proper field mapping
  const getFormattedInitialData = () => {
    if (!initialData) return undefined;
    
    console.log('Initial data for formatting:', initialData);
    
    return {
      englishName: initialData.name || initialData.englishName || '',
      arabicName: initialData.arabicName || '',
      department: initialData.department || '',
      idNumber: initialData.idNumber || '',
      title: initialData.position || initialData.title || '',
      directManager: initialData.directManager ? initialData.directManager.toString() : '',
      employmentType: initialData.employmentType || 'Full-time',
      joiningDate: initialData.joiningDate ? new Date(initialData.joiningDate).toISOString().split('T')[0] : '',
      exitDate: initialData.exitDate ? new Date(initialData.exitDate).toISOString().split('T')[0] : '',
      status: initialData.status || (initialData.isActive !== false ? 'Active' : 'Resigned'),
      personalMobile: initialData.personalMobile || initialData.phone || '',
      workMobile: initialData.workMobile || '',
      personalEmail: initialData.personalEmail || initialData.email || '',
      corporateEmail: initialData.corporateEmail || '',
      userId: initialData.userId ? initialData.userId.toString() : '',
    };
  };

  // State for controlling date picker popovers
  const [joiningDateOpen, setJoiningDateOpen] = useState(false);
  const [exitDateOpen, setExitDateOpen] = useState(false);

  // Initialize form with default values
  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
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
      console.log('Formatted data for form reset:', formattedData);
      if (formattedData) {
        // Reset form with formatted data
        form.reset(formattedData);
      }
    } else {
      // Reset to default values for create mode
      form.reset({
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
  }, [initialData, form]);

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
      arabicName: values.arabicName || null,
      directManager: values.directManager && values.directManager !== '' ? parseInt(values.directManager) : null,
      exitDate: values.exitDate && values.exitDate !== '' ? values.exitDate : null,
      personalMobile: values.personalMobile || null,
      workMobile: values.workMobile || null,
      personalEmail: values.personalEmail || null,
      corporateEmail: values.corporateEmail || null,
      userId: values.userId && values.userId !== '' ? parseInt(values.userId) : null,
    };
    
    // For edit mode, include the empId if it exists in initialData
    if (isEditMode && initialData?.empId) {
      (formattedData as any).empId = initialData.empId;
    }
    
    console.log('Formatted data being sent:', formattedData);
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        <Tabs defaultValue="general">
          <TabsList className="mb-4 grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="general">{translations.generalInfo}</TabsTrigger>
            <TabsTrigger value="contact">{translations.contactInfo}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      value={field.value}
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
                          <SelectItem value="General">{translations.general}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {translations.selectDepartments}
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
                  <FormControl>
                    <ActiveEmployeeSelect
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      placeholder={translations.none}
                      showDepartment={true}
                      showPosition={true}
                      disabled={isSubmitting}
                      dropdownHeight="compact"
                    />
                  </FormControl>
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
                      value={field.value}
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
			                  <SelectItem value="Freelance">{translations.freelance}</SelectItem>
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
                      <Calendar
                        mode="picker"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={language === 'English' ? 'Pick joining date' : 'اختر تاريخ الانضمام'}
                        disabled={(date) => date > new Date()}
                        className="w-full"
                      />
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
                      <Calendar
                        mode="picker"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={language === 'English' ? 'Pick exit date (optional)' : 'اختر تاريخ المغادرة (اختياري)'}
                        className="w-full"
                      />
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
                      value={field.value}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
