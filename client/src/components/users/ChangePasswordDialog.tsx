import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Key } from 'lucide-react';

// Define schema for password change validation
const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSubmit: (userId: number, newPassword: string) => void;
  isSubmitting: boolean;
}

export default function ChangePasswordDialog({ 
  open, 
  onOpenChange, 
  user, 
  onSubmit, 
  isSubmitting 
}: ChangePasswordDialogProps) {
  const { language } = useLanguage();

  // Translations
  const translations = {
    title: language === 'English' ? 'Change Password' : 'تغيير كلمة المرور',
    description: language === 'English' 
      ? 'Change the password for the selected user' 
      : 'تغيير كلمة المرور للمستخدم المحدد',
    userInfo: language === 'English' 
      ? 'Changing password for' 
      : 'تغيير كلمة المرور لـ',
    newPassword: language === 'English' ? 'New Password' : 'كلمة المرور الجديدة',
    confirmPassword: language === 'English' ? 'Confirm Password' : 'تأكيد كلمة المرور',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    changePassword: language === 'English' ? 'Change Password' : 'تغيير كلمة المرور',
    changing: language === 'English' ? 'Changing...' : 'جاري التغيير...',
  };

  // Initialize form
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof changePasswordSchema>) => {
    onSubmit(user.id, values.newPassword);
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {translations.title}
          </DialogTitle>
          <DialogDescription>
            {translations.description}
          </DialogDescription>
        </DialogHeader>
        
        {user && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              {translations.userInfo}:
            </p>
            <p className="font-medium">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.username}
            </p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.newPassword}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.confirmPassword}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                {translations.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? translations.changing : translations.changePassword}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}