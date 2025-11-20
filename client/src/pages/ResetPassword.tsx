import { useState, useEffect } from 'react';
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

// Schema for password reset
const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenExpired, setTokenExpired] = useState(false);
  const { language } = useLanguage();
  
  // Get the token from the URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  // Determine translations based on language
  const translations = {
    title: language === 'English' ? 'Reset Password' : 'إعادة تعيين كلمة المرور',
    subtitle: language === 'English' ? 'Create a new password' : 'إنشاء كلمة مرور جديدة',
    newPassword: language === 'English' ? 'New Password' : 'كلمة المرور الجديدة',
    confirmPassword: language === 'English' ? 'Confirm Password' : 'تأكيد كلمة المرور',
    requirements: language === 'English' 
      ? 'Password must be at least 8 characters and contain both letters and numbers' 
      : 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل وتحتوي على أحرف وأرقام',
    resetButton: language === 'English' ? 'Reset Password' : 'إعادة تعيين كلمة المرور',
    backToLogin: language === 'English' ? 'Back to Login' : 'العودة إلى تسجيل الدخول',
    requestNewLink: language === 'English' ? 'Request New Link' : 'طلب رابط جديد',
    successTitle: language === 'English' ? 'Password Reset Complete' : 'اكتمل إعادة تعيين كلمة المرور',
    successMessage: language === 'English' 
      ? 'Your password has been reset successfully. You can now login with your new password.' 
      : 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.',
    invalidToken: language === 'English' ? 'Link Expired or Already Used' : 'انتهت صلاحية الرابط أو تم استخدامه',
    expiredMessage: language === 'English' 
      ? 'This password reset link has expired or has already been used. Please request a new password reset link.' 
      : 'انتهت صلاحية رابط إعادة تعيين كلمة المرور هذا أو تم استخدامه بالفعل. يرجى طلب رابط إعادة تعيين كلمة مرور جديد.',
    resetError: language === 'English' ? 'Failed to reset password' : 'فشل في إعادة تعيين كلمة المرور',
    tryAgain: language === 'English' ? 'Please try again' : 'يرجى المحاولة مرة أخرى',
    noToken: language === 'English' 
      ? 'No reset token provided. Please request a new password reset link.' 
      : 'لم يتم تقديم رمز إعادة التعيين. يرجى طلب رابط إعادة تعيين كلمة المرور الجديد.',
  };

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        // Make a lightweight validation request
        const response = await fetch('/api/forgot-password/validate-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
          setTokenExpired(true);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setTokenExpired(true);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Form setup
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle reset password
  const onResetPassword = async (values: z.infer<typeof resetPasswordSchema>) => {
    if (!token) {
      toast({
        title: translations.invalidToken,
        description: translations.noToken,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token,
          newPassword: values.newPassword,
          language
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check if it's an expired/used token error
        if (data.expired) {
          toast({
            title: language === 'English' ? 'Link Expired' : 'انتهت صلاحية الرابط',
            description: data.message,
            variant: 'destructive',
            duration: 6000,
          });
          // Redirect to forgot password page after 2 seconds
          setTimeout(() => {
            navigate('/forgot-password');
          }, 2000);
          return;
        }
        
        throw new Error(data.message || 'Failed to reset password');
      }
      
      setIsComplete(true);
      
      toast({
        title: translations.successTitle,
        description: translations.successMessage,
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: translations.resetError,
        description: error.message || translations.tryAgain,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If no token is provided or token is expired, show error
  if (!token || tokenExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-red-600">
              {translations.invalidToken}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              {tokenExpired ? translations.expiredMessage : translations.noToken}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="default"
                onClick={() => navigate('/forgot-password')}
                className="w-full"
              >
                {translations.requestNewLink}
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
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-gray-600">
                {language === 'English' ? 'Validating reset link...' : 'التحقق من صحة رابط إعادة التعيين...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-lg">
          {!isComplete ? (
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
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                    <FormField
                      control={resetPasswordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{translations.newPassword}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            {translations.requirements}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={resetPasswordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{translations.confirmPassword}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col space-y-2">
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            <span>{translations.resetButton}...</span>
                          </div>
                        ) : (
                          translations.resetButton
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
                  {translations.successTitle}
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
                    {translations.successMessage}
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