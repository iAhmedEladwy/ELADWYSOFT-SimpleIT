/**
 * Employee Link Required Component
 * 
 * Context: SimpleIT v0.4.5 - Component to handle missing employee links
 * 
 * Shows when user is authenticated but has no employee record
 * Provides options to link to existing employee or contact admin
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User, Link, RefreshCw } from 'lucide-react';

interface Employee {
  id: number;
  userId: number | null;
  name: string;
}

interface EmployeeLinkRequiredProps {
  availableEmployees: Employee[];
  onRefresh?: () => void;
}

export default function EmployeeLinkRequired({ availableEmployees, onRefresh }: EmployeeLinkRequiredProps) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const translations = {
    title: language === 'English' ? 'Employee Record Required' : 'سجل الموظف مطلوب',
    message: language === 'English' 
      ? 'Your user account is not linked to an employee record. You need to be linked to an employee to access the portal.' 
      : 'حساب المستخدم الخاص بك غير مرتبط بسجل موظف. تحتاج إلى ربط حسابك بموظف للوصول إلى البوابة.',
    availableEmployees: language === 'English' ? 'Available Employees' : 'الموظفون المتاحون',
    linkToEmployee: language === 'English' ? 'Link to This Employee' : 'ربط بهذا الموظف',
    contactAdmin: language === 'English' ? 'Contact Administrator' : 'اتصل بالمسؤول',
    adminMessage: language === 'English' 
      ? 'If you don\'t see your employee record below, please contact your system administrator to create an employee record for you.' 
      : 'إذا لم تر سجل الموظف الخاص بك أدناه، يرجى الاتصال بمسؤول النظام لإنشاء سجل موظف لك.',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    linking: language === 'English' ? 'Linking...' : 'جاري الربط...',
    linked: language === 'English' ? 'Linked' : 'مرتبط',
    noEmployees: language === 'English' ? 'No unlinked employees available' : 'لا توجد موظفين غير مرتبطين متاحين',
  };

  // Link employee mutation
  const linkEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const response = await fetch('/api/portal/debug/link-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ employeeId })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refresh the employee status
      queryClient.invalidateQueries({ queryKey: ['/api/portal/debug/employee-status'] });
      if (onRefresh) onRefresh();
    },
  });

  const unlinkedEmployees = availableEmployees.filter(emp => !emp.userId);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-orange-700">
            {translations.message}
          </p>

          {unlinkedEmployees.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-orange-800">{translations.availableEmployees}</h3>
              <div className="space-y-2">
                {unlinkedEmployees.map((employee) => (
                  <div 
                    key={employee.id} 
                    className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="font-medium">{employee.name}</span>
                        <Badge variant="outline" className="ml-2">ID: {employee.id}</Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => linkEmployeeMutation.mutate(employee.id)}
                      disabled={linkEmployeeMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {linkEmployeeMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {translations.linking}
                        </>
                      ) : (
                        <>
                          <Link className="h-4 w-4 mr-2" />
                          {translations.linkToEmployee}
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unlinkedEmployees.length === 0 && (
            <div className="text-center py-6">
              <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-3" />
              <p className="text-orange-700 mb-4">{translations.noEmployees}</p>
            </div>
          )}

          <div className="border-t border-orange-200 pt-4">
            <p className="text-sm text-orange-600 mb-3">
              {translations.adminMessage}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onRefresh}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {translations.refresh}
              </Button>
            </div>
          </div>

          {linkEmployeeMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-700 text-sm">
                Error: {linkEmployeeMutation.error.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}