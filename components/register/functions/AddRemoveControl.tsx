import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface AddRemoveControlProps {
  label: string;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
  min?: number;
  max?: number;
  removeDisabled?: boolean;
}

const AddRemoveControl: React.FC<AddRemoveControlProps> = ({
  label,
  count,
  onAdd,
  onRemove,
  min = 0,
  max = Infinity,
  removeDisabled = false,
}) => {
  const canRemove = count > min && !removeDisabled;
  const canAdd = count < max;

  return (
    <div className="flex items-center w-full">
      <button
        type="button"
        onClick={onRemove}
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
        onClick={onAdd}
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