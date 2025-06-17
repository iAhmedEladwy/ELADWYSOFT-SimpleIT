import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import EmployeesTable from '@/components/employees/EmployeesTable';
import EmployeeForm from '@/components/employees/EmployeeForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Download, Upload, Filter, X, CheckSquare, Square, Trash2, Edit3, UserCheck } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState('Active'); // Default to Active employees
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Listen for the FAB add employee event
  useEffect(() => {
    const handleFabAddEmployee = () => {
      // Clear editing state and open dialog for new employee
      setEditingEmployee(null);
      setOpenDialog(true);
    };
    
    // Register event listener
    window.addEventListener('fab:add-employee', handleFabAddEmployee);
    
    // Check if URL has action=new parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      handleFabAddEmployee();
      // Clean up the URL to prevent dialog from reopening on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Clean up
    return () => {
      window.removeEventListener('fab:add-employee', handleFabAddEmployee);
    };
  }, []);

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
    filterByStatus: language === 'English' ? 'Filter by Status' : 'تصفية حسب الحالة',
    advancedFilters: language === 'English' ? 'Advanced Filters' : 'فلاتر متقدمة',
    department: language === 'English' ? 'Department' : 'القسم',
    employmentType: language === 'English' ? 'Employment Type' : 'نوع التوظيف',
    allDepartments: language === 'English' ? 'All Departments' : 'جميع الأقسام',
    allTypes: language === 'English' ? 'All Types' : 'جميع الأنواع',
    clearFilters: language === 'English' ? 'Clear Filters' : 'مسح الفلاتر',
    selectAll: language === 'English' ? 'Select All' : 'تحديد الكل',
    deselectAll: language === 'English' ? 'Deselect All' : 'إلغاء تحديد الكل',
    bulkActions: language === 'English' ? 'Bulk Actions' : 'العمليات المجمعة',
    deleteSelected: language === 'English' ? 'Delete Selected' : 'حذف المحدد',
    changeStatus: language === 'English' ? 'Change Status' : 'تغيير الحالة',
    exportSelected: language === 'English' ? 'Export Selected' : 'تصدير المحدد',
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
    mutationFn: (employeeData: any) => {
      console.log('Submitting employee data:', employeeData);
      return apiRequest('POST', '/api/employees/create-raw', employeeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: translations.employeeAdded,
      });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      console.error('Employee creation error:', error);
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

  // Filter employees based on search query and status
  const filteredEmployees = (employees as any[]).filter((employee: any) => {
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = (
      employee.englishName?.toLowerCase().includes(searchString) ||
      employee.arabicName?.toLowerCase().includes(searchString) ||
      employee.empId?.toLowerCase().includes(searchString) ||
      employee.department?.toLowerCase().includes(searchString) ||
      employee.title?.toLowerCase().includes(searchString)
    );
    
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' && employee.isActive !== false) ||
      (statusFilter === 'Resigned' && employee.status === 'Resigned') ||
      (statusFilter === 'Terminated' && employee.status === 'Terminated') ||
      (statusFilter === 'On Leave' && employee.status === 'On Leave');
    
    return matchesSearch && matchesStatus;
  });

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
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
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

      <div className="flex gap-4 mb-6">
        <Input
          placeholder={translations.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={translations.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{translations.allEmployees}</SelectItem>
            <SelectItem value="Active">{translations.active}</SelectItem>
            <SelectItem value="Resigned">{translations.resigned}</SelectItem>
            <SelectItem value="Terminated">{translations.terminated}</SelectItem>
            <SelectItem value="On Leave">{translations.onLeave}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-[400px] w-full" />
      ) : (
        <EmployeesTable 
          employees={filteredEmployees} 
          onEdit={handleEditEmployee} 
          onDelete={handleDeleteEmployee} 
        />
      )}
    </div>
  );
}
