import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Bell } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface NotificationPreferencesData {
  ticketAssignments: boolean;
  ticketStatusChanges: boolean;
  assetAssignments: boolean;
  maintenanceAlerts: boolean;
  upgradeRequests: boolean;
  systemAnnouncements: boolean;
  employeeChanges: boolean;
}

export function NotificationPreferences() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferencesData>({
    ticketAssignments: true,
    ticketStatusChanges: true,
    assetAssignments: true,
    maintenanceAlerts: true,
    upgradeRequests: true,
    systemAnnouncements: true,
    employeeChanges: true,
  });

  const t = {
    title: language === 'English' ? 'Notification Preferences' : 'تفضيلات الإشعارات',
    description: language === 'English' 
      ? 'Control which notifications you want to receive' 
      : 'تحكم في الإشعارات التي تريد استلامها',
    ticketAssignments: language === 'English' ? 'Ticket Assignments' : 'تعيينات التذاكر',
    ticketAssignmentsDesc: language === 'English' 
      ? 'When a ticket is assigned to you' 
      : 'عند تعيين تذكرة لك',
    ticketStatusChanges: language === 'English' ? 'Ticket Status Changes' : 'تغييرات حالة التذكرة',
    ticketStatusChangesDesc: language === 'English' 
      ? 'When tickets you created or are assigned to change status' 
      : 'عند تغيير حالة التذاكر التي أنشأتها أو المعينة لك',
    assetAssignments: language === 'English' ? 'Asset Assignments' : 'تعيينات الأصول',
    assetAssignmentsDesc: language === 'English' 
      ? 'When assets are assigned to or returned from you' 
      : 'عند تعيين الأصول لك أو إرجاعها منك',
    maintenanceAlerts: language === 'English' ? 'Maintenance Alerts' : 'تنبيهات الصيانة',
    maintenanceAlertsDesc: language === 'English' 
      ? 'When your assigned assets require maintenance' 
      : 'عند حاجة الأصول المعينة لك للصيانة',
    upgradeRequests: language === 'English' ? 'Upgrade Requests' : 'طلبات الترقية',
    upgradeRequestsDesc: language === 'English' 
      ? 'Updates on upgrade requests and approvals' 
      : 'تحديثات على طلبات الترقية والموافقات',
    systemAnnouncements: language === 'English' ? 'System Announcements' : 'إعلانات النظام',
    systemAnnouncementsDesc: language === 'English' 
      ? 'Important system-wide announcements from administrators' 
      : 'إعلانات مهمة على مستوى النظام من المسؤولين',
    employeeChanges: language === 'English' ? 'Employee Changes' : 'تغييرات الموظفين',
    employeeChangesDesc: language === 'English' 
      ? 'Changes to employee records (managers/admins only)' 
      : 'تغييرات في سجلات الموظفين (للمديرين/المسؤولين فقط)',
    save: language === 'English' ? 'Save Preferences' : 'حفظ التفضيلات',
    saving: language === 'English' ? 'Saving...' : 'جاري الحفظ...',
    successTitle: language === 'English' ? 'Preferences Saved' : 'تم حفظ التفضيلات',
    successMsg: language === 'English' 
      ? 'Your notification preferences have been updated' 
      : 'تم تحديث تفضيلات الإشعارات الخاصة بك',
    errorTitle: language === 'English' ? 'Error' : 'خطأ',
    errorMsg: language === 'English' 
      ? 'Failed to save preferences. Please try again.' 
      : 'فشل حفظ التفضيلات. يرجى المحاولة مرة أخرى.',
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferencesData) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiRequest('/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });

      toast({
        title: t.successTitle,
        description: t.successMsg,
      });
    } catch (error) {
      toast({
        title: t.errorTitle,
        description: t.errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const preferenceItems: Array<{
    key: keyof NotificationPreferencesData;
    label: string;
    description: string;
  }> = [
    { key: 'ticketAssignments', label: t.ticketAssignments, description: t.ticketAssignmentsDesc },
    { key: 'ticketStatusChanges', label: t.ticketStatusChanges, description: t.ticketStatusChangesDesc },
    { key: 'assetAssignments', label: t.assetAssignments, description: t.assetAssignmentsDesc },
    { key: 'maintenanceAlerts', label: t.maintenanceAlerts, description: t.maintenanceAlertsDesc },
    { key: 'upgradeRequests', label: t.upgradeRequests, description: t.upgradeRequestsDesc },
    { key: 'systemAnnouncements', label: t.systemAnnouncements, description: t.systemAnnouncementsDesc },
    { key: 'employeeChanges', label: t.employeeChanges, description: t.employeeChangesDesc },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preferenceItems.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between space-x-2 py-3 border-b last:border-0">
            <div className="flex-1">
              <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                {label}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <Switch
              id={key}
              checked={preferences[key]}
              onCheckedChange={() => handleToggle(key)}
            />
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.saving}
            </>
          ) : (
            t.save
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
