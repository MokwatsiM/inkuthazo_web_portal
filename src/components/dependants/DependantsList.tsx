import React from "react";
import { format } from "date-fns";
import { ExternalLink, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import type { Dependant } from "../../types";

interface DependantsListProps {
  dependants: Dependant[];
  onDelete: (dependant: Dependant) => void;
}

const DependantsList: React.FC<DependantsListProps> = ({
  dependants,
  onDelete,
}) => {
  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'parent':
        return 'border-purple-400/30 bg-purple-400/10 text-purple-200 dark:text-purple-200';
      case 'child':
        return 'border-blue-400/30 bg-blue-400/10 text-blue-200 dark:text-blue-200';
      case 'spouse':
        return 'border-pink-400/30 bg-pink-400/10 text-pink-200 dark:text-pink-200';
      case 'sibling':
        return 'border-green-400/30 bg-green-400/10 text-green-200 dark:text-green-200';
      default:
        return 'border-neutral-400/30 bg-neutral-400/10 text-neutral-200 dark:text-neutral-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {dependants.map((dependant) => (
        <div
          key={dependant.id}
          className="rounded-xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark/40 p-4 hover:border-line-hover dark:hover:border-line-dark transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base tracking-tight font-semibold text-text-primary dark:text-text-primary-dark">{dependant.full_name}</h4>
                <span className={`text-[11px] rounded-full border px-2 py-0.5 capitalize ${getRelationshipColor(dependant.relationship)}`}>
                  {dependant.relationship}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-sm text-text-secondary dark:text-text-secondary-dark">
                <p>Date of Birth: {format(dependant.date_of_birth.toDate(), "dd MMM yyyy")}</p>
                <p>ID Number: {dependant.id_number}</p>
              </div>
              {dependant.id_document_url && (
                <a
                  href={dependant.id_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center text-sm text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200"
                >
                  View ID Document
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              )}
            </div>
            <button
              onClick={() => onDelete(dependant)}
              className="inline-flex items-center justify-center rounded-lg border border-line dark:border-line-dark bg-surface/50 dark:bg-surface-dark/50 text-text-secondary dark:text-text-secondary-dark hover:text-rose-600 dark:hover:text-rose-200 hover:bg-rose-500/10 hover:border-rose-500/30 p-2 transition"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" />
              <span className="sr-only">Delete</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DependantsList;
