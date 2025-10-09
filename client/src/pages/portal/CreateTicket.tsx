/**
 * Create Ticket Page - Employee Portal
 * 
 * Context: SimpleIT v0.4.3 - Create new support ticket for employee
 * 
 * Features:
 * - Create new support tickets
 * - Select from available categories
 * - Link to employee's assets (optional)
 * - Set urgency and impact levels
 * - Bilingual support (English/Arabic)
 * 
 * API Endpoint: POST /api/portal/tickets
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';

export default function CreateTicket() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Get assetId from URL if provided
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedAssetId = urlParams.get('assetId');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    categoryId: '',
    urgency: 'Medium',
    impact: 'Medium',
    relatedAssetId: preselectedAssetId || '',
  });

  const translations = {
    createTicket: language === 'English' ? 'Create Support Ticket' : 'إنشاء تذكرة دعم',
    back: language === 'English' ? 'Back' : 'العودة',
    title: language === 'English' ? 'Title' : 'العنوان',
    description: language === 'English' ? 'Description' : 'الوصف',
    type: language === 'English' ? 'Type' : 'النوع',
    category: language === 'English' ? 'Category' : 'الفئة',
    urgency: language === 'English' ? 'Urgency' : 'الإلحاح',
    impact: language === 'English' ? 'Impact' : 'التأثير',
    relatedAsset: language === 'English' ? 'Related Asset (Optional)' : 'الأصل ذو الصلة (اختياري)',
    submit: language === 'English' ? 'Create Ticket' : 'إنشاء التذكرة',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    loading: language === 'English' ? 'Creating...' : 'جاري الإنشاء...',
    selectOption: language === 'English' ? 'Select an option' : 'اختر خيار',
    none: language === 'English' ? 'None' : 'لا شيء',
  };

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['/api/portal/categories'],
    queryFn: async () => {
      const response = await fetch('/api/portal/categories', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Fetch employee's assets for selection
  const { data: assets } = useQuery({
    queryKey: ['/api/portal/my-assets'],
    queryFn: async () => {
      const response = await fetch('/api/portal/my-assets', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch assets');
      return response.json();
    },
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/portal/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          relatedAssetId: data.relatedAssetId ? parseInt(data.relatedAssetId) : null,
        }),
      });
      if (!response.ok) throw new Error('Failed to create ticket');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/my-tickets'] });
      navigate('/portal/my-tickets');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.description && formData.type && formData.categoryId) {
      createTicketMutation.mutate(formData);
    }
  };

  const typeOptions = [
    { value: 'Hardware', label: language === 'English' ? 'Hardware Issue' : 'مشكلة أجهزة' },
    { value: 'Software', label: language === 'English' ? 'Software Issue' : 'مشكلة برامج' },
    { value: 'Access', label: language === 'English' ? 'Access Request' : 'طلب وصول' },
    { value: 'Other', label: language === 'English' ? 'Other' : 'أخرى' },
  ];

  const urgencyOptions = [
    { value: 'Low', label: language === 'English' ? 'Low' : 'منخفض' },
    { value: 'Medium', label: language === 'English' ? 'Medium' : 'متوسط' },
    { value: 'High', label: language === 'English' ? 'High' : 'عالي' },
    { value: 'Critical', label: language === 'English' ? 'Critical' : 'حرج' },
  ];

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/portal/my-tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {translations.back}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{translations.createTicket}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{translations.title} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={language === 'English' ? 'Brief description of the issue' : 'وصف مختصر للمشكلة'}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{translations.description} *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={language === 'English' ? 'Detailed description of the issue...' : 'وصف مفصل للمشكلة...'}
                  rows={4}
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>{translations.type} *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.selectOption} />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>{translations.category} *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.selectOption} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {language === 'English' ? category.englishName : category.arabicName || category.englishName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Urgency & Impact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{translations.urgency}</Label>
                  <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{translations.impact}</Label>
                  <Select value={formData.impact} onValueChange={(value) => setFormData({ ...formData, impact: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Related Asset */}
              <div className="space-y-2">
                <Label>{translations.relatedAsset}</Label>
                <Select value={formData.relatedAssetId} onValueChange={(value) => setFormData({ ...formData, relatedAssetId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.selectOption} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{translations.none}</SelectItem>
                    {assets?.map((asset: any) => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        {asset.assetId} - {asset.type} ({asset.brand})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/portal/my-tickets')}
                  disabled={createTicketMutation.isPending}
                >
                  {translations.cancel}
                </Button>
                <Button type="submit" disabled={createTicketMutation.isPending}>
                  {createTicketMutation.isPending ? translations.loading : translations.submit}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}