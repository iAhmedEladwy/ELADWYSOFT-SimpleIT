import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Clock, Plus, Edit, Trash2, Play, Pause } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { BackupJobResponse, BackupJobCreateRequest } from '@shared/types';

interface ScheduledBackupsTabProps {}

export default function ScheduledBackupsTab({}: ScheduledBackupsTabProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<BackupJobResponse | null>(null);
  const [formData, setFormData] = useState<BackupJobCreateRequest>({
    name: '',
    description: '',
    schedule_type: 'daily',
    schedule_value: 1,
    is_enabled: true
  });

  const t = {
    scheduledBackups: language === 'English' ? 'Scheduled Backups' : 'النسخ الاحتياطية المجدولة',
    createScheduledBackup: language === 'English' ? 'Create Scheduled Backup' : 'إنشاء نسخة احتياطية مجدولة',
    editScheduledBackup: language === 'English' ? 'Edit Scheduled Backup' : 'تعديل النسخة الاحتياطية المجدولة',
    name: language === 'English' ? 'Job Name' : 'اسم المهمة',
    description: language === 'English' ? 'Description' : 'الوصف',
    scheduleType: language === 'English' ? 'Schedule Type' : 'نوع الجدولة',
    scheduleValue: language === 'English' ? 'Every' : 'كل',
    enabled: language === 'English' ? 'Enabled' : 'مفعل',
    lastRun: language === 'English' ? 'Last Run' : 'آخر تشغيل',
    nextRun: language === 'English' ? 'Next Run' : 'التشغيل التالي',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    hourly: language === 'English' ? 'Hourly' : 'كل ساعة',
    daily: language === 'English' ? 'Daily' : 'يومي',
    weekly: language === 'English' ? 'Weekly' : 'أسبوعي',
    monthly: language === 'English' ? 'Monthly' : 'شهري',
    hours: language === 'English' ? 'hour(s)' : 'ساعة/ساعات',
    days: language === 'English' ? 'day(s)' : 'يوم/أيام',
    weeks: language === 'English' ? 'week(s)' : 'أسبوع/أسابيع',
    months: language === 'English' ? 'month(s)' : 'شهر/أشهر',
    save: language === 'English' ? 'Save' : 'حفظ',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    delete: language === 'English' ? 'Delete' : 'حذف',
    edit: language === 'English' ? 'Edit' : 'تعديل',
    runNow: language === 'English' ? 'Run Now' : 'تشغيل الآن',
    enable: language === 'English' ? 'Enable' : 'تفعيل',
    disable: language === 'English' ? 'Disable' : 'إلغاء التفعيل',
    noJobs: language === 'English' ? 'No scheduled backup jobs found' : 'لم يتم العثور على مهام نسخ احتياطي مجدولة',
    creating: language === 'English' ? 'Creating...' : 'جاري الإنشاء...',
    updating: language === 'English' ? 'Updating...' : 'جاري التحديث...',
    deleting: language === 'English' ? 'Deleting...' : 'جاري الحذف...',
    executing: language === 'English' ? 'Executing...' : 'جاري التنفيذ...',
    never: language === 'English' ? 'Never' : 'أبداً',
    status: language === 'English' ? 'Status' : 'الحالة',
    active: language === 'English' ? 'Active' : 'نشط',
    inactive: language === 'English' ? 'Inactive' : 'غير نشط'
  };

  // Fetch backup jobs
  const { data: backupJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['backup-jobs'],
    queryFn: () => apiRequest('/api/backup-jobs', 'GET')
  });

  // Create backup job mutation
  const createJobMutation = useMutation({
    mutationFn: (data: BackupJobCreateRequest) => 
      apiRequest('/api/backup-jobs', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: language === 'English' ? 'Scheduled backup job created successfully' : 'تم إنشاء مهمة النسخ الاحتياطي المجدولة بنجاح'
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to create backup job' : 'فشل في إنشاء مهمة النسخ الاحتياطي'),
        variant: 'destructive'
      });
    }
  });

  // Update backup job mutation
  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BackupJobCreateRequest> }) => 
      apiRequest(`/api/backup-jobs/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
      setEditingJob(null);
      resetForm();
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: language === 'English' ? 'Scheduled backup job updated successfully' : 'تم تحديث مهمة النسخ الاحتياطي المجدولة بنجاح'
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to update backup job' : 'فشل في تحديث مهمة النسخ الاحتياطي'),
        variant: 'destructive'
      });
    }
  });

  // Delete backup job mutation
  const deleteJobMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/backup-jobs/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: language === 'English' ? 'Scheduled backup job deleted successfully' : 'تم حذف مهمة النسخ الاحتياطي المجدولة بنجاح'
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to delete backup job' : 'فشل في حذف مهمة النسخ الاحتياطي'),
        variant: 'destructive'
      });
    }
  });

  // Execute backup job mutation
  const executeJobMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/backup-jobs/${id}/execute`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: language === 'English' ? 'Backup job executed successfully' : 'تم تنفيذ مهمة النسخ الاحتياطي بنجاح'
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to execute backup job' : 'فشل في تنفيذ مهمة النسخ الاحتياطي'),
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      schedule_type: 'daily',
      schedule_value: 1,
      is_enabled: true
    });
  };

  const handleEdit = (job: BackupJobResponse) => {
    setEditingJob(job);
    setFormData({
      name: job.name,
      description: job.description || '',
      schedule_type: job.schedule_type,
      schedule_value: job.schedule_value,
      is_enabled: job.is_enabled
    });
  };

  const handleSubmit = () => {
    if (editingJob) {
      updateJobMutation.mutate({ id: editingJob.id, data: formData });
    } else {
      createJobMutation.mutate(formData);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t.never;
    return new Date(dateString).toLocaleString();
  };

  const getScheduleText = (type: string, value: number) => {
    switch (type) {
      case 'hourly':
        return `${value} ${t.hours}`;
      case 'daily':
        return `${value} ${t.days}`;
      case 'weekly':
        return `${value} ${t.weeks}`;
      case 'monthly':
        return `${value} ${t.months}`;
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t.scheduledBackups}
        </CardTitle>
        <Dialog open={isCreateDialogOpen || !!editingJob} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingJob(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.createScheduledBackup}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingJob ? t.editScheduledBackup : t.createScheduledBackup}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t.name}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'English' ? 'Enter job name' : 'أدخل اسم المهمة'}
                />
              </div>
              <div>
                <Label htmlFor="description">{t.description}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={language === 'English' ? 'Enter description (optional)' : 'أدخل الوصف (اختياري)'}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="schedule_type">{t.scheduleType}</Label>
                <Select
                  value={formData.schedule_type}
                  onValueChange={(value: 'hourly' | 'daily' | 'weekly' | 'monthly') => 
                    setFormData({ ...formData, schedule_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">{t.hourly}</SelectItem>
                    <SelectItem value="daily">{t.daily}</SelectItem>
                    <SelectItem value="weekly">{t.weekly}</SelectItem>
                    <SelectItem value="monthly">{t.monthly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="schedule_value">{t.scheduleValue}</Label>
                <Input
                  id="schedule_value"
                  type="number"
                  min="1"
                  value={formData.schedule_value}
                  onChange={(e) => setFormData({ ...formData, schedule_value: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                />
                <Label htmlFor="is_enabled">{t.enabled}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingJob(null);
                  resetForm();
                }}
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createJobMutation.isPending || updateJobMutation.isPending}
              >
                {(createJobMutation.isPending || updateJobMutation.isPending) ? 
                  (editingJob ? t.updating : t.creating) : t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {jobsLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : backupJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.noJobs}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.description}</TableHead>
                  <TableHead>{t.scheduleType}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.lastRun}</TableHead>
                  <TableHead>{t.nextRun}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupJobs.map((job: BackupJobResponse) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>{job.description || '-'}</TableCell>
                    <TableCell>{getScheduleText(job.schedule_type, job.schedule_value)}</TableCell>
                    <TableCell>
                      <Badge variant={job.is_enabled ? 'default' : 'secondary'}>
                        {job.is_enabled ? t.active : t.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(job.last_run_at)}</TableCell>
                    <TableCell>{formatDate(job.next_run_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(job)}
                          disabled={updateJobMutation.isPending}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => executeJobMutation.mutate(job.id)}
                          disabled={executeJobMutation.isPending}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteJobMutation.mutate(job.id)}
                          disabled={deleteJobMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}