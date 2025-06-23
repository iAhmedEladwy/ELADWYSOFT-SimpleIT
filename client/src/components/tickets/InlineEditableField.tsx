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

  // Auto-save on blur
  const handleBlur = () => {
    if (editValue !== String(value)) {
      handleSave();
    } else {
      setIsEditing(false);
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
      <div className="w-full">
        <Select 
          value={editValue} 
          onValueChange={(value) => {
            setEditValue(value);
            // Auto-save immediately on selection change
            setTimeout(() => {
              if (value !== String(value)) {
                onSave(value).then(() => setIsEditing(false));
              }
            }, 0);
          }}
        >
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
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="w-full">
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full"
          rows={3}
          disabled={isLoading}
          placeholder="Click away to save, Escape to cancel"
        />
        {isLoading && (
          <p className="text-xs text-gray-500 mt-1">Saving...</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full"
        disabled={isLoading}
        placeholder="Press Enter or click away to save"
      />
      {isLoading && (
        <p className="text-xs text-gray-500 mt-1">Saving...</p>
      )}
    </div>
  );
}