import React, { useState, useRef } from "react";
import { MoreVertical, Edit, Download, FileText } from "lucide-react";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import Button from "../ui/Button";
import type { Member } from "../../types";

interface MemberActionsProps {
  member: Member;
  onEdit: () => void;
  onGenerateStatement: () => void;
  onGenerateInvoice: () => void;
}

const MemberActions: React.FC<MemberActionsProps> = ({
//   member,
  onEdit,
  onGenerateStatement,
  onGenerateInvoice,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setIsOpen(false));

  const actions = [
    { label: "Edit Member", icon: Edit, onClick: onEdit },
    {
      label: "Generate Statement",
      icon: FileText,
      onClick: onGenerateStatement,
    },
    {
      label: "Generate Monthly Invoice",
      icon: Download,
      onClick: onGenerateInvoice,
    },
  ];

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:flex space-x-2">
        <Button icon={Edit} onClick={onEdit}>
          Edit Member
        </Button>
        <Button icon={FileText} onClick={onGenerateStatement}>
          Generate Statement
        </Button>
        <Button icon={Download} onClick={onGenerateInvoice}>
          Generate Monthly Invoice
        </Button>
      </div>

      {/* Mobile View */}
      <div className="relative md:hidden" ref={dropdownRef}>
        <Button
          variant="secondary"
          icon={MoreVertical}
          onClick={() => setIsOpen(!isOpen)}
          className="!p-2"
        >
          <span className="sr-only">Open menu</span>
        </Button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1" role="menu">
              {actions.map(({ label, icon: Icon, onClick }) => (
                <button
                  key={label}
                  onClick={() => {
                    onClick();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  role="menuitem"
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MemberActions;
