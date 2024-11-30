import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import type { Notification, NotificationType } from "../types/notification";

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

type NotificationAction =
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "REMOVE_NOTIFICATION"; payload: string };

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const notificationReducer = (
  state: Notification[],
  action: NotificationAction
): Notification[] => {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return [...state, action.payload];
    case "REMOVE_NOTIFICATION":
      return state.filter((notification) => notification.id !== action.payload);
    default:
      return state;
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newNotification = {
        ...notification,
        id,
        duration: notification.duration || 5000, // Default duration of 5 seconds
      };

      dispatch({ type: "ADD_NOTIFICATION", payload: newNotification });

      // Auto-remove notification after duration
      setTimeout(() => {
        dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
      }, newNotification.duration);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
