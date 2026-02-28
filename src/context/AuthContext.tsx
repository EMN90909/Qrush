import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { showError } from '@/utils/toast';

export type Plan = 'guest' | 'free' | 'paid';

interface UserProfile {
  id: string;
  email: string;
  plan: Plan;
  dynamicQRCodes: number;
  storageUsedMB: number;
}

interface AuthContextType {
  user: UserProfile | null;
  plan: Plan;
  session: Session | null;
  loading: boolean;
  signIn: () => void;
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const plan = user?.plan || 'guest';

  const getPlanLimits = () => {
    switch (plan) {
      case 'free':
        return {
          maxDynamicQRs: 2,
          maxStorageMB: 20,
          canCustomize: false,
          canTrackAnalytics: true,
        };
      case 'paid':
        return {
          maxDynamicQRs: 20,
          maxStorageMB: Infinity,
          canCustomize: true,
          canTrackAnalytics: true,
        };
      case 'guest':
      default:
        return defaultLimits;
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setLoading(true);
      
      if (currentSession) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email, user_type, dynamicQRCodes, storageUsedMB')
          .eq('id', currentSession.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || 'unknown@example.com',
            plan: 'guest',
            dynamicQRCodes: 0,
            storageUsedMB: 0,
          });
        } else if (profile) {
          setUser({
            id: profile.id,
            email: profile.email || currentSession.user.email || 'unknown@example.com',
            plan: (profile.user_type as Plan) || 'guest',
            dynamicQRCodes: profile.dynamicQRCodes || 0,
            storageUsedMB: profile.storageUsedMB || 0,
          });
        }
        
        if (location.pathname === '/login') {
          navigate('/');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (!initialSession) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signIn = () => {
    navigate('/login');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError('Failed to sign out.');
    } else {
      setUser(null);
      setSession(null);
      navigate('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, plan, session, loading, signIn, signOut, getPlanLimits }}>
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