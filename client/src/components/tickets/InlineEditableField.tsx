import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Check, X, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditableFieldProps {
  value: string | number;
  onSave: (newValue: string) => void;
  type?: 'text' | 'textarea' | 'select' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  displayValue?: string;
  disabled?: boolean;
}

export default function InlineEditableField({
  value,
  onSave,
  type = 'text',
  options = [],
  placeholder = 'Click to edit',
  className = '',
  displayValue,
  disabled = false
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ''));
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(String(value || ''));
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      // Focus the input when entering edit mode
      setTimeout(() => {
        if (type === 'textarea' && textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        } else if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isEditing, type]);

  const handleSave = async () => {
    if (editValue === String(value)) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving field:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value || ''));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && e.ctrlKey && type === 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (disabled) {
    return (
      <span className={cn('text-sm', className)}>
        {displayValue || value || placeholder}
      </span>
    );
  }

  if (!isEditing) {
    return (
      <div
        className={cn(
          'group relative cursor-pointer rounded px-2 py-1 hover:bg-gray-50 transition-colors',
          'border border-transparent hover:border-gray-200',
          className
        )}
        onClick={() => setIsEditing(true)}
      >
        <span className="text-sm">
          {displayValue || value || (
            <span className="text-gray-400 italic">{placeholder}</span>
          )}
        </span>
        <Edit2 className="h-3 w-3 absolute right-1 top-1 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div className="flex items-center gap-2">
        <Select value={editValue} onValueChange={setEditValue}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full"
          rows={3}
          disabled={isLoading}
        />
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
          >
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Press Ctrl+Enter to save, Escape to cancel
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1"
        disabled={isLoading}
      />
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}