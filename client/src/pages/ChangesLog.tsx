import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Search, Edit, Trash2, Calendar, Tag, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Form schema for changes log
const changeLogSchema = z.object({
  version: z.string().min(1, 'Version is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  changeType: z.string().min(1, 'Change type is required'),
  priority: z.string().default('Medium'),
  affectedModules: z.array(z.string()).optional(),
  status: z.string().default('Active'),
});

type ChangeLogFormData = z.infer<typeof changeLogSchema>;

interface ChangeLog {
  id: number;
  version: string;
  title: string;
  description: string;
  changeType: string;
  priority: string;
  affectedModules: string[] | null;
  status: string;
  releaseDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChangesLog() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingChange, setEditingChange] = useState<ChangeLog | null>(null);
  const [filters, setFilters] = useState({
    version: '',
    changeType: '',
    status: '',
    page: 1,
    limit: 10
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch changes log
  const { data: changesData, isLoading } = useQuery({
    queryKey: ['/api/changes-log', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
      const queryString = params.toString();
      return apiRequest(`/api/changes-log${queryString ? `?${queryString}` : ''}`);
    }
  });

  // Form setup
  const form = useForm<ChangeLogFormData>({
    resolver: zodResolver(changeLogSchema),
    defaultValues: {
      version: '',
      title: '',
      description: '',
      changeType: '',
      priority: 'Medium',
      affectedModules: [],
      status: 'Active'
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ChangeLogFormData) => apiRequest('/api/changes-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/changes-log'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Change log entry created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create change log entry',
        variant: 'destructive'
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ChangeLogFormData> }) => 
      apiRequest(`/api/changes-log/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/changes-log'] });
      setEditingChange(null);
      form.reset();
      toast({
        title: 'Success',
        description: 'Change log entry updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update change log entry',
        variant: 'destructive'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/changes-log/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/changes-log'] });
      toast({
        title: 'Success',
        description: 'Change log entry deleted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete change log entry',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (data: ChangeLogFormData) => {
    if (editingChange) {
      updateMutation.mutate({ id: editingChange.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (change: ChangeLog) => {
    setEditingChange(change);
    form.reset({
      version: change.version,
      title: change.title,
      description: change.description,
      changeType: change.changeType,
      priority: change.priority,
      affectedModules: change.affectedModules || [],
      status: change.status
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this change log entry?')) {
      deleteMutation.mutate(id);
    }
  };

  const getChangeTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'feature': return 'bg-blue-100 text-blue-800';
      case 'bug fix': return 'bg-red-100 text-red-800';
      case 'enhancement': return 'bg-green-100 text-green-800';
      case 'security': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Changes Log</h1>
          <p className="text-muted-foreground">
            Track system updates, features, and bug fixes
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Change
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingChange ? 'Edit Change Log Entry' : 'Add Change Log Entry'}
              </DialogTitle>
              <DialogDescription>
                {editingChange ? 'Update the change log entry details.' : 'Create a new change log entry to track system updates.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1.2.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="changeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Change Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Feature">Feature</SelectItem>
                            <SelectItem value="Bug Fix">Bug Fix</SelectItem>
                            <SelectItem value="Enhancement">Enhancement</SelectItem>
                            <SelectItem value="Security">Security</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of the change" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed description of the change"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
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
                        <FormLabel>Priority</FormLabel>
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingChange(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingChange ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search version..."
                value={filters.version}
                onChange={(e) => setFilters(prev => ({ ...prev, version: e.target.value, page: 1 }))}
                className="w-full"
              />
            </div>
            <Select 
              value={filters.changeType} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, changeType: value, page: 1 }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Change Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="Feature">Feature</SelectItem>
                <SelectItem value="Bug Fix">Bug Fix</SelectItem>
                <SelectItem value="Enhancement">Enhancement</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                version: '',
                changeType: '',
                status: '',
                page: 1,
                limit: 10
              })}
            >
              <Search className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Changes List */}
      {isLoading ? (
        <div className="text-center py-8">Loading changes log...</div>
      ) : (
        <div className="space-y-4">
          {changesData?.data?.map((change: ChangeLog) => (
            <Card key={change.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{change.version}</Badge>
                      <Badge className={getChangeTypeBadgeColor(change.changeType)}>
                        {change.changeType}
                      </Badge>
                      <Badge className={getPriorityBadgeColor(change.priority)}>
                        {change.priority}
                      </Badge>
                      <Badge variant={change.status === 'Active' ? 'default' : 'secondary'}>
                        {change.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{change.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(change)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(change.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(change.releaseDate), 'MMM dd, yyyy')}
                  </div>
                  {change.affectedModules && change.affectedModules.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {change.affectedModules.join(', ')}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p className="text-sm leading-relaxed">{change.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {changesData?.data?.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No changes found matching your criteria.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pagination */}
      {changesData?.pagination && changesData.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={filters.page <= 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-3">
            Page {filters.page} of {changesData.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={filters.page >= changesData.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}