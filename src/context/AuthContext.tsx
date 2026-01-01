import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Plan = 'guest' | 'free' | 'paid';

interface User {
  id: string;
  email: string;
  plan: Plan;
  dynamicQRCodes: number; // Current count of dynamic QRs
  storageUsedMB: number; // Current storage usage
}

interface AuthContextType {
  user: User | null;
  plan: Plan;
  signIn: (plan: Plan) => void;
  signOut: () => void;
  getPlanLimits: () => {
    maxDynamicQRs: number;
    maxStorageMB: number;
    canCustomize: boolean;
    canTrackAnalytics: boolean;
  };
}

const defaultLimits = {
  maxDynamicQRs: 0,
  maxStorageMB: 0,
  canCustomize: false,
  canTrackAnalytics: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_USER: User = {
  id: 'guest',
  email: 'guest@example.com',
  plan: 'guest',
  dynamicQRCodes: 0,
  storageUsedMB: 0,
};

const FREE_USER: User = {
  id: 'user-123',
  email: 'freeuser@example.com',
  plan: 'free',
  dynamicQRCodes: 1, // Mocking 1 dynamic QR already created
  storageUsedMB: 10,
};

const PAID_USER: User = {
  id: 'user-456',
  email: 'paiduser@example.com',
  plan: 'paid',
  dynamicQRCodes: 5,
  storageUsedMB: 50,
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(GUEST_USER);
  const plan = user?.plan || 'guest';

  const getPlanLimits = () => {
    switch (plan) {
      case 'free':
        return {
          maxDynamicQRs: 2,
          maxStorageMB: 20,
          canCustomize: false,
          canTrackAnalytics: true, // Scan count tracking
        };
      case 'paid':
        return {
          maxDynamicQRs: 20,
          maxStorageMB: Infinity,
          canCustomize: true,
          canTrackAnalytics: true, // Full analytics
        };
      case 'guest':
      default:
        return defaultLimits;
    }
  };

  const signIn = (targetPlan: Plan) => {
    if (targetPlan === 'free') {
      setUser(FREE_USER);
    } else if (targetPlan === 'paid') {
      setUser(PAID_USER);
    }
  };

  const signOut = () => {
    setUser(GUEST_USER);
  };

  return (
    <AuthContext.Provider value={{ user, plan, signIn, signOut, getPlanLimits }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};