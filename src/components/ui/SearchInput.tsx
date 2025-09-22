import React from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
  debounceMs?: number;
  fullWidth?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  onClear,
  debounceMs = 300,
  fullWidth = false,
}) => {
  const [localValue, setLocalValue] = React.useState(value);
  const debounceRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localValue, onChange, debounceMs]);

  const handleClear = () => {
    setLocalValue("");
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'w-full max-w-md'} ${className}`}>
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className={`
          block w-full rounded-input border border-gray-300 bg-white
          pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-500
          transition-all duration-200
          focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20
          dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400
          dark:focus:border-primary-400
        `.replace(/\s+/g, ' ').trim()}
        placeholder={placeholder}
      />
      {localValue && (
        <div className="absolute inset-y-0 right-3 flex items-center">
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchInput;
