import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import EmployeesTable from '@/components/employees/EmployeesTable';
import EmployeeForm from '@/components/employees/EmployeeForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Download, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

export default function Employees() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Translations
  const translations = {
    title: language === 'English' ? 'Employees Management' : 'إدارة الموظفين',
    description: language === 'English' 
      ? 'Add, edit and manage company employees' 
      : 'إضافة وتعديل وإدارة موظفي الشركة',
    allEmployees: language === 'English' ? 'All Employees' : 'جميع الموظفين',
    active: language === 'English' ? 'Active' : 'نشط',
    resigned: language === 'English' ? 'Resigned' : 'استقال',
    terminated: language === 'English' ? 'Terminated' : 'تم إنهاء الخدمة',
    onLeave: language === 'English' ? 'On Leave' : 'في إجازة',
    addEmployee: language === 'English' ? 'Add Employee' : 'إضافة موظف',
    editEmployee: language === 'English' ? 'Edit Employee' : 'تعديل الموظف',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    search: language === 'English' ? 'Search...' : 'بحث...',
    import: language === 'English' ? 'Import' : 'استيراد',
    export: language === 'English' ? 'Export' : 'تصدير',
    selectFile: language === 'English' ? 'Select File' : 'اختر ملف',
    employeeAdded: language === 'English' ? 'Employee added successfully' : 'تمت إضافة الموظف بنجاح',
    employeeUpdated: language === 'English' ? 'Employee updated successfully' : 'تم تحديث الموظف بنجاح',
    employeeDeleted: language === 'English' ? 'Employee deleted successfully' : 'تم حذف الموظف بنجاح',
    importSuccess: language === 'English' ? 'Employees imported successfully' : 'تم استيراد الموظفين بنجاح',
    error: language === 'English' ? 'An error occurred' : 'حدث خطأ',
  };

  // Fetch employees
  const { 
    data: employees = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['/api/employees'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add employee mutation
  const addEmployeeMutation = useMutation({
    mutationFn: (employeeData: any) => 
      apiRequest('POST', '/api/employees', employeeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: translations.employeeAdded,
      });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, employeeData }: { id: number; employeeData: any }) => 
      apiRequest('PUT', `/api/employees/${id}`, employeeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: translations.employeeUpdated,
      });
      setOpenDialog(false);
      setEditingEmployee(null);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: translations.employeeDeleted,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Import employees mutation
  const importEmployeesMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/employees/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: translations.importSuccess,
        description: `${data.imported} employees imported.`,
      });
      setImportFile(null);
      setIsImporting(false);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
      setIsImporting(false);
    },
  });

  const handleAddEmployee = (employeeData: any) => {
    addEmployeeMutation.mutate(employeeData);
  };

  const handleUpdateEmployee = (employeeData: any) => {
    if (editingEmployee && editingEmployee.id) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, employeeData });
    }
  };

  const handleDeleteEmployee = (employeeId: number) => {
    deleteEmployeeMutation.mutate(employeeId);
  };

  const handleEditEmployee = (employee: any) => {
    setEditingEmployee(employee);
    setOpenDialog(true);
  };

  const handleExport = () => {
    window.open('/api/employees/export', '_blank');
  };

  const handleImport = () => {
    if (!importFile) return;
    
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    importEmployeesMutation.mutate(formData);
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter((employee: any) => {
    const searchString = searchQuery.toLowerCase();
    return (
      employee.englishName?.toLowerCase().includes(searchString) ||
      employee.arabicName?.toLowerCase().includes(searchString) ||
      employee.empId?.toLowerCase().includes(searchString) ||
      employee.department?.toLowerCase().includes(searchString) ||
      employee.title?.toLowerCase().includes(searchString)
    );
  });

  // Filter employees by status
  const activeEmployees = filteredEmployees.filter((employee: any) => employee.status === 'Active');
  const resignedEmployees = filteredEmployees.filter((employee: any) => employee.status === 'Resigned');
  const terminatedEmployees = filteredEmployees.filter((employee: any) => employee.status === 'Terminated');
  const onLeaveEmployees = filteredEmployees.filter((employee: any) => employee.status === 'On Leave');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{translations.title}</h1>
          <p className="text-gray-600">{translations.description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {translations.refresh}
          </Button>
          
          {hasAccess(2) && (
            <>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                {translations.export}
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {translations.import}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{translations.import}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <Button 
                      onClick={handleImport} 
                      disabled={!importFile || isImporting}
                      className="w-full"
                    >
                      {isImporting ? 'Importing...' : translations.import}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {translations.addEmployee}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEmployee ? translations.editEmployee : translations.addEmployee}
                    </DialogTitle>
                  </DialogHeader>
                  <EmployeeForm
                    onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                    initialData={editingEmployee}
                    isSubmitting={addEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder={translations.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">{translations.allEmployees}</TabsTrigger>
          <TabsTrigger value="active">{translations.active}</TabsTrigger>
          <TabsTrigger value="resigned">{translations.resigned}</TabsTrigger>
          <TabsTrigger value="terminated">{translations.terminated}</TabsTrigger>
          <TabsTrigger value="onleave">{translations.onLeave}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <EmployeesTable 
              employees={filteredEmployees} 
              onEdit={handleEditEmployee} 
              onDelete={handleDeleteEmployee} 
            />
          )}
        </TabsContent>

        <TabsContent value="active">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <EmployeesTable 
              employees={activeEmployees} 
              onEdit={handleEditEmployee} 
              onDelete={handleDeleteEmployee} 
            />
          )}
        </TabsContent>

        <TabsContent value="resigned">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <EmployeesTable 
              employees={resignedEmployees} 
              onEdit={handleEditEmployee} 
              onDelete={handleDeleteEmployee} 
            />
          )}
        </TabsContent>

        <TabsContent value="terminated">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <EmployeesTable 
              employees={terminatedEmployees} 
              onEdit={handleEditEmployee} 
              onDelete={handleDeleteEmployee} 
            />
          )}
        </TabsContent>

        <TabsContent value="onleave">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <EmployeesTable 
              employees={onLeaveEmployees} 
              onEdit={handleEditEmployee} 
              onDelete={handleDeleteEmployee} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
