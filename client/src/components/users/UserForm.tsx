import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
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

interface UserFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isSubmitting: boolean;
}

export default function UserForm({ onSubmit, initialData, isSubmitting }: UserFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isEditMode = !!initialData;
  const isSuperAdmin = user?.role === 'super_admin';

  // Define schema that adapts based on edit mode
  const getSchema = () => {
    if (isEditMode) {
      // For edit mode, password is optional and not validated
      return z.object({
        username: z.string().min(3, 'Username must be at least 3 characters'),
        email: z.string().email('Please enter a valid email'),
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        password: z.string().optional(),
        role: z.string(),
      });
    } else {
      // For new user mode, password is required
      return z.object({
        username: z.string().min(3, 'Username must be at least 3 characters'),
        email: z.string().email('Please enter a valid email'),
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.string(),
      });
    }
  };

  const schema = getSchema();

  // Translations
  const translations = {
    username: language === 'English' ? 'Username' : 'اسم المستخدم',
    usernameDesc: language === 'English' ? 'The unique identifier for this user' : 'المعرف الفريد لهذا المستخدم',
    firstName: language === 'English' ? 'First Name' : 'الاسم الأول',
    firstNameDesc: language === 'English' ? 'The user\'s first name' : 'الاسم الأول للمستخدم',
    lastName: language === 'English' ? 'Last Name' : 'الاسم الأخير',
    lastNameDesc: language === 'English' ? 'The user\'s last name' : 'الاسم الأخير للمستخدم',
    email: language === 'English' ? 'Email' : 'البريد الإلكتروني',
    emailDesc: language === 'English' ? 'The user\'s email address' : 'عنوان البريد الإلكتروني للمستخدم',
    password: language === 'English' ? 'Password' : 'كلمة المرور',
    passwordDesc: language === 'English' ? 'Leave blank to keep current password' : 'اتركه فارغًا للاحتفاظ بكلمة المرور الحالية',
    newPassword: language === 'English' ? 'New Password' : 'كلمة مرور جديدة',
    role: language === 'English' ? 'Role' : 'الدور',
    roleDesc: language === 'English' ? 'Determines what actions the user can perform' : 'يحدد الإجراءات التي يمكن للمستخدم تنفيذها',
    superAdmin: language === 'English' ? 'Super Admin (System Developer)' : 'مسؤول أعلى (مطور النظام)',
    admin: language === 'English' ? 'Admin (Full Access)' : 'مسؤول (وصول كامل)',
    manager: language === 'English' ? 'Manager (Supervisory)' : 'مدير (إشرافي)',
    agent: language === 'English' ? 'Agent (Tickets & Assets)' : 'وكيل (التذاكر والأصول)',
    employee: language === 'English' ? 'Employee (Basic Access)' : 'موظف (وصول أساسي)',
    selectRole: language === 'English' ? 'Select role' : 'اختر الدور',
    create: language === 'English' ? 'Create User' : 'إنشاء مستخدم',
    save: language === 'English' ? 'Save Changes' : 'حفظ التغييرات',
    submitting: language === 'English' ? 'Submitting...' : 'جاري الإرسال...',
  };

  // Initialize form with default values
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: initialData?.username || '',
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      password: isEditMode ? undefined : '',
      role: initialData?.role || 'employee',
    },
  });

  // Reset form when initialData or edit mode changes
  useEffect(() => {
    form.reset({
      username: initialData?.username || '',
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      password: isEditMode ? undefined : '',
      role: initialData?.role || 'employee',
    });
  }, [initialData, isEditMode, form]);

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof schema>) => {
    console.log('Form submitted with values:', values);
    console.log('Is edit mode:', isEditMode);
    
    if (isEditMode) {
      // For edit mode, exclude password from submission
      const { password, ...dataWithoutPassword } = values;
      onSubmit(dataWithoutPassword);
    } else {
      // For new user, password should be included and validated
      onSubmit(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.username}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>{translations.usernameDesc}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.firstName}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>{translations.firstNameDesc}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.lastName}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>{translations.lastNameDesc}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.email}</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormDescription>{translations.emailDesc}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditMode && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.password}</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.role}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.selectRole} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">{translations.superAdmin}</SelectItem>
                  )}
                  <SelectItem value="admin">{translations.admin}</SelectItem>
                  <SelectItem value="manager">{translations.manager}</SelectItem>
                  <SelectItem value="agent">{translations.agent}</SelectItem>
                  <SelectItem value="employee">{translations.employee}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{translations.roleDesc}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
          onClick={() => console.log('Save button clicked, isSubmitting:', isSubmitting)}
        >
          {isSubmitting ? translations.submitting : isEditMode ? translations.save : translations.create}
        </Button>
      </form>
    </Form>
  );
}
