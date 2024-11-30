import { useEffect, useState } from "react";
import { subscribeToConnectionStatus } from "../utils/firebaseConnection";
import { useNotifications } from "./useNotifications";

export const useFirebaseStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const { showWarning, showSuccess } = useNotifications();

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((online) => {
      setIsOnline(online);
      if (online) {
        showSuccess("Connection restored", "Back Online");
      } else {
        showWarning(
          "You are currently offline. Some features may be limited.",
          "Connection Lost"
        );
      }
    });

    return () => unsubscribe();
  }, [showWarning, showSuccess]);

  return { isOnline };
};
