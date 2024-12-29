import React from "react";
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
  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <AvatarUpload member={member} onUpload={onAvatarUpload} />
        <div>
          <h3 className="text-xl font-semibold">{member.full_name}</h3>
          <p className="text-gray-500">{member.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Phone</p>
          <p className="font-medium">{member.phone}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Join Date</p>
          <p className="font-medium">
            {format(member.join_date.toDate(), "dd MMM yyyy")}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              member.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {member.status}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500">Role</p>
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              member.role === "admin"
                ? "bg-purple-100 text-purple-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {member.role}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
