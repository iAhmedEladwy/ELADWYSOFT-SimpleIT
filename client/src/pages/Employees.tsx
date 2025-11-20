import { useState, useEffect, useMemo,useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import EmployeesTable from '@/components/employees/EmployeesTable';
import EmployeeForm from '@/components/employees/EmployeeForm';
import EmployeeCustomFilters, { CustomFilterType } from '@/components/employees/EmployeeCustomFilters';
import { applyCustomEmployeeFilter } from '@/utils/employeeFilters'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  // Initialize statusFilter: 'All' if custom filter in URL, otherwise 'Active'
  const params = new URLSearchParams(window.location.search);
  const [statusFilter, setStatusFilter] = useState(params.get('customFilter') && !params.get('statusFilter') ? 'All' : 'Active');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [customFilter, setCustomFilter] = useState<CustomFilterType>(null);
  const isInitialMount = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout>(); 


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
    filters: language === 'English' ? 'Filters' : 'الفلاتر',
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
    status: language === 'English' ? 'Status' : 'الحالة',
    search: language === 'English' ? 'Search...' : 'بحث...',
    searchPlaceholder: language === 'English' ? 'Search employees...' : 'البحث عن الموظفين...',
    import: language === 'English' ? 'Import' : 'استيراد',
    export: language === 'English' ? 'Export' : 'تصدير',
    selectFile: language === 'English' ? 'Select File' : 'اختر ملف',
    employeeAdded: language === 'English' ? 'Employee added successfully' : 'تمت إضافة الموظف بنجاح',
    employeeUpdated: language === 'English' ? 'Employee updated successfully' : 'تم تحديث الموظف بنجاح',
    employeeDeleted: language === 'English' ? 'Employee deleted successfully' : 'تم حذف الموظف بنجاح',
    importSuccess: language === 'English' ? 'Employees imported successfully' : 'تم استيراد الموظفين بنجاح',
    error: language === 'English' ? 'An error occurred' : 'حدث خطأ',
    quickFilters: language === 'English' ? 'Quick Filters' : 'الفلاتر السريعة',
    employeesSelected: language === 'English' ? 'employees selected' : 'موظف محدد',
    activateSelected: language === 'English' ? 'Activate Selected' : 'تفعيل المحدد',
    markAsResigned: language === 'English' ? 'Mark as Resigned' : 'وضع علامة كمستقيل',
    markOnLeave: language === 'English' ? 'Mark on Leave' : 'وضع علامة في إجازة',
    markAsTerminated: language === 'English' ? 'Mark as Terminated' : 'وضع علامة كمنهي الخدمة',
    showing: language === 'English' ? 'Showing' : 'عرض',
    of: language === 'English' ? 'of' : 'من',
    employees: language === 'English' ? 'employees' : 'موظف',
    filtersActive: language === 'English' ? 'filter(s) active' : 'مرشح نشط',
    filtersApplied: language === 'English' ? 'Filters applied' : 'تم تطبيق الفلاتر',
    employeesUpdatedSuccess: language === 'English' ? 'employees updated successfully' : 'تم تحديث الموظفين بنجاح',
    failedToUpdate: language === 'English' ? 'Failed to update employees' : 'فشل في تحديث الموظفين',
    editEmployeeDescription: language === 'English' ? 'Edit employee information and details' : 'تعديل معلومات وتفاصيل الموظف',
    addEmployeeDescription: language === 'English' ? 'Add a new employee to the system' : 'إضافة موظف جديد إلى النظام',
  };

  // Fetch employees
  const { 
    data: employees = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiRequest('/api/employees', 'GET'),
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch assets data (needed for asset-related filters)
  const { data: assets = [] } = useQuery({
    queryKey: ['/api/assets'],
    queryFn: () => apiRequest('/api/assets', 'GET'),
    staleTime: 5 * 60 * 1000,
  });

    // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Read filters from URL
    const statusParam = params.get('statusFilter');
    const departmentParam = params.get('departmentFilter');
    const employmentTypeParam = params.get('employmentTypeFilter');
    const searchParam = params.get('search');
    const customFilterParam = params.get('customFilter');
      if (customFilterParam) {
        setCustomFilter(customFilterParam as CustomFilterType);
        // If custom filter is set and no explicit status filter, use 'All' to avoid conflicts
        if (!statusParam) {
          setStatusFilter('All');
        }
      }

    // Update state based on URL params
    if (statusParam) setStatusFilter(statusParam);
    if (departmentParam) setDepartmentFilter(departmentParam);
    if (employmentTypeParam) setEmploymentTypeFilter(employmentTypeParam);
    if (searchParam) setSearchQuery(searchParam);

    // Mark that initial mount is complete
    isInitialMount.current = false;
  }, []); // Only run on mount

  // Function to update URL when filters change
  const updateURL = useCallback(() => {
    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce URL updates (500ms)
    updateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();

      // Add parameters
      if (statusFilter !== 'Active') {
        params.set('statusFilter', statusFilter);
      }
      if (departmentFilter !== 'All') {
        params.set('departmentFilter', departmentFilter);
      }
      if (employmentTypeFilter !== 'All') {
        params.set('employmentTypeFilter', employmentTypeFilter);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      // Construct the new URL
      const newSearch = params.toString();
      const newPath = newSearch ? `/employees?${newSearch}` : '/employees';

      // Update the URL without triggering a re-render
      if (window.location.pathname + window.location.search !== newPath) {
        window.history.replaceState({}, '', newPath);
      }
    }, 500);
  }, [statusFilter, departmentFilter, employmentTypeFilter, searchQuery]);

   // Update URL whenever filters change (but not on initial mount)
  useEffect(() => {
    if (!isInitialMount.current) {
      updateURL();
    }
  }, [statusFilter, departmentFilter, employmentTypeFilter, searchQuery, updateURL]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
// Update URL when custom filter changes
  useEffect(() => {
    if (!isInitialMount.current && customFilter !== null) {
      const params = new URLSearchParams(window.location.search);
      if (customFilter) {
        params.set('customFilter', customFilter);
      } else {
        params.delete('customFilter');
      }
      const newPath = params.toString() ? `/employees?${params.toString()}` : '/employees';
      window.history.replaceState({}, '', newPath);
    }
  }, [customFilter]);
    

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

  // Fetch custom departments for filter dropdown
  const { data: customDepartments = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-departments'],
    staleTime: 1000 * 60 * 5,
  });

  // Get department names for filter (from custom_departments table)
  const departments = useMemo(() => {
    if (!customDepartments || !Array.isArray(customDepartments)) return ['All'];
    const deptNames = customDepartments.map((dept: any) => dept.name).sort();
    return ['All', ...deptNames];
  }, [customDepartments]);

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
      // Get the full employee data for each selected employee
      const selectedEmployeeData = employees.filter((emp: any) => 
        selectedEmployees.includes(emp.id)
      );
      
      await Promise.all(
        selectedEmployeeData.map((employee: any) => 
          apiRequest(`/api/employees/${employee.id}`, 'PUT', {
            ...employee, // Send all existing data
            status: newStatus,
            isActive: newStatus === 'Active'
          })
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: `${selectedEmployees.length} ${translations.employeesUpdatedSuccess}`,
      });
      setSelectedEmployees([]);
    } catch (error) {
      toast({
        title: translations.error,
        description: translations.failedToUpdate,
        variant: 'destructive',
      });
    }
  };

  // Enhanced filtering with multiple criteria and null safety
 const filteredEmployees = useMemo(() => {
  if (!employees || !Array.isArray(employees)) return [];
  
  // First, apply the standard filters
  let filtered = employees.filter((employee: any) => {
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

  // Then, apply custom filter if it exists
  if (customFilter) {
    filtered = applyCustomEmployeeFilter(filtered, customFilter, assets);
  }

  return filtered;
}, [employees, searchQuery, statusFilter, departmentFilter, employmentTypeFilter, customFilter, assets]);

  // Count active filters for display
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter !== 'All') count++;
    if (departmentFilter !== 'All') count++;
    if (employmentTypeFilter !== 'All') count++;
    if (customFilter) count++;
    return count;
  }, [searchQuery, statusFilter, departmentFilter, employmentTypeFilter,customFilter]);

  // Add this useEffect to read URL parameters on mount


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
                      {editingEmployee ? translations.editEmployeeDescription : translations.addEmployeeDescription}
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

     {/* Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {translations.filters}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* FIRST ROW: Search Bar (Full Width) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={translations.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          
          {/* SECOND ROW: All 4 Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* 1. Custom Filters Dropdown */}
            <div>
              <Label className="text-sm font-medium mb-1 block">
                {translations.quickFilters}
              </Label>
              <EmployeeCustomFilters
                onFilterChange={setCustomFilter}
                currentFilter={customFilter}
                employeeCount={
                  customFilter ? 
                  filteredEmployees.length :  // Use the already filtered employees count
                  undefined
                }
                assetData={assets}
              />
            </div>
            
            {/* 2. Status Filter */}
            <div>
              <Label className="text-sm font-medium mb-1 block">
                {translations.status || 'Status'}
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={translations.filterByStatus} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="All">{translations.all}</SelectItem>
                  <SelectItem value="Active">{translations.active}</SelectItem>
                  <SelectItem value="Resigned">{translations.resigned}</SelectItem>
                  <SelectItem value="Terminated">{translations.terminated}</SelectItem>
                  <SelectItem value="On Leave">{translations.onLeave}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 3. Department Filter */}
            <div>
              <Label className="text-sm font-medium mb-1 block">
                {translations.department}
              </Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={translations.department} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="All">{translations.allDepartments}</SelectItem>
                  {departments.slice(1).map((dept: string) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 4. Employment Type Filter */}
            <div>
              <Label className="text-sm font-medium mb-1 block">
                {translations.employmentType}
              </Label>
              <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={translations.employmentType} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="All">{translations.allTypes}</SelectItem>
                  {employmentTypes.slice(1).map((type: string) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {searchQuery && (
                <Badge variant="outline" className="gap-1">
                  {translations.search}: {searchQuery}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {customFilter && (
                <Badge variant="outline" className="gap-1">
                  {translations.quickFilters}: {customFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setCustomFilter(null)}
                  />
                </Badge>
              )}
              {statusFilter !== 'All' && (
                <Badge variant="outline" className="gap-1">
                  {translations.status}: {translations[statusFilter.toLowerCase() as keyof typeof translations] || statusFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setStatusFilter('All')}
                  />
                </Badge>
              )}
              {departmentFilter !== 'All' && (
                <Badge variant="outline" className="gap-1">
                  {translations.department}: {departmentFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setDepartmentFilter('All')}
                  />
                </Badge>
              )}
              {employmentTypeFilter !== 'All' && (
                <Badge variant="outline" className="gap-1">
                  {translations.employmentType}: {employmentTypeFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setEmploymentTypeFilter('All')}
                  />
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDepartmentFilter('All');
                  setEmploymentTypeFilter('All');
                  setStatusFilter('All');
                  setSearchQuery('');
                  setCustomFilter(null);
                }}
                className="h-6 px-2 text-xs"
              >
                {translations.clearFilters}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee count summary */}
      {selectedEmployees.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
            {selectedEmployees.length} {translations.employeesSelected}
          </span>
        </div>
      )}

      {/* Bulk Operations */}
      {selectedEmployees.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-700">
              {selectedEmployees.length} {translations.employeesSelected}
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
                  {translations.activateSelected}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('Resigned')}>
                  <UserX className="h-4 w-4 mr-2" />
                  {translations.markAsResigned}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('On Leave')}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  {translations.markOnLeave}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('Terminated')}>
                  <UserX className="h-4 w-4 mr-2" />
                  {translations.markAsTerminated}
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
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>
          {translations.showing} {Array.isArray(filteredEmployees) ? filteredEmployees.length : 0} {translations.of} {Array.isArray(employees) ? employees.length : 0} {translations.employees}
        </span>
        {activeFilterCount > 0 && (
          <span className="text-blue-600">
            {translations.filtersApplied}
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
