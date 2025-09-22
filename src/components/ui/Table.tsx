import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface TableProps {
  headers?: string[];
  columns?: TableColumn[];
  children: React.ReactNode;
  className?: string;
  stickyHeader?: boolean;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
}

const Table: React.FC<TableProps> = ({
  headers,
  columns,
  children,
  className = "",
  stickyHeader = false,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  // Use either columns or headers for backward compatibility
  const tableHeaders = columns || headers?.map(h => ({ key: h, label: h })) || [];

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow-card rounded-base border border-line">
            <table className="min-w-full">
              <thead className={`bg-gray-50 dark:bg-gray-800 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                <tr className="border-b border-line">
                  {tableHeaders.map((header, index) => {
                    const isSortable = typeof header === 'object' ? header.sortable : false;
                    const headerKey = typeof header === 'object' ? header.key : header;
                    const headerLabel = typeof header === 'object' ? header.label : header;
                    const headerWidth = typeof header === 'object' ? header.width : undefined;
                    const headerAlign = typeof header === 'object' ? header.align || 'left' : 'left';
                    const isSorted = sortColumn === headerKey;

                    const alignClass = {
                      left: 'text-left',
                      center: 'text-center',
                      right: 'text-right'
                    }[headerAlign];

                    return (
                      <th
                        key={index}
                        scope="col"
                        className={`
                          px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100
                          ${alignClass}
                          ${isSortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none' : ''}
                          transition-colors duration-150
                        `.replace(/\s+/g, ' ').trim()}
                        style={headerWidth ? { width: headerWidth } : undefined}
                        onClick={isSortable && onSort ? () => onSort(headerKey) : undefined}
                      >
                        <div className="flex items-center gap-2">
                          <span>{headerLabel}</span>
                          {isSortable && (
                            <div className="flex flex-col">
                              <ChevronUp
                                className={`w-3 h-3 ${
                                  isSorted && sortDirection === 'asc'
                                    ? 'text-primary-600'
                                    : 'text-gray-400'
                                }`}
                              />
                              <ChevronDown
                                className={`w-3 h-3 -mt-1 ${
                                  isSorted && sortDirection === 'desc'
                                    ? 'text-primary-600'
                                    : 'text-gray-400'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-line">
                {children}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Table Row component with hover effects
export const TableRow: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}> = ({ children, className = "", onClick, interactive = false }) => {
  return (
    <tr
      className={`
        transition-colors duration-150
        ${interactive || onClick ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

// Table Cell component
export const TableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}> = ({ children, className = "", align = "left" }) => {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[align];

  return (
    <td className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 ${alignClass} ${className}`}>
      {children}
    </td>
  );
};

export default Table;
