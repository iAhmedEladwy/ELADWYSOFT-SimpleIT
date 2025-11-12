import { useLanguage } from '@/hooks/use-language';
import { Link } from 'wouter';
import {
  Terminal,
  Database,
  Zap,
  Activity,
  FileCode,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DeveloperTools() {
  const { language } = useLanguage();

  const translations = {
    title: language === 'English' ? 'Developer Tools' : 'أدوات المطور',
    subtitle: language === 'English' 
      ? 'Advanced tools and utilities for system administration and debugging' 
      : 'أدوات وأدوات متقدمة لإدارة النظام وتصحيح الأخطاء',
    systemLogs: {
      title: language === 'English' ? 'System Logs' : 'سجلات النظام',
      description: language === 'English' 
        ? 'View and manage system logs, errors, and application events' 
        : 'عرض وإدارة سجلات النظام والأخطاء وأحداث التطبيق',
    },
    databaseConsole: {
      title: language === 'English' ? 'Database Console' : 'وحدة تحكم قاعدة البيانات',
      description: language === 'English' 
        ? 'Execute raw SQL queries and manage database directly' 
        : 'تنفيذ استعلامات SQL الخام وإدارة قاعدة البيانات مباشرة',
      comingSoon: language === 'English' ? 'Coming Soon' : 'قريباً',
    },
    apiTester: {
      title: language === 'English' ? 'API Tester' : 'مختبر API',
      description: language === 'English' 
        ? 'Test and debug API endpoints with request/response inspection' 
        : 'اختبار وتصحيح نقاط نهاية API مع فحص الطلب/الاستجابة',
      comingSoon: language === 'English' ? 'Coming Soon' : 'قريباً',
    },
    performanceMonitor: {
      title: language === 'English' ? 'Performance Monitor' : 'مراقب الأداء',
      description: language === 'English' 
        ? 'Monitor system performance, memory usage, and response times' 
        : 'مراقبة أداء النظام واستخدام الذاكرة وأوقات الاستجابة',
      comingSoon: language === 'English' ? 'Coming Soon' : 'قريباً',
    },
    cacheManager: {
      title: language === 'English' ? 'Cache Manager' : 'مدير ذاكرة التخزين المؤقت',
      description: language === 'English' 
        ? 'Clear and manage application cache and sessions' 
        : 'مسح وإدارة ذاكرة التخزين المؤقت والجلسات',
      comingSoon: language === 'English' ? 'Coming Soon' : 'قريباً',
    },
    configEditor: {
      title: language === 'English' ? 'Config Editor' : 'محرر التكوين',
      description: language === 'English' 
        ? 'Edit system configuration and environment variables' 
        : 'تحرير تكوين النظام ومتغيرات البيئة',
      comingSoon: language === 'English' ? 'Coming Soon' : 'قريباً',
    },
  };

  const tools = [
    {
      title: translations.systemLogs.title,
      description: translations.systemLogs.description,
      icon: Terminal,
      href: '/developer-tools/system-logs',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      available: true,
    },
    {
      title: translations.databaseConsole.title,
      description: translations.databaseConsole.description,
      icon: Database,
      href: '#',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      available: false,
      comingSoon: translations.databaseConsole.comingSoon,
    },
    {
      title: translations.apiTester.title,
      description: translations.apiTester.description,
      icon: Zap,
      href: '#',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      available: false,
      comingSoon: translations.apiTester.comingSoon,
    },
    {
      title: translations.performanceMonitor.title,
      description: translations.performanceMonitor.description,
      icon: Activity,
      href: '#',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      available: false,
      comingSoon: translations.performanceMonitor.comingSoon,
    },
    {
      title: translations.cacheManager.title,
      description: translations.cacheManager.description,
      icon: FileCode,
      href: '#',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      available: false,
      comingSoon: translations.cacheManager.comingSoon,
    },
    {
      title: translations.configEditor.title,
      description: translations.configEditor.description,
      icon: Settings,
      href: '#',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      available: false,
      comingSoon: translations.configEditor.comingSoon,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          {translations.title}
        </h1>
        <p className="text-gray-600">{translations.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          const CardWrapper = tool.available ? Link : 'div';
          const cardProps = tool.available ? { href: tool.href } : {};

          return (
            <CardWrapper key={index} {...cardProps}>
              <Card
                className={`
                  ${tool.borderColor} border-2 transition-all
                  ${tool.available ? 'hover:shadow-lg cursor-pointer hover:-translate-y-1' : 'opacity-75 cursor-not-allowed'}
                `}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${tool.bgColor}`}>
                      <Icon className={`h-6 w-6 ${tool.color}`} />
                    </div>
                    {!tool.available && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {tool.comingSoon}
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-4">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </CardWrapper>
          );
        })}
      </div>
    </div>
  );
}
