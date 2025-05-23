import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';

interface AddRemoveControlProps {
  count: number;
  onAdd: () => void;
  onRemove: () => void;
  minCount?: number;
  maxCount?: number;
  addLabel?: string;
  removeLabel?: string;
  countLabel?: string;
  showCount?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

export const AddRemoveControl: React.FC<AddRemoveControlProps> = ({
  count,
  onAdd,
  onRemove,
  minCount = 0,
  maxCount = Infinity,
  addLabel = "Add",
  removeLabel = "Remove",
  countLabel = "items",
  showCount = true,
  disabled = false,
  variant = 'default',
  className,
}) => {
  const canAdd = count < maxCount && !disabled;
  const canRemove = count > minCount && !disabled;

  // Debounce the add and remove callbacks to prevent rapid clicks
  // 300ms delay should be sufficient to prevent accidental double-clicks
  const debouncedAdd = useDebouncedCallback(onAdd, 300);
  const debouncedRemove = useDebouncedCallback(onRemove, 300);

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={debouncedRemove}
          disabled={!canRemove}
          className="h-8 w-8"
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        {showCount && (
          <span className="text-sm font-medium min-w-[3ch] text-center">
            {count}
          </span>
        )}
        
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={debouncedAdd}
          disabled={!canAdd}
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showCount && (
          <span className="text-sm text-muted-foreground">
            {count} {countLabel}
          </span>
        )}
        
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={debouncedAdd}
            disabled={!canAdd}
          >
            <Plus className="h-4 w-4 mr-1" />
            {addLabel}
          </Button>
          
          {count > minCount && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={debouncedRemove}
              disabled={!canRemove}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              {removeLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("space-y-2", className)}>
      {showCount && (
        <p className="text-sm text-muted-foreground">
          {count} {countLabel}
        </p>
      )}
      
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={debouncedAdd}
          disabled={!canAdd}
        >
          <Plus className="h-4 w-4 mr-2" />
          {addLabel}
        </Button>
        
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={debouncedRemove}
          disabled={!canRemove}
          className={cn(
            canRemove && "text-destructive hover:bg-destructive hover:text-destructive-foreground"
          )}
        >
          <Minus className="h-4 w-4 mr-2" />
          {removeLabel}
        </Button>
      </div>
    </div>
  );
};

// Create specialized attendee counter
export const AttendeeCounter: React.FC<{
  attendeeCount: number;
  onAdd: () => void;
  onRemove: () => void;
  maxAttendees?: number;
}> = ({ attendeeCount, onAdd, onRemove, maxAttendees = 10 }) => {
  return (
    <AddRemoveControl
      count={attendeeCount}
      onAdd={onAdd}
      onRemove={onRemove}
      minCount={1}
      maxCount={maxAttendees}
      addLabel="Add Attendee"
      removeLabel="Remove Attendee"
      countLabel="attendees"
      variant="inline"
    />
  );
};

// Create specialized ticket counter
export const TicketCounter: React.FC<{
  ticketCount: number;
  onAdd: () => void;
  onRemove: () => void;
  maxTickets: number;
  ticketType: string;
}> = ({ ticketCount, onAdd, onRemove, maxTickets, ticketType }) => {
  return (
    <AddRemoveControl
      count={ticketCount}
      onAdd={onAdd}
      onRemove={onRemove}
      minCount={0}
      maxCount={maxTickets}
      countLabel={`${ticketType} tickets`}
      variant="compact"
    />
  );
};

// Create legacy-compatible version for gradual migration
export const LegacyAddRemoveControl: React.FC<{
  label: string;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
  min?: number;
  max?: number;
  removeDisabled?: boolean;
}> = ({ label, count, onAdd, onRemove, min = 0, max = Infinity, removeDisabled = false }) => {
  const canRemove = count > min && !removeDisabled;
  const canAdd = count < max;
  
  // Debounce the callbacks for legacy component as well
  const debouncedAdd = useDebouncedCallback(onAdd, 300);
  const debouncedRemove = useDebouncedCallback(onRemove, 300);

  return (
    <div className="flex items-center w-full">
      <button
        type="button"
        onClick={debouncedRemove}
        disabled={!canRemove}
        className={`w-10 h-10 flex items-center justify-center bg-white border border-slate-300 text-slate-700 rounded-l-md transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 ${!canRemove ? 'opacity-50 cursor-not-allowed hover:bg-white' : ''}`}
        aria-label={`Remove last ${label}`}
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="flex-grow h-10 flex items-center justify-center px-4 bg-white border-y border-slate-300 text-slate-800 font-medium text-sm">
        {label} ({count})
      </div>
      <button
        type="button"
        onClick={debouncedAdd}
        disabled={!canAdd}
        className={`w-10 h-10 flex items-center justify-center bg-white border border-slate-300 text-slate-700 rounded-r-md transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 ${!canAdd ? 'opacity-50 cursor-not-allowed hover:bg-white' : ''}`}
        aria-label={`Add ${label}`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AddRemoveControl;