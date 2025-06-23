import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import type { EmployeeResponse } from '@shared/types';

interface EmployeeDetailsDialogProps {
  employee: EmployeeResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmployeeDetailsDialog({ 
  employee, 
  open, 
  onOpenChange 
}: EmployeeDetailsDialogProps) {
  const { language } = useLanguage();

  if (!employee) return null;

  const translations = {
    title: language === 'Arabic' ? 'تفاصيل الموظف' : 'Employee Details',
    personalInfo: language === 'Arabic' ? 'المعلومات الشخصية' : 'Personal Information',
    workInfo: language === 'Arabic' ? 'معلومات العمل' : 'Work Information',
    name: language === 'Arabic' ? 'الاسم' : 'Name',
    email: language === 'Arabic' ? 'البريد الإلكتروني' : 'Email',
    phone: language === 'Arabic' ? 'الهاتف' : 'Phone',
    department: language === 'Arabic' ? 'القسم' : 'Department',
    position: language === 'Arabic' ? 'المنصب' : 'Position',
    hireDate: language === 'Arabic' ? 'تاريخ التوظيف' : 'Hire Date',
    employmentType: language === 'Arabic' ? 'نوع التوظيف' : 'Employment Type',
    status: language === 'Arabic' ? 'الحالة' : 'Status',
    salary: language === 'Arabic' ? 'الراتب' : 'Salary'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Resigned': return 'bg-gray-100 text-gray-800';
      case 'Terminated': return 'bg-red-100 text-red-800';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{translations.title}</DialogTitle>
          <DialogDescription>
            {employee.employeeId} - {employee.englishName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{translations.personalInfo}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.name}
                  </label>
                  <p className="font-medium">{employee.englishName}</p>
                  {employee.arabicName && (
                    <p className="text-sm text-gray-600">{employee.arabicName}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.email}
                  </label>
                  <p className="font-medium">{employee.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.phone}
                  </label>
                  <p className="font-medium">{employee.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.status}
                  </label>
                  <div>
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{translations.workInfo}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.department}
                  </label>
                  <p className="font-medium">{employee.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.position}
                  </label>
                  <p className="font-medium">{employee.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.employmentType}
                  </label>
                  <p className="font-medium">{employee.employmentType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.hireDate}
                  </label>
                  <p className="font-medium">
                    {new Date(employee.hireDate).toLocaleDateString()}
                  </p>
                </div>
                {employee.salary && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.salary}
                    </label>
                    <p className="font-medium">
                      {employee.salary.toLocaleString()} EGP
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}