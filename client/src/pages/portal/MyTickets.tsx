/**
 * My Tickets Page - Employee Portal
 * 
 * Context: SimpleIT v0.4.3 - View and manage tickets created by employee
 * 
 * Features:
 * - List all tickets submitted by employee
 * - Filter by status (All, Open, In Progress, Resolved, Closed)
 * - Create new ticket button
 * - Click ticket to view details
 * - Color-coded priority badges
 * - Empty state for no tickets
 * - Bilingual support (English/Arabic)
 * 
 * API Endpoint: GET /api/portal/my-tickets
 */

import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Ticket, AlertCircle, Search, Filter, Calendar, SortAsc, SortDesc, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import PortalLayout from '@/components/portal/PortalLayout';
import { useEmployeeLink } from '@/hooks/use-employee-link';
import EmployeeLinkRequired from '@/components/portal/EmployeeLinkRequired';

export default function MyTickets() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  
  // Enhanced filtering and search state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  const { canAccessPortal, needsEmployeeLink, availableEmployees, isLoading: isEmployeeLoading } = useEmployeeLink();
  const translations = {
    myTickets: language === 'English' ? 'My Tickets' : 'تذاكري',
    all: language === 'English' ? 'All' : 'الكل',
    loading: language === 'English' ? 'Loading tickets...' : 'جاري تحميل التذاكر...',
    error: language === 'English' ? 'Failed to load tickets' : 'فشل تحميل التذاكر',
    noTickets: language === 'English' ? 'No tickets found' : 'لم يتم العثور على تذاكر',
    createTicket: language === 'English' ? 'Create Ticket' : 'إنشاء تذكرة',
    type: language === 'English' ? 'Type' : 'النوع',
    statusOpen: language === 'English' ? 'Open' : 'مفتوح',
    statusInProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    statusResolved: language === 'English' ? 'Resolved' : 'تم الحل',
    statusClosed: language === 'English' ? 'Closed' : 'مغلق',
    
    // Enhanced filtering translations
    search: language === 'English' ? 'Search tickets...' : 'البحث في التذاكر...',
    filters: language === 'English' ? 'Filters' : 'المرشحات',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    sortBy: language === 'English' ? 'Sort by' : 'ترتيب حسب',
    sortByDate: language === 'English' ? 'Date Created' : 'تاريخ الإنشاء',
    sortByTitle: language === 'English' ? 'Title' : 'العنوان',
    sortByPriority: language === 'English' ? 'Priority' : 'الأولوية',
    sortByStatus: language === 'English' ? 'Status' : 'الحالة',
    ascending: language === 'English' ? 'Ascending' : 'تصاعدي',
    descending: language === 'English' ? 'Descending' : 'تنازلي',
    priorityLow: language === 'English' ? 'Low' : 'منخفض',
    priorityMedium: language === 'English' ? 'Medium' : 'متوسط',
    priorityHigh: language === 'English' ? 'High' : 'عالي',
    priorityCritical: language === 'English' ? 'Critical' : 'حرج',
    clearFilters: language === 'English' ? 'Clear Filters' : 'مسح المرشحات',
    resultsFound: language === 'English' ? 'tickets found' : 'تذكرة وجدت',
  };

  // Fetch employee's tickets
  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ['/api/portal/my-tickets'],
    queryFn: async () => {
      const response = await fetch('/api/portal/my-tickets', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      return response.json();
    },
    enabled: canAccessPortal && !isEmployeeLoading,
  });

  // Filter and sort tickets based on current filters
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Search filter (search in title and description)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower)
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Sort tickets
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          compareValue = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
        default:
          compareValue = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [tickets, statusFilter, searchTerm, priorityFilter, sortBy, sortOrder]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{translations.myTickets}</h1>
            <p className="text-gray-600 mt-2">
              {language === 'English'
                ? 'Track and manage your support tickets'
                : 'تتبع وإدارة تذاكر الدعم الخاصة بك'}
            </p>
          </div>
          <Button 
            onClick={() => navigate('/portal/create-ticket')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {translations.createTicket}
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">{translations.all}</TabsTrigger>
            <TabsTrigger value="Open">{translations.statusOpen}</TabsTrigger>
            <TabsTrigger value="In Progress">{translations.statusInProgress}</TabsTrigger>
            <TabsTrigger value="Resolved">{translations.statusResolved}</TabsTrigger>
            <TabsTrigger value="Closed">{translations.statusClosed}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Advanced Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{translations.filters}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={translations.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {/* Priority Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{translations.priority}</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translations.all}</SelectItem>
                    <SelectItem value="low">{translations.priorityLow}</SelectItem>
                    <SelectItem value="medium">{translations.priorityMedium}</SelectItem>
                    <SelectItem value="high">{translations.priorityHigh}</SelectItem>
                    <SelectItem value="critical">{translations.priorityCritical}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{translations.sortBy}</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">{translations.sortByDate}</SelectItem>
                    <SelectItem value="title">{translations.sortByTitle}</SelectItem>
                    <SelectItem value="priority">{translations.sortByPriority}</SelectItem>
                    <SelectItem value="status">{translations.sortByStatus}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Order</Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">{translations.descending}</SelectItem>
                    <SelectItem value="asc">{translations.ascending}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(searchTerm || priorityFilter !== 'all' || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setPriorityFilter('all');
                  setSortBy('createdAt');
                  setSortOrder('desc');
                }}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                {translations.clearFilters}
              </Button>
            </div>
          )}
        </div>

        {/* Employee Link Check */}
        {needsEmployeeLink && (
          <EmployeeLinkRequired availableEmployees={availableEmployees} />
        )}

        {/* Loading State */}
        {(isLoading || isEmployeeLoading) && canAccessPortal && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">{translations.loading}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && canAccessPortal && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600">{translations.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !isEmployeeLoading && !error && filteredTickets?.length === 0 && canAccessPortal && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ticket className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg mb-4">
                {searchTerm || priorityFilter !== 'all' || statusFilter !== 'all' 
                  ? (language === 'English' ? 'No tickets match your filters' : 'لا توجد تذاكر تطابق المرشحات')
                  : translations.noTickets
                }
              </p>
              <Button onClick={() => navigate('/portal/create-ticket')}>
                {translations.createTicket}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tickets List */}
        {!isLoading && !isEmployeeLoading && !error && filteredTickets?.length > 0 && canAccessPortal && (
          <div className="space-y-4">
            {filteredTickets.map((ticket: any) => (
              <Card 
                key={ticket.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/portal/my-tickets/${ticket.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-gray-600">
                          {ticket.ticketId}
                        </span>
                        <Badge variant={ticket.status === 'Open' ? 'destructive' : 'default'}>
                          {ticket.status}
                        </Badge>
                        <Badge variant={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{ticket.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        <span>{translations.type}: {ticket.type}</span>
                        <span>•</span>
                        <span>
                          {language === 'English' ? 'Created' : 'تم الإنشاء'}: {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}