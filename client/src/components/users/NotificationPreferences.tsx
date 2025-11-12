import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Bell } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import NotificationSettings from '@/components/notifications/NotificationSettings';

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
  const [savingKey, setSavingKey] = useState<keyof NotificationPreferencesData | null>(null);
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
    saved: language === 'English' ? 'Saved' : 'تم الحفظ',
    errorTitle: language === 'English' ? 'Error' : 'خطأ',
    errorMsg: language === 'English' 
      ? 'Failed to save preference. Please try again.' 
      : 'فشل حفظ التفضيل. يرجى المحاولة مرة أخرى.',
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

  const handleToggle = async (key: keyof NotificationPreferencesData) => {
    const newValue = !preferences[key];
    
    // Optimistically update UI
    setPreferences(prev => ({
      ...prev,
      [key]: newValue
    }));

    try {
      setSavingKey(key);
      
      // Save to server with the new preferences
      const updatedPreferences = {
        ...preferences,
        [key]: newValue
      };
      
      await apiRequest(
        '/api/notifications/preferences',
        'PUT',
        updatedPreferences
      );

      // Show brief success feedback
      toast({
        description: t.saved,
        duration: 2000,
      });
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({
        ...prev,
        [key]: !newValue
      }));
      
      toast({
        title: t.errorTitle,
        description: t.errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
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
    <div className="space-y-6">
      {/* Sound and Polling Settings */}
      <NotificationSettings />
      
      {/* Notification Type Preferences */}
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
              <div className="flex items-center gap-2">
                {savingKey === key && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <Switch
                  id={key}
                  checked={preferences[key]}
                  onCheckedChange={() => handleToggle(key)}
                  disabled={savingKey === key}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
