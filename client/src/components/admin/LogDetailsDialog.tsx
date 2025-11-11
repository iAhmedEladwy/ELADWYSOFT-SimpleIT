import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bug, Info, AlertTriangle, AlertCircle, User, Hash, Clock, Code, Database } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/hooks/use-language";

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

interface LogDetailsDialogProps {
  log: SystemLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LogDetailsDialog({ log, open, onOpenChange }: LogDetailsDialogProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const translations = {
    title: language === 'English' ? 'Log Details' : 'تفاصيل السجل',
    description: language === 'English' ? 'Complete information about this log entry' : 'معلومات كاملة عن هذا السجل',
    level: language === 'English' ? 'Level' : 'المستوى',
    module: language === 'English' ? 'Module' : 'الوحدة',
    timestamp: language === 'English' ? 'Timestamp' : 'الوقت',
    message: language === 'English' ? 'Message' : 'الرسالة',
    userId: language === 'English' ? 'User ID' : 'معرف المستخدم',
    requestId: language === 'English' ? 'Request ID' : 'معرف الطلب',
    metadata: language === 'English' ? 'Metadata' : 'البيانات الوصفية',
    stackTrace: language === 'English' ? 'Stack Trace' : 'تتبع المكدس',
    status: language === 'English' ? 'Status' : 'الحالة',
    resolved: language === 'English' ? 'Resolved' : 'تم الحل',
    unresolved: language === 'English' ? 'Unresolved' : 'لم يُحل',
    noMetadata: language === 'English' ? 'No metadata available' : 'لا توجد بيانات وصفية',
    noStackTrace: language === 'English' ? 'No stack trace available' : 'لا يوجد تتبع للمكدس',
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

  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {translations.title} #{log.id}
          </DialogTitle>
          <DialogDescription>
            {translations.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-4 p-1">
            {/* Status and Level */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {translations.level}
                </div>
                <Badge variant={getLevelColor(log.level)} className="flex items-center gap-1 w-fit text-base py-1 px-3">
                  {getLevelIcon(log.level)}
                  {log.level}
                </Badge>
              </div>

              <div className="flex-1 space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {translations.status}
                </div>
                <Badge variant={log.resolved ? "secondary" : "destructive"} className="text-base py-1 px-3">
                  {log.resolved ? translations.resolved : translations.unresolved}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Timestamp */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {translations.timestamp}
              </div>
              <div className="font-mono text-sm bg-muted p-3 rounded-md">
                {format(new Date(log.timestamp), "PPpp")}
              </div>
            </div>

            {/* Module */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Code className="h-4 w-4" />
                {translations.module}
              </div>
              <div className="font-mono text-sm bg-muted p-3 rounded-md">
                {log.module}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {translations.message}
              </div>
              <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap break-words">
                {log.message}
              </div>
            </div>

            {/* User ID */}
            {log.userId && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {translations.userId}
                </div>
                <div className="font-mono text-sm bg-muted p-3 rounded-md">
                  {log.userId}
                </div>
              </div>
            )}

            {/* Request ID */}
            {log.requestId && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {translations.requestId}
                </div>
                <div className="font-mono text-sm bg-muted p-3 rounded-md break-all">
                  {log.requestId}
                </div>
              </div>
            )}

            <Separator />

            {/* Metadata */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4" />
                {translations.metadata}
              </div>
              {log.metadata && Object.keys(log.metadata).length > 0 ? (
                <ScrollArea className="h-auto max-h-64 w-full rounded-md border">
                  <pre className="p-4 text-xs font-mono bg-muted/50">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-md">
                  {translations.noMetadata}
                </div>
              )}
            </div>

            {/* Stack Trace */}
            {log.stackTrace && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  {translations.stackTrace}
                </div>
                <ScrollArea className="h-auto max-h-96 w-full rounded-md border">
                  <pre className="p-4 text-xs font-mono bg-destructive/5 text-destructive whitespace-pre-wrap break-words">
                    {log.stackTrace}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
