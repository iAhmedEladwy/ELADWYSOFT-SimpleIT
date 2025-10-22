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
import { useEmployeeLink } from '@/hooks/use-employee-link';
import EmployeeLinkRequired from '@/components/portal/EmployeeLinkRequired';

export default function CreateTicket() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { canAccessPortal, needsEmployeeLink, availableEmployees, isLoading: isEmployeeLoading } = useEmployeeLink();
  
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
    relatedAssetId: preselectedAssetId || 'none',
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
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['/api/portal/categories'],
    queryFn: async () => {
      console.log('Fetching categories...');
      const response = await fetch('/api/portal/categories', {
        credentials: 'include',
      });
      if (!response.ok) {
        console.error('Categories fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      console.log('Categories fetched:', data);
      return data;
    },
    enabled: canAccessPortal && !isEmployeeLoading,
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
    enabled: canAccessPortal && !isEmployeeLoading,
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Calculate priority based on urgency and impact
      const getPriority = (urgency: string, impact: string) => {
        if (urgency === 'Critical' || impact === 'Critical') return 'Critical';
        if (urgency === 'High' || impact === 'High') return 'High';
        if (urgency === 'Low' && impact === 'Low') return 'Low';
        return 'Medium';
      };

      // Parse categoryId - handle empty string
      let categoryId = null;
      if (data.categoryId && data.categoryId !== '') {
        const parsed = parseInt(data.categoryId);
        if (!isNaN(parsed)) {
          categoryId = parsed;
        }
      }

      // Parse relatedAssetId
      let relatedAssetId = null;
      if (data.relatedAssetId && data.relatedAssetId !== 'none' && data.relatedAssetId !== '') {
        const parsed = parseInt(data.relatedAssetId);
        if (!isNaN(parsed)) {
          relatedAssetId = parsed;
        }
      }

      const ticketPayload = {
        title: data.title,
        description: data.description,
        type: data.type,
        categoryId,
        urgency: data.urgency,
        impact: data.impact,
        priority: getPriority(data.urgency, data.impact),
        relatedAssetId,
      };

      const response = await fetch('/api/portal/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ticketPayload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to create ticket');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/my-tickets'] });
      navigate('/portal/my-tickets');
    },
    onError: (error: Error) => {
      console.error('Error creating ticket:', error);
      alert(language === 'English' 
        ? `Failed to create ticket: ${error.message}` 
        : `فشل إنشاء التذكرة: ${error.message}`
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    console.log('Validation check:', {
      hasTitle: !!formData.title,
      hasDescription: !!formData.description,
      hasType: !!formData.type,
      hasCategoryId: !!formData.categoryId,
      categoryIdValue: formData.categoryId
    });
    
    if (!formData.title) {
      alert(language === 'English' ? 'Please enter a title' : 'الرجاء إدخال العنوان');
      return;
    }
    
    if (!formData.description) {
      alert(language === 'English' ? 'Please enter a description' : 'الرجاء إدخال الوصف');
      return;
    }
    
    if (!formData.type) {
      alert(language === 'English' ? 'Please select a type' : 'الرجاء اختيار النوع');
      return;
    }
    
    if (!formData.categoryId) {
      alert(language === 'English' ? 'Please select a category' : 'الرجاء اختيار الفئة');
      return;
    }
    
    console.log('All validations passed, submitting...');
    createTicketMutation.mutate(formData);
  };

  const typeOptions = [
    { value: 'Incident', label: language === 'English' ? 'Incident' : 'حادثة' },
    { value: 'Service Request', label: language === 'English' ? 'Service Request' : 'طلب خدمة' },
    { value: 'Problem', label: language === 'English' ? 'Problem' : 'مشكلة' },
    { value: 'Change', label: language === 'English' ? 'Change Request' : 'طلب تغيير' },
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

        {/* Employee Link Check */}
        {needsEmployeeLink && (
          <EmployeeLinkRequired availableEmployees={availableEmployees} />
        )}

        {/* Create Ticket Form */}
        {canAccessPortal && (
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
                {categoriesLoading && <p className="text-sm text-gray-500">Loading categories...</p>}
                {categoriesError && <p className="text-sm text-red-500">Error loading categories</p>}
                {categories && <p className="text-xs text-gray-400">Found {categories.length} categories</p>}
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => {
                    console.log('Category selected:', value);
                    setFormData({ ...formData, categoryId: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={translations.selectOption} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category: any) => {
                      console.log('Rendering category:', category);
                      return (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      );
                    })}
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
                    <SelectItem value="none">{translations.none}</SelectItem>
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
        )}
      </div>
    </PortalLayout>
  );
}