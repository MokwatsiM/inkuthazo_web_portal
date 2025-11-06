// src/components/ui/Pagination.tsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = React.memo<PaginationProps>(({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Maximum visible page numbers

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis-start');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="secondary"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="secondary"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
            Showing page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            <Button
              variant="secondary"
              className="rounded-l-md"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              icon={ChevronLeft}
            >
              <span className="sr-only">Previous</span>
            </Button>
            {pageNumbers.map((page, index) => {
              if (typeof page === 'string') {
                // Render ellipsis
                return (
                  <span
                    key={page}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-text-tertiary dark:text-text-tertiary-dark ring-1 ring-inset ring-line dark:ring-line-dark bg-surface dark:bg-surface-dark"
                  >
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? "z-10 bg-primary-600 dark:bg-primary-600 text-white dark:text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                      : "text-text-primary dark:text-text-primary-dark ring-1 ring-inset ring-line dark:ring-line-dark hover:bg-surface-hover dark:hover:bg-surface-dark focus:z-20 focus:outline-offset-0 bg-surface dark:bg-surface-dark"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <Button
              variant="secondary"
              className="rounded-r-md"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              icon={ChevronRight}
            >
              <span className="sr-only">Next</span>
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export default Pagination;
