import React from "react";
import { Search } from "lucide-react";

interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const SearchInput: React.FC<SearchInputProps> = (props) => {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        {...props}
        className="w-full pl-10 pr-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder={props.placeholder || "Search..."}
      />
    </div>
  );
};

export default SearchInput;
