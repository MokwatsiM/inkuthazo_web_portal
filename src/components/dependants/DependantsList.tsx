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
  return (
    <div className="space-y-4">
      {dependants.map((dependant) => (
        <div
          key={dependant.id}
          className="bg-white p-4 rounded-lg shadow border border-gray-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{dependant.full_name}</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>
                  Relationship:{" "}
                  <span className="capitalize">{dependant.relationship}</span>
                </p>
                <p>
                  Date of Birth:{" "}
                  {format(dependant.date_of_birth.toDate(), "dd MMM yyyy")}
                </p>
                <p>ID Number: {dependant.id_number}</p>
              </div>
              {dependant.id_document_url && (
                <a
                  href={dependant.id_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                >
                  View ID Document <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              )}
            </div>
            <Button
              variant="secondary"
              icon={Trash2}
              onClick={() => onDelete(dependant)}
              className="!p-2"
            >
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DependantsList;
