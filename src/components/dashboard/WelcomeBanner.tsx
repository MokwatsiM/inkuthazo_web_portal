import React from "react";
import { Sun, Moon, Sunset, Coffee } from "lucide-react";

interface WelcomeBannerProps {
  userName: string;
  userRole: string;
  memberSince?: Date;
  className?: string;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  userName,
  userRole,
  memberSince,
  className = ""
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Sun };
    if (hour < 17) return { text: "Good afternoon", icon: Sun };
    if (hour < 21) return { text: "Good evening", icon: Sunset };
    return { text: "Good evening", icon: Moon };
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Hope you're having a great day!",
      "Ready to make a difference today?",
      "Let's see what's happening in the society.",
      "Your community appreciates your commitment.",
      "Together we build stronger communities.",
    ];
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return messages[dayOfYear % messages.length];
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const roleDisplay = userRole === 'admin' ? 'Administrator' : userRole === 'dc_member' ? 'DC Member' : 'Member';

  return (
    <div className={`
      relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700
      dark:from-primary-600 dark:via-primary-700 dark:to-primary-800
      rounded-2xl p-6 text-white ${className}
    `}>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"></div>
      <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-white/5"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <GreetingIcon className="h-6 w-6 text-white/90" />
              <h1 className="text-2xl font-bold">
                {greeting.text}, {userName}!
              </h1>
            </div>

            <p className="text-white/80 mb-1">
              {getMotivationalMessage()}
            </p>

            <div className="flex items-center gap-4 text-sm text-white/70">
              <span className="inline-flex items-center gap-1">
                <div className="h-2 w-2 bg-white/70 rounded-full"></div>
                {roleDisplay}
              </span>
              {memberSince && (
                <span>
                  Member since {memberSince.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Time display */}
          <div className="text-right">
            <p className="text-lg font-semibold text-white/90">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </p>
            <p className="text-white/70 text-sm">
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Quick weather or tips section */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Coffee className="h-4 w-4" />
            <span>💡 Tip: Check the calendar for upcoming meetings and events</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;