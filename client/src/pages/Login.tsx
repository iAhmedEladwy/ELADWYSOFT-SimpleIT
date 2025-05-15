import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();

  // Get translations based on language
  const translations = {
    title: language === 'English' ? 'Login to ELADWYSOFT SimpleIT' : 'تسجيل الدخول إلى ELADWYSOFT SimpleIT',
    username: language === 'English' ? 'Username' : 'اسم المستخدم',
    password: language === 'English' ? 'Password' : 'كلمة المرور',
    loginButton: language === 'English' ? 'Login' : 'تسجيل الدخول',
    usernameRequired: language === 'English' ? 'Username is required' : 'اسم المستخدم مطلوب',
    passwordRequired: language === 'English' ? 'Password is required' : 'كلمة المرور مطلوبة',
    loginSuccess: language === 'English' ? 'Login successful' : 'تم تسجيل الدخول بنجاح',
    welcomeBack: language === 'English' ? 'Welcome back!' : 'مرحبا بعودتك!',
    loginFailed: language === 'English' ? 'Login failed' : 'فشل تسجيل الدخول',
    invalidCredentials: language === 'English' ? 'Invalid username or password' : 'اسم المستخدم أو كلمة المرور غير صحيحة',
  };

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      await login(values.username, values.password);
      toast({
        title: translations.loginSuccess,
        description: translations.welcomeBack,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: translations.loginFailed,
        description: translations.invalidCredentials,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <span className="text-primary font-bold text-3xl">ELADWYSOFT</span>
            <span className="text-secondary text-2xl font-semibold ml-2">SimpleIT</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">{translations.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.username}</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.password}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>{translations.loginButton}...</span>
                  </div>
                ) : (
                  translations.loginButton
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-center text-gray-500">
          <p className="w-full">
            Default login: admin / admin123
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
