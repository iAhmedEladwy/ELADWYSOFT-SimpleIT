/**
 * Notification Settings Component
 * Allows users to configure notification preferences including sound
 */

import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { getSoundPreference, setSoundPreference, playNotificationTone } from '@/lib/notificationSound';

export default function NotificationSettings() {
  const { language } = useLanguage();
  const [soundEnabled, setSoundEnabled] = useState(getSoundPreference());

  const t = {
    title: language === 'English' ? 'Notification Settings' : 'إعدادات الإشعارات',
    description: language === 'English' 
      ? 'Configure how you receive notifications'
      : 'قم بتكوين كيفية تلقي الإشعارات',
    soundTitle: language === 'English' ? 'Sound Notifications' : 'إشعارات صوتية',
    soundDescription: language === 'English'
      ? 'Play a sound when new notifications arrive'
      : 'تشغيل صوت عند وصول إشعارات جديدة',
    testSound: language === 'English' ? 'Test Sound' : 'اختبار الصوت',
    enabled: language === 'English' ? 'Enabled' : 'مفعل',
    disabled: language === 'English' ? 'Disabled' : 'معطل',
    pollingTitle: language === 'English' ? 'Auto-Refresh' : 'التحديث التلقائي',
    pollingDescription: language === 'English'
      ? 'Automatically check for new notifications every 30 seconds'
      : 'التحقق تلقائيًا من الإشعارات الجديدة كل 30 ثانية',
    pollingNote: language === 'English'
      ? 'Notifications update automatically without needing to refresh the page'
      : 'يتم تحديث الإشعارات تلقائيًا دون الحاجة إلى تحديث الصفحة',
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setSoundPreference(enabled);
  };

  const handleTestSound = () => {
    playNotificationTone();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sound Settings */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <Label htmlFor="sound-notifications" className="text-base font-medium flex items-center gap-2">
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {t.soundTitle}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t.soundDescription}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestSound}
              disabled={!soundEnabled}
            >
              {t.testSound}
            </Button>
            <Switch
              id="sound-notifications"
              checked={soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>
        </div>

        {/* Auto-Refresh Info */}
        <div className="pt-4 border-t">
          <Label className="text-base font-medium flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            {t.pollingTitle}
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            {t.pollingNote}
          </p>
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              ✓ {t.pollingDescription}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
