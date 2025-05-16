import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Actions and entity types from auditLogger
const actionTypes = [
  'CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 
  'EXPORT', 'IMPORT', 'ASSIGN', 'UNASSIGN', 'CONFIG_CHANGE', 'STATUS_CHANGE', 'ERROR'
];

const entityTypes = [
  'USER', 'EMPLOYEE', 'ASSET', 'TICKET', 'ASSET_MAINTENANCE', 'ASSET_SALE',
  'SYSTEM_CONFIG', 'SESSION', 'REPORT', 'SOFTWARE_ASSET', 'SERVICE_PROVIDER'
];

const filterFormSchema = z.object({
  filter: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

type FilterFormValues = z.infer<typeof filterFormSchema>;

interface AuditLogFilterProps {
  onFilter: (filters: any) => void;
  users?: { id: number; username: string }[];
  isLoading?: boolean;
}

export default function AuditLogFilter({ onFilter, users = [], isLoading = false }: AuditLogFilterProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      filter: "",
      action: undefined,
      entityType: undefined,
      startDate: undefined,
      endDate: undefined,
    },
  });

  function onSubmit(data: FilterFormValues) {
    // Track which filters are active for displaying badges
    const newActiveFilters = [];
    
    if (data.filter) newActiveFilters.push('text');
    if (data.action) newActiveFilters.push('action');
    if (data.entityType) newActiveFilters.push('entityType');
    if (data.startDate) newActiveFilters.push('dateRange');
    
    setActiveFilters(newActiveFilters);
    onFilter(data);
  }

  function clearFilters() {
    form.reset({
      filter: "",
      action: undefined,
      entityType: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setActiveFilters([]);
    onFilter({});
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <FormField
                control={form.control}
                name="filter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keyword Search</FormLabel>
                    <FormControl>
                      <Input placeholder="Search logs..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all-actions">All Actions</SelectItem>
                        {actionTypes.map(action => (
                          <SelectItem key={action} value={action}>{action}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select entity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all-entities">All Entities</SelectItem>
                        {entityTypes.map(entity => (
                          <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                {activeFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 sm:mb-0">
                    {activeFilters.includes('text') && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        Text
                        <button type="button" onClick={() => {
                          form.setValue('filter', '');
                          form.handleSubmit(onSubmit)();
                        }}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {activeFilters.includes('action') && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        Action: {form.getValues().action}
                        <button type="button" onClick={() => {
                          form.setValue('action', undefined);
                          form.handleSubmit(onSubmit)();
                        }}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {activeFilters.includes('entityType') && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        Entity: {form.getValues().entityType}
                        <button type="button" onClick={() => {
                          form.setValue('entityType', undefined);
                          form.handleSubmit(onSubmit)();
                        }}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {activeFilters.includes('dateRange') && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        Date Range
                        <button type="button" onClick={() => {
                          form.setValue('startDate', undefined);
                          form.setValue('endDate', undefined);
                          form.handleSubmit(onSubmit)();
                        }}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            
              <div className="flex gap-2">
                {activeFilters.length > 0 && (
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                  <Filter className="mr-2 h-4 w-4" />
                  {isLoading ? "Filtering..." : "Filter Logs"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}