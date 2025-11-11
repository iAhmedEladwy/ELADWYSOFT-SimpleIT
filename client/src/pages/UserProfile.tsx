import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/hooks/use-language';
import { SecurityQuestionsSettings } from '@/components/users/SecurityQuestionsSettings';
import { NotificationPreferences } from '@/components/users/NotificationPreferences';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Key, User as UserIcon, Save, Bell } from 'lucide-react';

export default function UserProfile() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Translation constants
  const translations = {
    title: language === 'English' ? 'User Profile' : 'الملف الشخصي للمستخدم',
    subtitle: language === 'English'
      ? 'Manage your account settings and security preferences'
      : 'إدارة إعدادات حسابك وتفضيلات الأمان',
    passwordTab: language === 'English' ? 'Change Password' : 'تغيير كلمة المرور',
    securityQuestionsTab: language === 'English' ? 'Security Questions' : 'أسئلة الأمان',
    notificationsTab: language === 'English' ? 'Notifications' : 'الإشعارات',
    profileTab: language === 'English' ? 'Profile' : 'الملف الشخصي',
    currentPassword: language === 'English' ? 'Current Password' : 'كلمة المرور الحالية',
    newPassword: language === 'English' ? 'New Password' : 'كلمة المرور الجديدة',
    confirmPassword: language === 'English' ? 'Confirm Password' : 'تأكيد كلمة المرور',
    save: language === 'English' ? 'Save Changes' : 'حفظ التغييرات',
    saving: language === 'English' ? 'Saving...' : 'جاري الحفظ...',
    successTitle: language === 'English' ? 'Password Updated' : 'تم تحديث كلمة المرور',
    successMsg: language === 'English'
      ? 'Your password has been changed successfully'
      : 'تم تغيير كلمة المرور الخاصة بك بنجاح',
    errorTitle: language === 'English' ? 'Error' : 'خطأ',
    passwordMismatch: language === 'English'
      ? 'New password and confirmation do not match'
      : 'كلمة المرور الجديدة والتأكيد غير متطابقين',
    passwordError: language === 'English'
      ? 'Please fill in all password fields'
      : 'يرجى ملء جميع حقول كلمة المرور',
    invalidCurrentPassword: language === 'English'
      ? 'Current password is incorrect'
      : 'كلمة المرور الحالية غير صحيحة',
    username: language === 'English' ? 'Username' : 'اسم المستخدم',
    firstName: language === 'English' ? 'First Name' : 'الاسم الأول',
    lastName: language === 'English' ? 'Last Name' : 'الاسم الأخير',
    email: language === 'English' ? 'Email' : 'البريد الإلكتروني',
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: translations.errorTitle,
        description: translations.passwordError,
        variant: 'destructive'
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: translations.errorTitle,
        description: translations.passwordMismatch,
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/user/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.ok) {
        toast({
          title: translations.successTitle,
          description: translations.successMsg
        });
        
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        
        if (response.status === 401) {
          toast({
            title: translations.errorTitle,
            description: translations.invalidCurrentPassword,
            variant: 'destructive'
          });
        } else {
          toast({
            title: translations.errorTitle,
            description: data.message || 'An error occurred',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: translations.errorTitle,
        description: 'An error occurred while changing your password',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{translations.title}</h1>
          <p className="text-muted-foreground">{translations.subtitle}</p>
        </div>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-4">
          <TabsTrigger value="profile">
            <UserIcon className="h-4 w-4 mr-2" />
            {translations.profileTab}
          </TabsTrigger>
          <TabsTrigger value="password">
            <Key className="h-4 w-4 mr-2" />
            {translations.passwordTab}
          </TabsTrigger>
          <TabsTrigger value="security-questions">
            <Key className="h-4 w-4 mr-2" />
            {translations.securityQuestionsTab}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            {translations.notificationsTab}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{translations.profileTab}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'View and update your profile information' 
                  : 'عرض وتحديث معلومات ملفك الشخصي'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{translations.firstName}</Label>
                  <Input 
                    id="firstName" 
                    value={user?.firstName || ''} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{translations.lastName}</Label>
                  <Input 
                    id="lastName" 
                    value={user?.lastName || ''} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">{translations.username}</Label>
                  <Input 
                    id="username" 
                    value={user?.username || ''} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{translations.email}</Label>
                  <Input 
                    id="email" 
                    value={user?.email || ''} 
                    disabled 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="password" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{translations.passwordTab}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Change your password to keep your account secure' 
                  : 'تغيير كلمة المرور للحفاظ على أمان حسابك'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">{translations.currentPassword}</Label>
                  <Input 
                    id="current-password" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">{translations.newPassword}</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{translations.confirmPassword}</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="mt-4">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {translations.saving}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {translations.save}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security-questions" className="mt-6">
          <SecurityQuestionsSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}