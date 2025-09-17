import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
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

// Define schema for form validation
const userFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.string(),
});

interface UserFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isSubmitting: boolean;
}

export default function UserForm({ onSubmit, initialData, isSubmitting }: UserFormProps) {
  const { language } = useLanguage();
  const isEditMode = !!initialData;

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
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: initialData?.username || '',
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      password: '',
      role: initialData?.role || 'employee',
    },
  });

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof userFormSchema>) => {
    // If password is empty and this is an edit form, remove it from the submission
    if (isEditMode && !values.password) {
      const { password, ...dataWithoutPassword } = values;
      onSubmit(dataWithoutPassword);
    } else {
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditMode ? translations.newPassword : translations.password}</FormLabel>
              <FormControl>
                <Input {...field} type="password" />
              </FormControl>
              {isEditMode && <FormDescription>{translations.passwordDesc}</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />

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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? translations.submitting : isEditMode ? translations.save : translations.create}
        </Button>
      </form>
    </Form>
  );
}
