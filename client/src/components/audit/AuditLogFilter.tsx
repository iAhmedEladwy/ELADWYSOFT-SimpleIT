import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from '@/hooks/use-language';

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
  const { language } = useLanguage();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const translations = {
    keywordSearch: language === 'English' ? 'Keyword Search' : 'البحث بالكلمات المفتاحية',
    searchLogs: language === 'English' ? 'Search logs...' : 'البحث في السجلات...',
    action: language === 'English' ? 'Action' : 'الإجراء',
    selectAction: language === 'English' ? 'Select action' : 'اختر الإجراء',
    allActions: language === 'English' ? 'All Actions' : 'جميع الإجراءات',
    entityType: language === 'English' ? 'Entity Type' : 'نوع الكيان',
    selectEntityType: language === 'English' ? 'Select entity type' : 'اختر نوع الكيان',
    allEntities: language === 'English' ? 'All Entities' : 'جميع الكيانات',
    startDate: language === 'English' ? 'Start Date' : 'تاريخ البداية',
    endDate: language === 'English' ? 'End Date' : 'تاريخ النهاية',
    pickDate: language === 'English' ? 'Pick a date' : 'اختر التاريخ',
    text: language === 'English' ? 'Text' : 'النص',
    entity: language === 'English' ? 'Entity' : 'الكيان',
    dateRange: language === 'English' ? 'Date Range' : 'نطاق التاريخ',
    clearAll: language === 'English' ? 'Clear All' : 'مسح الكل',
    filtering: language === 'English' ? 'Filtering...' : 'جاري التصفية...',
    filterLogs: language === 'English' ? 'Filter Logs' : 'تصفية السجلات',
  };

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
                    <FormLabel>{translations.keywordSearch}</FormLabel>
                    <FormControl>
                      <Input placeholder={translations.searchLogs} {...field} />
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
                    <FormLabel>{translations.action}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.selectAction} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all-actions">{translations.allActions}</SelectItem>
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
                    <FormLabel>{translations.entityType}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.selectEntityType} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all-entities">{translations.allEntities}</SelectItem>
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
                    <FormLabel>{translations.startDate}</FormLabel>
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
                              <span>{translations.pickDate}</span>
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
                    <FormLabel>{translations.endDate}</FormLabel>
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
                              <span>{translations.pickDate}</span>
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
                        {translations.text}
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
                        {translations.action}: {form.getValues().action}
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
                        {translations.entity}: {form.getValues().entityType}
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
                        {translations.dateRange}
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
                    {translations.clearAll}
                  </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                  <Filter className="mr-2 h-4 w-4" />
                  {isLoading ? translations.filtering : translations.filterLogs}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}