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
      employeesNeedingAssets: number;
      assetsNeedingMaintenance: number;
      ticketsNearingSLA: number;
    };
  };
  isLoading: boolean;
  // ADD THESE CALLBACK PROPS
  onAddEmployee?: () => void;
  onAddAsset?: () => void;
  onOpenTicket?: () => void;
}

export default function QuickActions({ 
  data, 
  isLoading,
  onAddEmployee, // ADD
  onAddAsset,    // ADD
  onOpenTicket   // ADD
}: QuickActionsProps) {
  const { language } = useLanguage();

  const translations = {
    quickActions: language === 'English' ? 'Quick Actions' : 'إجراءات سريعة',
    addEmployee: language === 'English' ? 'Add Employee' : 'إضافة موظف',
    addAsset: language === 'English' ? 'Add Asset' : 'إضافة أصل',
    openTicket: language === 'English' ? 'Open Ticket' : 'فتح تذكرة',
    pendingAlerts: language === 'English' ? 'Pending Alerts' : 'تنبيهات معلقة',
    employeesNeedAssets: language === 'English' ? 'Employees need assets' : 'موظفون يحتاجون أصول',
    assetsNeedMaintenance: language === 'English' ? 'Assets need maintenance' : 'أصول تحتاج صيانة',
    ticketsNearSLA: language === 'English' ? 'Tickets near SLA' : 'تذاكر قريبة من SLA',
  };

  // UPDATE THE ACTIONS ARRAY TO USE CALLBACKS
  const actions = [
    {
      label: translations.addEmployee,
      icon: UserPlus,
      onClick: onAddEmployee || (() => window.location.href = '/employees'), // Use callback or fallback
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      disabled: !data?.canAddEmployee,
    },
    {
      label: translations.addAsset,
      icon: Plus,
      onClick: onAddAsset || (() => window.location.href = '/assets'), // Use callback or fallback
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      disabled: !data?.canAddAsset,
    },
    {
      label: translations.openTicket,
      icon: Ticket,
      onClick: onOpenTicket || (() => window.location.href = '/tickets'), // Use callback or fallback
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      disabled: !data?.canOpenTicket,
    },
  ];

  const totalPendingActions = data ? 
    (data.pendingActions.employeesNeedingAssets + 
     data.pendingActions.assetsNeedingMaintenance + 
     data.pendingActions.ticketsNearingSLA) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {translations.quickActions}
            </h3>
            {totalPendingActions > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  {translations.pendingAlerts}
                </span>
                <Badge variant="destructive" className="ml-1">
                  {totalPendingActions}
                </Badge>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className={`h-auto p-4 justify-start ${action.bgColor} border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform`}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className="flex items-center gap-3 w-full">
                      <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${action.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {action.label}
                      </span>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Pending Actions Summary */}
          {data && totalPendingActions > 0 && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="space-y-2 text-sm">
                {data.pendingActions.employeesNeedingAssets > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {translations.employeesNeedAssets}
                    </span>
                    <a
                      href="/employees?filter=needsAssets"
                      className="font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      {data.pendingActions.employeesNeedingAssets}
                    </a>
                  </div>
                )}
                {data.pendingActions.assetsNeedingMaintenance > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {translations.assetsNeedMaintenance}
                    </span>
                    <a
                      href="/assets?maintenanceDue=scheduled"
                      className="font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      {data.pendingActions.assetsNeedingMaintenance}
                    </a>
                  </div>
                )}
                {data.pendingActions.ticketsNearingSLA > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {translations.ticketsNearSLA}
                    </span>
                    <a
                      href="/tickets?filter=nearingSLA"
                      className="font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      {data.pendingActions.ticketsNearingSLA}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}