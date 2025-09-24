import React from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  Trash2,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  ExternalLink
} from "lucide-react";
import Avatar from "../avatar/Avatar";
import { StatusPill } from "../ui/Badge";
import Button from "../ui/Button";
import { formatDate } from "../../utils/dateUtils";
import type { Member } from "../../types";

interface MemberCardProps {
  member: Member;
  onApprove?: (member: Member) => void;
  onDelete?: (member: Member) => void;
  isSelected?: boolean;
  onSelect?: (member: Member, selected: boolean) => void;
  showActions?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onApprove,
  onDelete,
  isSelected = false,
  onSelect,
  showActions = true,
}) => {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(member, e.target.checked);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div className={`
      bg-surface dark:bg-surface-dark rounded-lg border transition-all duration-200 hover:shadow-md
      ${isSelected ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/30' : 'border-line dark:border-line-dark'}
    `}>
      {/* Header with checkbox and actions */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-primary-600 border-line dark:border-line-dark rounded focus:ring-primary-500"
            />
          )}
          <StatusPill status={member.status as any} />
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            {member.status === "pending" && onApprove && (
              <button
                onClick={(e) => handleActionClick(e, () => onApprove(member))}
                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                title="Approve member"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => handleActionClick(e, () => onDelete(member))}
                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Delete member"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Member info */}
      <Link
        to={`/members/${member.id}`}
        className="block px-4 pb-4 hover:bg-surface-2/50 dark:hover:bg-surface-2-dark/50 transition-colors"
      >
        {/* Avatar and basic info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar member={member} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary dark:text-text-primary-dark truncate">
              {member.full_name}
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark truncate">
              Member since {formatDate(member.join_date, 'MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Contact details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-secondary-dark">
            <Mail className="w-4 h-4 text-text-tertiary dark:text-text-tertiary-dark" />
            <span className="truncate">{member.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-secondary-dark">
            <Phone className="w-4 h-4 text-text-tertiary dark:text-text-tertiary-dark" />
            <span>{member.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-secondary-dark">
            <Calendar className="w-4 h-4 text-text-tertiary dark:text-text-tertiary-dark" />
            <span>Joined {formatDate(member.join_date)}</span>
          </div>
        </div>

        {/* View details link */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-line dark:border-line-dark">
          <span className="text-sm text-primary-600 font-medium flex items-center gap-1">
            View Details
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </Link>
    </div>
  );
};

export default MemberCard;