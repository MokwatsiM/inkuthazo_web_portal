import React, { useRef, useState } from "react";
import { Camera } from "lucide-react";
import Button from "../ui/Button";
import type { Member } from "../../types";

interface AvatarUploadProps {
  member: Member;
  onUpload: (file: File) => Promise<void>;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ member, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploading(true);
        await onUpload(e.target.files[0]);
      } catch (error) {
        console.error("Error uploading avatar:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="relative group">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.full_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-2xl font-semibold">
            {member.full_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <Button
        variant="secondary"
        icon={Camera}
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="absolute bottom-0 right-0 !p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <span className="sr-only">
          {isUploading ? "Uploading..." : "Change Avatar"}
        </span>
      </Button>
    </div>
  );
};

export default AvatarUpload;
