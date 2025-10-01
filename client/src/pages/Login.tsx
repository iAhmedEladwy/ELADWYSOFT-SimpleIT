import { useState, useEffect } from 'react';
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
  username: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Get translations based on language
  const translations = {
    title: language === 'English' ? 'Login' : 'تسجيل الدخول',
    username: language === 'English' ? 'Username or Email' : 'اسم المستخدم أو البريد الإلكتروني',
    password: language === 'English' ? 'Password' : 'كلمة المرور',
    loginButton: language === 'English' ? 'Login' : 'تسجيل الدخول',
    usernameRequired: language === 'English' ? 'Username or Email is required' : 'اسم المستخدم أو البريد الإلكتروني مطلوب',
    passwordRequired: language === 'English' ? 'Password is required' : 'كلمة المرور مطلوبة',
    loginSuccess: language === 'English' ? 'Login successful' : 'تم تسجيل الدخول بنجاح',
    welcomeBack: language === 'English' ? 'Welcome back!' : 'مرحبا بعودتك!',
    loginFailed: language === 'English' ? 'Login failed' : 'فشل تسجيل الدخول',
    invalidCredentials: language === 'English' ? 'Invalid username/email or password' : 'اسم المستخدم/البريد الإلكتروني أو كلمة المرور غير صحيحة',
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
      
      // Attempt login
      const result = await login(values.username, values.password);
      
      toast({
        title: translations.loginSuccess,
        description: translations.welcomeBack,
      });
      
      // Navigate to dashboard - the authContext handles the user data fetch
      navigate('/');
      
    } catch (error) {
      
      // Enhanced error handling with network detection
      let errorTitle = translations.loginFailed;
      let errorDescription = translations.invalidCredentials;
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
          errorDescription = language === 'English' 
            ? 'Network error. Please check your connection and try again.' 
            : 'خطأ في الشبكة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorDescription = language === 'English' 
            ? 'Invalid username/email or password. Please try again.' 
            : 'اسم المستخدم/البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.';
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center justify-center mb-4">
            <h1 className="text-primary font-bold text-3xl">ELADWYSOFT</h1>
            <h2 className="text-gray-600 text-xl">SimpleIT</h2>
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
                      <Input placeholder="eladwy or eladwy.ahmed@example.com" autoComplete="username" {...field} />
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
                      <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mb-2" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>{translations.loginButton}...</span>
                  </div>
                ) : (
                  translations.loginButton
                )}
              </Button>
              
              <div className="text-center">
                <Button 
                  variant="link" 
                  className="text-sm text-primary" 
                  onClick={() => navigate('/forgot-password')}
                  type="button"
                >
                  {language === 'English' ? 'Forgot Password?' : 'نسيت كلمة المرور؟'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-center text-gray-500">
          <p className="w-full">
            Copy right reserved ELADWYSOFT 2025
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
