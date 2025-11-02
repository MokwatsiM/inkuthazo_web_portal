import React, { useState } from "react";
import { format } from "date-fns";
import AvatarUpload from "../avatar/AvatarUpload";
import type { Member } from "../../types";

interface MemberProfileProps {
  member: Member;
  onAvatarUpload: (file: File) => Promise<void>;
}

const MemberProfile: React.FC<MemberProfileProps> = ({
  member,
  onAvatarUpload,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark/40 shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <AvatarUpload member={member} onUpload={onAvatarUpload} />
          <div>
            <h2 className="text-xl tracking-tight font-semibold text-text-primary dark:text-text-primary-dark">{member.full_name}</h2>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{member.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-text-secondary dark:text-text-secondary-dark">Phone</p>
              <p className="font-medium text-text-primary dark:text-text-primary-dark">{member.phone}</p>
            </div>
            <button
              onClick={() => copyToClipboard(member.phone)}
              className="text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark rounded-md border border-line dark:border-line-dark bg-surface/50 dark:bg-surface-dark/50 px-2.5 py-1 text-xs hover:bg-surface-hover dark:hover:bg-surface-dark transition"
              title="Copy phone"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-text-secondary dark:text-text-secondary-dark">Join Date</p>
              <p className="font-medium text-text-primary dark:text-text-primary-dark">
                {format(member.join_date.toDate(), "dd MMM yyyy")}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
              member.status === 'active' || member.status === 'approved'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
            }`}>
              {member.status}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-text-secondary dark:text-text-secondary-dark">Role</p>
              <p className="font-medium text-text-primary dark:text-text-primary-dark capitalize">{member.role}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-600 dark:text-sky-300 capitalize">
              {member.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
