import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from "react-helmet-async";
import { 
  FileText, 
  AlertTriangle,
  Download,
  Search
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import AuditLogTable from '@/components/audit/AuditLogTable';
import AuditLogFilter from '@/components/audit/AuditLogFilter';
import { useAuth } from '@/lib/authContext';

export default function AuditLogs() {
  const { hasAccess } = useAuth();
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  if (filters.filter) queryParams.append('filter', filters.filter);
  if (filters.action) queryParams.append('action', filters.action);
  if (filters.entityType) queryParams.append('entityType', filters.entityType);
  
  if (filters.startDate) {
    queryParams.append('startDate', filters.startDate.toISOString());
  }
  
  if (filters.endDate) {
    queryParams.append('endDate', filters.endDate.toISOString());
  }
  
  // Define types for our API response
  interface AuditLogResponse {
    data: Array<{
      id: number;
      createdAt: string;
      action: string;
      entityType: string;
      entityId?: number;
      details?: any;
      user?: {
        id: number;
        username: string;
      };
      userId?: number;
    }>;
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  }

  // Fetch audit logs with filters
  const {
    data = { data: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: limit } } as AuditLogResponse,
    isLoading,
    isError,
    error
  } = useQuery<AuditLogResponse>({
    queryKey: ['/api/audit-logs', page, limit, filters],
    enabled: hasAccess(3), // Only accessible to level 3 users
  });

  // Fetch users for filtering
  const { data: users = [] } = useQuery<Array<{ id: number; username: string }>>({
    queryKey: ['/api/users'],
    enabled: hasAccess(3),
  });
  
  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const exportToCSV = () => {
    if (!data || !data.data) return;
    
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    
    const csvContent = [
      headers.join(','),
      ...data.data.map(log => [
        log.id,
        new Date(log.createdAt).toISOString(),
        log.user ? log.user.username : 'System',
        log.action,
        log.entityType,
        log.entityId || '',
        JSON.stringify(log.details || '').replace(/,/g, ';').replace(/"/g, '""')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasAccess(3)) {
    return (
      <Card className="mt-6">
        <CardHeader className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>
            You do not have permission to view the audit logs.
            This feature requires administrator access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Helmet>
        <title>Audit Logs | SimpleIT</title>
        <meta name="description" content="View and search system audit logs. Track user actions and security events." />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
              View and search all system activity and user actions
            </p>
          </div>
          
          <Button 
            onClick={exportToCSV} 
            variant="outline" 
            className="mt-4 sm:mt-0"
            disabled={isLoading || isError || !data?.data?.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <AuditLogFilter 
          onFilter={handleFilter} 
          users={users} 
          isLoading={isLoading}
        />

        {isError ? (
          <Card className="my-6">
            <CardHeader className="text-center">
              <CardTitle className="text-red-500">Error Loading Audit Logs</CardTitle>
              <CardDescription>
                {(error as any)?.message || 'Failed to load the audit log data'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <AuditLogTable logs={data?.data || []} isLoading={isLoading} />
                
                {data?.pagination && data.pagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(page - 1, 1))}
                            className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {[...Array(data.pagination.totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          // Show first page, last page, and pages around current
                          if (
                            pageNum === 1 || 
                            pageNum === data.pagination.totalPages ||
                            (pageNum >= page - 1 && pageNum <= page + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => handlePageChange(pageNum)}
                                  isActive={page === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          // Show ellipsis between non-consecutive page numbers
                          if (
                            (pageNum === 2 && page > 3) ||
                            (pageNum === data.pagination.totalPages - 1 && page < data.pagination.totalPages - 2)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(Math.min(page + 1, data.pagination.totalPages))}
                            className={page === data.pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
                
                <div className="mt-6 text-sm text-center text-muted-foreground">
                  {data?.pagination && (
                    <>
                      Showing {(page - 1) * limit + 1}-
                      {Math.min(page * limit, data.pagination.totalItems)} of {data.pagination.totalItems} entries
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}