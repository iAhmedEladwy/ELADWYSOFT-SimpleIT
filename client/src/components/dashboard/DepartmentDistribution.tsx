import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from '@/components/ui/skeleton';

interface DepartmentDistributionProps {
  employeesByDepartment: Record<string, number>;
  isLoading: boolean;
}

export default function DepartmentDistribution({ employeesByDepartment, isLoading }: DepartmentDistributionProps) {
  const { language } = useLanguage();

  // Translations
  const translations = {
    departmentDistribution: language === 'English' ? 'Department Distribution' : 'توزيع الإدارات',
    department: language === 'English' ? 'Department' : 'القسم',
    employees: language === 'English' ? 'Employees' : 'الموظفين',
    assets: language === 'English' ? 'Assets' : 'الأصول',
    value: language === 'English' ? 'Value' : 'القيمة',
    noData: language === 'English' ? 'No department data available' : 'لا توجد بيانات أقسام متاحة',
  };

  // Sample department data for visualization
  // In a real app, this would come from the backend, but we're using it for demo
  const departments = [
    { name: 'IT Department', employees: 24, assets: 86, value: '$87,320' },
    { name: 'Operations', employees: 42, assets: 126, value: '$74,250' },
    { name: 'Sales', employees: 38, assets: 102, value: '$62,830' },
    { name: 'Marketing', employees: 21, assets: 63, value: '$43,700' },
    { name: 'Finance', employees: 16, assets: 48, value: '$32,150' },
  ];

  // Get actual employee count from the data
  const getDepartmentEmployeeCount = (departmentName: string) => {
    return employeesByDepartment[departmentName] || 0;
  };

  // Calculate asset and value estimates based on employee count ratios
  const calculateEstimatedAssetCount = (employeeCount: number) => {
    return Math.round(employeeCount * 3); // approx 3 assets per employee
  };

  const calculateEstimatedValue = (assetCount: number) => {
    const avgValuePerAsset = 1000; // average value of $1000 per asset
    return `$${(assetCount * avgValuePerAsset).toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg text-gray-900">{translations.departmentDistribution}</h3>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-[216px] w-full" />
          ) : Object.keys(employeesByDepartment).length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.department}
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.employees}
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.assets}
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.value}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(employeesByDepartment)
                  .sort(([, a], [, b]) => b - a) // Sort by employee count, descending
                  .slice(0, 5) // Show top 5 departments
                  .map(([department, employeeCount]) => {
                    const assetCount = calculateEstimatedAssetCount(employeeCount);
                    const value = calculateEstimatedValue(assetCount);
                    
                    return (
                      <tr key={department}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {department}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {employeeCount}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {assetCount}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {value}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-[216px] text-gray-500">
              {translations.noData}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
