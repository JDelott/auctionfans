import { FieldAIEnhancer } from './FieldAIEnhancer';
import { AuctionFormData, Category } from '@/lib/auction-forms/types';

interface SmartFormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  categories: Category[];
  currentFormData: AuctionFormData;
  className?: string;
}

export function SmartFormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  options = [],
  categories,
  currentFormData,
  className = ''
}: SmartFormFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const baseClassName = `w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors ${className}`;

  // Only show AI enhancer for text inputs and textareas, not selects
  const showAIEnhancer = type !== 'select';

  const renderField = () => {
    switch (type) {
      case 'textarea':
        return (
          <div className="relative">
            <textarea
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className={`${baseClassName} resize-none min-h-[120px] ${showAIEnhancer ? 'pr-12' : ''}`}
              rows={6}
            />
            {showAIEnhancer && (
              <div className="absolute top-3 right-3">
                <FieldAIEnhancer
                  fieldName={name}
                  onFieldUpdate={onChange}
                  categories={categories}
                  currentFormData={currentFormData}
                />
              </div>
            )}
          </div>
        );
      
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={handleChange}
            className={baseClassName}
          >
            <option value="">Select...</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <div className="relative">
            <input
              type={type}
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className={`${baseClassName} ${showAIEnhancer ? 'pr-12' : ''}`}
              min={type === 'number' ? '0' : undefined}
              step={type === 'number' ? '0.01' : undefined}
            />
            {showAIEnhancer && (
              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                <FieldAIEnhancer
                  fieldName={name}
                  onFieldUpdate={onChange}
                  categories={categories}
                  currentFormData={currentFormData}
                />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {renderField()}
    </div>
  );
} 
