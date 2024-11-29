import React from "react";
import type { Member } from "../../types";

interface AvatarProps {
  member: Member;
  size?: "sm" | "md" | "lg";
}

const Avatar: React.FC<AvatarProps> = ({ member, size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-24 h-24 text-2xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200`}
    >
      {member.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={member.full_name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold">
          {member.full_name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default Avatar;
