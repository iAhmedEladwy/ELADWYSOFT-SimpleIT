/**
 * Portal Debug Page - Employee Portal
 * 
 * Context: SimpleIT v0.4.5 - Debug page to diagnose portal access issues
 * 
 * Features:
 * - Shows current authentication status
 * - Displays employee-user relationship
 * - Provides tools to fix common portal access issues
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, User, Database } from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';

export default function PortalDebug() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const translations = {
    title: language === 'English' ? 'Portal Debug' : 'تشخيص البوابة',
    authStatus: language === 'English' ? 'Authentication Status' : 'حالة المصادقة',
    employeeStatus: language === 'English' ? 'Employee Status' : 'حالة الموظف',
    diagnostics: language === 'English' ? 'System Diagnostics' : 'تشخيصات النظام',
    loading: language === 'English' ? 'Loading...' : 'جاري التحميل...',
    authenticated: language === 'English' ? 'Authenticated' : 'مصادق عليه',
    notAuthenticated: language === 'English' ? 'Not Authenticated' : 'غير مصادق عليه',
    hasEmployeeRecord: language === 'English' ? 'Has Employee Record' : 'له سجل موظف',
    noEmployeeRecord: language === 'English' ? 'No Employee Record' : 'لا يوجد سجل موظف',
    linkEmployee: language === 'English' ? 'Link to Employee' : 'ربط بموظف',
    refresh: language === 'English' ? 'Refresh Data' : 'تحديث البيانات',
  };

  // Check authentication and employee status
  const { data: debugData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/portal/debug/employee-status'],
    queryFn: async () => {
      const response = await fetch('/api/portal/debug/employee-status', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    retry: false
  });

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
      queryClient.invalidateQueries({ queryKey: ['/api/portal/debug/employee-status'] });
      alert('Employee linked successfully! Portal should now work.');
    },
    onError: (error) => {
      alert(`Failed to link employee: ${error.message}`);
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{translations.title}</h1>
        <p className="text-gray-600 mt-2">
          Diagnostic information for portal access issues
        </p>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {translations.authStatus}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700">{translations.authenticated}</span>
                <Badge variant="outline">{user.role}</Badge>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700">{translations.notAuthenticated}</span>
              </>
            )}
          </div>
          
          {user && (
            <div className="bg-gray-50 p-3 rounded">
              <pre className="text-sm">
                {JSON.stringify({ 
                  id: user.id, 
                  username: user.username, 
                  role: user.role 
                }, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {translations.employeeStatus}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span>{translations.loading}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>Error: {error.message}</span>
              </div>
            </div>
          )}

          {debugData && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {debugData.hasEmployeeRecord ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700">{translations.hasEmployeeRecord}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">{translations.noEmployeeRecord}</span>
                  </>
                )}
              </div>

              {/* Current Employee */}
              {debugData.employee && (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <h4 className="font-medium text-green-800">Current Employee Record:</h4>
                  <pre className="text-sm mt-2 text-green-700">
                    {JSON.stringify(debugData.employee, null, 2)}
                  </pre>
                </div>
              )}

              {/* Available Employees */}
              {debugData.allEmployees && debugData.allEmployees.length > 0 && (
                <div className="bg-gray-50 p-3 rounded border">
                  <h4 className="font-medium text-gray-800">Available Employees:</h4>
                  <div className="mt-2 space-y-2">
                    {debugData.allEmployees.map((emp: any) => (
                      <div key={emp.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <span className="font-medium">{emp.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            (ID: {emp.id}, UserID: {emp.userId || 'None'})
                          </span>
                        </div>
                        {!debugData.hasEmployeeRecord && !emp.userId && (
                          <Button 
                            size="sm" 
                            onClick={() => linkEmployeeMutation.mutate(emp.id)}
                            disabled={linkEmployeeMutation.isPending}
                          >
                            {translations.linkEmployee}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Debug Data */}
              <details className="bg-gray-50 p-3 rounded border">
                <summary className="font-medium cursor-pointer">Full Debug Data</summary>
                <pre className="text-sm mt-2 overflow-auto">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </details>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => refetch()} disabled={isLoading}>
              {translations.refresh}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}