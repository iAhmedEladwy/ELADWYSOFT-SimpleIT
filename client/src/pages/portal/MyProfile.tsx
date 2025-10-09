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

import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Building, Briefcase, Calendar } from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';
import { useEmployeeLink } from '@/hooks/use-employee-link';
import EmployeeLinkRequired from '@/components/portal/EmployeeLinkRequired';

export default function MyProfile() {
  const { language } = useLanguage();
  const { canAccessPortal, needsEmployeeLink, availableEmployees, isLoading: isEmployeeLoading } = useEmployeeLink();

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
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  {translations.contactInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {translations.corporateEmail}
                  </label>
                  <p className="break-all">{profile.corporateEmail || translations.notProvided}</p>
                </div>

                {profile.personalEmail && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {translations.personalEmail}
                    </label>
                    <p className="break-all">{profile.personalEmail}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {translations.workMobile}
                  </label>
                  <p>{profile.workMobile || translations.notProvided}</p>
                </div>

                {profile.personalMobile && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {translations.personalMobile}
                    </label>
                    <p>{profile.personalMobile}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}