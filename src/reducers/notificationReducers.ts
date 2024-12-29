import type { Notification } from '../types/notification';

export type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

export const notificationReducer = (
  state: Notification[],
  action: NotificationAction
): Notification[] => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return [...state, action.payload];
    case 'REMOVE_NOTIFICATION':
      return state.filter((notification) => notification.id !== action.payload);
    default:
      return state;
  }
};