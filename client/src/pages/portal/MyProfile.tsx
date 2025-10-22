/**
 * My Profile Page - Employee Portal
 * 
 * Context: SimpleIT v0.4.3 - View employee profile information
 * 
 * Features:
 * - Display employee personal information (read-only)
 * - Show contact details
 * - Department and job title
 * - Bilingual support (English/Arabic)
 * 
 * API Endpoint: GET /api/portal/my-profile
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Building, Briefcase, Calendar, Edit, Save, X, Lock } from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';
import { useEmployeeLink } from '@/hooks/use-employee-link';
import EmployeeLinkRequired from '@/components/portal/EmployeeLinkRequired';

export default function MyProfile() {
  const { language } = useLanguage();
  const { canAccessPortal, needsEmployeeLink, availableEmployees, isLoading: isEmployeeLoading } = useEmployeeLink();
  const queryClient = useQueryClient();
  
  // Edit state management
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    personalEmail: '',
    personalMobile: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const translations = {
    myProfile: language === 'English' ? 'My Profile' : 'ملفي الشخصي',
    personalInfo: language === 'English' ? 'Personal Information' : 'المعلومات الشخصية',
    employeeId: language === 'English' ? 'Employee ID' : 'رقم الموظف',
    englishName: language === 'English' ? 'English Name' : 'الاسم بالإنجليزية',
    arabicName: language === 'English' ? 'Arabic Name' : 'الاسم بالعربية',
    department: language === 'English' ? 'Department' : 'القسم',
    jobTitle: language === 'English' ? 'Job Title' : 'المسمى الوظيفي',
    status: language === 'English' ? 'Status' : 'الحالة',
    contactInfo: language === 'English' ? 'Contact Information' : 'معلومات الاتصال',
    corporateEmail: language === 'English' ? 'Corporate Email' : 'البريد الإلكتروني المؤسسي',
    personalEmail: language === 'English' ? 'Personal Email' : 'البريد الإلكتروني الشخصي',
    workMobile: language === 'English' ? 'Work Mobile' : 'الجوال الخاص بالعمل',
    personalMobile: language === 'English' ? 'Personal Mobile' : 'الجوال الشخصي',
    joiningDate: language === 'English' ? 'Joining Date' : 'تاريخ الانضمام',
    loading: language === 'English' ? 'Loading profile...' : 'جاري تحميل الملف الشخصي...',
    error: language === 'English' ? 'Failed to load profile' : 'فشل تحميل الملف الشخصي',
    notProvided: language === 'English' ? 'Not provided' : 'غير مقدم',
    
    // Edit functionality translations
    edit: language === 'English' ? 'Edit' : 'تعديل',
    save: language === 'English' ? 'Save' : 'حفظ',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    changePassword: language === 'English' ? 'Change Password' : 'تغيير كلمة المرور',
    currentPassword: language === 'English' ? 'Current Password' : 'كلمة المرور الحالية',
    newPassword: language === 'English' ? 'New Password' : 'كلمة المرور الجديدة',
    confirmPassword: language === 'English' ? 'Confirm New Password' : 'تأكيد كلمة المرور الجديدة',
    saving: language === 'English' ? 'Saving...' : 'جاري الحفظ...',
    updateSuccess: language === 'English' ? 'Profile updated successfully' : 'تم تحديث الملف الشخصي بنجاح',
    updateError: language === 'English' ? 'Failed to update profile' : 'فشل تحديث الملف الشخصي',
    passwordMismatch: language === 'English' ? 'Passwords do not match' : 'كلمات المرور غير متطابقة',
    passwordUpdateSuccess: language === 'English' ? 'Password updated successfully' : 'تم تحديث كلمة المرور بنجاح',
    passwordUpdateError: language === 'English' ? 'Failed to update password' : 'فشل تحديث كلمة المرور',
  };

  // Fetch employee profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['/api/portal/my-profile'],
    queryFn: async () => {
      const response = await fetch('/api/portal/my-profile', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      return response.json();
    },
    enabled: canAccessPortal && !isEmployeeLoading,
  });

  // Update contact information mutation
  const updateContactMutation = useMutation({
    mutationFn: async (data: { personalEmail: string; personalMobile: string }) => {
      const response = await fetch('/api/portal/my-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/my-profile'] });
      setIsEditingContact(false);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch('/api/portal/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsEditingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
  });

  // Handler functions
  const handleEditContact = () => {
    if (profile) {
      setEditForm({
        personalEmail: profile.personalEmail || '',
        personalMobile: profile.personalMobile || ''
      });
      setIsEditingContact(true);
    }
  };

  const handleSaveContact = () => {
    if (editForm.personalEmail || editForm.personalMobile) {
      updateContactMutation.mutate(editForm);
    }
  };

  const handleCancelContactEdit = () => {
    setIsEditingContact(false);
    setEditForm({
      personalEmail: '',
      personalMobile: ''
    });
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(translations.passwordMismatch);
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  const handleCancelPasswordEdit = () => {
    setIsEditingPassword(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">{translations.myProfile}</h1>
          <p className="text-gray-600 mt-2">
            {language === 'English' 
              ? 'View your personal and contact information'
              : 'عرض معلوماتك الشخصية ومعلومات الاتصال'}
          </p>
        </div>

        {/* Employee Link Check */}
        {needsEmployeeLink && (
          <EmployeeLinkRequired availableEmployees={availableEmployees} />
        )}

        {/* Loading State */}
        {(isLoading || isEmployeeLoading) && canAccessPortal && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">{translations.loading}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && canAccessPortal && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4">
              <User className="h-5 w-5 text-red-600" />
              <p className="text-red-600">{translations.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Profile Content */}
        {!isLoading && !isEmployeeLoading && !error && profile && canAccessPortal && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {translations.personalInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.employeeId}
                    </label>
                    <p className="font-mono">{profile.empId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.status}
                    </label>
                    <div className="mt-1">
                      <Badge variant={profile.status === 'Active' ? 'default' : 'secondary'}>
                        {profile.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.englishName}
                  </label>
                  <p className="text-lg font-medium">{profile.englishName}</p>
                </div>

                {profile.arabicName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.arabicName}
                    </label>
                    <p className="text-lg font-medium" dir="rtl">{profile.arabicName}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {translations.department}
                    </label>
                    <p>{profile.department}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {translations.jobTitle}
                    </label>
                    <p>{profile.title}</p>
                  </div>
                </div>

                {profile.joiningDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {translations.joiningDate}
                    </label>
                    <p>{new Date(profile.joiningDate).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    {translations.contactInfo}
                  </div>
                  {!isEditingContact && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleEditContact}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      {translations.edit}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {translations.corporateEmail}
                  </label>
                  <p className="break-all text-gray-500">{profile.corporateEmail || translations.notProvided}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'English' ? 'Managed by IT Department' : 'يُديره قسم تكنولوجيا المعلومات'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {translations.personalEmail}
                  </Label>
                  {isEditingContact ? (
                    <Input
                      type="email"
                      value={editForm.personalEmail}
                      onChange={(e) => setEditForm({ ...editForm, personalEmail: e.target.value })}
                      placeholder={language === 'English' ? 'Enter personal email' : 'أدخل البريد الشخصي'}
                      className="mt-1"
                    />
                  ) : (
                    <p className="break-all mt-1">{profile.personalEmail || translations.notProvided}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {translations.workMobile}
                  </label>
                  <p className="text-gray-500">{profile.workMobile || translations.notProvided}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'English' ? 'Managed by IT Department' : 'يُديره قسم تكنولوجيا المعلومات'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {translations.personalMobile}
                  </Label>
                  {isEditingContact ? (
                    <Input
                      type="tel"
                      value={editForm.personalMobile}
                      onChange={(e) => setEditForm({ ...editForm, personalMobile: e.target.value })}
                      placeholder={language === 'English' ? 'Enter personal mobile' : 'أدخل الجوال الشخصي'}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{profile.personalMobile || translations.notProvided}</p>
                  )}
                </div>

                {isEditingContact && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={handleSaveContact}
                      disabled={updateContactMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      <Save className="h-4 w-4" />
                      {updateContactMutation.isPending ? translations.saving : translations.save}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelContactEdit}
                      className="flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      {translations.cancel}
                    </Button>
                  </div>
                )}

                {/* Password Change Section */}
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Lock className="h-4 w-4" />
                      {translations.changePassword}
                    </Label>
                    {!isEditingPassword && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditingPassword(true)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        {translations.edit}
                      </Button>
                    )}
                  </div>

                  {isEditingPassword && (
                    <div className="space-y-3">
                      <div>
                        <Label>{translations.currentPassword}</Label>
                        <Input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>{translations.newPassword}</Label>
                        <Input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>{translations.confirmPassword}</Label>
                        <Input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={handleChangePassword}
                          disabled={changePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword}
                          className="flex items-center gap-1"
                        >
                          <Save className="h-4 w-4" />
                          {changePasswordMutation.isPending ? translations.saving : translations.save}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelPasswordEdit}
                          className="flex items-center gap-1"
                        >
                          <X className="h-4 w-4" />
                          {translations.cancel}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}