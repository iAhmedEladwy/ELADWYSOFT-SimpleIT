import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Database, Download, Upload, Trash2, ArrowLeft, Clock, FileUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient'; 
import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import { RoleGuard } from '@/components/auth/RoleGuard';

interface BackupFile {
  id: number;
  filename: string;
  fileSize: number;
  backupType: string;
  status: string;
  createdAt: string;
  metadata?: string;
}

interface RestoreHistoryItem {
  id: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  recordsRestored?: number;
  filename?: string;
}

export default function BackupRestore() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('backups');
  const [backupDescription, setBackupDescription] = useState('');
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isRestoreFromFileDialogOpen, setIsRestoreFromFileDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Translations
  const t = {
    title: language === 'English' ? 'Backup & Restore' : 'النسخ الاحتياطي والاستعادة',
    description: language === 'English' ? 'Manage database backups and restore operations' : 'إدارة النسخ الاحتياطية وعمليات الاستعادة',
    backupManagement: language === 'English' ? 'Backup Management' : 'إدارة النسخ الاحتياطية',
    restoreHistory: language === 'English' ? 'Restore History' : 'تاريخ الاستعادة',
    createBackup: language === 'English' ? 'Create Backup' : 'إنشاء نسخة احتياطية',
    restoreData: language === 'English' ? 'Restore Data' : 'استعادة البيانات',
    deleteBackup: language === 'English' ? 'Delete Backup' : 'حذف النسخة الاحتياطية',
    filename: language === 'English' ? 'Filename' : 'اسم الملف',
    size: language === 'English' ? 'Size' : 'الحجم',
    type: language === 'English' ? 'Type' : 'النوع',
    created: language === 'English' ? 'Created' : 'تاريخ الإنشاء',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    confirmRestore: language === 'English' ? 'Confirm Restore' : 'تأكيد الاستعادة',
    restoreWarning: language === 'English' 
      ? 'This will completely replace all current data with the backup data. This action cannot be undone.' 
      : 'سيؤدي هذا إلى استبدال جميع البيانات الحالية ببيانات النسخة الاحتياطية. لا يمكن التراجع عن هذا الإجراء.',
    backToAdminConsole: language === 'English' ? 'Back to Admin Console' : 'العودة لوحدة التحكم',
    manual: language === 'English' ? 'Manual' : 'يدوي',
    scheduled: language === 'English' ? 'Scheduled' : 'مجدول',
    completed: language === 'English' ? 'Completed' : 'مكتمل',
    failed: language === 'English' ? 'Failed' : 'فشل',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    status: language === 'English' ? 'Status' : 'الحالة',
    startedAt: language === 'English' ? 'Started At' : 'بدأ في',
    completedAt: language === 'English' ? 'Completed At' : 'اكتمل في',
    recordsRestored: language === 'English' ? 'Records Restored' : 'السجلات المستعادة',
    errorMessage: language === 'English' ? 'Error Message' : 'رسالة الخطأ',
    backupDescription: language === 'English' ? 'Description' : 'الوصف',
    downloadBackup: language === 'English' ? 'Download' : 'تحميل',
    restoreFromFile: language === 'English' ? 'Restore from File' : 'استعادة من ملف',
    uploadBackupFile: language === 'English' ? 'Upload Backup File' : 'رفع ملف النسخة الاحتياطية',
    selectFile: language === 'English' ? 'Select .sql backup file' : 'اختر ملف النسخة الاحتياطية .sql',
    restoreFromFileWarning: language === 'English'
      ? 'This will restore data from the uploaded backup file. All current data will be replaced. This action cannot be undone.'
      : 'سيؤدي هذا إلى استعادة البيانات من ملف النسخة الاحتياطية المرفوع. سيتم استبدال جميع البيانات الحالية. لا يمكن التراجع عن هذا الإجراء.',
    uploading: language === 'English' ? 'Uploading...' : 'جاري الرفع...',
    noBackups: language === 'English' ? 'No backups found' : 'لم يتم العثور على نسخ احتياطية',
    noHistory: language === 'English' ? 'No restore history found' : 'لم يتم العثور على تاريخ استعادة',
    creating: language === 'English' ? 'Creating...' : 'جاري الإنشاء...',
    restoring: language === 'English' ? 'Restoring...' : 'جاري الاستعادة...',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء'
  };

    // Fetch backups 
    const { data: backups = [], isLoading: backupsLoading } = useQuery({
      queryKey: ['admin-backups'],
      queryFn: () => apiRequest('/api/admin/backups', 'GET')
    });

    // Fetch restore history 
    const { data: restoreHistory = [], isLoading: historyLoading } = useQuery({
      queryKey: ['admin-restore-history'],
      queryFn: () => apiRequest('/api/admin/restore-history', 'GET')
    });

    // Create backup mutation 
    const createBackupMutation = useMutation({
      mutationFn: (description: string) => 
        apiRequest('/api/admin/backups', 'POST', { description }),
      onSuccess: () => {
        toast({ 
          title: language === 'English' ? 'Backup created successfully' : 'تم إنشاء النسخة الاحتياطية بنجاح' 
        });
        queryClient.invalidateQueries({ queryKey: ['admin-backups'] });
        setIsBackupDialogOpen(false);
        setBackupDescription('');
      },
      onError: () => {
        toast({ 
          title: language === 'English' ? 'Failed to create backup' : 'فشل في إنشاء النسخة الاحتياطية', 
          variant: 'destructive' 
        });
      }
    });

    // Restore backup mutation - CORRECTED
    const restoreBackupMutation = useMutation({
      mutationFn: (backupId: number) => 
        apiRequest(`/api/admin/restore/${backupId}`, 'POST'),
      onSuccess: () => {
        toast({ 
          title: language === 'English' ? 'Data restored successfully' : 'تم استعادة البيانات بنجاح' 
        });
        queryClient.invalidateQueries({ queryKey: ['admin-restore-history'] });
      },
      onError: () => {
        toast({ 
          title: language === 'English' ? 'Failed to restore data' : 'فشل في استعادة البيانات', 
          variant: 'destructive' 
        });
      }
    });

    // Delete backup mutation - CORRECTED
    const deleteBackupMutation = useMutation({
      mutationFn: (backupId: number) => 
        apiRequest(`/api/admin/backups/${backupId}`, 'DELETE'),
      onSuccess: () => {
        toast({ 
          title: language === 'English' ? 'Backup deleted successfully' : 'تم حذف النسخة الاحتياطية بنجاح' 
        });
        queryClient.invalidateQueries({ queryKey: ['admin-backups'] });
      },
      onError: () => {
        toast({ 
          title: language === 'English' ? 'Failed to delete backup' : 'فشل في حذف النسخة الاحتياطية', 
          variant: 'destructive' 
        });
      }
    });

    // Restore from file mutation
    const restoreFromFileMutation = useMutation({
      mutationFn: (file: File) => {
        const formData = new FormData();
        formData.append('backup', file);
        return fetch('/api/admin/backups/restore-from-file', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }).then(async res => {
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to restore from file');
          }
          return res.json();
        });
      },
      onSuccess: () => {
        toast({ 
          title: language === 'English' ? 'Data restored successfully from file' : 'تم استعادة البيانات بنجاح من الملف' 
        });
        queryClient.invalidateQueries({ queryKey: ['admin-restore-history'] });
        setIsRestoreFromFileDialogOpen(false);
        setSelectedFile(null);
      },
      onError: (error: any) => {
        toast({ 
          title: language === 'English' ? 'Failed to restore from file' : 'فشل في استعادة البيانات من الملف', 
          description: error.message,
          variant: 'destructive' 
        });
      }
    });

    // Download backup handler
    const handleDownloadBackup = (backupId: number, filename: string) => {
      const url = `/api/admin/backups/${backupId}/download`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // File selection handler
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.name.endsWith('.sql')) {
          setSelectedFile(file);
        } else {
          toast({
            title: language === 'English' ? 'Invalid file type' : 'نوع ملف غير صالح',
            description: language === 'English' ? 'Please select a .sql backup file' : 'يرجى اختيار ملف نسخة احتياطية .sql',
            variant: 'destructive'
          });
        }
      }
    };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'manual': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };

    return (
      <Badge className={colors[status] || colors['manual']}>
        {t[status as keyof typeof t] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(
      language === 'English' ? 'en-US' : 'ar-SA',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  };

  return (
    <RoleGuard allowedRoles={['admin']} fallback={<div>Access denied</div>}>
      <Helmet>
        <title>{t.title} - SimpleIT</title>
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
              <p className="text-muted-foreground">{t.description}</p>
            </div>
          </div>
          <Link href="/admin-console">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>{t.backToAdminConsole}</span>
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="backups" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t.backupManagement}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t.restoreHistory}
            </TabsTrigger>
          </TabsList>

          {/* Backup Management Tab */}
          <TabsContent value="backups">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {t.backupManagement}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        {t.createBackup}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.createBackup}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">{t.backupDescription}</label>
                          <Textarea
                            value={backupDescription}
                            onChange={(e) => setBackupDescription(e.target.value)}
                            placeholder={language === 'English' ? 'Enter backup description...' : 'أدخل وصف النسخة الاحتياطية...'}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsBackupDialogOpen(false)}
                        >
                          {t.cancel}
                        </Button>
                        <Button
                          onClick={() => createBackupMutation.mutate(backupDescription)}
                          disabled={createBackupMutation.isPending}
                        >
                          {createBackupMutation.isPending ? t.creating : t.createBackup}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isRestoreFromFileDialogOpen} onOpenChange={setIsRestoreFromFileDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <FileUp className="h-4 w-4 mr-2" />
                        {t.restoreFromFile}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.uploadBackupFile}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">{t.selectFile}</label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".sql"
                            onChange={handleFileSelect}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          />
                          {selectedFile && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Selected: {selectedFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsRestoreFromFileDialogOpen(false);
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          {t.cancel}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              disabled={!selectedFile || restoreFromFileMutation.isPending}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {restoreFromFileMutation.isPending ? t.uploading : t.restoreFromFile}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.confirmRestore}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.restoreFromFileWarning}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => selectedFile && restoreFromFileMutation.mutate(selectedFile)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t.restoreFromFile}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {backupsLoading ? (
                  <div className="text-center py-8">Loading backups...</div>
                ) : backups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t.noBackups}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.filename}</TableHead>
                          <TableHead>{t.size}</TableHead>
                          <TableHead>{t.type}</TableHead>
                          <TableHead>{t.created}</TableHead>
                          <TableHead>{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backups.map((backup) => (
                          <TableRow key={backup.id}>
                            <TableCell className="font-medium">
                              {backup.filename}
                              {backup.metadata && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {backup.metadata}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>{formatFileSize(backup.fileSize)}</TableCell>
                            <TableCell>{getStatusBadge(backup.backupType)}</TableCell>
                            <TableCell>{formatDate(backup.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadBackup(backup.id, backup.filename)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Upload className="h-4 w-4 mr-1" />
                                      {t.restoreData}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t.confirmRestore}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t.restoreWarning}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        {t.cancel}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => restoreBackupMutation.mutate(backup.id)}
                                        disabled={restoreBackupMutation.isPending}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {restoreBackupMutation.isPending ? t.restoring : t.restoreData}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteBackupMutation.mutate(backup.id)}
                                  disabled={deleteBackupMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
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
          </TabsContent>

          {/* Restore History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t.restoreHistory}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8">Loading history...</div>
                ) : restoreHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t.noHistory}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.filename}</TableHead>
                          <TableHead>{t.status}</TableHead>
                          <TableHead>{t.startedAt}</TableHead>
                          <TableHead>{t.completedAt}</TableHead>
                          <TableHead>{t.recordsRestored}</TableHead>
                          <TableHead>{t.errorMessage}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {restoreHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.filename || 'N/A'}
                            </TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>{formatDate(item.startedAt)}</TableCell>
                            <TableCell>
                              {item.completedAt ? formatDate(item.completedAt) : '-'}
                            </TableCell>
                            <TableCell>
                              {item.recordsRestored ? item.recordsRestored.toLocaleString() : '-'}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              {item.errorMessage ? (
                                <span className="text-destructive text-xs">
                                  {item.errorMessage}
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}