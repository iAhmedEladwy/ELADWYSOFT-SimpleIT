import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useTicketTranslations } from '@/lib/translations/tickets';
import type { EmployeeResponse, UserResponse, AssetResponse } from '@shared/types';

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

interface TicketAssetSelectorProps {
  control: any;
  submittedByValue?: string;
  onEmployeeChange?: (value: string) => void;
  onAssignedToChange?: (value: string) => void;
  onAssetChange?: (value: string) => void;
}

export default function TicketAssetSelector({ 
  control, 
  submittedByValue,
  onEmployeeChange,
  onAssignedToChange,
  onAssetChange 
}: TicketAssetSelectorProps) {
  const { language } = useLanguage();
  const t = useTicketTranslations(language);
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);

  // Data queries
  const { data: employees = [] } = useQuery<EmployeeResponse[]>({
    queryKey: ['/api/employees'],
    staleTime: 300000, // 5 minutes
  });

  const { data: users = [] } = useQuery<UserResponse[]>({
    queryKey: ['/api/users'],
    staleTime: 300000, // 5 minutes
  });

  const { data: assets = [] } = useQuery<AssetResponse[]>({
    queryKey: ['/api/assets'],
    staleTime: 300000, // 5 minutes
  });

  // Filter assets by selected employee
  const submittedByEmployeeId = submittedByValue ? parseInt(submittedByValue) : null;
  const filteredAssets = submittedByEmployeeId 
    ? assets.filter((asset: AssetResponse) => asset.assignedEmployeeId === submittedByEmployeeId)
    : [];

  return (
    <div className="space-y-4">
      {/* Submitted By (Employee Selection) */}
      <FormField
        control={control}
        name="submittedById"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.submittedBy} *</FormLabel>
            <Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value
                      ? employees.find((employee: EmployeeResponse) => employee.id.toString() === field.value)?.englishName || 
                        employees.find((employee: EmployeeResponse) => employee.id.toString() === field.value)?.name ||
                        `Employee ${field.value}`
                      : t.selectEmployee
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder={t.searchEmployee} />
                  <CommandEmpty>{t.noEmployeeFound}</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {employees.map((employee: EmployeeResponse) => (
                      <CommandItem
                        key={employee.id}
                        value={`${employee.englishName || employee.name || ''} ${employee.department || ''}`}
                        onSelect={() => {
                          const newValue = employee.id.toString();
                          field.onChange(newValue);
                          onEmployeeChange?.(newValue);
                          // Reset asset selection when employee changes
                          onAssetChange?.('none');
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
                // FIXED: Proper value handling without empty strings
                if (value === 'unassigned') {
                  field.onChange(undefined);
                } else {
                  field.onChange(parseInt(value));
                }
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

      {/* Related Asset (Filtered by Employee) - FIXED: No empty strings */}
      <FormField
        control={control}
        name="relatedAssetId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.relatedAsset}</FormLabel>
            <Select 
              onValueChange={(value) => {
                // FIXED: Proper value handling without empty strings
                if (value === 'none') {
                  field.onChange(undefined);
                } else {
                  field.onChange(parseInt(value));
                }
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
                {/* FIXED: Use 'none' instead of empty string */}
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
                    <SelectItem value="no-assets-available" disabled>
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