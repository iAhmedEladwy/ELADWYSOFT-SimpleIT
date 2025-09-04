import { Plus, Ticket, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from '@/components/ui/skeleton';

interface QuickActionsProps {
  data?: {
    canAddEmployee: boolean;
    canAddAsset: boolean;
    canOpenTicket: boolean;
    pendingActions: {
      employeesNeedToReturnAssets: number; // New clear name
      assetsNeedingMaintenance: number;
      ticketsNearingSLA: number;
    };
  };
  isLoading: boolean;
  onAddEmployee?: () => void;
  onAddAsset?: () => void;
  onOpenTicket?: () => void;
}

export default function QuickActions({ data, isLoading,  onAddEmployee, onAddAsset, onOpenTicket }: QuickActionsProps) {
  const { language } = useLanguage();

  const translations = {
    quickActions: language === 'English' ? 'Quick Actions' : 'إجراءات سريعة',
    addEmployee: language === 'English' ? 'Add Employee' : 'إضافة موظف',
    addAsset: language === 'English' ? 'Add Asset' : 'إضافة أصل',
    openTicket: language === 'English' ? 'Open Ticket' : 'فتح تذكرة',
    pendingAlerts: language === 'English' ? 'Pending Alerts' : 'تنبيهات معلقة',
    employeesNeedToReturn: language === 'English' ? 'Employees must return assets' : 'موظفون يجب عليهم إرجاع الأصول',
    assetsNeedMaintenance: language === 'English' ? 'Assets need maintenance' : 'أصول تحتاج صيانة',
    ticketsNearSLA: language === 'English' ? 'Tickets near SLA' : 'تذاكر قريبة من SLA',
  };

  const actions = [
    {
      label: translations.addEmployee,
      icon: UserPlus,
      onClick: onAddEmployee || (() => window.location.href = '/employees'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      disabled: !data?.canAddEmployee || !onAddEmployee,
    },
    {
      label: translations.addAsset,
      icon: Plus,
      onClick: onAddAsset || (() => window.location.href = '/assets'),
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      disabled: !data?.canAddAsset || !onAddAsset,
    },
    {
      label: translations.openTicket,
      icon: Ticket,
      onClick: onOpenTicket || (() => window.location.href = '/tickets'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      disabled: !data?.canOpenTicket || !onOpenTicket,
    },
  ];

const totalPendingActions = data ? 
  (data.pendingActions.employeesNeedToReturnAssets + 
   data.pendingActions.assetsNeedingMaintenance + 
   data.pendingActions.ticketsNearingSLA) : 0;

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-32" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {translations.quickActions}
            </h3>
            {totalPendingActions > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertCircle className="h-3 w-3 mr-1" />
                {totalPendingActions} {translations.pendingAlerts}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`${action.bgColor} ${action.color} border-none hover:shadow-md transition-all`}
                  variant="outline"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Pending Actions Alert Bar */}
        {data && totalPendingActions > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-wrap gap-4 text-sm">
            {data.pendingActions.employeesNeedToReturnAssets > 0 && (
              <div 
                className="flex items-center gap-2 text-orange-600 cursor-pointer hover:text-orange-700"
                onClick={() => window.location.href = '/employees?statusFilter=Resigned'}
              >
                <AlertCircle className="h-4 w-4" />
                <span>{data.pendingActions.employeesNeedToReturnAssets} {translations.employeesNeedToReturn}</span>
              </div>
              )}
              {data.pendingActions.assetsNeedingMaintenance > 0 && (
                <div 
                  className="flex items-center gap-2 text-yellow-600 cursor-pointer hover:text-yellow-700"
                  onClick={() => window.location.href = '/assets?maintenanceDue=scheduled'}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{data.pendingActions.assetsNeedingMaintenance} {translations.assetsNeedMaintenance}</span>
                </div>
              )}
              {data.pendingActions.ticketsNearingSLA > 0 && (
                <div 
                  className="flex items-center gap-2 text-red-600 cursor-pointer hover:text-red-700"
                  onClick={() => window.location.href = '/tickets?statusFilter=Open'}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{data.pendingActions.ticketsNearingSLA} {translations.ticketsNearSLA}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}