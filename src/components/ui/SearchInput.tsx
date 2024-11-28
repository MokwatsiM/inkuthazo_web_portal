import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const SearchInput: React.FC<SearchInputProps> = (props) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
      <input
        {...props}
        className="w-full pl-10 pr-4 py-2 border rounded-md"
      />
    </div>
  );
};

export default SearchInput;