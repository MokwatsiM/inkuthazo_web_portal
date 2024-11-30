import { enableNetwork, disableNetwork, getFirestore } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNotifications } from '../hooks/useNotifications';

let isOnline = true;
const listeners: Array<(online: boolean) => void> = [];

export const subscribeToConnectionStatus = (callback: (online: boolean) => void) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

export const notifyListeners = (online: boolean) => {
  isOnline = online;
  listeners.forEach(listener => listener(online));
};

export const initializeConnectionHandler = () => {
  window.addEventListener('online', async () => {
    if (!isOnline) {
      try {
        await enableNetwork(db);
        notifyListeners(true);
      } catch (error) {
        console.error('Error enabling network:', error);
      }
    }
  });

  window.addEventListener('offline', async () => {
    if (isOnline) {
      try {
        await disableNetwork(db);
        notifyListeners(false);
      } catch (error) {
        console.error('Error disabling network:', error);
      }
    }
  });
};

export const useFirebaseConnection = () => {
  const { showWarning, showSuccess } = useNotifications();

  const handleConnectionChange = (online: boolean) => {
    if (online) {
      showSuccess('Connection restored', 'Back Online');
    } else {
      showWarning(
        'You are currently offline. Some features may be limited.',
        'Connection Lost'
      );
    }
  };

  return {
    subscribeToConnectionStatus,
    handleConnectionChange
  };
};