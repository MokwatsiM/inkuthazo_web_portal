import React, { useEffect } from "react";
import { analytics } from "../../config/firebase";
import { setAnalyticsCollectionEnabled } from "firebase/analytics";

interface AnalyticsProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  enabled = true,
}) => {
  useEffect(() => {
    // Enable/disable analytics collection based on prop
    setAnalyticsCollectionEnabled(analytics, enabled);
  }, [enabled]);

  return <>{children}</>;
};

export default AnalyticsProvider;
