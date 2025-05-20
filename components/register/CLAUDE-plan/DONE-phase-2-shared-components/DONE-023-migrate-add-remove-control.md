# Task 023: Migrate AddRemoveControl

## Objective
Migrate the AddRemoveControl component to the shared location with improvements and proper typing.

## Dependencies
- Phase 1 foundation complete

## Reference Files
- `components/register/functions/AddRemoveControl.tsx`

## Steps

1. Copy and refactor AddRemoveControl:
```typescript
// components/register/forms/shared/AddRemoveControl.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={onRemove}
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
          onClick={onAdd}
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
            onClick={onAdd}
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
              onClick={onRemove}
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
          onClick={onAdd}
          disabled={!canAdd}
        >
          <Plus className="h-4 w-4 mr-2" />
          {addLabel}
        </Button>
        
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRemove}
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
```

2. Create specialized versions for common use cases:
```typescript
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
```

## Deliverables
- Migrated AddRemoveControl component
- Multiple style variants
- Specialized versions for common cases
- Proper accessibility

## Success Criteria
- Component supports all existing use cases
- New variants for different UI needs
- Type-safe with proper constraints
- Accessible with keyboard navigation