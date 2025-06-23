import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileDown } from 'lucide-react';
import { AssetTransaction, Asset, Employee } from '@shared/schema';

// Define the transaction response structure with joined entities
interface TransactionResponse {
  asset_transactions: AssetTransaction;
  assets?: Asset;
  employees?: Employee;
}

// Combine them for easier usage in component
interface TransactionWithRelations extends AssetTransaction {
  asset?: Asset;
  employee?: Employee;
}

export default function TransactionHistoryTable() {
  const { language } = useLanguage();
  const [filter, setFilter] = useState({
    type: 'all',
    assetId: 'all',
    employeeId: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Translations
  const translations = {
    title: language === 'English' ? 'Asset History' : 'سجل الأصول',
    description: language === 'English' 
      ? 'Track all asset check-in and check-out activities' 
      : 'تتبع جميع أنشطة تسجيل الوصول والمغادرة للأصول',
    id: language === 'English' ? 'ID' : 'المعرف',
    asset: language === 'English' ? 'Asset' : 'الأصل',
    employee: language === 'English' ? 'Employee' : 'الموظف',
    type: language === 'English' ? 'Type' : 'النوع',
    date: language === 'English' ? 'Date' : 'التاريخ',
    notes: language === 'English' ? 'Notes' : 'ملاحظات',
    all: language === 'English' ? 'All' : 'الكل',
    checkIn: language === 'English' ? 'Check In' : 'تسجيل الدخول',
    checkOut: language === 'English' ? 'Check Out' : 'تسجيل الخروج',
    filterType: language === 'English' ? 'Filter by Type' : 'تصفية حسب النوع',
    filterAsset: language === 'English' ? 'Filter by Asset' : 'تصفية حسب الأصل',
    filterEmployee: language === 'English' ? 'Filter by Employee' : 'تصفية حسب الموظف',
    clearFilters: language === 'English' ? 'Clear Filters' : 'مسح التصفية',
    downloadCSV: language === 'English' ? 'Download CSV' : 'تحميل CSV',
    loading: language === 'English' ? 'Loading transactions...' : 'جاري تحميل المعاملات...',
    noTransactions: language === 'English' ? 'No transactions found' : 'لم يتم العثور على معاملات',
  };
  
  // Fetch asset transactions
  const { data: transactionResponse, isLoading } = useQuery<TransactionResponse[]>({
    queryKey: ['/api/asset-transactions'],
  });
  
  // Transform the response to more usable format
  const transactions = transactionResponse?.map(item => {
    return {
      ...item.asset_transactions,
      asset: item.assets,
      employee: item.employees
    } as TransactionWithRelations;
  }) || [];
  
  // Assets data for the filter
  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });
  
  // Employees data for the filter
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });
  
  // Filter transactions
  const filteredTransactions = transactions?.filter((transaction: TransactionWithRelations) => {
    if (filter.type !== 'all' && transaction.type !== filter.type) return false;
    if (filter.assetId !== 'all' && transaction.asset?.id !== parseInt(filter.assetId)) return false;
    if (filter.employeeId !== 'all' && transaction.employee?.id !== parseInt(filter.employeeId)) return false;
    return true;
  });

  // Pagination calculations
  const totalItems = filteredTransactions?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = filteredTransactions?.slice(startIndex, endIndex);
  
  // Clear all filters
  const clearFilters = () => {
    setFilter({
      type: 'all',
      assetId: 'all',
      employeeId: 'all',
    });
    setCurrentPage(1);
  };
  
  // Download transaction history as CSV
  const downloadCSV = () => {
    if (!transactions || !filteredTransactions) return;
    
    // Prepare CSV data
    const headers = ['ID', 'Asset', 'Employee', 'Type', 'Date', 'Notes'];
    const csvRows = [headers.join(',')];
    
    // Add null check to ensure filteredTransactions is defined
    if (filteredTransactions) {
      for (const transaction of filteredTransactions) {
      const assetName = transaction.asset?.assetId || '';
      const employeeName = transaction.employee?.englishName || '';
      const date = transaction.transactionDate ? format(new Date(transaction.transactionDate), 'yyyy-MM-dd HH:mm') : '';
      const notes = transaction.conditionNotes ? `"${transaction.conditionNotes.replace(/"/g, '""')}"` : '';
      
      csvRows.push([
        transaction.id,
        assetName,
        employeeName,
        transaction.type,
        date,
        notes,
      ].join(','));
      }
    }
    
    // Create a downloadable CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `asset-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{translations.title}</CardTitle>
        <CardDescription>{translations.description}</CardDescription>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="type-filter">{translations.filterType}</Label>
            <Select 
              value={filter.type} 
              onValueChange={(value) => setFilter({...filter, type: value})}
            >
              <SelectTrigger id="type-filter">
                <SelectValue placeholder={translations.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.all}</SelectItem>
                <SelectItem value="Check-In">{translations.checkIn}</SelectItem>
                <SelectItem value="Check-Out">{translations.checkOut}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="asset-filter">{translations.filterAsset}</Label>
            <Select 
              value={filter.assetId} 
              onValueChange={(value) => setFilter({...filter, assetId: value})}
            >
              <SelectTrigger id="asset-filter">
                <SelectValue placeholder={translations.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.all}</SelectItem>
                {assets?.map((asset: Asset) => (
                  <SelectItem key={asset.id} value={String(asset.id)}>
                    {asset.assetId} - {asset.modelName || asset.modelNumber || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="employee-filter">{translations.filterEmployee}</Label>
            <Select 
              value={filter.employeeId} 
              onValueChange={(value) => setFilter({...filter, employeeId: value})}
            >
              <SelectTrigger id="employee-filter">
                <SelectValue placeholder={translations.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.all}</SelectItem>
                {employees?.map((employee: Employee) => (
                  <SelectItem key={employee.id} value={String(employee.id)}>
                    {employee.englishName || employee.empId || 'Unknown Employee'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end gap-2 mt-auto">
            <Button variant="outline" onClick={clearFilters}>
              {translations.clearFilters}
            </Button>
            <Button variant="outline" onClick={downloadCSV}>
              <FileDown className="h-4 w-4 mr-2" />
              {translations.downloadCSV}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p>{translations.loading}</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.id}</TableHead>
                  <TableHead>{translations.asset}</TableHead>
                  <TableHead>{translations.employee}</TableHead>
                  <TableHead>{translations.type}</TableHead>
                  <TableHead>{translations.date}</TableHead>
                  <TableHead>{translations.notes}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions?.length ? (
                  paginatedTransactions.map((transaction: TransactionWithRelations) => (
                    <TableRow key={`transaction-${transaction.id || `temp-${Math.random()}`}`}>
                      <TableCell>{transaction.id}</TableCell>
                      <TableCell className="font-medium">{transaction.asset?.assetId || '-'}</TableCell>
                      <TableCell>{transaction.employee?.englishName || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'Check-In' ? 'outline' : 'default'}>
                          {transaction.type === 'Check-In' ? translations.checkIn : translations.checkOut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.transactionDate ? 
                          format(new Date(transaction.transactionDate), 'yyyy-MM-dd HH:mm') : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.conditionNotes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      {translations.noTransactions}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="page-size">{language === 'English' ? 'Items per page:' : 'عناصر لكل صفحة:'}</Label>
              <Select value={String(pageSize)} onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger id="page-size" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {language === 'English' 
                  ? `${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} items`
                  : `${startIndex + 1}-${Math.min(endIndex, totalItems)} من ${totalItems} عنصر`}
              </span>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {language === 'English' ? 'Previous' : 'السابق'}
                </Button>
                
                <span className="px-3 py-1 text-sm">
                  {language === 'English' 
                    ? `Page ${currentPage} of ${totalPages}`
                    : `صفحة ${currentPage} من ${totalPages}`}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {language === 'English' ? 'Next' : 'التالي'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}