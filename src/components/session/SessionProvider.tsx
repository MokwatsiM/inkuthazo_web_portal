import React from 'react';
import { useSession } from '../../hooks/useSession';
import SessionTimeoutWarning from './SessionTimeoutWarning';

interface SessionProviderProps {
  children: React.ReactNode;
}

const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const session = useSession();

  return (
    <>
      {children}
      {session.isAuthenticated && <SessionTimeoutWarning />}
    </>
  );
};

export default SessionProvider;