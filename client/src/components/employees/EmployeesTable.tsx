import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import type { EmployeeResponse } from '@shared/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Eye,
  Briefcase,
  Laptop,
  Ticket,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/authContext';
import EmployeeDetailsDialog from './EmployeeDetailsDialog';

interface EmployeesTableProps {
  employees: EmployeeResponse[];
  onEdit: (employee: EmployeeResponse) => void;
  onDelete: (employeeId: number) => void;
  selectedEmployees?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
}

export default function EmployeesTable({ 
  employees, 
  onEdit, 
  onDelete, 
  selectedEmployees = [],
  onSelectionChange
}: EmployeesTableProps) {
  const { language } = useLanguage();
  const { hasAccess } = useAuth();
  const [, navigate] = useLocation();
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeResponse | null>(null);
  
  // Action handlers for dropdown menu
  const handleViewDetails = (employee: EmployeeResponse) => {
    setSelectedEmployee(employee);
    setShowDetailsDialog(true);
  };

  const handleViewAssets = (employee: EmployeeResponse) => {
    navigate(`/assets?assignedTo=${employee.id}`);
  };

  const handleViewTickets = (employee: EmployeeResponse) => {
    navigate(`/tickets?assignedTo=${employee.id}`);
  };

  // Handle individual checkbox selection
  const handleEmployeeSelect = (employeeId: number, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedEmployees, employeeId]);
    } else {
      onSelectionChange(selectedEmployees.filter(id => id !== employeeId));
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange(employees.map(emp => emp.id));
    } else {
      onSelectionChange([]);
    }
  };

  const isAllSelected = employees.length > 0 && selectedEmployees.length === employees.length;
  const isIndeterminate = selectedEmployees.length > 0 && selectedEmployees.length < employees.length;

  // Translations
  const translations = {
    employeeID: language === 'English' ? 'Employee ID' : 'رقم الموظف',
    name: language === 'English' ? 'Name' : 'الاسم',
    department: language === 'English' ? 'Department' : 'القسم',
    title: language === 'English' ? 'Title' : 'المسمى الوظيفي',
    status: language === 'English' ? 'Status' : 'الحالة',
    joiningDate: language === 'English' ? 'Joining Date' : 'تاريخ الالتحاق',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    edit: language === 'English' ? 'Edit' : 'تعديل',
    delete: language === 'English' ? 'Delete' : 'حذف',
    confirmDelete: language === 'English' ? 'Confirm Deletion' : 'تأكيد الحذف',
    deleteWarning: language === 'English' 
      ? 'Are you sure you want to delete this employee? This action cannot be undone.' 
      : 'هل أنت متأكد أنك تريد حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    noEmployees: language === 'English' ? 'No employees found' : 'لم يتم العثور على موظفين',
    viewDetails: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    viewAssets: language === 'English' ? 'View Assets' : 'عرض الأصول',
    viewTickets: language === 'English' ? 'View Tickets' : 'عرض التذاكر',
    changeStatus: language === 'English' ? 'Change Status' : 'تغيير الحالة',
    active: language === 'English' ? 'Active' : 'نشط',
    resigned: language === 'English' ? 'Resigned' : 'استقال',
    terminated: language === 'English' ? 'Terminated' : 'تم إنهاء الخدمة',
    onLeave: language === 'English' ? 'On Leave' : 'في إجازة',
  };

  // Get status badge with color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            {translations.active}
          </Badge>
        );
      case 'Resigned':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            {translations.resigned}
          </Badge>
        );
      case 'Terminated':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            {translations.terminated}
          </Badge>
        );
      case 'On Leave':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            {translations.onLeave}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            {status || 'N/A'}
          </Badge>
        );
    }
  };

  // Format date for display (YYYY-MM-DD -> DD/MM/YYYY)
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (employeeToDelete) {
      onDelete(employeeToDelete.id);
      setEmployeeToDelete(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectionChange && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all employees"
                  className={isIndeterminate ? "data-[state=checked]:bg-blue-600" : ""}
                />
              </TableHead>
            )}
            <TableHead>{translations.employeeID}</TableHead>
            <TableHead>{translations.name}</TableHead>
            <TableHead>{translations.department}</TableHead>
            <TableHead>{translations.title}</TableHead>
            <TableHead>Employment Type</TableHead>
            <TableHead>{translations.status}</TableHead>
            <TableHead>{translations.joiningDate}</TableHead>
            <TableHead className="text-right">{translations.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length > 0 ? (
            employees.map((employee) => (
              <TableRow 
                key={employee.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={(e) => {
                  // Prevent row click when clicking on checkbox or action buttons
                  if (e.target instanceof HTMLElement && 
                      (e.target.closest('input[type="checkbox"]') || 
                       e.target.closest('button') || 
                       e.target.closest('[role="button"]') ||
                       e.target.closest('.dropdown-menu'))) {
                    return;
                  }
                  onEdit(employee);
                }}
              >
                {onSelectionChange && (
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={(checked) => handleEmployeeSelect(employee.id, checked as boolean)}
                      aria-label={`Select employee ${employee.englishName}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{employee.employeeId}</TableCell>
                <TableCell>
                  <button 
                    className="text-gray-900 px-2 py-1 rounded text-left cursor-pointer font-medium hover:text-blue-600 hover:underline"
                    onClick={() => onEdit(employee)}
                  >
                    {employee.englishName || 'N/A'}
                  </button>
                </TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.employmentType || 'Full-time'}</TableCell>
                <TableCell>
                  {getStatusBadge(employee.status || (employee.isActive !== false ? 'Active' : 'Resigned'))}
                </TableCell>
                <TableCell>{formatDate(employee.joiningDate)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(employee)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {translations.edit}
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => handleViewDetails(employee)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {translations.viewDetails}
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => handleViewAssets(employee)}>
                        <Laptop className="h-4 w-4 mr-2" />
                        {translations.viewAssets}
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => handleViewTickets(employee)}>
                        <Ticket className="h-4 w-4 mr-2" />
                        {translations.viewTickets}
                      </DropdownMenuItem>
                      
                      {hasAccess(3) && (
                        <DropdownMenuItem 
                          onClick={() => setEmployeeToDelete(employee)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {translations.delete}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={onSelectionChange ? 8 : 7} className="text-center h-24 text-muted-foreground">
                {translations.noEmployees}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!employeeToDelete} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Employee Details Dialog */}
      <EmployeeDetailsDialog
        employee={selectedEmployee}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </div>
  );
}
