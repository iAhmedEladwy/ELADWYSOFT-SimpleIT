/**
 * Employee Registration Page
 * 
 * Allows employees to self-register by entering their corporate email.
 * System verifies employee exists and sends verification email.
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function Register() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const translations = {
    title: language === 'English' ? 'Employee Registration' : 'تسجيل الموظف',
    description: language === 'English' 
      ? 'Enter your corporate email to create your account' 
      : 'أدخل بريدك الإلكتروني للشركة لإنشاء حسابك',
    emailLabel: language === 'English' ? 'Corporate Email' : 'البريد الإلكتروني للشركة',
    emailPlaceholder: language === 'English' ? 'your.name@company.com' : 'اسمك@الشركة.com',
    submitButton: language === 'English' ? 'Send Verification Email' : 'إرسال بريد التحقق',
    submitting: language === 'English' ? 'Sending...' : 'جاري الإرسال...',
    backToLogin: language === 'English' ? 'Back to Login' : 'العودة لتسجيل الدخول',
    successTitle: language === 'English' ? 'Check Your Email!' : 'تحقق من بريدك الإلكتروني!',
    successMessage: language === 'English'
      ? 'We\'ve sent a verification link to your email. Click the link to complete your registration.'
      : 'لقد أرسلنا رابط التحقق إلى بريدك الإلكتروني. انقر على الرابط لإكمال التسجيل.',
    note: language === 'English'
      ? 'Note: You must be registered as an employee in the system to create an account.'
      : 'ملاحظة: يجب أن تكون مسجلاً كموظف في النظام لإنشاء حساب.',
  };

  const registerMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    },
    onSuccess: () => {
      setEmailSent(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      registerMutation.mutate(email.trim().toLowerCase());
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center text-2xl">{translations.successTitle}</CardTitle>
            <CardDescription className="text-center">
              {translations.successMessage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                {language === 'English' 
                  ? `Verification email sent to: ${email}`
                  : `تم إرسال بريد التحقق إلى: ${email}`
                }
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setLocation('/login')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {translations.backToLogin}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{translations.title}</CardTitle>
          <CardDescription>{translations.description}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{translations.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder={translations.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={registerMutation.isPending}
              />
            </div>

            {registerMutation.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {registerMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertDescription className="text-sm">
                {translations.note}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={registerMutation.isPending || !email.trim()}
            >
              <Mail className="mr-2 h-4 w-4" />
              {registerMutation.isPending ? translations.submitting : translations.submitButton}
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setLocation('/login')}
              type="button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {translations.backToLogin}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
