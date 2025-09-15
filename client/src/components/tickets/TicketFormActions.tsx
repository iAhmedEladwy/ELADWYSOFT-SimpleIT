import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import { useTicketTranslations } from '@/lib/translations/tickets';
import { Save, Loader2, X, Edit3, Send, Trash2 } from 'lucide-react';

interface TicketFormActionsProps {
  mode: 'create' | 'edit';
  isLoading?: boolean;
  isDirty?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onSubmit?: () => void;
  canDelete?: boolean;
  canEdit?: boolean;
  showSubmit?: boolean;
  className?: string;
}

export default function TicketFormActions({
  mode,
  isLoading = false,
  isDirty = false,
  onSave,
  onCancel,
  onDelete,
  onSubmit,
  canDelete = false,
  canEdit = true,
  showSubmit = false,
  className = ''
}: TicketFormActionsProps) {
  const { language } = useLanguage();
  const t = useTicketTranslations(language);

  return (
    <div className={`flex justify-between items-center pt-4 border-t ${className}`}>
      
      {/* Left side actions */}
      <div className="flex items-center gap-2">
        {mode === 'edit' && canDelete && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t.delete}
          </Button>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        
        {/* Cancel Button */}
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            {t.cancel}
          </Button>
        )}

        {/* Save Draft Button (for edit mode with changes) */}
        {mode === 'edit' && isDirty && onSave && (
          <Button
            type="button"
            variant="secondary"
            onClick={onSave}
            disabled={isLoading || !canEdit}
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            {t.save}
          </Button>
        )}

        {/* Submit/Create Button */}
        {((mode === 'create') || (mode === 'edit' && showSubmit)) && onSubmit && (
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isLoading || !canEdit}
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'create' ? (
              <>
                <Send className="h-4 w-4" />
                {t.createTicket}
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                {t.editTicket}
              </>
            )}
          </Button>
        )}

      </div>
    </div>
  );
}