import { useState } from 'react';
import { useLocation } from 'wouter';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { apiRequest } from '@/lib/queryClient';

// Schema for email-based password reset
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPassword() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { language } = useLanguage();

  // Determine translations based on language
  const translations = {
    title: language === 'English' ? 'Forgot Password' : 'نسيت كلمة المرور',
    subtitle: language === 'English' ? 'Reset your password via email' : 'إعادة تعيين كلمة المرور عبر البريد الإلكتروني',
    emailLabel: language === 'English' ? 'Email Address' : 'عنوان البريد الإلكتروني',
    enterEmail: language === 'English' ? 'Enter your email address to receive a password reset link' : 'أدخل عنوان بريدك الإلكتروني لتلقي رابط إعادة تعيين كلمة المرور',
    sendButton: language === 'English' ? 'Send Reset Link' : 'إرسال رابط إعادة التعيين',
    backToLogin: language === 'English' ? 'Back to Login' : 'العودة إلى تسجيل الدخول',
    emailSentTitle: language === 'English' ? 'Reset Link Sent' : 'تم إرسال رابط إعادة التعيين',
    emailSentMessage: language === 'English' ? 'If this email exists in our system, a password reset link has been sent to your email address.' : 'إذا كان هذا البريد الإلكتروني موجود في نظامنا، فقد تم إرسال رابط إعادة تعيين كلمة المرور إلى عنوان بريدك الإلكتروني.',
    checkInbox: language === 'English' ? 'Please check your inbox and follow the instructions in the email.' : 'يرجى فحص صندوق الوارد الخاص بك واتباع التعليمات في البريد الإلكتروني.',
    tryAgain: language === 'English' ? 'Please try again' : 'يرجى المحاولة مرة أخرى',
    resetError: language === 'English' ? 'Failed to send reset email' : 'فشل في إرسال بريد إعادة التعيين',
  };

  // Form setup for email-based reset
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Handle email-based password reset
  const onForgotPassword = async (values: z.infer<typeof forgotPasswordSchema>) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('/api/forgot-password', 'POST', {
        email: values.email
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reset email');
      }
      
      // Show success message regardless of whether email exists (security)
      setEmailSent(true);
      
      toast({
        title: translations.emailSentTitle,
        description: translations.emailSentMessage,
      });
      
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: translations.resetError,
        description: error.message || translations.tryAgain,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-lg">
          {!emailSent ? (
            <>
              <CardHeader className="space-y-1">
                <div className="flex flex-col items-center justify-center mb-4">
                  <h1 className="text-primary font-bold text-3xl">ELADWYSOFT</h1>
                  <h2 className="text-gray-600 text-xl">SimpleIT</h2>
                </div>
                <CardTitle className="text-2xl font-bold text-center">{translations.title}</CardTitle>
                <p className="text-center text-sm text-gray-600">
                  {translations.subtitle}
                </p>
              </CardHeader>
              <CardContent>
                <Form {...forgotPasswordForm}>
                  <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{translations.emailLabel}</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="admin@simpleit.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            {translations.enterEmail}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col space-y-2">
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            <span>{translations.sendButton}...</span>
                          </div>
                        ) : (
                          translations.sendButton
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/login')}
                        className="w-full"
                      >
                        {translations.backToLogin}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <div className="flex flex-col items-center justify-center mb-4">
                  <h1 className="text-primary font-bold text-3xl">ELADWYSOFT</h1>
                  <h2 className="text-gray-600 text-xl">SimpleIT</h2>
                </div>
                <CardTitle className="text-2xl font-bold text-center text-green-600">
                  {translations.emailSentTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {translations.emailSentMessage}
                  </p>
                  <p className="text-sm text-gray-600">
                    {translations.checkInbox}
                  </p>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  {translations.backToLogin}
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}