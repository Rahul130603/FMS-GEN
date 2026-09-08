import React, { createContext, useContext, useState } from 'react';
import { CURRENT_USER } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children, user: currentUser }) {
  const [user, setUser] = useState(currentUser || CURRENT_USER);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
