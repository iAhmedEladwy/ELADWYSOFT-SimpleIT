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
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Ticket, AlertCircle } from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';

export default function MyTickets() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
  };

  // Fetch employee's tickets
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['/api/portal/my-tickets', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all' 
        ? '/api/portal/my-tickets'
        : `/api/portal/my-tickets?status=${statusFilter}`;
        
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      return response.json();
    },
  });

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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">{translations.loading}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600">{translations.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && tickets?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ticket className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg mb-4">{translations.noTickets}</p>
              <Button onClick={() => navigate('/portal/create-ticket')}>
                {translations.createTicket}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tickets List */}
        {!isLoading && !error && tickets?.length > 0 && (
          <div className="space-y-4">
            {tickets.map((ticket: any) => (
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