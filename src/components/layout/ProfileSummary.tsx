import React from "react";
import { User, Mail, Phone, MapPin, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { format } from "date-fns";

const ProfileSummary: React.FC = () => {
  const { userDetails } = useAuth();

  // Mock data for activity stats - you can replace with real data from hooks
  const activityStats = {
    contributions: 12,
    claims: 3,
    documents: 8,
  };

  return (
    <div className="w-80 bg-white dark:bg-surface-dark border-l border-gray-100 dark:border-gray-800 p-6 space-y-6 overflow-y-auto">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-[20px] p-6 text-white shadow-lg">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center overflow-hidden">
              {userDetails?.profile_photo_url ? (
                <img
                  src={userDetails.profile_photo_url}
                  alt={userDetails.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            {/* Online Status Indicator */}
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>

          {/* Name and Role */}
          <h3 className="text-lg font-bold mb-1">
            {userDetails?.full_name || "User"}
          </h3>
          <p className="text-sm text-purple-100 mb-4">
            {userDetails?.role === "admin" ? "Administrator" : "Member"}
          </p>

          {/* Mini Stats */}
          <div className="flex gap-4 w-full justify-center">
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold">{activityStats.contributions}</p>
              <p className="text-xs text-purple-100">Contributions</p>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold">{activityStats.claims}</p>
              <p className="text-xs text-purple-100">Claims</p>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold">{activityStats.documents}</p>
              <p className="text-xs text-purple-100">Documents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-[20px] p-5 space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Contact Information
        </h4>

        {/* Email */}
        {userDetails?.email && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {userDetails.email}
              </p>
            </div>
          </div>
        )}

        {/* Phone */}
        {userDetails?.phone_number && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {userDetails.phone_number}
              </p>
            </div>
          </div>
        )}

        {/* Address */}
        {userDetails?.physical_address && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                {userDetails.physical_address}
              </p>
            </div>
          </div>
        )}

        {/* Member Since */}
        {userDetails?.created_at && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Member Since
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {format(userDetails.created_at.toDate(), "MMM yyyy")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Card */}
      <div className="bg-gradient-to-br from-teal-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-[20px] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            This Month
          </h4>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Active Days
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              18/30
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
              style={{ width: "60%" }}
            ></div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Completion Rate
            </span>
            <span className="text-sm font-bold text-green-600">85%</span>
          </div>
        </div>
      </div>

      {/* Bio Section (if available) */}
      {userDetails?.bio && (
        <div className="bg-white dark:bg-gray-800 rounded-[20px] p-5 border border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            About
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {userDetails.bio}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileSummary;
