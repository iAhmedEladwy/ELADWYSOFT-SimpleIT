import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// ITIL-compliant upgrade form schema
const upgradeFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  businessJustification: z.string().min(20, 'Business justification must be at least 20 characters'),
  upgradeType: z.enum(['Hardware', 'Software', 'Firmware', 'Configuration', 'Security', 'Performance']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  risk: z.enum(['Low', 'Medium', 'High', 'Critical']),
  currentConfiguration: z.string().optional(),
  newConfiguration: z.string().min(10, 'New configuration details required'),
  impactAssessment: z.string().min(20, 'Impact assessment required'),
  backoutPlan: z.string().min(20, 'Backout plan required'),
  successCriteria: z.string().min(10, 'Success criteria required'),
  estimatedCost: z.number().min(0, 'Cost must be positive').optional(),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  downtimeRequired: z.boolean(),
  estimatedDowntime: z.string().optional()
});

type UpgradeFormData = z.infer<typeof upgradeFormSchema>;

interface UpgradeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: number;
  assetInfo: {
    assetId: string;
    type: string;
    brand: string;
    modelName?: string;
    serialNumber?: string;
  };
}

export function UpgradeForm({ open, onOpenChange, assetId, assetInfo }: UpgradeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');

  const form = useForm<UpgradeFormData>({
    resolver: zodResolver(upgradeFormSchema),
    defaultValues: {
      title: '',
      description: '',
      businessJustification: '',
      upgradeType: 'Hardware',
      priority: 'Medium',
      risk: 'Medium',
      currentConfiguration: `Current: ${assetInfo.brand} ${assetInfo.modelName || assetInfo.type}`,
      newConfiguration: '',
      impactAssessment: '',
      backoutPlan: '',
      successCriteria: '',
      estimatedCost: 0,
      plannedStartDate: '',
      plannedEndDate: '',
      downtimeRequired: false,
      estimatedDowntime: ''
    }
  });

  const createUpgradeMutation = useMutation({
    mutationFn: (data: UpgradeFormData) => 
      apiRequest(`/api/assets/${assetId}/upgrade`, 'POST', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'ITIL upgrade request created successfully. Awaiting management approval.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/upgrades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create upgrade request',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: UpgradeFormData) => {
    createUpgradeMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            ITIL Upgrade Request - {assetInfo.assetId}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create an ITIL-compliant upgrade request with proper approval workflow
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="planning">Planning</TabsTrigger>
                <TabsTrigger value="risk">Risk & Impact</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Upgrade Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Memory Upgrade from 8GB to 16GB" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="upgradeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upgrade Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select upgrade type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Hardware">Hardware</SelectItem>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Firmware">Firmware</SelectItem>
                            <SelectItem value="Configuration">Configuration</SelectItem>
                            <SelectItem value="Security">Security</SelectItem>
                            <SelectItem value="Performance">Performance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="risk"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Level *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed description of the upgrade requirements and scope"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessJustification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Justification *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Explain the business need and benefits of this upgrade"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="technical" className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentConfiguration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Configuration</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Details of current asset configuration"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newConfiguration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Configuration *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Details of the new configuration after upgrade"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="successCriteria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Success Criteria *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How will success be measured? What tests will be performed?"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="planning" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plannedStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned Start Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="plannedEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned End Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Cost</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Downtime Required</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="downtimeRequired"
                      {...form.register('downtimeRequired')}
                      className="rounded"
                    />
                    <Label htmlFor="downtimeRequired" className="text-sm">
                      This upgrade requires system downtime
                    </Label>
                  </div>
                </div>

                {form.watch('downtimeRequired') && (
                  <FormField
                    control={form.control}
                    name="estimatedDowntime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Downtime</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2 hours" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
                <FormField
                  control={form.control}
                  name="impactAssessment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impact Assessment *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Assess the potential impact on business operations, users, and systems"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backoutPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Backout Plan *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed plan for reverting changes if the upgrade fails"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createUpgradeMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createUpgradeMutation.isPending ? 'Creating...' : 'Submit Upgrade Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}