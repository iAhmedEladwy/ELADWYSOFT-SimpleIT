import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useTicketTranslations } from '@/lib/translations/tickets';
import { apiRequest } from '@/lib/queryClient';
import type { AssetResponse, UserResponse } from '@shared/types';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Employee {
  id: number;
  englishName?: string;
  arabicName?: string;
  name?: string;
  department?: string;
}

interface TicketAssetSelectorProps {
  control: any;
  submittedByValue?: string;
  onSubmittedByChange?: (value: string) => void;
  onAssetChange?: (value: string) => void;
  onAssignedToChange?: (value: string) => void;
}

export default function TicketAssetSelector({
  control,
  submittedByValue,
  onSubmittedByChange,
  onAssetChange,
  onAssignedToChange,
}: TicketAssetSelectorProps) {
  const { language } = useLanguage();
  const t = useTicketTranslations(language);
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const response = await apiRequest('/api/employees');
      return Array.isArray(response) ? response.filter(emp => emp && emp.id) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery<UserResponse[]>({
    queryKey: ['/api/users'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch assets and filter by selected employee
  const { data: allAssets = [] } = useQuery<AssetResponse[]>({
    queryKey: ['/api/assets'],
    staleTime: 5 * 60 * 1000,
  });

  // Filter assets by selected employee
  const filteredAssets = submittedByValue && submittedByValue !== '' 
    ? allAssets.filter(asset => {
        const employeeIdNum = parseInt(submittedByValue);
        if (isNaN(employeeIdNum)) return false;
        
        // Check if asset is assigned to this employee
        return asset.assignedToId === employeeIdNum;
      })
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* Submitted By (Employee Search) */}
      <FormField
        control={control}
        name="submittedById"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{t.submittedBy} *</FormLabel>
            <Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={employeePopoverOpen}
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value && Array.isArray(employees)
                      ? employees.find(emp => emp.id.toString() === field.value)?.englishName || t.selectEmployee
                      : t.selectEmployee}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                <Command>
                  <CommandInput placeholder={t.searchEmployee} className="h-9" />
                  <CommandEmpty>{t.noEmployeeFound}</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-auto">
                    {employees.map((employee) => (
                      <CommandItem
                        key={employee.id}
                        value={`${employee.englishName || ''} ${employee.arabicName || ''} ${employee.department || ''}`}
                        onSelect={() => {
                          const newValue = employee.id.toString();
                          field.onChange(newValue);
                          onSubmittedByChange?.(newValue);
                          // Reset asset selection when employee changes
                          onAssetChange?.('');
                          setEmployeePopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === employee.id.toString() ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{employee.englishName || employee.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">
                            {employee.department || t.noDepartment}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Assigned To (User Selection) */}
      <FormField
        control={control}
        name="assignedToId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.assignedTo}</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value === 'unassigned' ? undefined : parseInt(value));
                onAssignedToChange?.(value);
              }} 
              value={field.value ? field.value.toString() : 'unassigned'}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectUser} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="unassigned">{t.unassigned}</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Related Asset (Filtered by Employee) */}
      <FormField
        control={control}
        name="relatedAssetId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.relatedAsset}</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value === 'none' ? undefined : parseInt(value));
                onAssetChange?.(value);
              }}
              value={field.value ? field.value.toString() : 'none'}
              disabled={!submittedByValue || submittedByValue === ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !submittedByValue ? t.selectEmployeeFirst : t.selectAssetOptional
                  } />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">{t.noAsset}</SelectItem>
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => {
                    const displayParts = [asset.assetId];
                    const deviceInfo = [];
                    
                    if (asset.type) deviceInfo.push(asset.type);
                    if (asset.brand) deviceInfo.push(asset.brand);
                    if (asset.modelName) deviceInfo.push(asset.modelName);
                    
                    const displayString = deviceInfo.length > 0 
                      ? `${asset.assetId}, ${deviceInfo.join(' ')}`
                      : asset.assetId;
                    
                    return (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        {displayString}
                      </SelectItem>
                    );
                  })
                ) : (
                  submittedByValue && (
                    <SelectItem value="no-assets" disabled>
                      {t.noAssetsForEmployee}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}