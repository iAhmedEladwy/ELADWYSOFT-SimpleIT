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
    dialogTitle: language === 'English' ? 'Employee Details' : 'تفاصيل الموظف',
    personalInfo: language === 'English' ? 'Personal Information' : 'المعلومات الشخصية',
    workInfo: language === 'English' ? 'Work Information' : 'معلومات العمل',
    contactInfo: language === 'English' ? 'Contact Information' : 'معلومات الاتصال',
    systemInfo: language === 'English' ? 'System Information' : 'معلومات النظام',
    name: language === 'English' ? 'Name' : 'الاسم',
    englishName: language === 'English' ? 'English Name' : 'الاسم بالإنجليزية',
    arabicName: language === 'English' ? 'Arabic Name' : 'الاسم بالعربية',
    idNumber: language === 'English' ? 'ID Number' : 'رقم الهوية',
    employeeId: language === 'English' ? 'Employee ID' : 'رقم الموظف',
    email: language === 'English' ? 'Email' : 'البريد الإلكتروني',
    personalEmail: language === 'English' ? 'Personal Email' : 'البريد الشخصي',
    corporateEmail: language === 'English' ? 'Corporate Email' : 'البريد المؤسسي',
    phone: language === 'English' ? 'Phone' : 'الهاتف',
    personalMobile: language === 'English' ? 'Personal Mobile' : 'الجوال الشخصي',
    workMobile: language === 'English' ? 'Work Mobile' : 'جوال العمل',
    department: language === 'English' ? 'Department' : 'القسم',
    position: language === 'English' ? 'Position' : 'المنصب',
    jobTitle: language === 'English' ? 'Job Title' : 'المسمى الوظيفي',
    directManager: language === 'English' ? 'Direct Manager' : 'المدير المباشر',
    hireDate: language === 'English' ? 'Hire Date' : 'تاريخ التوظيف',
    joiningDate: language === 'English' ? 'Joining Date' : 'تاريخ الانضمام',
    exitDate: language === 'English' ? 'Exit Date' : 'تاريخ انتهاء الخدمة',
    employmentType: language === 'English' ? 'Employment Type' : 'نوع التوظيف',
    status: language === 'English' ? 'Status' : 'الحالة',
    salary: language === 'English' ? 'Salary' : 'الراتب',
    createdAt: language === 'English' ? 'Created At' : 'تاريخ الإنشاء',
    updatedAt: language === 'English' ? 'Last Updated' : 'تاريخ التحديث',
    noData: language === 'English' ? 'Not specified' : 'غير محدد'
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