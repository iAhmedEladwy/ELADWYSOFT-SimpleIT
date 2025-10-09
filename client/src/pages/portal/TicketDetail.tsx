/**
 * Ticket Detail Page - Employee Portal
 * 
 * Context: SimpleIT v0.4.3 - View individual ticket details and add comments
 * 
 * Features:
 * - Display ticket information
 * - Show ticket status and priority
 * - Add comments to ticket
 * - View comment history
 * - Bilingual support (English/Arabic)
 * 
 * API Endpoints: 
 * - GET /api/portal/my-tickets/:id
 * - POST /api/portal/my-tickets/:id/comments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, User, MessageSquare } from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';

interface TicketDetailProps {
  params: { id: string };
}

export default function TicketDetail({ params }: TicketDetailProps) {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const ticketId = params.id;

  const translations = {
    back: language === 'English' ? 'Back to Tickets' : 'العودة للتذاكر',
    ticketDetails: language === 'English' ? 'Ticket Details' : 'تفاصيل التذكرة',
    status: language === 'English' ? 'Status' : 'الحالة',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    type: language === 'English' ? 'Type' : 'النوع',
    category: language === 'English' ? 'Category' : 'الفئة',
    created: language === 'English' ? 'Created' : 'تم الإنشاء',
    description: language === 'English' ? 'Description' : 'الوصف',
    comments: language === 'English' ? 'Comments' : 'التعليقات',
    addComment: language === 'English' ? 'Add Comment' : 'إضافة تعليق',
    writeComment: language === 'English' ? 'Write your comment...' : 'اكتب تعليقك...',
    submit: language === 'English' ? 'Submit' : 'إرسال',
    loading: language === 'English' ? 'Loading...' : 'جاري التحميل...',
    error: language === 'English' ? 'Failed to load ticket' : 'فشل تحميل التذكرة',
    noComments: language === 'English' ? 'No comments yet' : 'لا توجد تعليقات بعد',
  };

  // Fetch ticket details
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: [`/api/portal/my-tickets/${ticketId}`],
    queryFn: async () => {
      const response = await fetch(`/api/portal/my-tickets/${ticketId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch ticket');
      return response.json();
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/portal/my-tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to add comment');
      return response.json();
    },
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: [`/api/portal/my-tickets/${ticketId}`] });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      addCommentMutation.mutate(comment.trim());
    }
  };

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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/portal/my-tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {translations.back}
          </Button>
        </div>

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
              <p className="text-red-600">{translations.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Ticket Content */}
        {!isLoading && !error && ticket && (
          <div className="space-y-6">
            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{ticket.title}</span>
                  <div className="flex gap-2">
                    <Badge variant={ticket.status === 'Open' ? 'destructive' : 'default'}>
                      {ticket.status}
                    </Badge>
                    <Badge variant={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-500">{translations.type}</label>
                    <p>{ticket.type}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">{translations.category}</label>
                    <p>{ticket.categoryName || ticket.category}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {translations.created}
                    </label>
                    <p>{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-500">Ticket ID</label>
                    <p className="font-mono text-xs">{ticket.ticketId}</p>
                  </div>
                </div>

                <div>
                  <label className="font-medium text-gray-500">{translations.description}</label>
                  <p className="mt-1 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {translations.comments}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Comments */}
                {ticket.comments && ticket.comments.length > 0 ? (
                  <div className="space-y-3">
                    {ticket.comments.map((comment: any) => (
                      <div key={comment.id} className="border-l-4 border-gray-200 pl-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                          <User className="h-3 w-3" />
                          <span>{comment.authorName}</span>
                          <span>•</span>
                          <span>{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">{translations.noComments}</p>
                )}

                {/* Add Comment Form */}
                <form onSubmit={handleSubmitComment} className="space-y-3 pt-4 border-t">
                  <div>
                    <label className="font-medium text-gray-700">{translations.addComment}</label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={translations.writeComment}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={!comment.trim() || addCommentMutation.isPending}
                    >
                      {addCommentMutation.isPending ? translations.loading : translations.submit}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}