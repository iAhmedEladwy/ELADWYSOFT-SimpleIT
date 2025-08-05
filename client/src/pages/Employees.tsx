import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import EmployeesTable from '@/components/employees/EmployeesTable';
import EmployeeForm from '@/components/employees/EmployeeForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Download, Upload, Filter, X, CheckSquare, Square, Trash2, Edit3, UserCheck, UserX, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Employees() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth(); // Enhanced employee data validation and management
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
  


  // Translations
  const translations = {
    title: language === 'English' ? 'Employees Management' : 'إدارة الموظفين',
    description: language === 'English' 
      ? 'Add, edit and manage company employees' 
      : 'إضافة وتعديل وإدارة موظفي الشركة',
    allEmployees: language === 'English' ? 'All Employees' : 'جميع الموظفين',
    all: language === 'English' ? 'All' : 'الكل',
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
    staleTime: 0, // Always fetch fresh data
  });

  // Add employee mutation
  const addEmployeeMutation = useMutation({
    mutationFn: (employeeData: any) => {
      console.log('Submitting employee data:', employeeData);
      return apiRequest('/api/employees/create-raw', 'POST', employeeData);
    },
    onSuccess: async () => {
      // Force immediate cache invalidation and refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      await refetch(); // Ensure fresh data loads immediately
      toast({
        title: translations.employeeAdded,
      });
      setOpenDialog(false);
      setEditingEmployee(null); // Clear any editing state
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
      apiRequest(`/api/employees/${id}`, 'PUT', employeeData),
    onSuccess: async () => {
      // Force immediate cache invalidation and refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      await refetch(); // Ensure UI reflects changes immediately
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
      apiRequest(`/api/employees/${id}`, 'DELETE'),
    onSuccess: async () => {
      // Force immediate cache invalidation and refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      await refetch(); // Ensure deleted employee is removed from UI immediately
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

  // Get unique departments and employment types for filters with null safety
  const departments = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return ['All'];
    const depts = Array.from(new Set(
      employees
        .map((emp: any) => emp?.department)
        .filter(dept => dept && dept.trim() !== '' && dept !== 'null' && dept !== 'undefined')
    ));
    return ['All', ...depts.sort()];
  }, [employees]);

  const employmentTypes = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return ['All'];
    const types = Array.from(new Set(
      employees
        .map((emp: any) => emp?.employmentType)
        .filter(type => type && type.trim() !== '' && type !== 'null' && type !== 'undefined')
    ));
    return ['All', ...types.sort()];
  }, [employees]);

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((emp: any) => emp.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmployees.length === 0) return;
    
    try {
      await Promise.all(
        selectedEmployees.map(id => 
          apiRequest(`/api/employees/${id}`, 'DELETE')
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: `${selectedEmployees.length} employees deleted successfully`,
      });
      setSelectedEmployees([]);
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: translations.error,
        description: 'Failed to delete employees',
        variant: 'destructive',
      });
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedEmployees.length === 0) return;
    
    try {
      await Promise.all(
        selectedEmployees.map(id => 
          apiRequest(`/api/employees/${id}`, 'PUT', { 
            status: newStatus,
            isActive: newStatus === 'Active'
          })
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: `${selectedEmployees.length} employees updated successfully`,
      });
      setSelectedEmployees([]);
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: translations.error,
        description: 'Failed to update employees',
        variant: 'destructive',
      });
    }
  };

  // Enhanced filtering with multiple criteria and null safety
  const filteredEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return [];
    
    return employees.filter((employee: any) => {
      // Null safety checks for all employee properties
      const safeEmployee = {
        englishName: employee?.englishName || '',
        name: employee?.name || '',
        arabicName: employee?.arabicName || '',
        empId: employee?.empId || '',
        employeeId: employee?.employeeId || '',
        department: employee?.department || '',
        title: employee?.title || '',
        position: employee?.position || '',
        personalEmail: employee?.personalEmail || '',
        email: employee?.email || '',
        corporateEmail: employee?.corporateEmail || '',
        status: employee?.status || '',
        isActive: employee?.isActive,
        employmentType: employee?.employmentType || ''
      };
      
      // Search filter - check all available name and identifier fields with null safety
      const searchString = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || (
        safeEmployee.englishName.toLowerCase().includes(searchString) ||
        safeEmployee.name.toLowerCase().includes(searchString) ||
        safeEmployee.arabicName.toLowerCase().includes(searchString) ||
        safeEmployee.empId.toLowerCase().includes(searchString) ||
        safeEmployee.employeeId.toLowerCase().includes(searchString) ||
        safeEmployee.department.toLowerCase().includes(searchString) ||
        safeEmployee.title.toLowerCase().includes(searchString) ||
        safeEmployee.position.toLowerCase().includes(searchString) ||
        safeEmployee.personalEmail.toLowerCase().includes(searchString) ||
        safeEmployee.email.toLowerCase().includes(searchString) ||
        safeEmployee.corporateEmail.toLowerCase().includes(searchString)
      );
      
      // Status filter - use enum status values only
      const matchesStatus = statusFilter === 'All' || safeEmployee.status === statusFilter;
      
      // Department filter with null safety
      const matchesDepartment = departmentFilter === 'All' || 
        safeEmployee.department === departmentFilter;
      
      // Employment type filter with null safety
      const matchesEmploymentType = employmentTypeFilter === 'All' || 
        safeEmployee.employmentType === employmentTypeFilter;
      
      return matchesSearch && matchesStatus && matchesDepartment && matchesEmploymentType;
    });
  }, [employees, searchQuery, statusFilter, departmentFilter, employmentTypeFilter]);

  // Count active filters for display
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter !== 'Active') count++;
    if (departmentFilter !== 'All') count++;
    if (employmentTypeFilter !== 'All') count++;
    return count;
  }, [searchQuery, statusFilter, departmentFilter, employmentTypeFilter]);

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
              
              
              
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setEditingEmployee(null); // Clear editing state for new employee
                      setOpenDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {translations.addEmployee}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto" aria-describedby="employee-form-description">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEmployee ? translations.editEmployee : translations.addEmployee}
                      {editingEmployee && (
                        <span className="text-sm text-gray-500 ml-2 font-normal">
                          ({editingEmployee.empId || editingEmployee.employeeId})
                        </span>
                      )}
                    </DialogTitle>
                    <DialogDescription id="employee-form-description">
                      {editingEmployee ? 'Edit employee information and details' : 'Add a new employee to the system'}
                    </DialogDescription>
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

      {/* Advanced Search and Filter Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {language === 'English' ? 'Employee Filters' : 'مرشحات الموظفين'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">{translations.search}</Label>
              <Input
                placeholder={translations.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">{language === 'English' ? 'Status' : 'الحالة'}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={translations.filterByStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{translations.all}</SelectItem>
                  <SelectItem value="Active">{translations.active}</SelectItem>
                  <SelectItem value="Resigned">{translations.resigned}</SelectItem>
                  <SelectItem value="Terminated">{translations.terminated}</SelectItem>
                  <SelectItem value="On Leave">{translations.onLeave}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">{translations.department}</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Departments</SelectItem>
                  {departments.slice(1).map((dept: string) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">{translations.employmentType}</Label>
              <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  {employmentTypes.slice(1).map((type: string) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(departmentFilter !== 'All' || employmentTypeFilter !== 'All' || statusFilter !== 'Active' || searchQuery) && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDepartmentFilter('All');
                  setEmploymentTypeFilter('All');
                  setStatusFilter('Active');
                  setSearchQuery('');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                {translations.clearFilters}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Summary */}
      {activeFilterCount > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">
              {language === 'English' 
                ? `${activeFilterCount} filter(s) active - Showing ${filteredEmployees.length} of ${employees && Array.isArray(employees) ? employees.length : 0} employees`
                : `${activeFilterCount} مرشح نشط - عرض ${filteredEmployees.length} من ${employees && Array.isArray(employees) ? employees.length : 0} موظف`}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div>
          {selectedEmployees.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedEmployees.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
              >
                {translations.bulkActions}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Operations */}
      {showBulkActions && selectedEmployees.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-700">
              {selectedEmployees.length} {language === 'English' ? 'employees selected' : 'موظف محدد'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectedEmployees.length === (filteredEmployees && Array.isArray(filteredEmployees) ? filteredEmployees.length : 0) ? 
                translations.deselectAll : translations.selectAll}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserCheck className="h-4 w-4 mr-2" />
                  {translations.bulkActions}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkStatusChange('Active')}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  {language === 'English' ? 'Activate Selected' : 'تفعيل المحدد'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('Resigned')}>
                  <UserX className="h-4 w-4 mr-2" />
                  {language === 'English' ? 'Mark as Resigned' : 'وضع علامة كمستقيل'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('On Leave')}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  {language === 'English' ? 'Mark on Leave' : 'وضع علامة في إجازة'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('Terminated')}>
                  <UserX className="h-4 w-4 mr-2" />
                  {language === 'English' ? 'Mark as Terminated' : 'وضع علامة كمنهي الخدمة'}
                </DropdownMenuItem>
                {hasAccess(3) && (
                  <DropdownMenuItem 
                    onClick={handleBulkDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {translations.deleteSelected}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange('Active')}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {language === 'English' ? 'Change Status' : 'تغيير الحالة'}
            </Button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>
          Showing {Array.isArray(filteredEmployees) ? filteredEmployees.length : 0} of {Array.isArray(employees) ? employees.length : 0} employees
        </span>
        {activeFilterCount > 0 && (
          <span className="text-blue-600">
            Filters applied
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded" />
      ) : (
        <EmployeesTable 
          employees={Array.isArray(filteredEmployees) ? filteredEmployees : []} 
          onEdit={handleEditEmployee} 
          onDelete={handleDeleteEmployee} 
          selectedEmployees={selectedEmployees}
          onSelectionChange={setSelectedEmployees}
        />
      )}
    </div>
  );
}
