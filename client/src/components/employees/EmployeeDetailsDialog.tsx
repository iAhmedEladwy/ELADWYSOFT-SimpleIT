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
    dialogTitle: language === 'Arabic' ? 'تفاصيل الموظف' : 'Employee Details',
    personalInfo: language === 'Arabic' ? 'المعلومات الشخصية' : 'Personal Information',
    workInfo: language === 'Arabic' ? 'معلومات العمل' : 'Work Information',
    contactInfo: language === 'Arabic' ? 'معلومات الاتصال' : 'Contact Information',
    systemInfo: language === 'Arabic' ? 'معلومات النظام' : 'System Information',
    name: language === 'Arabic' ? 'الاسم' : 'Name',
    englishName: language === 'Arabic' ? 'الاسم بالإنجليزية' : 'English Name',
    arabicName: language === 'Arabic' ? 'الاسم بالعربية' : 'Arabic Name',
    idNumber: language === 'Arabic' ? 'رقم الهوية' : 'ID Number',
    employeeId: language === 'Arabic' ? 'رقم الموظف' : 'Employee ID',
    email: language === 'Arabic' ? 'البريد الإلكتروني' : 'Email',
    personalEmail: language === 'Arabic' ? 'البريد الشخصي' : 'Personal Email',
    corporateEmail: language === 'Arabic' ? 'البريد المؤسسي' : 'Corporate Email',
    phone: language === 'Arabic' ? 'الهاتف' : 'Phone',
    personalMobile: language === 'Arabic' ? 'الجوال الشخصي' : 'Personal Mobile',
    workMobile: language === 'Arabic' ? 'جوال العمل' : 'Work Mobile',
    department: language === 'Arabic' ? 'القسم' : 'Department',
    position: language === 'Arabic' ? 'المنصب' : 'Position',
    jobTitle: language === 'Arabic' ? 'المسمى الوظيفي' : 'Job Title',
    directManager: language === 'Arabic' ? 'المدير المباشر' : 'Direct Manager',
    hireDate: language === 'Arabic' ? 'تاريخ التوظيف' : 'Hire Date',
    joiningDate: language === 'Arabic' ? 'تاريخ الانضمام' : 'Joining Date',
    exitDate: language === 'Arabic' ? 'تاريخ انتهاء الخدمة' : 'Exit Date',
    employmentType: language === 'Arabic' ? 'نوع التوظيف' : 'Employment Type',
    status: language === 'Arabic' ? 'الحالة' : 'Status',
    salary: language === 'Arabic' ? 'الراتب' : 'Salary',
    createdAt: language === 'Arabic' ? 'تاريخ الإنشاء' : 'Created At',
    updatedAt: language === 'Arabic' ? 'تاريخ التحديث' : 'Last Updated',
    noData: language === 'Arabic' ? 'غير محدد' : 'Not specified'
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
          <DialogTitle className="flex items-center gap-2">
            {translations.dialogTitle}
            <Badge variant="outline" className="text-xs">
              {(employee as any).empId || employee.employeeId || 'N/A'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {employee.englishName || employee.name} - {employee.department}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 max-h-[70vh] overflow-y-auto">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{translations.personalInfo}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.englishName}
                  </label>
                  <p className="font-medium">{employee.englishName || employee.name || translations.noData}</p>
                </div>
                {((employee as any).arabicName) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.arabicName}
                    </label>
                    <p className="font-medium">{(employee as any).arabicName}</p>
                  </div>
                )}
                {((employee as any).idNumber) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.idNumber}
                    </label>
                    <p className="font-medium">{(employee as any).idNumber}</p>
                  </div>
                )}
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

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{translations.contactInfo}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {employee.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.email}
                    </label>
                    <p className="font-medium">{employee.email}</p>
                  </div>
                )}
                {((employee as any).personalEmail) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.personalEmail}
                    </label>
                    <p className="font-medium">{(employee as any).personalEmail}</p>
                  </div>
                )}
                {((employee as any).corporateEmail) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.corporateEmail}
                    </label>
                    <p className="font-medium">{(employee as any).corporateEmail}</p>
                  </div>
                )}
                {employee.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.phone}
                    </label>
                    <p className="font-medium">{employee.phone}</p>
                  </div>
                )}
                {((employee as any).personalMobile) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.personalMobile}
                    </label>
                    <p className="font-medium">{(employee as any).personalMobile}</p>
                  </div>
                )}
                {((employee as any).workMobile) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.workMobile}
                    </label>
                    <p className="font-medium">{(employee as any).workMobile}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{translations.workInfo}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.department}
                  </label>
                  <p className="font-medium">{employee.department || translations.noData}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.jobTitle}
                  </label>
                  <p className="font-medium">{(employee as any).title || employee.position || translations.noData}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.employmentType}
                  </label>
                  <p className="font-medium">{employee.employmentType || translations.noData}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.joiningDate}
                  </label>
                  <p className="font-medium">
                    {((employee as any).joiningDate) ? new Date((employee as any).joiningDate).toLocaleDateString() : 
                     (employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : translations.noData)}
                  </p>
                </div>
                {((employee as any).exitDate) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.exitDate}
                    </label>
                    <p className="font-medium text-red-600">
                      {new Date((employee as any).exitDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
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

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{translations.systemInfo}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translations.employeeId}
                  </label>
                  <p className="font-medium">{(employee as any).empId || employee.employeeId || translations.noData}</p>
                </div>
                {((employee as any).createdAt) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.createdAt}
                    </label>
                    <p className="font-medium text-sm">
                      {new Date((employee as any).createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {((employee as any).updatedAt) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {translations.updatedAt}
                    </label>
                    <p className="font-medium text-sm">
                      {new Date((employee as any).updatedAt).toLocaleDateString()}
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