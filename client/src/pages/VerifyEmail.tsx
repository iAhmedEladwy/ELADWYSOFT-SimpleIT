/**
 * Email Verification Page
 * 
 * Completes employee registration by verifying token and creating user account.
 * Accessed via link in verification email.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Extract token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const translations = {
    title: language === 'English' ? 'Complete Your Registration' : 'أكمل تسجيلك',
    description: language === 'English' 
      ? 'Create your account to access SimpleIT' 
      : 'أنشئ حسابك للوصول إلى SimpleIT',
    firstName: language === 'English' ? 'First Name' : 'الاسم الأول',
    lastName: language === 'English' ? 'Last Name' : 'اسم العائلة',
    username: language === 'English' ? 'Username' : 'اسم المستخدم',
    password: language === 'English' ? 'Password' : 'كلمة المرور',
    confirmPassword: language === 'English' ? 'Confirm Password' : 'تأكيد كلمة المرور',
    createAccount: language === 'English' ? 'Create Account' : 'إنشاء حساب',
    creating: language === 'English' ? 'Creating Account...' : 'جاري إنشاء الحساب...',
    successTitle: language === 'English' ? 'Account Created!' : 'تم إنشاء الحساب!',
    successMessage: language === 'English'
      ? 'Your account has been created successfully. You can now log in.'
      : 'تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول.',
    goToLogin: language === 'English' ? 'Go to Login' : 'الذهاب لتسجيل الدخول',
    invalidToken: language === 'English' ? 'Invalid or Expired Token' : 'رمز غير صالح أو منتهي الصلاحية',
    passwordMismatch: language === 'English' ? 'Passwords do not match' : 'كلمات المرور غير متطابقة',
    passwordMinLength: language === 'English' ? 'Password must be at least 8 characters' : 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
    usernameMinLength: language === 'English' ? 'Username must be at least 3 characters' : 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل',
    validatingToken: language === 'English' ? 'Validating your verification link...' : 'جاري التحقق من رابط التحقق...',
  };

  // Validate token on mount
  const { data: tokenValidation, isLoading: validating, error: tokenError } = useQuery({
    queryKey: ['validate-token', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');
      
      const response = await fetch(`/api/auth/validate-token/${token}`);
      const data = await response.json();
      
      if (!data.valid) {
        throw new Error(data.message || 'Invalid token');
      }
      
      return data;
    },
    enabled: !!token,
    retry: false,
  });

  const verifyMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      return data;
    },
    onSuccess: () => {
      setRegistrationComplete(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (password !== confirmPassword) {
      verifyMutation.reset();
      return;
    }

    if (password.length < 8) {
      return;
    }

    if (username.length < 3) {
      return;
    }

    verifyMutation.mutate({
      token,
      username: username.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-600">{translations.validatingToken}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (tokenError || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-center text-2xl">{translations.invalidToken}</CardTitle>
            <CardDescription className="text-center">
              {tokenError?.message || 'The verification link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setLocation('/register')}
            >
              {language === 'English' ? 'Request New Link' : 'طلب رابط جديد'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Success state
  if (registrationComplete) {
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
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => setLocation('/login')}
            >
              {translations.goToLogin}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{translations.title}</CardTitle>
          <CardDescription>{translations.description}</CardDescription>
          {tokenValidation?.employee && (
            <Alert>
              <AlertDescription>
                {language === 'English' 
                  ? `Welcome, ${tokenValidation.employee.englishName}!`
                  : `مرحباً، ${tokenValidation.employee.englishName}!`
                }
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{translations.firstName}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={verifyMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{translations.lastName}</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={verifyMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">{translations.username}</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                disabled={verifyMutation.isPending}
              />
              {username.length > 0 && username.length < 3 && (
                <p className="text-sm text-red-500">{translations.usernameMinLength}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{translations.password}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={verifyMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-sm text-red-500">{translations.passwordMinLength}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{translations.confirmPassword}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={verifyMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-500">{translations.passwordMismatch}</p>
              )}
            </div>

            {verifyMutation.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {verifyMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={
                verifyMutation.isPending || 
                password !== confirmPassword || 
                password.length < 8 ||
                username.length < 3
              }
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translations.creating}
                </>
              ) : (
                translations.createAccount
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
