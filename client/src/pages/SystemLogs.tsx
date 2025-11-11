import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useLogStream } from "@/hooks/use-log-stream";
import { Terminal, RefreshCw, CheckCircle, Trash2, Download, AlertCircle, Info, AlertTriangle, Bug, ChevronRight, ArrowLeft, Eye, Wifi, WifiOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import LogDetailsDialog from "@/components/admin/LogDetailsDialog";

// Type definitions
interface SystemLog {
  id: number;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  module: string;
  message: string;
  userId: number | null;
  requestId: string | null;
  metadata: any;
  stackTrace: string | null;
  resolved: boolean;
}

interface LogStats {
  levelCounts: Record<string, number>;
  moduleCounts: Record<string, number>;
  recentErrors: number;
  unresolvedCount: number;
}

export default function SystemLogs() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = language === 'ar';

  // Filter states
  const [level, setLevel] = useState<string>('all');
  const [module, setModule] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [resolved, setResolved] = useState<string>('all');
  const [limit, setLimit] = useState<number>(100);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Details dialog state
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // WebSocket connection for real-time updates
  const { isConnected: wsConnected } = useLogStream({
    onNewLog: (newLog) => {
      // Invalidate queries to refetch with new log
      queryClient.invalidateQueries({ queryKey: ['systemLogs'] });
      queryClient.invalidateQueries({ queryKey: ['systemLogStats'] });
      
      // Show toast for critical errors
      if (newLog.level === 'CRITICAL') {
        toast({
          title: language === 'English' ? 'Critical Error Logged' : 'خطأ حرج مسجل',
          description: newLog.message,
          variant: 'destructive',
        });
      }
    },
    onStatsUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['systemLogStats'] });
    },
  });

  const translations = {
    developerTools: language === 'English' ? 'Developer Tools' : 'أدوات المطور',
    title: language === 'English' ? 'System Logs' : 'سجلات النظام',
    subtitle: language === 'English' ? 'Developer access to system events and errors' : 'وصول المطورين لأحداث وأخطاء النظام',
    backToDevTools: language === 'English' ? 'Back to Developer Tools' : 'العودة إلى أدوات المطور',
    filters: language === 'English' ? 'Filters' : 'التصفية',
    level: language === 'English' ? 'Level' : 'المستوى',
    all: language === 'English' ? 'All' : 'الكل',
    module: language === 'English' ? 'Module' : 'الوحدة',
    search: language === 'English' ? 'Search message...' : 'البحث في الرسالة...',
    startDate: language === 'English' ? 'Start Date' : 'تاريخ البدء',
    endDate: language === 'English' ? 'End Date' : 'تاريخ النهاية',
    status: language === 'English' ? 'Status' : 'الحالة',
    resolved: language === 'English' ? 'Resolved' : 'تم الحل',
    unresolved: language === 'English' ? 'Unresolved' : 'لم يُحل',
    limit: language === 'English' ? 'Limit' : 'الحد',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    autoRefresh: language === 'English' ? 'Auto-refresh (30s)' : 'تحديث تلقائي (30 ثانية)',
    export: language === 'English' ? 'Export CSV' : 'تصدير CSV',
    cleanup: language === 'English' ? 'Cleanup Old Logs' : 'تنظيف السجلات القديمة',
    stats: language === 'English' ? 'Statistics' : 'الإحصائيات',
    totalLogs: language === 'English' ? 'Total Logs' : 'إجمالي السجلات',
    recentErrors: language === 'English' ? 'Errors (24h)' : 'الأخطاء (24 ساعة)',
    unresolvedIssues: language === 'English' ? 'Unresolved Issues' : 'المشاكل غير المحلولة',
    topModules: language === 'English' ? 'Top Modules' : 'أكثر الوحدات',
    timestamp: language === 'English' ? 'Timestamp' : 'الوقت',
    message: language === 'English' ? 'Message' : 'الرسالة',
    user: language === 'English' ? 'User' : 'المستخدم',
    requestId: language === 'English' ? 'Request ID' : 'معرف الطلب',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    markResolved: language === 'English' ? 'Mark Resolved' : 'تحديد كمُحل',
    viewDetails: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    noLogs: language === 'English' ? 'No logs found' : 'لا توجد سجلات',
    debug: language === 'English' ? 'Debug' : 'تصحيح',
    info: language === 'English' ? 'Info' : 'معلومات',
    warn: language === 'English' ? 'Warning' : 'تحذير',
    error: language === 'English' ? 'Error' : 'خطأ',
    critical: language === 'English' ? 'Critical' : 'حرج',
    resolveSuccess: language === 'English' ? 'Log marked as resolved' : 'تم تحديد السجل كمُحل',
    cleanupConfirm: language === 'English' ? 'Delete logs older than 90 days?' : 'حذف السجلات الأقدم من 90 يوماً؟',
    cleanupSuccess: language === 'English' ? 'Old logs cleaned up successfully' : 'تم تنظيف السجلات القديمة بنجاح',
    exportSuccess: language === 'English' ? 'Logs exported to CSV' : 'تم تصدير السجلات إلى CSV',
  };

  // Fetch logs
  const { data: logsResponse, isLoading, refetch } = useQuery({
    queryKey: ['systemLogs', level, module, search, startDate, endDate, resolved, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (level !== 'all') params.append('level', level);
      if (module) params.append('module', module);
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (resolved !== 'all') params.append('resolved', resolved);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/system-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    },
  });

  const logs: SystemLog[] = logsResponse?.logs || [];

  // Fetch stats
  const { data: stats } = useQuery<LogStats>({
    queryKey: ['systemLogStats'],
    queryFn: async () => {
      const response = await fetch('/api/system-logs/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      
      // Transform array format to object format expected by frontend
      const levelCounts: Record<string, number> = {};
      data.levelStats?.forEach((stat: any) => {
        levelCounts[stat.level] = Number(stat.count);
      });
      
      const moduleCounts: Record<string, number> = {};
      data.moduleStats?.forEach((stat: any) => {
        moduleCounts[stat.module] = Number(stat.count);
      });
      
      return {
        levelCounts,
        moduleCounts,
        recentErrors: data.recentErrors || 0,
        unresolvedCount: data.unresolvedErrors || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // Mark log as resolved
  const resolveMutation = useMutation({
    mutationFn: async (logId: number) => {
      const response = await fetch(`/api/system-logs/${logId}/resolve`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to resolve log');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: translations.resolveSuccess });
      queryClient.invalidateQueries({ queryKey: ['systemLogs'] });
      queryClient.invalidateQueries({ queryKey: ['systemLogStats'] });
    },
  });

  // Cleanup old logs
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/system-logs/cleanup?days=90', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to cleanup logs');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: translations.cleanupSuccess });
      queryClient.invalidateQueries({ queryKey: ['systemLogs'] });
      queryClient.invalidateQueries({ queryKey: ['systemLogStats'] });
    },
  });

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  // Export to CSV
  const handleExport = () => {
    const csvHeaders = ['Timestamp', 'Level', 'Module', 'Message', 'User ID', 'Request ID', 'Resolved'];
    const csvRows = logs.map(log => [
      log.timestamp,
      log.level,
      log.module,
      `"${log.message.replace(/"/g, '""')}"`,
      log.userId || '',
      log.requestId || '',
      log.resolved ? 'Yes' : 'No',
    ]);
    const csv = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: translations.exportSuccess });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'DEBUG': return <Bug className="h-4 w-4" />;
      case 'INFO': return <Info className="h-4 w-4" />;
      case 'WARN': return <AlertTriangle className="h-4 w-4" />;
      case 'ERROR': return <AlertCircle className="h-4 w-4" />;
      case 'CRITICAL': return <AlertCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'DEBUG': return 'outline';
      case 'INFO': return 'secondary';
      case 'WARN': return 'default';
      case 'ERROR': return 'destructive';
      case 'CRITICAL': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/developer-tools" className="hover:text-primary flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          {translations.backToDevTools}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{translations.title}</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Terminal className="h-8 w-8" />
            {translations.title}
          </h1>
          <p className="text-muted-foreground mt-1">{translations.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {/* WebSocket Connection Status */}
          <Badge variant={wsConnected ? "secondary" : "outline"} className="flex items-center gap-1">
            {wsConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                {language === 'English' ? 'Live' : 'مباشر'}
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                {language === 'English' ? 'Offline' : 'غير متصل'}
              </>
            )}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${isLoading ? 'animate-spin' : ''}`} />
            {translations.refresh}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {translations.export}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm(translations.cleanupConfirm)) {
                cleanupMutation.mutate();
              }
            }}
          >
            <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {translations.cleanup}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{translations.totalLogs}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(stats.levelCounts).reduce((a, b) => a + b, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{translations.recentErrors}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.recentErrors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{translations.unresolvedIssues}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.unresolvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{translations.topModules}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                {Object.entries(stats.moduleCounts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([module, count]) => (
                    <div key={module} className="flex justify-between">
                      <span className="truncate max-w-[100px]">{module}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{translations.filters}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder={translations.level} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.all}</SelectItem>
                <SelectItem value="DEBUG">{translations.debug}</SelectItem>
                <SelectItem value="INFO">{translations.info}</SelectItem>
                <SelectItem value="WARN">{translations.warn}</SelectItem>
                <SelectItem value="ERROR">{translations.error}</SelectItem>
                <SelectItem value="CRITICAL">{translations.critical}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={translations.module}
              value={module}
              onChange={(e) => setModule(e.target.value)}
            />

            <Input
              placeholder={translations.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select value={resolved} onValueChange={setResolved}>
              <SelectTrigger>
                <SelectValue placeholder={translations.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.all}</SelectItem>
                <SelectItem value="true">{translations.resolved}</SelectItem>
                <SelectItem value="false">{translations.unresolved}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder={translations.startDate}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              type="date"
              placeholder={translations.endDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
              <SelectTrigger>
                <SelectValue placeholder={translations.limit} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="250">250</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoRefresh" className="text-sm cursor-pointer">
                {translations.autoRefresh}
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.timestamp}</TableHead>
                <TableHead>{translations.level}</TableHead>
                <TableHead>{translations.module}</TableHead>
                <TableHead>{translations.message}</TableHead>
                <TableHead>{translations.user}</TableHead>
                <TableHead>{translations.requestId}</TableHead>
                <TableHead className="text-right">{translations.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {translations.noLogs}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className={log.resolved ? 'opacity-50' : ''}>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLevelColor(log.level)} className="flex items-center gap-1 w-fit">
                        {getLevelIcon(log.level)}
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.module}</TableCell>
                    <TableCell className="max-w-md truncate">{log.message}</TableCell>
                    <TableCell className="text-sm">{log.userId || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{log.requestId || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          {translations.viewDetails}
                        </Button>
                        {!log.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveMutation.mutate(log.id)}
                            disabled={resolveMutation.isPending}
                          >
                            <CheckCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {translations.markResolved}
                          </Button>
                        )}
                        {log.resolved && (
                          <Badge variant="secondary">
                            <CheckCircle className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            {translations.resolved}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <LogDetailsDialog
        log={selectedLog}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  );
}
