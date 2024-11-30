import React from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useFirebaseStatus } from "../../hooks/useFirebaseStatus";

const ConnectionStatus: React.FC = () => {
  const { isOnline } = useFirebaseStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
      <WifiOff className="h-5 w-5" />
      <span>You're offline. Some features may be limited.</span>
    </div>
  );
};

export default ConnectionStatus;
