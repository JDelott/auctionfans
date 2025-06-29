import { FieldUpdate } from '@/lib/auction-forms/types';
import { getFieldDisplayName } from '@/lib/auction-forms/form-analysis';

interface AIMessageProps {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  fieldUpdates?: FieldUpdate[];
  onAcceptFieldUpdate?: (update: FieldUpdate) => void;
  onRejectFieldUpdate?: (update: FieldUpdate) => void;
}

export function AIMessage({ 
  role, 
  content, 
  fieldUpdates = [],
  onAcceptFieldUpdate,
  onRejectFieldUpdate
}: AIMessageProps) {
  return (
    <div className={`${
      role === 'assistant' 
        ? 'bg-violet-600/10 border-violet-600/20' 
        : 'bg-zinc-800/50 border-zinc-700/50'
    } border rounded-lg p-3`}>
      <p className="text-sm text-zinc-200 whitespace-pre-line">
        {content}
      </p>
      
      {/* Field Updates Display */}
      {fieldUpdates.length > 0 && onAcceptFieldUpdate && onRejectFieldUpdate && (
        <div className="mt-3 space-y-2">
          {fieldUpdates.map((update, index) => (
            <div key={index} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2">
              <div className="text-xs text-zinc-400 mb-1">
                {getFieldDisplayName(update.field)}: {update.reason}
              </div>
              <div className="text-sm text-white bg-zinc-900/50 rounded px-2 py-1 mb-2">
                &quot;{update.value}&quot;
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAcceptFieldUpdate(update)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded transition-colors"
                >
                  ✓ Accept
                </button>
                <button
                  onClick={() => onRejectFieldUpdate(update)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition-colors"
                >
                  ✗ Revise
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
