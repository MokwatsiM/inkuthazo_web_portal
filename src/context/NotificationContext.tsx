import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import { notificationReducer } from "../reducers/notificationReducers";
import { generateNotificationId } from "../utils/notification";
import type { Notification } from "../types/notification";

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = generateNotificationId();
      const newNotification = { ...notification, id };

      dispatch({ type: "ADD_NOTIFICATION", payload: newNotification });

      setTimeout(() => {
        dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
      }, notification.duration);
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
