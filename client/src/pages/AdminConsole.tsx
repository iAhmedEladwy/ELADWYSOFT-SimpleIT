import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  FileText, 
  Activity, 
  Wrench,
  ArrowLeft,
  Settings,
  BarChart3,
  Database
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { RoleGuard } from '@/components/auth/RoleGuard';
import NotFound from '@/pages/not-found';
import { Link } from 'wouter';

export default function AdminConsole() {
  const { language } = useLanguage();
  const { hasAccess } = useAuth();

  const translations = {
    title: language === 'English' ? 'Admin Console' : 'وحدة التحكم الإدارية',
    description: language === 'English' ? 'Manage system administration and monitoring tools' : 'إدارة أدوات الإدارة والمراقبة في النظام',
    auditLogs: language === 'English' ? 'Audit Logs' : 'سجلات التدقيق',
    auditLogsDesc: language === 'English' ? 'View and monitor all system activities and changes' : 'عرض ومراقبة جميع أنشطة وتغييرات النظام',
    bulkOperations: language === 'English' ? 'Bulk Operations' : 'العمليات المجمعة',
    bulkOperationsDesc: language === 'English' ? 'View and manage bulk operations history' : 'عرض وإدارة تاريخ العمليات المجمعة',
    upgradeRequests: language === 'English' ? 'Upgrade Requests' : 'طلبات الترقية',
    upgradeRequestsDesc: language === 'English' ? 'Manage asset upgrade requests and approvals' : 'إدارة طلبات ترقية الأصول والموافقات',
    systemSettings: language === 'English' ? 'System Settings' : 'إعدادات النظام',
    systemSettingsDesc: language === 'English' ? 'Configure system parameters and preferences' : 'تكوين معاملات النظام والتفضيلات',
    reports: language === 'English' ? 'Reports' : 'التقارير',
    reportsDesc: language === 'English' ? 'Generate and view system reports' : 'إنشاء وعرض تقارير النظام',
    backupRestore: language === 'English' ? 'Backup & Restore' : 'النسخ الاحتياطي والاستعادة',
    backupRestoreDesc: language === 'English' ? 'Manage database backups and restore operations' : 'إدارة النسخ الاحتياطية وعمليات الاستعادة',
    backToDashboard: language === 'English' ? 'Back to Dashboard' : 'العودة للوحة التحكم',
    adminTools: language === 'English' ? 'Administrative Tools' : 'الأدوات الإدارية',
    monitoring: language === 'English' ? 'Monitoring & Logs' : 'المراقبة والسجلات',
    management: language === 'English' ? 'Management' : 'الإدارة',
  };

  const adminTools = [
    {
      id: 'audit-logs',
      title: translations.auditLogs,
      description: translations.auditLogsDesc,
      icon: FileText,
      href: '/admin-console/audit-logs',
      category: 'monitoring'
    },
    {
      id: 'bulk-operations',
      title: translations.bulkOperations,
      description: translations.bulkOperationsDesc,
      icon: Activity,
      href: '/admin-console/bulk-operations',
      category: 'monitoring'
    },
    {
      id: 'upgrade-requests',
      title: translations.upgradeRequests,
      description: translations.upgradeRequestsDesc,
      icon: Wrench,
      href: '/admin-console/upgrade-requests',
      category: 'management'
    },
    {
      id: 'system-settings',
      title: translations.systemSettings,
      description: translations.systemSettingsDesc,
      icon: Settings,
      href: '/admin-console/system-settings',
      category: 'management'
    },
    {
      id: 'reports',
      title: translations.reports,
      description: translations.reportsDesc,
      icon: BarChart3,
      href: '/admin-console/reports',
      category: 'management'
    },
    {
      id: 'backup-restore',
      title: translations.backupRestore,
      description: translations.backupRestoreDesc,
      icon: Database,
      href: '/admin-console/backup-restore',
      category: 'management'
    }
  ];

  const groupedTools = {
    monitoring: adminTools.filter(tool => tool.category === 'monitoring'),
    management: adminTools.filter(tool => tool.category === 'management')
  };

  return (
    <RoleGuard allowedRoles={['admin']} fallback={<NotFound />}>
      <div className="container mx-auto py-6 space-y-6">
        <Helmet>
          <title>{translations.title}</title>
          <meta name="description" content={translations.description} />
        </Helmet>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{translations.title}</h1>
              <p className="text-muted-foreground">{translations.description}</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>{translations.backToDashboard}</span>
            </Button>
          </Link>
        </div>

        {/* Monitoring & Logs Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-px bg-border flex-1" />
            <h2 className="text-xl font-semibold text-muted-foreground px-4">
              {translations.monitoring}
            </h2>
            <div className="h-px bg-border flex-1" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupedTools.monitoring.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Link key={tool.id} href={tool.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{tool.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {tool.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Management Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-px bg-border flex-1" />
            <h2 className="text-xl font-semibold text-muted-foreground px-4">
              {translations.management}
            </h2>
            <div className="h-px bg-border flex-1" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedTools.management.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Link key={tool.id} href={tool.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{tool.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {tool.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
