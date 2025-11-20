/**
 * Notification Settings Component
 * Allows users to configure notification preferences including sound and Do Not Disturb
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Volume2, VolumeX, RefreshCw, Moon, Clock } from 'lucide-react';
import { getSoundPreference, setSoundPreference, playNotificationTone } from '@/lib/notificationSound';
import { useToast } from '@/hooks/use-toast';

export default function NotificationSettings() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(getSoundPreference());
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStartTime, setDndStartTime] = useState('22:00');
  const [dndEndTime, setDndEndTime] = useState('08:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    dndTitle: language === 'English' ? 'Do Not Disturb' : 'عدم الإزعاج',
    dndDescription: language === 'English'
      ? 'Silence notifications during specific hours every day (e.g., 10 PM - 7 AM)'
      : 'كتم الإشعارات خلال ساعات محددة يوميًا (مثال: 10 مساءً - 7 صباحًا)',
    startTime: language === 'English' ? 'Start Time' : 'وقت البدء',
    endTime: language === 'English' ? 'End Time' : 'وقت الانتهاء',
    save: language === 'English' ? 'Save' : 'حفظ',
    saving: language === 'English' ? 'Saving...' : 'جاري الحفظ...',
    saved: language === 'English' ? 'Settings saved successfully' : 'تم حفظ الإعدادات بنجاح',
    error: language === 'English' ? 'Failed to save settings' : 'فشل حفظ الإعدادات',
  };

  useEffect(() => {
    loadDndSettings();
  }, []);

  const loadDndSettings = async () => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        credentials: 'include',
      });
      if (response.ok) {
        const prefs = await response.json();
        setDndEnabled(prefs.dndEnabled || false);
        setDndStartTime(prefs.dndStartTime || '22:00');
        setDndEndTime(prefs.dndEndTime || '08:00');
      }
    } catch (error) {
      console.error('Failed to load DND settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setSoundPreference(enabled);
  };

  const handleTestSound = () => {
    playNotificationTone();
  };

  const handleDndToggle = async (enabled: boolean) => {
    setDndEnabled(enabled);
    await saveDndSettings(enabled, dndStartTime, dndEndTime);
  };

  const handleTimeChange = async () => {
    await saveDndSettings(dndEnabled, dndStartTime, dndEndTime);
  };

  const saveDndSettings = async (enabled: boolean, start: string, end: string) => {
    try {
      setSaving(true);
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dndEnabled: enabled,
          dndStartTime: start,
          dndEndTime: end,
        }),
      });

      if (response.ok) {
        toast({
          description: t.saved,
          duration: 2000,
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: t.error,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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

        {/* Do Not Disturb Settings */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <Label htmlFor="dnd-enabled" className="text-base font-medium flex items-center gap-2">
                <Moon className="h-4 w-4" />
                {t.dndTitle}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t.dndDescription}
              </p>
            </div>
            <Switch
              id="dnd-enabled"
              checked={dndEnabled}
              onCheckedChange={handleDndToggle}
              disabled={loading || saving}
            />
          </div>

          {dndEnabled && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                <div>
                  <Label htmlFor="dnd-start" className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t.startTime}
                  </Label>
                  <Input
                    id="dnd-start"
                    type="time"
                    value={dndStartTime}
                    onChange={(e) => setDndStartTime(e.target.value)}
                    onBlur={handleTimeChange}
                    disabled={loading || saving}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dnd-end" className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t.endTime}
                  </Label>
                  <Input
                    id="dnd-end"
                    type="time"
                    value={dndEndTime}
                    onChange={(e) => setDndEndTime(e.target.value)}
                    onBlur={handleTimeChange}
                    disabled={loading || saving}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground px-4">
                {language === 'English' 
                  ? '💡 These quiet hours repeat daily. Notifications will be silenced during this time window every day.'
                  : '💡 تتكرر هذه الساعات الهادئة يوميًا. سيتم كتم الإشعارات خلال هذه الفترة الزمنية كل يوم.'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
